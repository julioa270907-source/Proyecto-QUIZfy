<?php
// api/api_categorias.php
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
    // 1. LEER TODAS LAS CATEGORÍAS
    // ----------------------------------------------------
    case 'leer':
        try {
            $stmt = $conexion->query("SELECT * FROM quiz_categorias ORDER BY id DESC");
            $categorias = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200); // OK
            echo json_encode([
                "status" => "success", 
                "data" => $categorias
            ]);
        } catch(Exception $e) {
            http_response_code(500); // Internal Server Error
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 2. CREAR NUEVA CATEGORÍA
    // ----------------------------------------------------
    case 'crear':
        try {
            $nombre = trim($data['cat_nombre'] ?? $data['nombre'] ?? '');
            
            if (empty($nombre)) {
                http_response_code(400); // Bad Request
                echo json_encode(["status" => "error", "mensaje" => "El nombre de la categoría no puede estar vacío."]);
                exit;
            }
            
            $stmt = $conexion->prepare("INSERT INTO quiz_categorias (nombre) VALUES (:nombre)");
            $stmt->execute([':nombre' => $nombre]);

            http_response_code(201); // Created
            echo json_encode(["status" => "success", "mensaje" => "Categoría creada correctamente."]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    // ----------------------------------------------------
    // 3. ELIMINAR CATEGORÍA
    // ----------------------------------------------------
    case 'eliminar':
        try {
            $id = $data['id'] ?? null;

            if (!$id) {
                http_response_code(400); // Bad Request
                echo json_encode(["status" => "error", "mensaje" => "ID de categoría no especificado."]);
                exit;
            }

            $stmt = $conexion->prepare("DELETE FROM quiz_categorias WHERE id = :id");
            $stmt->execute([':id' => $id]);

            http_response_code(200); // OK
            echo json_encode(["status" => "success", "mensaje" => "Categoría eliminada."]);
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