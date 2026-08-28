-- ========================================================
-- Base de Datos Unificada de QuizFy (Versión MySQL)
-- Convertida desde PostgreSQL a MySQL 8.0+ / MariaDB 10.3+
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. MODULO DE AVATARES Y ACCESORIOS (OFFSET STUDIO)
-- --------------------------------------------------------

-- Tabla de Personajes Base
CREATE TABLE personajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    ruta_imagen VARCHAR(255) NOT NULL, -- Ruta donde se guarda el SVG o PNG base
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de Accesorios/Items de la Tienda
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria ENUM('Cabeza', 'Rostro', 'Cuerpo') NOT NULL,
    precio DECIMAL(10, 2) NOT NULL DEFAULT 100.00 CHECK (precio >= 0),
    ruta_svg VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla intermedia de offsets (Ajustes visuales de posición por personaje e item)
CREATE TABLE personaje_item_offset (
    personaje_id INT NOT NULL,
    item_id INT NOT NULL,
    width INT NOT NULL DEFAULT 100,      -- Ancho del SVG
    pos_x INT NOT NULL DEFAULT 0,        -- Posición Left
    pos_y INT NOT NULL DEFAULT 0,        -- Posición Top
    rotacion INT NOT NULL DEFAULT 0,     -- Rotación en grados
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (personaje_id, item_id),
    CONSTRAINT fk_offset_personaje FOREIGN KEY (personaje_id) REFERENCES personajes(id) ON DELETE CASCADE,
    CONSTRAINT fk_offset_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 2. USUARIOS
-- --------------------------------------------------------

CREATE TABLE usuarios (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario      VARCHAR(50)  NOT NULL UNIQUE,
    correo              VARCHAR(255) NOT NULL UNIQUE,
    contrasena          VARCHAR(255) NOT NULL,
    foto_url            TEXT,
    es_admin            BOOLEAN DEFAULT FALSE,
    monedas             INT DEFAULT 0 CHECK (monedas >= 0),
    personaje_actual_id INT,
    fecha_registro      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_personaje FOREIGN KEY (personaje_actual_id)
        REFERENCES personajes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cuenta de administrador por defecto
INSERT INTO usuarios (nombre_usuario, correo, contrasena, es_admin) VALUES
    ('admin', 'admin@quizfy.com', 'admin123', TRUE);

-- --------------------------------------------------------
-- 3. MODULO DE QUIZZES Y TRIVIA (Panel de Administración)
-- --------------------------------------------------------

CREATE TABLE quiz_categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    dificultad ENUM('Fácil', 'Medio', 'Difícil') NOT NULL,
    tiempo_pregunta INT NOT NULL DEFAULT 30 CHECK (tiempo_pregunta > 0),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_quiz_categoria FOREIGN KEY (categoria_id)
        REFERENCES quiz_categorias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE preguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    enunciado TEXT NOT NULL,
    opcion_a VARCHAR(255) NOT NULL,
    opcion_b VARCHAR(255) NOT NULL,
    opcion_c VARCHAR(255) NOT NULL,
    opcion_d VARCHAR(255) NOT NULL,
    respuesta_correcta ENUM('A', 'B', 'C', 'D') NOT NULL,

    CONSTRAINT fk_pregunta_quiz FOREIGN KEY (quiz_id)
        REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 4. PARTIDAS, PROGRESO Y TIENDA (Jugadores)
-- --------------------------------------------------------

CREATE TABLE partidas (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id              INT NOT NULL,
    quiz_id                 INT NOT NULL,
    total_preguntas         SMALLINT DEFAULT 0,
    respuestas_correctas    SMALLINT DEFAULT 0,
    puntaje                 INT DEFAULT 0,
    monedas_ganadas         INT DEFAULT 0, -- Registra las monedas obtenidas en la partida
    estado                  ENUM('en_progreso', 'terminada', 'abandonada') DEFAULT 'en_progreso',
    fecha_inicio            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin               TIMESTAMP NULL DEFAULT NULL,

    CONSTRAINT fk_partida_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE,
    -- Se mantiene ON DELETE CASCADE para que el Admin pueda borrar Quizzes libremente
    CONSTRAINT fk_partida_quiz FOREIGN KEY (quiz_id)
        REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE usuario_items (
    usuario_id      INT NOT NULL,
    item_id         INT NOT NULL,
    fecha_compra    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    equipado        BOOLEAN DEFAULT FALSE, -- Indica si el accesorio está equipado actualmente
    PRIMARY KEY (usuario_id, item_id),

    CONSTRAINT fk_ui_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_ui_item FOREIGN KEY (item_id)
        REFERENCES items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- 5. TABLA INTERMEDIA: HISTORIAL DETALLADO DE PARTIDA
-- ========================================================
CREATE TABLE partida_respuestas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partida_id INT NOT NULL,
    pregunta_id INT NOT NULL,
    opcion_seleccionada ENUM('A', 'B', 'C', 'D', 'X'), -- 'X' si se le acabó el tiempo
    es_correcta BOOLEAN NOT NULL DEFAULT FALSE,
    tiempo_tardado_seg VARCHAR(10) DEFAULT '0', -- Para desempates en leaderboards
    fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pr_partida FOREIGN KEY (partida_id)
        REFERENCES partidas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pr_pregunta FOREIGN KEY (pregunta_id)
        REFERENCES preguntas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- 6. MODULO DE LOGROS Y GAMIFICACION
-- ========================================================
CREATE TABLE logros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    recompensa_monedas INT DEFAULT 50 CHECK (recompensa_monedas >= 0),
    icono_svg VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla Intermedia Muchos a Muchos (Usuario <-> Logro)
CREATE TABLE usuario_logros (
    usuario_id INT NOT NULL,
    logro_id INT NOT NULL,
    fecha_desbloqueo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, logro_id),

    CONSTRAINT fk_ul_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_ul_logro FOREIGN KEY (logro_id)
        REFERENCES logros(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- 7. MODULO DE ESTADISTICAS Y LEADERBOARD
-- ========================================================
CREATE TABLE usuario_estadisticas (
    usuario_id INT PRIMARY KEY,
    partidas_jugadas INT DEFAULT 0,
    partidas_ganadas INT DEFAULT 0,      -- Quizzes con >80% de acierto
    puntaje_acumulado BIGINT DEFAULT 0,  -- Para la tabla de posiciones global
    racha_dias INT DEFAULT 0,            -- Días seguidos jugando (estilo Duolingo)
    ultima_partida_fecha TIMESTAMP NULL DEFAULT NULL,

    CONSTRAINT fk_ue_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- 8. RESTRICCION DE MONO-EQUIPAMIENTO POR CATEGORIA
-- ========================================================
-- IMPORTANTE — diferencia de comportamiento con PostgreSQL:
-- En Postgres, un trigger puede actualizar OTRAS filas de la MISMA tabla que
-- lo disparó. MySQL/MariaDB lo prohíbe: un trigger no puede modificar la
-- tabla sobre la que está definido si esa tabla ya está siendo usada por la
-- sentencia que lo activó (error 1442: "Can't update table ... because it is
-- already used by statement which invoked this trigger"). Por eso esta
-- lógica NO se puede portar como trigger y se implementa como un
-- PROCEDIMIENTO ALMACENADO.
--
-- Tu API en PHP debe llamar a este procedimiento en vez de hacer un
-- INSERT/UPDATE directo sobre usuario_items cuando el usuario equipa un
-- accesorio, por ejemplo:
--   $stmt = $conexion->prepare("CALL sp_equipar_item(:usuario_id, :item_id)");
--   $stmt->execute(['usuario_id' => $usuarioId, 'item_id' => $itemId]);

DELIMITER $$

CREATE PROCEDURE sp_equipar_item(IN p_usuario_id INT, IN p_item_id INT)
BEGIN
    DECLARE v_categoria VARCHAR(50);

    SELECT categoria INTO v_categoria FROM items WHERE id = p_item_id;

    -- Desequipa cualquier otro item de la misma categoría que este usuario tenga
    UPDATE usuario_items ui
    JOIN items i ON ui.item_id = i.id
    SET ui.equipado = FALSE
    WHERE ui.usuario_id = p_usuario_id
      AND i.categoria = v_categoria
      AND ui.item_id <> p_item_id;

    -- Registra la compra si no existía, y marca este item como equipado
    INSERT INTO usuario_items (usuario_id, item_id, equipado)
    VALUES (p_usuario_id, p_item_id, TRUE)
    ON DUPLICATE KEY UPDATE equipado = TRUE;
END$$

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;
