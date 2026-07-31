<?php
// api/api_auth.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

session_start();
require_once 'conexion.php';

$db = new Conexion();
$conexion = $db->conectar();
$accion = $_REQUEST['accion'] ?? '';

switch($accion) {

    // ----------------------------------------------------
    // 1. REGISTRO DE NUEVO JUGADOR
    // ----------------------------------------------------
    case 'registrar':
        try {
            $usuario  = trim($_POST['nombre_usuario'] ?? '');
            $correo   = trim($_POST['correo'] ?? '');
            $password = $_POST['contrasena'] ?? '';

            if (empty($usuario) || empty($correo) || empty($password)) {
                throw new Exception("Todos los campos son obligatorios.");
            }

            // Validar si usuario o correo ya existen
            $checkStmt = $conexion->prepare("SELECT id FROM usuarios WHERE nombre_usuario = :u OR correo = :c");
            $checkStmt->execute([':u' => $usuario, ':c' => $correo]);
            if ($checkStmt->fetch()) {
                throw new Exception("El nombre de usuario o correo ya está registrado.");
            }

            // Encriptar contraseña de forma segura
            $passwordHash = password_hash($password, PASSWORD_BCRYPT);

            $conexion->beginTransaction();

            // Insertar usuario (Inicia con 100 monedas de regalo)
            $stmt = $conexion->prepare("INSERT INTO usuarios (nombre_usuario, correo, contrasena, monedas) VALUES (:u, :c, :p, 100) RETURNING id");
            $stmt->execute([':u' => $usuario, ':c' => $correo, ':p' => $passwordHash]);
            $nuevoUsuario = $stmt->fetch(PDO::FETCH_ASSOC);
            $usuarioId = $nuevoUsuario['id'];

            // Crear registro inicial de estadísticas
            $stmtEst = $conexion->prepare("INSERT INTO usuario_estadisticas (usuario_id) VALUES (:id)");
            $stmtEst->execute([':id' => $usuarioId]);

            $conexion->commit();

            echo json_encode(["status" => "success", "mensaje" => "¡Registro exitoso! Ya puedes iniciar sesión."]);
        } catch (Exception $e) {
            if ($conexion->inTransaction()) $conexion->rollBack();
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 2. INICIO DE SESIÓN (LOGIN)
    // ----------------------------------------------------
    case 'login':
        try {
            $usuario  = trim($_POST['usuario_correo'] ?? '');
            $password = $_POST['contrasena'] ?? '';

            if (empty($usuario) || empty($password)) {
                throw new Exception("Ingresa tu usuario/correo y contraseña.");
            }

            // Buscar por usuario O por correo
            $stmt = $conexion->prepare("SELECT id, nombre_usuario, correo, contrasena, es_admin, monedas, personaje_actual_id FROM usuarios WHERE nombre_usuario = :u OR correo = :u");
            $stmt->execute([':u' => $usuario]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // Verificar contraseña con el hash
            if (!$user || !password_verify($password, $user['contrasena'])) {
                throw new Exception("Credenciales incorrectas.");
            }

            // Guardar en Sesión de PHP
            $_SESSION['usuario_id']     = $user['id'];
            $_SESSION['nombre_usuario'] = $user['nombre_usuario'];
            $_SESSION['es_admin']       = $user['es_admin'];

            // Ocultar hash de la respuesta
            unset($user['contrasena']);

            echo json_encode([
                "status" => "success",
                "mensaje" => "Bienvenido " . $user['nombre_usuario'],
                "usuario" => $user
            ]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 3. VERIFICAR SESIÓN ACTIVA (Al recargar la página)
    // ----------------------------------------------------
    case 'verificar_sesion':
        if (isset($_SESSION['usuario_id'])) {
            $stmt = $conexion->prepare("SELECT id, nombre_usuario, correo, es_admin, monedas, personaje_actual_id FROM usuarios WHERE id = :id");
            $stmt->execute([':id' => $_SESSION['usuario_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode(["status" => "authenticated", "usuario" => $user]);
        } else {
            echo json_encode(["status" => "unauthenticated"]);
        }
        break;

    // ----------------------------------------------------
    // 4. CERRAR SESIÓN (LOGOUT)
    // ----------------------------------------------------
    case 'logout':
        session_destroy();
        echo json_encode(["status" => "success", "mensaje" => "Sesión cerrada."]);
        break;
}
?>