<?php
// api/api_avatar.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

session_start();
require_once 'conexion.php';

$db = new Conexion();
$conexion = $db->conectar();

// Soporte para lectura de JSON (HTTPie / Fetch API)
$body = json_decode(file_get_contents('php://input'), true) ?? [];
$data = array_merge($_REQUEST, $_POST, $body);

$accion = $data['accion'] ?? '';

// CONTROL DE AUTENTICACIÓN ESTRICTO SEGÚN LA GUÍA (401 Unauthorized)
$usuario_id = $_SESSION['usuario_id'] ?? ($data['usuario_id'] ?? null);

if (!$usuario_id) {
    http_response_code(401); // Unauthorized
    echo json_encode(["status" => "error", "mensaje" => "No hay sesión activa. Acceso denegado."]);
    exit;
}

switch($accion) {

    // ----------------------------------------------------
    // OBTIENE EL PERSONAJE ACTUAL Y SUS ITEMS EQUIPADOS
    // ----------------------------------------------------
    case 'obtener_avatar':
        try {
            // Consulta del personaje base activo del usuario
            $stmtUser = $conexion->prepare("
                SELECT u.id AS usuario_id, p.id AS personaje_id, p.nombre AS personaje_nombre, p.ruta_imagen
                FROM usuarios u
                LEFT JOIN personajes p ON u.personaje_actual_id = p.id
                WHERE u.id = :uid
            ");
            $stmtUser->execute([':uid' => $usuario_id]);
            $avatarData = $stmtUser->fetch(PDO::FETCH_ASSOC);

            if (!$avatarData || !$avatarData['personaje_id']) {
                http_response_code(200); // 200 OK, pero avisamos que no hay personaje
                echo json_encode([
                    "status" => "warning", 
                    "mensaje" => "El usuario no tiene un personaje seleccionado.",
                    "avatar" => null
                ]);
                exit;
            }

            $personajeId = $avatarData['personaje_id'];

            // Consulta de los ítems EQUIPADOS con sus offsets
            $stmtItems = $conexion->prepare("
                SELECT 
                    i.id AS item_id, 
                    i.nombre AS item_nombre, 
                    i.categoria, 
                    i.ruta_svg,
                    COALESCE(pio.width, 100) AS width,
                    COALESCE(pio.pos_x, 0) AS pos_x,
                    COALESCE(pio.pos_y, 0) AS pos_y,
                    COALESCE(pio.rotacion, 0) AS rotacion
                FROM usuario_items ui
                JOIN items i ON ui.item_id = i.id
                LEFT JOIN personaje_item_offset pio 
                       ON pio.personaje_id = :pid AND pio.item_id = i.id
                WHERE ui.usuario_id = :uid AND ui.equipado = TRUE
            ");
            $stmtItems->execute([':uid' => $usuario_id, ':pid' => $personajeId]);
            $itemsEquipados = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200); // OK
            echo json_encode([
                "status" => "success",
                "avatar" => [
                    "personaje_id"     => $avatarData['personaje_id'],
                    "personaje_nombre" => $avatarData['personaje_nombre'],
                    "ruta_imagen"      => $avatarData['ruta_imagen'],
                    "items_equipados"  => $itemsEquipados
                ]
            ]);

        } catch (Exception $e) {
            http_response_code(500); // Internal Server Error
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // ASIGNAR O CAMBIAR PERSONAJE BASE
    // ----------------------------------------------------
    case 'cambiar_personaje':
        try {
            $personaje_id = $data['personaje_id'] ?? null;

            if (!$personaje_id) {
                http_response_code(400); // Bad Request
                throw new Exception("ID de personaje no especificado.");
            }

            $stmt = $conexion->prepare("UPDATE usuarios SET personaje_actual_id = :pid WHERE id = :uid");
            $stmt->execute([':pid' => $personaje_id, ':uid' => $usuario_id]);

            http_response_code(200); // OK
            echo json_encode(["status" => "success", "mensaje" => "Personaje actualizado con éxito."]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(400); // Bad Request
        echo json_encode(["status" => "error", "mensaje" => "Acción no válida."]);
        break;
}
?>