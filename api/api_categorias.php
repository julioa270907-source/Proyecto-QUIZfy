<?php
// api/api_categorias.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once 'conexion.php';
$db = new Conexion();
$conexion = $db->conectar();
$accion = $_REQUEST['accion'] ?? '';

switch($accion) {
    case 'leer':
        try {
            $stmt = $conexion->query("SELECT * FROM quiz_categorias ORDER BY id DESC");
            echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    case 'crear':
        try {
            $nombre = $_POST['cat_nombre'] ?? '';
            if(empty($nombre)) throw new Exception("El nombre no puede estar vacío.");
            
            $stmt = $conexion->prepare("INSERT INTO quiz_categorias (nombre) VALUES (:nombre)");
            $stmt->execute([':nombre' => $nombre]);
            echo json_encode(["status" => "success", "mensaje" => "Categoría creada correctamente."]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;

    case 'eliminar':
        try {
            $id = $_POST['id'] ?? null;
            $stmt = $conexion->prepare("DELETE FROM quiz_categorias WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["status" => "success", "mensaje" => "Categoría eliminada."]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        break;
}
?>