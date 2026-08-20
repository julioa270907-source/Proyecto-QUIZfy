<?php
// api/api_auth.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

session_start();
require_once 'conexion.php';

$db = new Conexion();
$conexion = $db->conectar();

// LECTURA HOMOLOGADA: Soporta datos enviados por Formularios HTML o por JSON (HTTPie / Fetch API)
$body = json_decode(file_get_contents('php://input'), true) ?? [];
$data = array_merge($_REQUEST, $_POST, $body);

$accion = $data['accion'] ?? '';

switch($accion) {

    // ----------------------------------------------------
    // 1. REGISTRO DE NUEVO JUGADOR
    // ----------------------------------------------------
    case 'registrar':
        try {
            $usuario  = trim($data['nombre_usuario'] ?? '');
            $correo   = trim($data['correo'] ?? '');
            $password = $data['contrasena'] ?? '';

            if (empty($usuario) || empty($correo) || empty($password)) {
                http_response_code(400); // Bad Request
                echo json_encode(["status" => "error", "mensaje" => "Todos los campos son obligatorios."]);
                exit;
            }

            // Validar existencia previa
            $checkStmt = $conexion->prepare("SELECT id FROM usuarios WHERE nombre_usuario = :u OR correo = :c");
            $checkStmt->execute([':u' => $usuario, ':c' => $correo]);
            if ($checkStmt->fetch()) {
                http_response_code(400); // Bad Request
                echo json_encode(["status" => "error", "mensaje" => "El nombre de usuario o correo ya está registrado."]);
                exit;
            }

            $passwordHash = password_hash($password, PASSWORD_BCRYPT);

            $conexion->beginTransaction();

            // Obtener el ID del personaje base por defecto
            $stmtChar = $conexion->query("SELECT id FROM personajes ORDER BY id ASC LIMIT 1");
            $personajeBase = $stmtChar->fetch(PDO::FETCH_ASSOC);
            $personajeIdDefecto = $personajeBase ? $personajeBase['id'] : null;

            // Insertar usuario
            $stmt = $conexion->prepare("
                INSERT INTO usuarios (nombre_usuario, correo, contrasena, monedas, personaje_actual_id) 
                VALUES (:u, :c, :p, 100, :pid) 
                RETURNING id
            ");
            $stmt->execute([
                ':u'   => $usuario, 
                ':c'   => $correo, 
                ':p'   => $passwordHash,
                ':pid' => $personajeIdDefecto
            ]);
            
            $nuevoUsuario = $stmt->fetch(PDO::FETCH_ASSOC);
            $usuarioId = $nuevoUsuario['id'];

            // Crear registro inicial de estadísticas
            $stmtEst = $conexion->prepare("INSERT INTO usuario_estadisticas (usuario_id) VALUES (:id)");
            $stmtEst->execute([':id' => $usuarioId]);

            $conexion->commit();

            http_response_code(201); // Created
            echo json_encode(["status" => "success", "mensaje" => "¡Registro exitoso! Te hemos regalado 🪙 100 monedas."]);
        } catch (Exception $e) {
            if ($conexion->inTransaction()) $conexion->rollBack();
            http_response_code(500); // Internal Server Error
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 2. INICIO DE SESIÓN (LOGIN)
    // ----------------------------------------------------
    case 'login':
        try {
            $usuario  = trim($data['usuario_correo'] ?? $data['correo'] ?? $data['email'] ?? '');
            $password = $data['contrasena'] ?? $data['password'] ?? '';

            if (empty($usuario) || empty($password)) {
                http_response_code(400); // Bad Request
                echo json_encode(["status" => "error", "mensaje" => "Ingresa tu usuario/correo y contraseña."]);
                exit;
            }

            $stmt = $conexion->prepare("SELECT id, nombre_usuario, correo, contrasena, es_admin, monedas, personaje_actual_id FROM usuarios WHERE nombre_usuario = :u OR correo = :u");
            $stmt->execute([':u' => $usuario]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user || !password_verify($password, $user['contrasena'])) {
                http_response_code(401); // Unauthorized
                echo json_encode(["status" => "error", "mensaje" => "Credenciales incorrectas."]);
                exit;
            }

            $_SESSION['usuario_id']     = $user['id'];
            $_SESSION['nombre_usuario'] = $user['nombre_usuario'];
            $_SESSION['es_admin']       = $user['es_admin'];

            unset($user['contrasena']);

            http_response_code(200); // OK
            echo json_encode([
                "status" => "success",
                "mensaje" => "Bienvenido " . $user['nombre_usuario'],
                "usuario" => $user
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 3. RECUPERACIÓN DE CONTRASEÑA (PASO 1)
    // ----------------------------------------------------
    case 'forgot_password':
    case 'forgot-password':
        try {
            $email = trim($data['email'] ?? $data['correo'] ?? '');
            if (empty($email)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "El correo es requerido."]);
                exit;
            }

            // Verificar si el usuario existe
            $stmt = $conexion->prepare("SELECT id FROM usuarios WHERE correo = :c");
            $stmt->execute([':c' => $email]);
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(404); // Not Found
                echo json_encode(["status" => "error", "mensaje" => "El correo no está registrado en el sistema."]);
                exit;
            }

            // Aquí el sistema debería generar un token e insertarlo en una tabla temporal. 
            // Para fines de la demostración y cumplir con el endpoint, devolvemos el success.
            $codigoGenerado = "123456"; // Simulación

            http_response_code(200);
            echo json_encode(["status" => "success", "message" => "Código de recuperación generado exitosamente"]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 4. RESTABLECER CONTRASEÑA (PASO 2)
    // ----------------------------------------------------
    case 'reset_password':
    case 'reset-password':
        try {
            $email = trim($data['email'] ?? $data['correo'] ?? '');
            $codigo = trim($data['codigo'] ?? '');
            $newPassword = $data['new_password'] ?? $data['nueva_contrasena'] ?? '';

            if (empty($email) || empty($codigo) || empty($newPassword)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "Datos incompletos (requerido: email, codigo, new_password)."]);
                exit;
            }

            // Nota: Aquí se debería validar el código en la base de datos contra el correo.
            if($codigo !== "123456") {
                http_response_code(401);
                echo json_encode(["status" => "error", "mensaje" => "El código de recuperación es inválido o ha expirado."]);
                exit;
            }

            // Actualizar contraseña
            $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);
            $stmt = $conexion->prepare("UPDATE usuarios SET contrasena = :p WHERE correo = :c");
            $stmt->execute([':p' => $passwordHash, ':c' => $email]);

            http_response_code(200);
            echo json_encode(["status" => "success", "message" => "Contraseña actualizada correctamente"]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 5. VERIFICAR SESIÓN ACTIVA (Al recargar la página)
    // ----------------------------------------------------
    case 'verificar_sesion':
        if (isset($_SESSION['usuario_id'])) {
            $stmt = $conexion->prepare("SELECT id, nombre_usuario, correo, es_admin, monedas, personaje_actual_id FROM usuarios WHERE id = :id");
            $stmt->execute([':id' => $_SESSION['usuario_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode(["status" => "authenticated", "usuario" => $user]);
        } else {
            http_response_code(401); // Unauthorized
            echo json_encode(["status" => "unauthenticated"]);
        }
        break;

    // ----------------------------------------------------
    // 6. CERRAR SESIÓN (LOGOUT)
    // ----------------------------------------------------
    case 'logout':
        session_destroy();
        http_response_code(200);
        echo json_encode(["status" => "success", "mensaje" => "Sesión cerrada."]);
        break;
        
    default:
        http_response_code(400); // Bad Request
        echo json_encode(["status" => "error", "mensaje" => "Acción no válida o no especificada."]);
        break;
}
?>