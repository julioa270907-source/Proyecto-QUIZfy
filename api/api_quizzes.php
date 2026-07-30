<?php
// api/api_quizzes.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'conexion.php';
$db = new Conexion();
$conexion = $db->conectar();
$accion = $_REQUEST['accion'] ?? '';

switch($accion) {
    case 'leer':
        try {
            // Hacemos un JOIN para traer el nombre de la categoría en lugar de solo su ID
            $query = "SELECT q.*, c.nombre as categoria_nombre 
                      FROM quizzes q 
                      LEFT JOIN quiz_categorias c ON q.categoria_id = c.id 
                      ORDER BY q.id DESC";
            $stmt = $conexion->query($query);
            echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    case 'leer_un_quiz':
        try {
            $id = $_GET['id'] ?? null;
            if(!$id) throw new Exception("ID no proporcionado");

            // 1. Obtener datos básicos del Quiz
            $stmtQuiz = $conexion->prepare("SELECT * FROM quizzes WHERE id = :id");
            $stmtQuiz->execute([':id' => $id]);
            $quiz = $stmtQuiz->fetch(PDO::FETCH_ASSOC);

            // 2. Obtener las preguntas asociadas
            $stmtPreg = $conexion->prepare("SELECT * FROM preguntas WHERE quiz_id = :id");
            $stmtPreg->execute([':id' => $id]);
            $preguntas = $stmtPreg->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(["status" => "success", "data" => ["quiz" => $quiz, "preguntas" => $preguntas]]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    case 'crear':
        try {
            $categoria_id = $_POST['q_categoria'] ?? 1; 
            $titulo = $_POST['q_titulo'] ?? '';
            $dificultad = $_POST['q_dificultad'] ?? 'Fácil';
            $tiempo = $_POST['q_tiempo'] ?? 30;

            $query = "INSERT INTO quizzes (categoria_id, titulo, dificultad, tiempo_pregunta) 
                      VALUES (:cat, :titulo, :dif, :tiempo)";
            $stmt = $conexion->prepare($query);
            $stmt->execute([
                ':cat' => $categoria_id,
                ':titulo' => $titulo,
                ':dif' => $dificultad,
                ':tiempo' => $tiempo
            ]);
            $id_quiz = $conexion->lastInsertId();
            echo json_encode(["status" => "success", "id" => $id_quiz, "mensaje" => "Quiz creado correctamente."]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => "Error BD: " . $e->getMessage()]);
        }
        break;

    case 'editar':
        try {
            $id = $_POST['edit_q_id'] ?? null;
            $titulo = $_POST['edit_q_nombre'] ?? '';
            $categoria = $_POST['edit_q_categoria'] ?? '';
            $dificultad = $_POST['edit_q_nivel'] ?? 'Fácil';
            $tiempo = $_POST['edit_q_tiempo'] ?? 30;
            
            if(!$id) throw new Exception("ID del quiz no proporcionado.");

            // 1. Extraer y asegurar que el JSON sea sí o sí un Array
            $preguntas_json = $_POST['preguntas_edit'] ?? '[]';
            $preguntas = json_decode($preguntas_json, true);
            
            // BLINDAJE: Si json_decode falla y devuelve null, lo forzamos a array vacío
            if (!is_array($preguntas)) {
                $preguntas = [];
            }

            // 2. Actualizar la tabla principal (Quiz)
            $query = "UPDATE quizzes 
                      SET titulo = :titulo, 
                          categoria_id = :categoria, 
                          dificultad = :dificultad, 
                          tiempo_pregunta = :tiempo 
                      WHERE id = :id";
            $stmt = $conexion->prepare($query);
            $stmt->execute([
                ':titulo' => $titulo,
                ':categoria' => $categoria,
                ':dificultad' => $dificultad,
                ':tiempo' => $tiempo,
                ':id' => $id
            ]);

            // 3. Limpiar las preguntas viejas SIEMPRE
            // Lo sacamos del "if" para garantizar que no queden datos basura
            $stmtDel = $conexion->prepare("DELETE FROM preguntas WHERE quiz_id = :quiz_id");
            $stmtDel->execute([':quiz_id' => $id]);

            // 4. Insertar las preguntas nuevas (solo si hay alguna en el array)
            if (count($preguntas) > 0) {
                // AQUÍ ESTÁ LA MAGIA: Nombres de columnas exactamente iguales a tu tabla
                $stmtIns = $conexion->prepare("INSERT INTO preguntas (quiz_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta) 
                                               VALUES (:quiz_id, :enun, :a, :b, :c, :d, :resp)");
                
                foreach($preguntas as $p) {
                    $stmtIns->execute([
                        ':quiz_id' => $id,
                        // Usamos ?? para atrapar el dato sin importar cómo lo llame el JS
                        ':enun' => $p['pregunta'] ?? $p['enunciado'] ?? '',
                        ':a' => $p['opcion_a'] ?? '',
                        ':b' => $p['opcion_b'] ?? '',
                        ':c' => $p['opcion_c'] ?? '',
                        ':d' => $p['opcion_d'] ?? '',
                        ':resp' => $p['correcta'] ?? $p['respuesta_correcta'] ?? 'A'
                    ]);
                }
            }
            
            echo json_encode(["status" => "success", "mensaje" => "Quiz actualizado correctamente."]);
        } catch(Exception $e) {
            // Ahora si falla algo, devolverá un JSON limpio con el error real
            echo json_encode(["status" => "error", "mensaje" => "Error BD: " . $e->getMessage()]);
        }
        break;

    case 'eliminar':
        try {
            $id = $_POST['id'] ?? null;
            $stmt = $conexion->prepare("DELETE FROM quizzes WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["status" => "success", "mensaje" => "Quiz y sus preguntas eliminados."]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "mensaje" => "Acción no válida"]);
        break;
}
?>