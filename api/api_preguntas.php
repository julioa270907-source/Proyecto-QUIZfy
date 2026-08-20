<?php
// api/api_preguntas.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'conexion.php';

$db = new Conexion();
$conexion = $db->conectar();

// Lectura unificada: Soporta JSON nativo y FormData
$body = json_decode(file_get_contents('php://input'), true) ?? [];
$data = array_merge($_REQUEST, $_POST, $body);

$accion = $data['accion'] ?? '';

switch($accion) {

    // ----------------------------------------------------
    // 1. LEER PREGUNTAS DE UN QUIZ ESPECÍFICO
    // ----------------------------------------------------
    case 'leer_por_quiz':
        try {
            $quiz_id = $data['quiz_id'] ?? $_GET['quiz_id'] ?? null;

            if (!$quiz_id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "Debe especificar un quiz_id."]);
                exit;
            }

            $query = "SELECT * FROM preguntas WHERE quiz_id = :quiz_id ORDER BY id ASC";
            $stmt = $conexion->prepare($query);
            $stmt->execute([':quiz_id' => $quiz_id]);
            $preguntas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode(["status" => "success", "data" => $preguntas]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 2. CREAR UNA NUEVA PREGUNTA INDIVIDUAL
    // ----------------------------------------------------
    case 'crear':
        try {
            $quiz_id   = $data['quiz_id'] ?? null;
            $enunciado = trim($data['p_enunciado'] ?? $data['enunciado'] ?? '');
            $opcion_a  = trim($data['p_opcion_a'] ?? $data['opcion_a'] ?? '');
            $opcion_b  = trim($data['p_opcion_b'] ?? $data['opcion_b'] ?? '');
            $opcion_c  = trim($data['p_opcion_c'] ?? $data['opcion_c'] ?? '');
            $opcion_d  = trim($data['p_opcion_d'] ?? $data['opcion_d'] ?? '');
            $respuesta = strtoupper(trim($data['p_respuesta'] ?? $data['respuesta_correcta'] ?? 'A'));

            if (!$quiz_id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "Debe seleccionar un Quiz primero."]);
                exit;
            }

            if (empty($enunciado) || empty($opcion_a) || empty($opcion_b)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "El enunciado y al menos las opciones A y B son obligatorios."]);
                exit;
            }

            $query = "INSERT INTO preguntas (quiz_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta) 
                      VALUES (:q_id, :enun, :a, :b, :c, :d, :resp)";
            $stmt = $conexion->prepare($query);
            $stmt->execute([
                ':q_id' => $quiz_id, 
                ':enun' => $enunciado, 
                ':a'    => $opcion_a, 
                ':b'    => $opcion_b, 
                ':c'    => $opcion_c, 
                ':d'    => $opcion_d, 
                ':resp' => $respuesta
            ]);

            http_response_code(201); // Created
            echo json_encode(["status" => "success", "mensaje" => "Pregunta agregada con éxito."]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => "Error BD: " . $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 3. EDITAR UNA PREGUNTA EXISTENTE
    // ----------------------------------------------------
    case 'editar':
        try {
            $id        = $data['id'] ?? null;
            $enunciado = trim($data['p_enunciado'] ?? $data['enunciado'] ?? '');
            $opcion_a  = trim($data['p_opcion_a'] ?? $data['opcion_a'] ?? '');
            $opcion_b  = trim($data['p_opcion_b'] ?? $data['opcion_b'] ?? '');
            $opcion_c  = trim($data['p_opcion_c'] ?? $data['opcion_c'] ?? '');
            $opcion_d  = trim($data['p_opcion_d'] ?? $data['opcion_d'] ?? '');
            $respuesta = strtoupper(trim($data['p_respuesta'] ?? $data['respuesta_correcta'] ?? 'A'));

            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "ID de la pregunta no proporcionado."]);
                exit;
            }

            $query = "UPDATE preguntas 
                      SET enunciado = :enun, opcion_a = :a, opcion_b = :b, opcion_c = :c, opcion_d = :d, respuesta_correcta = :resp 
                      WHERE id = :id";
            $stmt = $conexion->prepare($query);
            $stmt->execute([
                ':enun' => $enunciado, 
                ':a'    => $opcion_a, 
                ':b'    => $opcion_b, 
                ':c'    => $opcion_c, 
                ':d'    => $opcion_d, 
                ':resp' => $respuesta,
                ':id'   => $id
            ]);

            http_response_code(200);
            echo json_encode(["status" => "success", "mensaje" => "Pregunta actualizada correctamente."]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => "Error BD: " . $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 4. ELIMINAR UNA PREGUNTA INDIVIDUAL
    // ----------------------------------------------------
    case 'eliminar':
        try {
            $id = $data['id'] ?? null;

            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "ID de pregunta no especificado."]);
                exit;
            }

            $stmt = $conexion->prepare("DELETE FROM preguntas WHERE id = :id");
            $stmt->execute([':id' => $id]);

            http_response_code(200);
            echo json_encode(["status" => "success", "mensaje" => "Pregunta eliminada correctamente."]);
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