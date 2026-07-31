-- ========================================================
-- Base de datos unificada de QuizFight
-- (Fusion de proyecto.sql + Query_v2_BasedeDatosTienda.sql)
-- ========================================================

-- ========================================================
-- 1. MODULO DE AVATARES Y ACCESORIOS (OFFSET STUDIO)
-- ========================================================

-- Tabla de Personajes Base
CREATE TABLE personajes (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL UNIQUE,
    ruta_imagen     VARCHAR(255) NOT NULL, -- Ruta donde se guarda el SVG o PNG
    fecha_creacion  TIMESTAMP DEFAULT NOW()
);

-- Tabla de Accesorios/Items
CREATE TABLE items (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    categoria       VARCHAR(50) NOT NULL CHECK (categoria IN ('Cabeza', 'Rostro', 'Cuerpo')),
    precio          DECIMAL(10, 2) DEFAULT 100.00 CHECK (precio >= 0),
    ruta_svg        VARCHAR(255) NOT NULL,
    fecha_creacion  TIMESTAMP DEFAULT NOW()
);

-- Tabla intermedia de offsets (ajustes de posicion por personaje e item)
CREATE TABLE personaje_item_offset (
    personaje_id        INTEGER NOT NULL REFERENCES personajes(id) ON DELETE CASCADE,
    item_id             INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    width               INTEGER NOT NULL DEFAULT 100,
    pos_x               INTEGER NOT NULL DEFAULT 0,
    pos_y               INTEGER NOT NULL DEFAULT 0,
    rotacion            INTEGER NOT NULL DEFAULT 0,
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (personaje_id, item_id)
);

-- ========================================================
-- 2. USUARIOS
-- ========================================================

CREATE TABLE usuarios (
    id                  SERIAL PRIMARY KEY,
    nombre_usuario      VARCHAR(50)  NOT NULL UNIQUE,
    correo              VARCHAR(255) NOT NULL UNIQUE,
    contrasena          VARCHAR(255) NOT NULL,
    foto_url            TEXT,
    es_admin            BOOLEAN DEFAULT FALSE,
    monedas             INTEGER DEFAULT 0 CHECK (monedas >= 0),
    personaje_actual_id INTEGER REFERENCES personajes(id),
    fecha_registro      TIMESTAMP DEFAULT NOW()
);

-- Cuenta de administrador por defecto (cambiar la contrasena despues).
INSERT INTO usuarios (nombre_usuario, correo, contrasena, es_admin) VALUES
    ('admin', 'admin@quizfight.com', 'admin123', TRUE);

-- ========================================================
-- 3. MODULO DE QUIZZES Y TRIVIA
-- ========================================================

CREATE TABLE materias (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL UNIQUE,
    descripcion     TEXT
);

INSERT INTO materias (nombre, descripcion) VALUES
    ('Matematicas', 'Quiz de matematicas'),
    ('Ciencias', 'Quiz de ciencias'),
    ('Lenguaje', 'Quiz de lenguaje'),
    ('Sociales', 'Quiz de sociales'),
    ('Ingles', 'Quiz de ingles');

CREATE TABLE niveles (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(50) NOT NULL UNIQUE,
    orden           SMALLINT NOT NULL UNIQUE CHECK (orden BETWEEN 1 AND 3)
);

INSERT INTO niveles (nombre, orden) VALUES
    ('Facil', 1),
    ('Intermedio', 2),
    ('Avanzado', 3);

-- Un quiz es una materia combinada con un nivel (ej: Matematicas - Facil).
-- El administrador puede activar o desactivar cada quiz desde "activo",
-- y tambien editar o borrar sus preguntas.
CREATE TABLE quizzes (
    id              SERIAL PRIMARY KEY,
    materia_id      INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
    nivel_id        INTEGER NOT NULL REFERENCES niveles(id),
    titulo          VARCHAR(150),
    tiempo_pregunta INTEGER NOT NULL DEFAULT 30 CHECK (tiempo_pregunta > 0),
    activo          BOOLEAN DEFAULT TRUE,
    UNIQUE (materia_id, nivel_id)
);

-- Se crean los quizzes iniciales: todas las materias en todos los niveles,
-- menos Ingles que solo esta disponible en el nivel Avanzado.
INSERT INTO quizzes (materia_id, nivel_id)
SELECT m.id, n.id
FROM materias m
CROSS JOIN niveles n
WHERE m.nombre <> 'Ingles'
UNION ALL
SELECT m.id, n.id
FROM materias m
JOIN niveles n ON n.nombre = 'Avanzado'
WHERE m.nombre = 'Ingles';

CREATE TABLE preguntas (
    id              SERIAL PRIMARY KEY,
    quiz_id         INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    pregunta        TEXT NOT NULL,
    fecha_creacion  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE opciones (
    id              SERIAL PRIMARY KEY,
    pregunta_id     INTEGER NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
    texto           TEXT NOT NULL,
    es_correcta     BOOLEAN DEFAULT FALSE
);

-- ========================================================
-- 4. PARTIDAS, PROGRESO Y TIENDA (usuarios)
-- ========================================================

CREATE TABLE partidas (
    id                      SERIAL PRIMARY KEY,
    usuario_id              INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    quiz_id                 INTEGER NOT NULL REFERENCES quizzes(id),
    total_preguntas         SMALLINT DEFAULT 0,
    respuestas_correctas    SMALLINT DEFAULT 0,
    puntaje                 INTEGER DEFAULT 0,
    estado                  VARCHAR(20) DEFAULT 'en_progreso'
                                CHECK (estado IN ('en_progreso', 'terminada', 'abandonada')),
    fecha_inicio            TIMESTAMP DEFAULT NOW(),
    fecha_fin               TIMESTAMP
);

CREATE TABLE respuestas_partida (
    id                  SERIAL PRIMARY KEY,
    partida_id          INTEGER NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
    pregunta_id         INTEGER NOT NULL REFERENCES preguntas(id),
    opcion_elegida_id   INTEGER REFERENCES opciones(id),
    es_correcta         BOOLEAN DEFAULT FALSE,
    fecha_respuesta     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE progreso (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    quiz_id         INTEGER NOT NULL REFERENCES quizzes(id),
    mejor_puntaje   INTEGER DEFAULT 0,
    veces_jugado    INTEGER DEFAULT 0,
    completado      BOOLEAN DEFAULT FALSE,
    ultima_vez      TIMESTAMP,
    UNIQUE (usuario_id, quiz_id)
);

-- Tabla de posiciones: para mostrar el ranking se hace una consulta
-- a "progreso" ordenando por mejor_puntaje, agrupando por quiz.

-- Tabla intermedia: items de tienda comprados por cada usuario.
-- Puente entre el modulo de trivia (que otorga "monedas" via puntaje)
-- y el modulo de avatares (que se paga con esas monedas).
CREATE TABLE usuario_items (
    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    item_id         INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    fecha_compra    TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (usuario_id, item_id)
);
