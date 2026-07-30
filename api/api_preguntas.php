<?php
// api/api_preguntas.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'conexion.php';
$db = new Conexion();
$conexion = $db->conectar();
$accion = $_REQUEST['accion'] ?? '';

switch($accion) {
    case 'leer_por_quiz':
        try {
            $quiz_id = $_POST['quiz_id'] ?? null;
            $query = "SELECT * FROM preguntas WHERE quiz_id = :quiz_id ORDER BY id ASC";
            $stmt = $conexion->prepare($query);
            $stmt->execute([':quiz_id' => $quiz_id]);
            echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    case 'crear':
        try {
            $quiz_id = $_POST['quiz_id'] ?? null;
            $enunciado = $_POST['p_enunciado'] ?? '';
            $opcion_a = $_POST['p_opcion_a'] ?? '';
            $opcion_b = $_POST['p_opcion_b'] ?? '';
            $opcion_c = $_POST['p_opcion_c'] ?? '';
            $opcion_d = $_POST['p_opcion_d'] ?? '';
            $respuesta = $_POST['p_respuesta'] ?? 'A';

            if(!$quiz_id) throw new Exception("Debe seleccionar un Quiz primero.");

            $query = "INSERT INTO preguntas (quiz_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta) 
                      VALUES (:q_id, :enun, :a, :b, :c, :d, :resp)";
            $stmt = $conexion->prepare($query);
            $stmt->execute([
                ':q_id' => $quiz_id, ':enun' => $enunciado, 
                ':a' => $opcion_a, ':b' => $opcion_b, ':c' => $opcion_c, ':d' => $opcion_d, 
                ':resp' => $respuesta
            ]);
            echo json_encode(["status" => "success", "mensaje" => "Pregunta agregada al Quiz."]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => "Error BD: " . $e->getMessage()]);
        }
        break;
}
?>