<?php
// api/api_offsets.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'conexion.php';
$db = new Conexion();
$conexion = $db->conectar();
$accion = $_REQUEST['accion'] ?? '';

switch($accion) {
    
    // Traer la configuración exacta cuando selecciones un PJ y un Ítem en los <select>
    case 'leer_especifico':
        try {
            $personaje_id = $_POST['personaje_id'] ?? null;
            $item_id = $_POST['item_id'] ?? null;

            $query = "SELECT * FROM personaje_item_offset WHERE personaje_id = :p_id AND item_id = :i_id";
            $stmt = $conexion->prepare($query);
            $stmt->execute([':p_id' => $personaje_id, ':i_id' => $item_id]);
            $data = $stmt->fetch();

            if($data) {
                echo json_encode(["status" => "success", "existe" => true, "data" => $data]);
            } else {
                // Si no hay configuración previa, mandamos que no existe para usar valores por defecto en JS
                echo json_encode(["status" => "success", "existe" => false]);
            }
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // Guardar (Insertar si es nuevo, o Actualizar si ya existía)
    case 'guardar':
        try {
            $personaje_id = $_POST['personaje_id'] ?? null;
            $item_id = $_POST['item_id'] ?? null;
            $width = $_POST['width'] ?? 100;
            $pos_x = $_POST['pos_x'] ?? 0;
            $pos_y = $_POST['pos_y'] ?? 0;
            $rotacion = $_POST['rotacion'] ?? 0;

            // En PostgreSQL, la llave primaria compuesta dispara el "ON CONFLICT"
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
                ':w' => $width, 
                ':x' => $pos_x, 
                ':y' => $pos_y, 
                ':r' => $rotacion
            ]);

            echo json_encode(["status" => "success", "mensaje" => "Posición guardada con precisión milimétrica."]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;
}
?>