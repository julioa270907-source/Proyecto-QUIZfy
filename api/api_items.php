<?php
// api/api_items.php
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
    // 1. LEER TODOS LOS ÍTEMS/ACCESORIOS
    // ----------------------------------------------------
    case 'leer':
        try {
            $stmt = $conexion->query("SELECT * FROM items ORDER BY id DESC");
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200); // OK
            echo json_encode([
                "status" => "success", 
                "data" => $items
            ]);
        } catch(Exception $e) {
            http_response_code(500); // Internal Server Error
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 2. CREAR NUEVO ÍTEM (SUBIDA DE ARCHIVO SVG)
    // ----------------------------------------------------
    case 'crear':
        try {
            $nombre    = trim($data['i_nombre'] ?? $data['nombre'] ?? '');
            $categoria = trim($data['i_categoria'] ?? $data['categoria'] ?? ''); 
            $precio    = $data['i_precio'] ?? $data['precio'] ?? 0;
            $ruta_db   = '';

            if (empty($nombre) || empty($categoria)) {
                http_response_code(400); // Bad Request
                echo json_encode(["status" => "error", "mensaje" => "El nombre y la categoría son obligatorios."]);
                exit;
            }

            // Validar subida del archivo SVG
            if (!isset($_FILES['svg_file']) || $_FILES['svg_file']['error'] != 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "No se subió ningún archivo SVG o hubo un error en la subida."]);
                exit;
            }

            // Guardar dinámicamente en la carpeta de su categoría
            $directorio_fisico = "../imagenes/Accesorios/" . $categoria . "/"; 
            
            if (!file_exists($directorio_fisico)) {
                mkdir($directorio_fisico, 0777, true);
            }

            $nombre_archivo = time() . "_" . basename($_FILES['svg_file']['name']);
            $ruta_destino   = $directorio_fisico . $nombre_archivo;
            
            if (move_uploaded_file($_FILES['svg_file']['tmp_name'], $ruta_destino)) {
                $ruta_db = "imagenes/Accesorios/" . $categoria . "/" . $nombre_archivo;
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "mensaje" => "Error al guardar el archivo físico en el servidor."]);
                exit;
            }

            $query = "INSERT INTO items (nombre, categoria, precio, ruta_svg) VALUES (:nombre, :categoria, :precio, :ruta_svg)";
            $stmt = $conexion->prepare($query);
            $stmt->execute([
                ':nombre'   => $nombre, 
                ':categoria' => $categoria, 
                ':precio'    => $precio, 
                ':ruta_svg'  => $ruta_db
            ]);

            http_response_code(201); // Created
            echo json_encode(["status" => "success", "mensaje" => "Accesorio creado correctamente."]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => "Error de BD: " . $e->getMessage()]);
        }
        break;
    
    // ----------------------------------------------------
    // 3. EDITAR ÍTEM EXISTENTE
    // ----------------------------------------------------
    case 'editar':
        try {
            $id        = $data['edit_i_id'] ?? $data['id'] ?? null;
            $nombre    = trim($data['edit_i_nombre'] ?? $data['nombre'] ?? '');
            $precio    = $data['edit_i_precio'] ?? $data['precio'] ?? 0;
            $categoria = trim($data['edit_i_categoria'] ?? $data['categoria'] ?? '');

            if (!$id) {
                http_response_code(400); // Bad Request
                echo json_encode(["status" => "error", "mensaje" => "ID de accesorio no proporcionado."]);
                exit;
            }

            $query = "UPDATE items SET nombre = :nombre, precio = :precio, categoria = :categoria WHERE id = :id";
            $stmt = $conexion->prepare($query);
            $stmt->execute([
                ':nombre'    => $nombre, 
                ':precio'    => $precio, 
                ':categoria' => $categoria,
                ':id'        => $id
            ]);
            
            http_response_code(200); // OK
            echo json_encode(["status" => "success", "mensaje" => "Accesorio actualizado correctamente."]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 4. ELIMINAR ÍTEM
    // ----------------------------------------------------
    case 'eliminar':
        try {
            $id = $data['id'] ?? null;

            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "mensaje" => "ID no proporcionado."]);
                exit;
            }

            $stmt_img = $conexion->prepare("SELECT ruta_svg FROM items WHERE id = :id");
            $stmt_img->execute([':id' => $id]);
            $img = $stmt_img->fetch(PDO::FETCH_ASSOC);

            if ($img && !empty($img['ruta_svg']) && file_exists("../" . $img['ruta_svg'])) {
                unlink("../" . $img['ruta_svg']); 
            }

            $stmt = $conexion->prepare("DELETE FROM items WHERE id = :id");
            $stmt->execute([':id' => $id]);

            http_response_code(200); // OK
            echo json_encode(["status" => "success", "mensaje" => "Ítem eliminado."]);
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