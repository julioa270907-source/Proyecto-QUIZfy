<?php
// api/api_items.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'conexion.php';
$db = new Conexion();
$conexion = $db->conectar();
$accion = $_REQUEST['accion'] ?? '';

switch($accion) {
    case 'leer':
        $stmt = $conexion->query("SELECT * FROM items ORDER BY id DESC");
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
        break;

    case 'crear':
        try {
            // Nota: Me aseguré de poner los nombres exactos que tienes en tu HTML (i_nombre, i_categoria, i_precio)
            $nombre = $_POST['i_nombre'] ?? '';
            $categoria = $_POST['i_categoria'] ?? ''; 
            $precio = $_POST['i_precio'] ?? 0;
            $ruta_db = '';

            // VALIDACIÓN: Comprobar si realmente viene un archivo
            if(!isset($_FILES['svg_file']) || $_FILES['svg_file']['error'] != 0) {
                echo json_encode(["status" => "error", "mensaje" => "No se subió ningún archivo SVG o hubo un error en la subida."]);
                exit; // Detenemos la ejecución aquí
            }

            // Guardar dinámicamente en la carpeta de su categoría
            $directorio_fisico = "../imagenes/Accesorios/" . $categoria . "/"; 
            
            // Si la carpeta no existe, la crea
            if (!file_exists($directorio_fisico)) {
                mkdir($directorio_fisico, 0777, true);
            }

            $nombre_archivo = time() . "_" . basename($_FILES['svg_file']['name']);
            $ruta_destino = $directorio_fisico . $nombre_archivo;
            
            if(move_uploaded_file($_FILES['svg_file']['tmp_name'], $ruta_destino)) {
                $ruta_db = "imagenes/Accesorios/" . $categoria . "/" . $nombre_archivo;
            } else {
                echo json_encode(["status" => "error", "mensaje" => "Error al guardar el archivo físico en el servidor."]);
                exit;
            }

            $query = "INSERT INTO items (nombre, categoria, precio, ruta_svg) VALUES (:nombre, :categoria, :precio, :ruta_svg)";
            $stmt = $conexion->prepare($query);
            $stmt->execute([
                ':nombre' => $nombre, 
                ':categoria' => $categoria, 
                ':precio' => $precio, 
                ':ruta_svg' => $ruta_db
            ]);
            echo json_encode(["status" => "success", "mensaje" => "Accesorio creado correctamente."]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => "Error de BD: " . $e->getMessage()]);
        }
        break;
    
    case 'editar':
        try {
            $id = $_POST['edit_i_id'] ?? null;
            $nombre = $_POST['edit_i_nombre'] ?? '';
            $precio = $_POST['edit_i_precio'] ?? 0;
            $categoria = $_POST['edit_i_categoria'] ?? '';

            if(!$id) throw new Exception("ID no proporcionado.");

            $query = "UPDATE items SET nombre = :nombre, precio = :precio, categoria = :categoria WHERE id = :id";
            $stmt = $conexion->prepare($query);
            $stmt->execute([
                ':nombre' => $nombre, 
                ':precio' => $precio, 
                ':categoria' => $categoria,
                ':id' => $id
            ]);
            
            echo json_encode(["status" => "success", "mensaje" => "Accesorio actualizado correctamente."]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    case 'eliminar':
        // Lógica idéntica a personajes: buscar ruta, borrar archivo físico y borrar registro de BD.
        try {
            $id = $_POST['id'] ?? null;
            $stmt_img = $conexion->prepare("SELECT ruta_svg FROM items WHERE id = :id");
            $stmt_img->execute([':id' => $id]);
            $img = $stmt_img->fetch();

            if($img && file_exists("../" . $img['ruta_svg'])) {
                unlink("../" . $img['ruta_svg']); 
            }

            $stmt = $conexion->prepare("DELETE FROM items WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["status" => "success", "mensaje" => "Ítem eliminado."]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;
}
?>