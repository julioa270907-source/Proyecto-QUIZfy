<?php
// api/api_personajes.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'conexion.php';
$db = new Conexion();
$conexion = $db->conectar();
$accion = $_REQUEST['accion'] ?? '';

switch($accion) {
    case 'leer':
        $stmt = $conexion->query("SELECT * FROM personajes ORDER BY id DESC");
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
        break;

    case 'crear':
        try {
            $nombre = $_POST['p_nombre'] ?? '';
            $ruta_db = '';

            if(isset($_FILES['p_imagen']) && $_FILES['p_imagen']['error'] == 0) {
                // Ruta física para que PHP guarde el archivo (sale de api/ y entra a imagenes/)
                $directorio_fisico = "../imagenes/Personajes/"; 
                $nombre_archivo = time() . "_" . basename($_FILES['p_imagen']['name']);
                $ruta_destino = $directorio_fisico . $nombre_archivo;
                
                if(move_uploaded_file($_FILES['p_imagen']['tmp_name'], $ruta_destino)) {
                    // Ruta relativa que se guarda en BD para que el index.html la lea bien
                    $ruta_db = "imagenes/Personajes/" . $nombre_archivo;
                }
            }

            $query = "INSERT INTO personajes (nombre, ruta_imagen) VALUES (:nombre, :ruta_imagen)";
            $stmt = $conexion->prepare($query);
            $stmt->execute([':nombre' => $nombre, ':ruta_imagen' => $ruta_db]);
            echo json_encode(["status" => "success", "mensaje" => "Personaje creado."]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;
    
    case 'editar':
        try {
            $id = $_POST['id'] ?? null;
            $nombre = $_POST['p_nombre'] ?? '';

            if(!$id) throw new Exception("ID de personaje no proporcionado.");
            if(empty($nombre)) throw new Exception("El nombre no puede estar vacío.");

            // Solo actualizamos el nombre
            $query = "UPDATE personajes SET nombre = :nombre WHERE id = :id";
            $stmt = $conexion->prepare($query);
            $stmt->execute([
                ':nombre' => $nombre, 
                ':id' => $id
            ]);
            
            echo json_encode(["status" => "success", "mensaje" => "Nombre actualizado correctamente."]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => "Error BD: " . $e->getMessage()]);
        }
        break;

    case 'eliminar':
        try {
            $id = $_POST['id'] ?? null;
            $stmt_img = $conexion->prepare("SELECT ruta_imagen FROM personajes WHERE id = :id");
            $stmt_img->execute([':id' => $id]);
            $img = $stmt_img->fetch();

            if($img && file_exists("../" . $img['ruta_imagen'])) {
                unlink("../" . $img['ruta_imagen']); // Borra el archivo físico
            }

            $stmt = $conexion->prepare("DELETE FROM personajes WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["status" => "success", "mensaje" => "Personaje eliminado."]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;
}
?>