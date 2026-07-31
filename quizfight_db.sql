-- ========================================================
-- Base de Datos Unificada de QuizFy (Versión Optimizada)
-- ========================================================

-- --------------------------------------------------------
-- 1. MODULO DE AVATARES Y ACCESORIOS (OFFSET STUDIO)
-- --------------------------------------------------------

-- Tabla de Personajes Base
CREATE TABLE personajes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    ruta_imagen VARCHAR(255) NOT NULL, -- Ruta donde se guarda el SVG o PNG base
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Accesorios/Items de la Tienda
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Cabeza', 'Rostro', 'Cuerpo')),
    precio DECIMAL(10, 2) DEFAULT 100.00 CHECK (precio >= 0),
    ruta_svg VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla intermedia de offsets (Ajustes visuales de posición por personaje e item)
CREATE TABLE personaje_item_offset (
    personaje_id INT NOT NULL,
    item_id INT NOT NULL,
    width INT NOT NULL DEFAULT 100,      -- Ancho del SVG
    pos_x INT NOT NULL DEFAULT 0,        -- Posición Left
    pos_y INT NOT NULL DEFAULT 0,        -- Posición Top
    rotacion INT NOT NULL DEFAULT 0,      -- Rotación en grados
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (personaje_id, item_id),
    CONSTRAINT fk_offset_personaje FOREIGN KEY (personaje_id) REFERENCES personajes(id) ON DELETE CASCADE,
    CONSTRAINT fk_offset_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 2. USUARIOS
-- --------------------------------------------------------

CREATE TABLE usuarios (
    id                  SERIAL PRIMARY KEY,
    nombre_usuario      VARCHAR(50)  NOT NULL UNIQUE,
    correo              VARCHAR(255) NOT NULL UNIQUE,
    contrasena          VARCHAR(255) NOT NULL,
    foto_url            TEXT,
    es_admin            BOOLEAN DEFAULT FALSE,
    monedas             INTEGER DEFAULT 0 CHECK (monedas >= 0),
    -- Corrección: ON DELETE SET NULL para no bloquear el borrado de personajes base
    personaje_actual_id INTEGER REFERENCES personajes(id) ON DELETE SET NULL,
    fecha_registro      TIMESTAMP DEFAULT NOW()
);

-- Cuenta de administrador por defecto
INSERT INTO usuarios (nombre_usuario, correo, contrasena, es_admin) VALUES
    ('admin', 'admin@quizfy.com', 'admin123', TRUE);

-- --------------------------------------------------------
-- 3. MODULO DE QUIZZES Y TRIVIA (Panel de Administración)
-- --------------------------------------------------------

CREATE TABLE quiz_categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    categoria_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    dificultad VARCHAR(20) NOT NULL CHECK (dificultad IN ('Fácil', 'Medio', 'Difícil')),
    tiempo_pregunta INT NOT NULL DEFAULT 30 CHECK (tiempo_pregunta > 0),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_quiz_categoria FOREIGN KEY (categoria_id) REFERENCES quiz_categorias(id) ON DELETE CASCADE
);

CREATE TABLE preguntas (
    id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL,
    enunciado TEXT NOT NULL,
    opcion_a VARCHAR(255) NOT NULL,
    opcion_b VARCHAR(255) NOT NULL,
    opcion_c VARCHAR(255) NOT NULL,
    opcion_d VARCHAR(255) NOT NULL,
    respuesta_correcta CHAR(1) NOT NULL CHECK (respuesta_correcta IN ('A', 'B', 'C', 'D')),
    
    CONSTRAINT fk_pregunta_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 4. PARTIDAS, PROGRESO Y TIENDA (Jugadores)
-- --------------------------------------------------------

CREATE TABLE partidas (
    id                      SERIAL PRIMARY KEY,
    usuario_id              INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    -- CORRECCIÓN CRÍTICA: Se agrega ON DELETE CASCADE para que el Admin pueda borrar Quizzes libremente
    quiz_id                 INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    total_preguntas         SMALLINT DEFAULT 0,
    respuestas_correctas    SMALLINT DEFAULT 0,
    puntaje                 INTEGER DEFAULT 0,
    monedas_ganadas         INTEGER DEFAULT 0, -- ¡NUEVO! Registra las monedas obtenidas en la partida
    estado                  VARCHAR(20) DEFAULT 'en_progreso'
                                CHECK (estado IN ('en_progreso', 'terminada', 'abandonada')),
    fecha_inicio            TIMESTAMP DEFAULT NOW(),
    fecha_fin               TIMESTAMP
);

CREATE TABLE usuario_items (
    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    item_id         INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    fecha_compra    TIMESTAMP DEFAULT NOW(),
    equipado        BOOLEAN DEFAULT FALSE, -- ¡NUEVO! Indica si el accesorio está equipado actualmente
    PRIMARY KEY (usuario_id, item_id)
);

-- ========================================================
-- 1. TABLA INTERMEDIA: HISTORIAL DETALLADO DE PARTIDA
-- ========================================================
CREATE TABLE partida_respuestas (
    id SERIAL PRIMARY KEY,
    partida_id INTEGER NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
    pregunta_id INTEGER NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
    opcion_seleccionada CHAR(1) CHECK (opcion_seleccionada IN ('A', 'B', 'C', 'D', 'X')), -- 'X' si se le acabó el tiempo
    es_correcta BOOLEAN NOT NULL DEFAULT FALSE,
    tiempo_tardado_seg VARCHAR(10) DEFAULT '0', -- Para desempates en leaderboards
    fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 2. MODULO DE LOGROS Y GAMIFICACION (NUEVO)
-- ========================================================
CREATE TABLE logros (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    recompensa_monedas INTEGER DEFAULT 50 CHECK (recompensa_monedas >= 0),
    icono_svg VARCHAR(255) NOT NULL
);

-- Tabla Intermedia Muchos a Muchos (Usuario <-> Logro)
CREATE TABLE usuario_logros (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    logro_id INTEGER NOT NULL REFERENCES logros(id) ON DELETE CASCADE,
    fecha_desbloqueo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, logro_id)
);

-- ========================================================
-- 3. MODULO DE ESTADISTICAS Y LEADERBOARD (NUEVO - OPTIMIZACION)
-- ========================================================
CREATE TABLE usuario_estadisticas (
    usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    partidas_jugadas INTEGER DEFAULT 0,
    partidas_ganadas INTEGER DEFAULT 0,  -- Quizzes con >80% de acierto
    puntaje_acumulado BIGINT DEFAULT 0,  -- Para la tabla de posiciones global
    racha_dias INTEGER DEFAULT 0,        -- Días seguidos jugando (estilo Duolingo)
    ultima_partida_fecha TIMESTAMP
);

-- ========================================================
-- 4. RESTRICCION DE MONO-EQUIPAMIENTO POR CATEGORIA
-- ========================================================
-- Esta función y trigger aseguran que al marcar equipado = TRUE en un ítem,
-- se desmarquen automáticamente los otros ítems de la MISMA categoría para ese usuario.

CREATE OR REPLACE FUNCTION auto_desequipar_categoria() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.equipado = TRUE THEN
        UPDATE usuario_items ui
        SET equipado = FALSE
        FROM items i_old, items i_new
        WHERE ui.item_id = i_old.id
          AND NEW.item_id = i_new.id
          AND ui.usuario_id = NEW.usuario_id
          AND i_old.categoria = i_new.categoria
          AND ui.item_id <> NEW.item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_equip_per_category
BEFORE INSERT OR UPDATE ON usuario_items
FOR EACH ROW
EXECUTE FUNCTION auto_desequipar_categoria();