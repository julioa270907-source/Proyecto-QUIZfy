<?php
// api/conexion.php
class Conexion {
    private $host = 'localhost';
    private $port = '3306';
    private $dbname = 'tienda'; // Reemplaza con el nombre real
    private $user = 'root';
    private $password = 'admin123'; // Reemplaza con tu clave real
    private $conexion;

    public function conectar() {
        $this->conexion = null;
        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->dbname . ";charset=utf8mb4";
            $this->conexion = new PDO($dsn, $this->user, $this->password);
            $this->conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conexion->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo json_encode(["status" => "error", "mensaje" => "Error BD: " . $e->getMessage()]);
            die();
        }
        return $this->conexion;
    }
}
?>
