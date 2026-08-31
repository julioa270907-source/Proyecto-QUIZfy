<?php
// api/conexion.php
class Conexion {
    private $host = '204.93.224.89';
    private $port = '3306';
    private $dbname = 'isextrha_DB_e3'; // En cPanel siempre lleva el prefijo de tu usuario
    private $user = 'isextrha_user_e3';   // También lleva el prefijo
    private $password = 'equipo3@26$';
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

    

    // --- Utilidades para validar/inspeccionar tablas y columnas dinámicamente ---
    // No las usa todavía ningún endpoint actual (todos usan nombres de tabla fijos),
    // quedan listas para un endpoint genérico que reciba el nombre de tabla como parámetro.

    public static function ident($s) {
        return '`' . str_replace('`', '``', $s) . '`';
    }

    // Obtener el nombre de la BD en MySQL
    public static function getDatabaseName($cn) {
        $queryDb = $cn->query("SELECT DATABASE()");
        $db = $queryDb->fetchColumn();
        $queryDb->closeCursor();
        return $db;
    }

    // Obtiene los nombres de las columnas de una tabla específica
    public static function getTableColumns($cn, $db, $tabla) {
        $stmtCols = $cn->prepare("
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :t
            ORDER BY ORDINAL_POSITION
        ");
        $stmtCols->execute([':db' => $db, ':t' => $tabla]);
        $cols = $stmtCols->fetchAll(PDO::FETCH_COLUMN);
        $stmtCols->closeCursor();
        return $cols;
    }
}

// Función de validación de tabla adaptada a MySQL.
// Comprueba, contra INFORMATION_SCHEMA, que $tabla exista realmente en la BD actual
// (útil para blindar un endpoint genérico que reciba el nombre de tabla por parámetro).
function validarTabla($tabla) {
    if (empty($tabla)) return false;
    try {
        $db = new Conexion();
        $cn = $db->conectar();

        $dbName = Conexion::getDatabaseName($cn);

        $tb = $cn->prepare("
            SELECT 1
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = :db
              AND TABLE_NAME = :t
            LIMIT 1
        ");

        $tb->execute([':db' => $dbName, ':t' => $tabla]);
        $existe = $tb->fetchColumn();
        $tb->closeCursor();

        return $existe ? true : false;
    } catch (PDOException $e) {
        return false;
    }
}


$verificacionConexion = new Conexion();
$verificacionConexion->conectar();
unset($verificacionConexion);



?>