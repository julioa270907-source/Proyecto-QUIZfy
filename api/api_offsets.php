<?php
// api/api_offsets.php
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
    // 1. OBTENER CONFIGURACIÓN ESPECÍFICA (PJ + ÍTEM)
    // ----------------------------------------------------
    case 'leer_especifico':
        try {
            $personaje_id = $data['personaje_id'] ?? null;
            $item_id      = $data['item_id'] ?? null;

            if (!$personaje_id || !$item_id) {
                http_response_code(400); // Bad Request
                echo json_encode(["status" => "error", "mensaje" => "Se requiere personaje_id e item_id."]);
                exit;
            }

            $query = "SELECT * FROM personaje_item_offset WHERE personaje_id = :p_id AND item_id = :i_id";
            $stmt = $conexion->prepare($query);
            $stmt->execute([':p_id' => $personaje_id, ':i_id' => $item_id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            http_response_code(200); // OK
            if ($result) {
                echo json_encode(["status" => "success", "existe" => true, "data" => $result]);
            } else {
                echo json_encode(["status" => "success", "existe" => false]);
            }
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 2. GUARDAR O ACTUALIZAR OFFSET (UPSERT EN POSTGRESQL)
    // ----------------------------------------------------
    case 'guardar':
        try {
            $personaje_id = $data['personaje_id'] ?? null;
            $item_id      = $data['item_id'] ?? null;
            $width        = $data['width'] ?? 100;
            $pos_x        = $data['pos_x'] ?? 0;
            $pos_y        = $data['pos_y'] ?? 0;
            $rotacion     = $data['rotacion'] ?? 0;

            if (!$personaje_id || !$item_id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "Debe especificar el personaje y el ítem para guardar los offsets."]);
                exit;
            }

            // Cláusula ON CONFLICT aprovechando la llave primaria compuesta en PostgreSQL
            $query = "INSERT INTO personaje_item_offset (personaje_id, item_id, width, pos_x, pos_y, rotacion) 
                      VALUES (:p_id, :i_id, :w, :x, :y, :r) 
                      ON CONFLICT (personaje_id, item_id) 
                      DO UPDATE SET 
                        width = EXCLUDED.width, 
                        pos_x = EXCLUDED.pos_x, 
                        pos_y = EXCLUDED.pos_y, 
                        rotacion = EXCLUDED.rotacion,
                        fecha_actualizacion = CURRENT_TIMESTAMP";
            
            $stmt = $conexion->prepare($query);
            $stmt->execute([
                ':p_id' => $personaje_id, 
                ':i_id' => $item_id, 
                ':w'    => $width, 
                ':x'    => $pos_x, 
                ':y'    => $pos_y, 
                ':r'    => $rotacion
            ]);

            http_response_code(200); // OK
            echo json_encode(["status" => "success", "mensaje" => "Ajustes de posición guardados correctamente."]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => "Error BD: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(["status" => "error", "mensaje" => "Acción no válida o no especificada."]);
        break;
}
?>