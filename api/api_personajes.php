<?php
// api/api_personajes.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'conexion.php';

$db = new Conexion();
$conexion = $db->conectar();

// 💡 Lectura unificada: Soporta JSON nativo y FormData
$body = json_decode(file_get_contents('php://input'), true) ?? [];
$data = array_merge($_REQUEST, $_POST, $body);

$accion = $data['accion'] ?? '';

switch($accion) {

    // ----------------------------------------------------
    // 1. LEER TODOS LOS PERSONAJES
    // ----------------------------------------------------
    case 'leer':
        try {
            $stmt = $conexion->query("SELECT * FROM personajes ORDER BY id DESC");
            $personajes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200); // OK
            echo json_encode([
                "status" => "success", 
                "data" => $personajes
            ]);
        } catch(Exception $e) {
            http_response_code(500); // Internal Error
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 2. CREAR UN NUEVO PERSONAJE (CON SUBIDA DE IMAGEN)
    // ----------------------------------------------------
    case 'crear':
        try {
            $nombre  = trim($data['p_nombre'] ?? $data['nombre'] ?? '');
            $ruta_db = '';

            if (empty($nombre)) {
                http_response_code(400); // Bad Request
                echo json_encode(["status" => "error", "mensaje" => "El nombre del personaje no puede estar vacío."]);
                exit;
            }

            // Validar subida del archivo de imagen
            if (!isset($_FILES['p_imagen']) || $_FILES['p_imagen']['error'] != 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "No se subió ninguna imagen o ocurrió un error en la subida."]);
                exit;
            }

            // Ruta física para guardar el archivo
            $directorio_fisico = "../imagenes/Personajes/";
            if (!file_exists($directorio_fisico)) {
                mkdir($directorio_fisico, 0777, true);
            }

            $nombre_archivo = time() . "_" . basename($_FILES['p_imagen']['name']);
            $ruta_destino   = $directorio_fisico . $nombre_archivo;
            
            if (move_uploaded_file($_FILES['p_imagen']['tmp_name'], $ruta_destino)) {
                $ruta_db = "imagenes/Personajes/" . $nombre_archivo;
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "mensaje" => "Error al guardar la imagen en el servidor."]);
                exit;
            }

            $query = "INSERT INTO personajes (nombre, ruta_imagen) VALUES (:nombre, :ruta_imagen)";
            $stmt = $conexion->prepare($query);
            $stmt->execute([
                ':nombre'      => $nombre, 
                ':ruta_imagen' => $ruta_db
            ]);

            http_response_code(201); // Created
            echo json_encode(["status" => "success", "mensaje" => "Personaje creado correctamente."]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => "Error BD: " . $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 3. EDITAR NOMBRE DEL PERSONAJE
    // ----------------------------------------------------
    case 'editar':
        try {
            $id     = $data['edit_p_id'] ?? $data['id'] ?? null;
            $nombre = trim($data['edit_p_nombre'] ?? $data['nombre'] ?? '');

            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "ID de personaje no proporcionado."]);
                exit;
            }

            if (empty($nombre)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "El nombre no puede estar vacío."]);
                exit;
            }

            $query = "UPDATE personajes SET nombre = :nombre WHERE id = :id";
            $stmt = $conexion->prepare($query);
            $stmt->execute([
                ':nombre' => $nombre, 
                ':id'     => $id
            ]);
            
            http_response_code(200); // OK
            echo json_encode(["status" => "success", "mensaje" => "Nombre actualizado correctamente."]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => "Error BD: " . $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 4. ELIMINAR PERSONAJE Y SU ARCHIVO FÍSICO
    // ----------------------------------------------------
    case 'eliminar':
        try {
            $id = $data['id'] ?? null;

            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "ID de personaje no especificado."]);
                exit;
            }

            // Buscar la ruta del archivo para eliminarlo físicamente
            $stmt_img = $conexion->prepare("SELECT ruta_imagen FROM personajes WHERE id = :id");
            $stmt_img->execute([':id' => $id]);
            $img = $stmt_img->fetch(PDO::FETCH_ASSOC);

            if ($img && !empty($img['ruta_imagen']) && file_exists("../" . $img['ruta_imagen'])) {
                unlink("../" . $img['ruta_imagen']);
            }

            $stmt = $conexion->prepare("DELETE FROM personajes WHERE id = :id");
            $stmt->execute([':id' => $id]);

            http_response_code(200); // OK
            echo json_encode(["status" => "success", "mensaje" => "Personaje eliminado."]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(["status" => "error", "mensaje" => "Acción no válida o no especificada."]);
        break;
}
?>