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

-- ============================================================
-- SCRIPTS Y CONSULTAS EXTRAIDOS DE LA DOCUMENTACION (Word)
-- A partir de aqui: datos de prueba, operaciones CRUD, consultas
-- relacionales avanzadas e indices documentados en el Word.
-- ============================================================

-- --------------------------------------------------------
-- 5.2 Script DML de Insercion (INSERT INTO) - Datos de prueba
-- --------------------------------------------------------

-- Tabla: personajes
INSERT INTO personajes (nombre, ruta_imagen) VALUES
('Astro', '/avatares/astro_base.svg'),
('Nova', '/avatares/nova_base.svg'),
('Rex', '/avatares/rex_base.svg'),
('Luna', '/avatares/luna_base.svg'),
('Zeta', '/avatares/zeta_base.svg');

-- Tabla: items
INSERT INTO items (nombre, categoria, precio, ruta_svg) VALUES
('Gorra Pixel', 'Cabeza', 150.00, '/items/gorra_pixel.svg'),
('Lentes de Sol', 'Rostro', 80.00, '/items/lentes_sol.svg'),
('Capa Heroica', 'Cuerpo', 300.00, '/items/capa_heroica.svg'),
('Corona Dorada', 'Cabeza', 500.00, '/items/corona_dorada.svg'),
('Bigote Retro', 'Rostro', 60.00, '/items/bigote_retro.svg'),
('Armadura Neón', 'Cuerpo', 400.00, '/items/armadura_neon.svg'),
('Casco Espacial', 'Cabeza', 250.00, '/items/casco_espacial.svg');

-- Tabla: personaje_item_offset
INSERT INTO personaje_item_offset (personaje_id, item_id, width, pos_x, pos_y, rotacion) VALUES
(1, 1, 120, 10, -15, 0),
(1, 3, 200, 0, 40, 0),
(2, 2, 90, 15, 20, 0),
(2, 4, 130, 5, -20, 0),
(3, 5, 80, 20, 25, 5),
(4, 6, 220, 0, 35, 0),
(5, 7, 140, 8, -18, 0);

-- Tabla: usuarios
-- Nota: la cuenta 'admin' ya se inserta en el script DDL (quizfight_db.sql).
INSERT INTO usuarios (nombre_usuario, correo, contrasena, foto_url, es_admin, monedas, personaje_actual_id) VALUES
('juanp', 'juan.perez@example.com', '$2a$12$eImiTXuWVmM7hashado', '/fotos/juanp.png', FALSE, 350, 1),
('mlopez', 'maria.lopez@example.com', '$2a$12$k8l2m9P0Qhashado', '/fotos/mlopez.png', FALSE, 820, 2),
('carlosr', 'carlos.ruiz@example.com', '$2a$12$Ab3xZhashado', NULL, FALSE, 120, 3),
('sofiag', 'sofia.gomez@example.com', '$2a$12$Qw7yThashado', '/fotos/sofiag.png', FALSE, 990, 4),
('diegom', 'diego.morales@example.com', '$2a$12$Lm2nBhashado', NULL, FALSE, 60, 5),
('valeh', 'valentina.h@example.com', '$2a$12$Zx9cVhashado', '/fotos/valeh.png', FALSE, 450, 1);

-- Tabla: quiz_categorias
INSERT INTO quiz_categorias (nombre) VALUES
('Ciencia'),
('Historia'),
('Deportes'),
('Entretenimiento'),
('Geografía'),
('Tecnología');

-- Tabla: quizzes
INSERT INTO quizzes (categoria_id, titulo, dificultad, tiempo_pregunta) VALUES
(1, 'El Universo y sus Misterios', 'Medio', 30),
(2, 'Grandes Civilizaciones', 'Difícil', 45),
(3, 'Mundial de Fútbol', 'Fácil', 20),
(4, 'Cine de los 90', 'Medio', 30),
(5, 'Capitales del Mundo', 'Fácil', 25),
(6, 'Lenguajes de Programación', 'Difícil', 40);

-- Tabla: preguntas
INSERT INTO preguntas (quiz_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta) VALUES
(1, '¿Cuál es el planeta más grande del sistema solar?', 'Marte', 'Júpiter', 'Saturno', 'Neptuno', 'B'),
(1, '¿Qué galaxia contiene nuestro sistema solar?', 'Andrómeda', 'Vía Láctea', 'Triángulo', 'Sombrero', 'B'),
(2, '¿Qué civilización construyó Machu Picchu?', 'Maya', 'Azteca', 'Inca', 'Olmeca', 'C'),
(2, '¿En qué río se desarrolló la civilización egipcia?', 'Tigris', 'Éufrates', 'Nilo', 'Indo', 'C'),
(3, '¿Qué país ha ganado más Copas del Mundo?', 'Alemania', 'Argentina', 'Brasil', 'Italia', 'C'),
(4, '¿Quién dirigió "Jurassic Park"?', 'James Cameron', 'Steven Spielberg', 'George Lucas', 'Ridley Scott', 'B'),
(5, '¿Cuál es la capital de Australia?', 'Sídney', 'Melbourne', 'Canberra', 'Perth', 'C'),
(6, '¿Qué lenguaje impulsa el backend de QuizFight?', 'Python', 'JavaScript/Node.js', 'Ruby', 'PHP', 'B');

-- Tabla: partidas
INSERT INTO partidas (usuario_id, quiz_id, total_preguntas, respuestas_correctas, puntaje, monedas_ganadas, estado, fecha_fin) VALUES
(2, 1, 2, 2, 200, 40, 'terminada', NOW()),
(3, 2, 2, 1, 100, 20, 'terminada', NOW()),
(4, 3, 1, 1, 100, 20, 'terminada', NOW()),
(5, 4, 1, 0, 0, 0, 'terminada', NOW()),
(6, 5, 1, 1, 100, 20, 'terminada', NOW()),
(7, 6, 1, 1, 100, 20, 'terminada', NOW()),
(2, 6, 1, 0, 0, 0, 'abandonada', NULL),
(3, 3, 1, 0, 0, 0, 'en_progreso', NULL);

-- Tabla: usuario_items
INSERT INTO usuario_items (usuario_id, item_id, equipado) VALUES
(2, 1, TRUE),
(2, 3, TRUE),
(3, 2, TRUE),
(4, 4, TRUE),
(4, 6, FALSE),
(5, 5, TRUE),
(6, 7, TRUE),
(7, 1, FALSE);

-- Tabla: partida_respuestas
INSERT INTO partida_respuestas (partida_id, pregunta_id, opcion_seleccionada, es_correcta, tiempo_tardado_seg) VALUES
(1, 1, 'B', TRUE, '12'),
(1, 2, 'B', TRUE, '18'),
(2, 3, 'C', TRUE, '25'),
(2, 4, 'A', FALSE, '30'),
(3, 5, 'C', TRUE, '15'),
(4, 6, 'A', FALSE, '28'),
(5, 7, 'C', TRUE, '10'),
(6, 8, 'B', TRUE, '20'),
(7, 8, 'X', FALSE, '40');

-- Tabla: logros
INSERT INTO logros (titulo, descripcion, recompensa_monedas, icono_svg) VALUES
('Primer Triunfo', 'Completa tu primera partida con más del 50% de aciertos.', 50, '/logros/primer_triunfo.svg'),
('Racha de Fuego', 'Juega 5 días consecutivos.', 100, '/logros/racha_fuego.svg'),
('Sabio Total', 'Responde 50 preguntas correctamente en total.', 150, '/logros/sabio_total.svg'),
('Coleccionista', 'Compra 5 accesorios distintos en la tienda.', 80, '/logros/coleccionista.svg'),
('Velocista', 'Responde una pregunta en menos de 5 segundos.', 60, '/logros/velocista.svg');

-- Tabla: usuario_logros
INSERT INTO usuario_logros (usuario_id, logro_id) VALUES
(2, 1),
(2, 2),
(3, 1),
(4, 3),
(5, 1),
(6, 4);

-- Tabla: usuario_estadisticas
INSERT INTO usuario_estadisticas (usuario_id, partidas_jugadas, partidas_ganadas, puntaje_acumulado, racha_dias, ultima_partida_fecha) VALUES
(2, 12, 8, 3400, 5, NOW()),
(3, 7, 3, 1200, 2, NOW()),
(4, 5, 4, 1800, 1, NOW()),
(5, 3, 0, 0, 0, NOW()),
(6, 9, 6, 2500, 3, NOW()),
(7, 4, 2, 900, 1, NOW());

-- --------------------------------------------------------
-- 6.1 Operaciones Básicas CRUD (por cada tabla principal)
-- --------------------------------------------------------

-- Tabla: usuarios — Create
INSERT INTO usuarios (nombre_usuario, correo, contrasena)
VALUES ('nuevo_user', 'nuevo.usuario@example.com', '$2a$12$hashadoDeEjemplo');

-- Tabla: usuarios — Read
SELECT id, nombre_usuario, correo, monedas
FROM usuarios
WHERE id = 2;

-- Tabla: usuarios — Update
UPDATE usuarios
SET monedas = monedas + 50
WHERE id = 2;

-- Tabla: usuarios — Delete
DELETE FROM usuarios
WHERE id = 8;
-- ON DELETE CASCADE elimina en cadena sus partidas, ítems comprados,
-- logros desbloqueados y estadísticas asociadas.

-- Tabla: quizzes — Create
INSERT INTO quizzes (categoria_id, titulo, dificultad, tiempo_pregunta)
VALUES (1, 'Exploración Espacial', 'Medio', 30);

-- Tabla: quizzes — Read
SELECT id, titulo, dificultad, tiempo_pregunta
FROM quizzes
WHERE dificultad = 'Difícil';

-- Tabla: quizzes — Update
UPDATE quizzes
SET tiempo_pregunta = 35
WHERE id = 3;

-- Tabla: quizzes — Delete
DELETE FROM quizzes
WHERE id = 7;
-- ON DELETE CASCADE elimina sus preguntas y las partidas jugadas sobre él.

-- Tabla: preguntas — Create
INSERT INTO preguntas (quiz_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
VALUES (1, '¿Cuántas lunas tiene Marte?', '1', '2', '3', '4', 'B');

-- Tabla: preguntas — Read
SELECT enunciado, opcion_a, opcion_b, opcion_c, opcion_d
FROM preguntas
WHERE quiz_id = 1;

-- Tabla: preguntas — Update
UPDATE preguntas
SET opcion_c = 'Titán'
WHERE id = 5;

-- Tabla: preguntas — Delete
DELETE FROM preguntas
WHERE id = 9;

-- Tabla: items (tienda) — Create
INSERT INTO items (nombre, categoria, precio, ruta_svg)
VALUES ('Alas de Ángel', 'Cuerpo', 350.00, '/items/alas_angel.svg');

-- Tabla: items (tienda) — Read
SELECT nombre, categoria, precio
FROM items
WHERE precio BETWEEN 100 AND 400
ORDER BY precio ASC;

-- Tabla: items (tienda) — Update
UPDATE items
SET precio = 275.00
WHERE id = 6;

-- Tabla: items (tienda) — Delete
DELETE FROM items
WHERE id = 8;
-- ON DELETE CASCADE limpia usuario_items y personaje_item_offset relacionados.

-- Tabla: partidas — Create
INSERT INTO partidas (usuario_id, quiz_id, total_preguntas)
VALUES (2, 4, 5);

-- Tabla: partidas — Read
SELECT id, quiz_id, estado, puntaje, fecha_inicio
FROM partidas
WHERE usuario_id = 2
ORDER BY fecha_inicio DESC;

-- Tabla: partidas — Update (cierre de partida, equivalente a un "soft delete" de su estado activo)
UPDATE partidas
SET estado = 'terminada', respuestas_correctas = 4, puntaje = 400, fecha_fin = NOW()
WHERE id = 9;

-- Tabla: partidas — Delete
DELETE FROM partidas
WHERE id = 12;

-- --------------------------------------------------------
-- 6.2 Consultas Relacionales Avanzadas (JOINs)
-- --------------------------------------------------------

-- Consulta 1 (INNER JOIN — 2 Tablas)
-- Propósito: Pantalla de Perfil: obtener el nombre de usuario, sus monedas y el personaje que tiene equipado actualmente.
SELECT u.id, u.nombre_usuario, u.monedas, p.nombre AS personaje
FROM usuarios u
INNER JOIN personajes p ON u.personaje_actual_id = p.id;

-- Consulta 2 (Multiple JOIN — 4 Tablas)
-- Propósito: Pantalla de Resumen de Partida: mostrar cada pregunta respondida en una partida, la opción elegida y si fue correcta.
SELECT
    pa.id AS partida_id,
    u.nombre_usuario,
    q.titulo AS quiz,
    pre.enunciado,
    pr.opcion_seleccionada,
    pr.es_correcta
FROM partidas pa
JOIN usuarios u ON pa.usuario_id = u.id
JOIN quizzes q ON pa.quiz_id = q.id
JOIN partida_respuestas pr ON pr.partida_id = pa.id
JOIN preguntas pre ON pr.pregunta_id = pre.id
WHERE pa.id = 1;

-- Consulta 3 (Agregación con GROUP BY y HAVING)
-- Propósito: Leaderboard: calcular el puntaje total y el número de partidas terminadas por usuario, filtrando solo a quienes superan 100 puntos acumulados.
SELECT
    u.nombre_usuario,
    COUNT(p.id) AS total_partidas,
    SUM(p.puntaje) AS puntaje_total
FROM usuarios u
JOIN partidas p ON u.id = p.usuario_id
WHERE p.estado = 'terminada'
GROUP BY u.id, u.nombre_usuario
HAVING SUM(p.puntaje) > 100
ORDER BY puntaje_total DESC;

-- Consulta 4 (Búsqueda con Wildcards y Filtros)
-- Propósito: Catálogo de Quizzes: buscador de texto libre por título combinado con un filtro de dificultad.
SELECT q.id, q.titulo, q.dificultad, c.nombre AS categoria
FROM quizzes q
JOIN quiz_categorias c ON q.categoria_id = c.id
WHERE q.titulo ILIKE '%mundo%'
AND q.dificultad IN ('Fácil', 'Medio')
ORDER BY q.titulo;

-- Consulta 5 (LEFT JOIN — Historial de Compras)
-- Propósito: Pantalla 'Mi Inventario': listar los accesorios comprados por un usuario e indicar cuál tiene equipado.
SELECT
    i.nombre AS accesorio,
    i.categoria,
    i.precio,
    ui.fecha_compra,
    ui.equipado
FROM usuario_items ui
JOIN items i ON ui.item_id = i.id
WHERE ui.usuario_id = 2
ORDER BY ui.fecha_compra DESC;

-- Consulta 6 (JOIN — Logros Desbloqueados)
-- Propósito: Pantalla de Perfil / Logros: mostrar los logros que un usuario ya desbloqueó junto con su recompensa en monedas.
SELECT
    u.nombre_usuario,
    l.titulo AS logro,
    l.recompensa_monedas,
    ul.fecha_desbloqueo
FROM usuario_logros ul
JOIN usuarios u ON ul.usuario_id = u.id
JOIN logros l ON ul.logro_id = l.id
WHERE u.id = 2
ORDER BY ul.fecha_desbloqueo DESC;

-- --------------------------------------------------------
-- 7.1 Estrategia de Índices (Indexación)
-- --------------------------------------------------------

-- Búsquedas por categoría en el catálogo de quizzes
CREATE INDEX idx_quizzes_categoria ON quizzes(categoria_id);

-- Carga de preguntas de un quiz al iniciar una partida
CREATE INDEX idx_preguntas_quiz ON preguntas(quiz_id);

-- Historial de partidas por usuario
CREATE INDEX idx_partidas_usuario ON partidas(usuario_id);

-- Reportes de partidas por quiz
CREATE INDEX idx_partidas_quiz ON partidas(quiz_id);

-- Detalle de respuestas de una partida
CREATE INDEX idx_partida_respuestas_partida ON partida_respuestas(partida_id);

-- Ranking global ordenado por puntaje acumulado (leaderboard)
CREATE INDEX idx_usuario_estadisticas_puntaje
    ON usuario_estadisticas(puntaje_acumulado DESC);

-- Búsqueda de texto libre por título de quiz (requiere la extensión pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_quizzes_titulo_trgm
    ON quizzes USING GIN (titulo gin_trgm_ops);