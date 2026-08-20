<?php
// api/api_quizzes.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'conexion.php';

$db = new Conexion();
$conexion = $db->conectar();

$body = json_decode(file_get_contents('php://input'), true) ?? [];
$data = array_merge($_REQUEST, $_POST, $body);

$accion = $data['accion'] ?? '';

switch($accion) {

    // 1. LEER TODOS LOS QUIZZES
    case 'leer':
        try {
            $query = "SELECT q.*, c.nombre AS categoria_nombre 
                      FROM quizzes q 
                      LEFT JOIN quiz_categorias c ON q.categoria_id = c.id 
                      ORDER BY q.id DESC";
            $stmt = $conexion->query($query);
            $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode(["status" => "success", "data" => $quizzes]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // 2. LEER UN QUIZ ESPECÍFICO CON SUS PREGUNTAS
    case 'leer_un_quiz':
        try {
            $id = $data['id'] ?? $_GET['id'] ?? null;

            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "ID de Quiz no proporcionado."]);
                exit;
            }

            $stmtQuiz = $conexion->prepare("
                SELECT q.*, c.nombre AS categoria_nombre 
                FROM quizzes q 
                LEFT JOIN quiz_categorias c ON q.categoria_id = c.id 
                WHERE q.id = :id
            ");
            $stmtQuiz->execute([':id' => $id]);
            $quiz = $stmtQuiz->fetch(PDO::FETCH_ASSOC);

            if (!$quiz) {
                http_response_code(404);
                echo json_encode(["status" => "error", "mensaje" => "Quiz no encontrado."]);
                exit;
            }

            $stmtPreguntas = $conexion->prepare("SELECT * FROM preguntas WHERE quiz_id = :id ORDER BY id ASC");
            $stmtPreguntas->execute([':id' => $id]);
            $quiz['preguntas'] = $stmtPreguntas->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode(["status" => "success", "data" => $quiz]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // 3. CREAR UN NUEVO QUIZ
    case 'crear':
        try {
            $titulo       = trim($data['titulo'] ?? $data['q_titulo'] ?? '');
            $categoria_id = $data['categoria_id'] ?? $data['q_categoria_id'] ?? $data['q_categoria'] ?? null;
            $dificultad   = $data['dificultad'] ?? $data['q_dificultad'] ?? 'Medio';
            $tiempo       = $data['tiempo_pregunta'] ?? $data['q_tiempo'] ?? 30;
            $preguntas    = $data['preguntas'] ?? [];

            if (empty($titulo) || !$categoria_id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "El título y la categoría son obligatorios."]);
                exit;
            }

            $conexion->beginTransaction();

            $query = "INSERT INTO quizzes (titulo, categoria_id, dificultad, tiempo_pregunta) 
                      VALUES (:titulo, :categoria_id, :dificultad, :tiempo) RETURNING id";
            $stmt = $conexion->prepare($query);
            $stmt->execute([
                ':titulo'       => $titulo,
                ':categoria_id' => $categoria_id,
                ':dificultad'   => $dificultad,
                ':tiempo'       => $tiempo
            ]);

            $quiz_id = $stmt->fetchColumn();

            if (!empty($preguntas) && is_array($preguntas)) {
                $stmtP = $conexion->prepare("
                    INSERT INTO preguntas (quiz_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta) 
                    VALUES (:q_id, :enun, :a, :b, :c, :d, :resp)
                ");
                foreach ($preguntas as $p) {
                    $stmtP->execute([
                        ':q_id' => $quiz_id,
                        ':enun' => $p['enunciado'] ?? $p['pregunta'] ?? '',
                        ':a'    => $p['opcion_a'] ?? $p['a'] ?? '',
                        ':b'    => $p['opcion_b'] ?? $p['b'] ?? '',
                        ':c'    => $p['opcion_c'] ?? $p['c'] ?? '',
                        ':d'    => $p['opcion_d'] ?? $p['d'] ?? '',
                        ':resp' => $p['respuesta_correcta'] ?? $p['correcta'] ?? 'A'
                    ]);
                }
            }

            $conexion->commit();

            http_response_code(201);
            echo json_encode([
                "status"  => "success", 
                "mensaje" => "Quiz creado correctamente.", 
                "id"      => $quiz_id, 
                "quiz_id" => $quiz_id
            ]);
        } catch(Exception $e) {
            if ($conexion->inTransaction()) {
                $conexion->rollBack();
            }
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => "Error BD: " . $e->getMessage()]);
        }
        break;

    // 4. EDITAR UN QUIZ EXISTENTE
    case 'editar':
        try {
            $id           = $data['id'] ?? $data['quiz_id'] ?? $data['q_id'] ?? null;
            $titulo       = trim($data['titulo'] ?? $data['q_titulo'] ?? '');
            $categoria_id = $data['categoria_id'] ?? $data['q_categoria_id'] ?? $data['q_categoria'] ?? null;
            $dificultad   = $data['dificultad'] ?? $data['q_dificultad'] ?? 'Medio';
            $tiempo       = $data['tiempo_pregunta'] ?? $data['q_tiempo'] ?? 30;

            // Soporta tanto arreglo plano como cadena JSON codificada desde FormData
            $preguntas = $data['preguntas'] ?? null;
            if (isset($data['preguntas_edit']) && is_string($data['preguntas_edit'])) {
                $preguntas = json_decode($data['preguntas_edit'], true);
            }

            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "ID de Quiz no especificado."]);
                exit;
            }

            $conexion->beginTransaction();

            $query = "UPDATE quizzes 
                      SET titulo = :titulo, categoria_id = :categoria_id, dificultad = :dificultad, tiempo_pregunta = :tiempo 
                      WHERE id = :id";
            $stmt = $conexion->prepare($query);
            $stmt->execute([
                ':titulo'       => $titulo,
                ':categoria_id' => $categoria_id,
                ':dificultad'   => $dificultad,
                ':tiempo'       => $tiempo,
                ':id'           => $id
            ]);

            if (is_array($preguntas)) {
                $conexion->prepare("DELETE FROM preguntas WHERE quiz_id = :id")->execute([':id' => $id]);

                $stmtP = $conexion->prepare("
                    INSERT INTO preguntas (quiz_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta) 
                    VALUES (:q_id, :enun, :a, :b, :c, :d, :resp)
                ");
                foreach ($preguntas as $p) {
                    $stmtP->execute([
                        ':q_id' => $id,
                        ':enun' => $p['enunciado'] ?? $p['pregunta'] ?? '',
                        ':a'    => $p['opcion_a'] ?? $p['a'] ?? '',
                        ':b'    => $p['opcion_b'] ?? $p['b'] ?? '',
                        ':c'    => $p['opcion_c'] ?? $p['c'] ?? '',
                        ':d'    => $p['opcion_d'] ?? $p['d'] ?? '',
                        ':resp' => $p['respuesta_correcta'] ?? $p['correcta'] ?? 'A'
                    ]);
                }
            }

            $conexion->commit();

            http_response_code(200);
            echo json_encode(["status" => "success", "mensaje" => "Quiz actualizado correctamente."]);
        } catch(Exception $e) {
            if ($conexion->inTransaction()) {
                $conexion->rollBack();
            }
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => "Error BD: " . $e->getMessage()]);
        }
        break;

    // 5. ELIMINAR UN QUIZ
    case 'eliminar':
        try {
            $id = $data['id'] ?? null;

            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "ID de Quiz no especificado."]);
                exit;
            }

            $stmt = $conexion->prepare("DELETE FROM quizzes WHERE id = :id");
            $stmt->execute([':id' => $id]);

            http_response_code(200);
            echo json_encode(["status" => "success", "mensaje" => "Quiz eliminada correctamente."]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(["status" => "error", "mensaje" => "Acción no válida."]);
        break;
}
?>