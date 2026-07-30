// ==========================================
// CONFIGURACIÓN GLOBAL
// ==========================================
const API_URL = 'api/'; // Ruta donde están tus archivos PHP

// ==========================================
// 1. NAVEGACIÓN Y UI (SINGLE PAGE APPLICATION)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarNavegacion();
    cargarPersonajes();
    cargarQuizzes();
});

function inicializarNavegacion() {
    // 1.1 Control de Submenús (Acordeón)
    const dropdownHeaders = document.querySelectorAll('.dropdown-header');
    dropdownHeaders.forEach(header => {
        header.addEventListener('click', (e) => {
            const targetId = header.getAttribute('data-target');
            const submenu = document.getElementById(targetId);
            
            // Toggle de clases
            header.classList.toggle('active');
            submenu.classList.toggle('open');
        });
    });

    // 1.2 Cambio de Vistas (Pantallas)
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    const titleElement = document.getElementById('current-view-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Quitar clase active a todos los botones del menú y vistas
            navItems.forEach(nav => nav.classList.remove('active'));
            viewSections.forEach(view => view.classList.remove('active'));

            // Agregar clase active al botón clickeado
            item.classList.add('active');

            // Mostrar la vista correspondiente
            const targetViewId = item.getAttribute('data-view');
            document.getElementById(targetViewId).classList.add('active');

            // Actualizar el título superior
            titleElement.innerHTML = item.innerHTML;
        });
    });
}

// ==========================================
// 2. MÓDULO DE PERSONAJES
// ==========================================

// 2.1 Cargar y mostrar personajes
async function cargarPersonajes() {
    try {
        const response = await fetch(`${API_URL}api_personajes.php?accion=leer`);
        const result = await response.json();

        if (result.status === 'success') {
            const tbody = document.getElementById('tabla-personajes-body');
            const selectEditor = document.getElementById('selectPersonaje');
            
            tbody.innerHTML = '';
            selectEditor.innerHTML = '<option value="">Seleccione un personaje...</option>';

            result.data.forEach(p => {
                // 1. Llenar la tabla del CRUD
                tbody.innerHTML += `
                    <tr>
                        <td>${p.id}</td>
                        <td>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <img src="${p.ruta_imagen}" style="width:40px; height:40px; object-fit:contain; background:#222b3c; border-radius:5px;">
                                ${p.nombre}
                            </div>
                        </td>
                        <td><small style="color:var(--text-muted)">${p.ruta_imagen}</small></td>
                        <td>
                            <div style="display:flex; gap:5px;">
                                <button class="btn btn-sm" style="background-color: var(--accent-purple); color: white;" onclick="editarPersonaje(${p.id}, '${p.nombre}')">✏️ Editar</button>
                                <button class="btn btn-sm btn-danger" onclick="eliminarPersonaje(${p.id})">🗑️ Borrar</button>
                            </div>
                        </td>
                    </tr>
                `;

                // 2. Llenar el <select> del Editor de Offset al mismo tiempo
                selectEditor.innerHTML += `<option value="${p.id}" data-img="${p.ruta_imagen}">${p.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error("Error cargando personajes:", error);
        Swal.fire('Error', 'No se pudieron cargar los personajes', 'error');
    }
}

// =====================================================================================================================================

// 2.2 Crear un nuevo personaje
const formPersonaje = document.getElementById('form-personaje');
if(formPersonaje) {
    formPersonaje.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página recargue

        const formData = new FormData(formPersonaje);
        formData.append('accion', 'crear');

        try {
            const response = await fetch(`${API_URL}api_personajes.php`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.status === 'success') {
                Swal.fire({
                    title: '¡Añadido!',
                    text: result.mensaje,
                    icon: 'success',
                    background: '#151a24',
                    color: '#fff'
                });
                formPersonaje.reset(); // Limpia el formulario
                cargarPersonajes();    // Recarga la tabla para mostrar el nuevo
            } else {
                Swal.fire('Error', result.mensaje, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Hubo un problema de conexión', 'error');
        }
    });
}

// =====================================================================================================================================

// 2.3 Eliminar personaje
async function eliminarPersonaje(id) {
    const confirmacion = await Swal.fire({
        title: '¿Estás seguro?',
        text: "¡Se borrará el personaje y sus ajustes de offset en cascada!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#222b3c',
        confirmButtonText: 'Sí, eliminar',
        background: '#151a24',
        color: '#fff'
    });

    if (confirmacion.isConfirmed) {
        const formData = new FormData();
        formData.append('accion', 'eliminar');
        formData.append('id', id);

        try {
            const response = await fetch(`${API_URL}api_personajes.php`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.status === 'success') {
                Swal.fire({
                    title: 'Eliminado',
                    text: 'Personaje borrado.',
                    icon: 'success',
                    background: '#151a24',
                    color: '#fff'
                });
                cargarPersonajes(); // Recargamos la tabla
            } else {
                Swal.fire('Error', result.mensaje, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Hubo un problema al eliminar', 'error');
        }
    }
}

// =====================================================================================================================================

// 2.4 Editar Personaje (Modal de SweetAlert2)
// 2.X Editar Personaje (Solo Nombre)
async function editarPersonaje(id, nombreActual) {
    const { value: nuevoNombre } = await Swal.fire({
        title: '✏️ Editar Personaje',
        text: 'Modifica el nombre del personaje:',
        input: 'text',
        inputValue: nombreActual, // Muestra el nombre actual por defecto
        showCancelButton: true,
        confirmButtonText: '💾 Guardar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#10b981', // accent-green
        cancelButtonColor: '#222b3c',
        background: '#151a24',
        color: '#fff',
        inputValidator: (value) => {
            if (!value) {
                return '¡El nombre no puede estar vacío!';
            }
        }
    });

    // Si el usuario ingresó un nombre y presionó guardar
    if (nuevoNombre && nuevoNombre !== nombreActual) {
        const formData = new FormData();
        formData.append('accion', 'editar');
        formData.append('id', id);
        formData.append('p_nombre', nuevoNombre);

        try {
            const response = await fetch(`${API_URL}api_personajes.php`, { method: 'POST', body: formData });
            const result = await response.json();

            if (result.status === 'success') {
                Swal.fire({
                    toast: true, position: 'top-end', showConfirmButton: false, timer: 2000,
                    icon: 'success', title: 'Nombre actualizado', background: '#151a24', color: '#fff'
                });
                cargarPersonajes(); // Recarga la tabla al instante
                cargarItems(); // Opcional: Para refrescar los selectores en el Editor de Offset
            } else {
                Swal.fire('Error', result.mensaje, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Hubo un problema al actualizar.', 'error');
        }
    }
}

// ==========================================
// 3. MÓDULO DE ACCESORIOS (ÍTEMS)
// ==========================================

// Se ejecuta al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarItems(); // Añadimos esto para que cargue los ítems al iniciar
});

// =====================================================================================================================================

// 3.1 Cargar y mostrar ítems
async function cargarItems() {
    try {
        const response = await fetch(`${API_URL}api_items.php?accion=leer`);
        const result = await response.json();

        if (result.status === 'success') {
            const tbody = document.getElementById('tabla-items-body');
            const selectItem = document.getElementById('selectItem');
            
            tbody.innerHTML = '';
            selectItem.innerHTML = '<option value="">Seleccione un accesorio...</option>';

            result.data.forEach(item => {
                // Llenar tabla del CRUD
                tbody.innerHTML += `
                    <tr>
                        <td>${item.id}</td>
                        <td>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <img src="${item.ruta_svg}" style="width:30px; height:30px; object-fit:contain; filter: drop-shadow(0 0 2px var(--primary-neon));">
                                ${item.nombre}
                            </div>
                        </td>
                        <td><span class="badge" style="background:var(--bg-sidebar); padding:4px 8px; border-radius:4px;">${item.categoria}</span></td>
                        <td>$${item.precio}</td>
                        <td>
                            <button class="btn btn-sm" style="background-color: var(--accent-purple); color: white;" onclick="abrirModalEditarItem(${item.id}, '${item.nombre}', ${item.precio}, '${item.categoria}')">✏️ Editar</button>
                            <button class="btn btn-sm btn-danger" onclick="eliminarItem(${item.id})">🗑️</button>
                        </td>
                    </tr>
                `;

                // Llenar el <select> del Editor de Offset
                selectItem.innerHTML += `<option value="${item.id}" data-svg="${item.ruta_svg}">${item.nombre} (${item.categoria})</option>`;
            });
        }
    } catch (error) {
        console.error("Error cargando ítems:", error);
    }
}

// =====================================================================================================================================

// 3.2 Crear un nuevo Accesorio
const formItem = document.getElementById('form-item');
if(formItem) {
    formItem.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(formItem);
        formData.append('accion', 'crear');

        try {
            const response = await fetch(`${API_URL}api_items.php`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.status === 'success') {
                Swal.fire({
                    title: '¡Ítem Guardado!',
                    text: result.mensaje,
                    icon: 'success',
                    background: '#151a24',
                    color: '#fff'
                });
                formItem.reset();
                cargarItems(); // Recargar la tabla y el select del editor
            } else {
                Swal.fire('Error', result.mensaje, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Hubo un problema al crear el ítem', 'error');
        }
    });
}

// =====================================================================================================================================

// 3.3 Eliminar Accesorio
async function eliminarItem(id) {
    const confirmacion = await Swal.fire({
        title: '¿Borrar Accesorio?',
        text: "Se eliminará el archivo SVG y los ajustes de offset en los personajes que lo usen.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#222b3c',
        confirmButtonText: 'Sí, borrar',
        background: '#151a24',
        color: '#fff'
    });

    if (confirmacion.isConfirmed) {
        const formData = new FormData();
        formData.append('accion', 'eliminar');
        formData.append('id', id);

        try {
            const response = await fetch(`${API_URL}api_items.php`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.status === 'success') {
                Swal.fire({
                    title: 'Eliminado',
                    text: 'Accesorio borrado.',
                    icon: 'success',
                    background: '#151a24',
                    color: '#fff'
                });
                cargarItems();
            } else {
                Swal.fire('Error', result.mensaje, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Hubo un problema al eliminar', 'error');
        }
    }
}

// =====================================================================================================================================

// 3.4 GESTIÓN DE ACCESORIOS (EDICIÓN)
// Función para abrir el modal y pre-llenar los datos
function abrirModalEditarItem(id, nombre, precio, categoria) {
    const modal = document.getElementById('modal-editar-item');
    if (!modal) return console.error("No se encontró el modal 'modal-editar-item'");

    // Llenamos los inputs usando los IDs exactos de tu HTML
    document.getElementById('edit-i-id').value = id;
    document.getElementById('edit-i-nombre').value = nombre;
    document.getElementById('edit-i-precio').value = precio;
    document.getElementById('edit-i-categoria').value = categoria;

    modal.style.display = 'flex'; 
}

const formEditarItem = document.getElementById('form-editar-item');

if (formEditarItem) {
    // Esto se ejecuta por sí solo al cargar la página, esperando a que hagas submit
    formEditarItem.addEventListener('submit', async (e) => {
        // 1. Previene que el navegador recargue la página
        e.preventDefault(); 

        // 2. Empaquetamos automáticamente todos los inputs del <form>
        const formData = new FormData(formEditarItem);
        formData.append('accion', 'editar');

        try {
            const response = await fetch(`${API_URL}api_items.php`, { 
                method: 'POST', 
                body: formData 
            });
            
            const result = await response.json();

            if (result.status === 'success') {
                Swal.fire({
                    toast: true, 
                    position: 'top-end', 
                    showConfirmButton: false, 
                    timer: 2000,
                    icon: 'success', 
                    title: 'Accesorio actualizado', 
                    background: '#151a24', 
                    color: '#fff'
                });
                
                cerrarModalEditarItem(); // Cerramos el modal
                cargarItems();           // Recargamos la tabla con los datos nuevos
            } else {
                Swal.fire('Error', result.mensaje, 'error');
            }
        } catch (error) {
            console.error("Error al actualizar:", error);
            Swal.fire('Error', 'Hubo un problema de conexión al actualizar.', 'error');
        }
    });
}

function cerrarModalEditarItem() {
    const modal = document.getElementById('modal-editar-item');
    if (modal) modal.style.display = 'none';
}

// Escuchar los botones de cierre genéricos (la "X")
document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modalId = e.target.getAttribute('data-modal');
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    });
});

// ==========================================
// 4. MÓDULO: STUDIO OFFSET EDITOR
// ==========================================

// Elementos del DOM
const selectPersonaje = document.getElementById('selectPersonaje');
const selectItem = document.getElementById('selectItem');
const stagePersonaje = document.getElementById('stagePersonaje');
const stageItem = document.getElementById('stageItem');

// Controles (Sliders e Inputs Numéricos)
const controls = {
    w: { slider: document.getElementById('sliderWidth'), num: document.getElementById('numWidth'), css: 'width', unit: 'px', tel: document.getElementById('telemetryW') },
    x: { slider: document.getElementById('sliderLeft'), num: document.getElementById('numLeft'), css: 'left', unit: 'px', tel: document.getElementById('telemetryX') },
    y: { slider: document.getElementById('sliderTop'), num: document.getElementById('numTop'), css: 'top', unit: 'px', tel: document.getElementById('telemetryY') },
    r: { slider: document.getElementById('sliderRotate'), num: document.getElementById('numRotate'), css: 'transform', unit: 'deg', tel: document.getElementById('telemetryR') }
};

// =====================================================================================================================================

// 4.1 Actualizar imágenes en el Canvas Stage
function actualizarStage() {
    const pjOption = selectPersonaje.options[selectPersonaje.selectedIndex];
    const itemOption = selectItem.options[selectItem.selectedIndex];

    if (pjOption.value) {
        stagePersonaje.src = pjOption.getAttribute('data-img') || pjOption.getAttribute('data-svg'); // por si es svg o img
        stagePersonaje.style.display = 'block';
    } else {
        stagePersonaje.style.display = 'none';
    }

    if (itemOption.value) {
        stageItem.src = itemOption.getAttribute('data-svg');
        stageItem.style.display = 'block';
        stageItem.style.position = 'absolute'; // Vital para que se mueva libremente
        cargarConfiguracionOffset(pjOption.value, itemOption.value);
    } else {
        stageItem.style.display = 'none';
    }
}

selectPersonaje.addEventListener('change', actualizarStage);
selectItem.addEventListener('change', actualizarStage);

// =====================================================================================================================================

// 4.2 Sincronizar Sliders, Inputs y la Imagen en tiempo real
function aplicarTransformacion() {
    const w = controls.w.slider.value;
    const x = controls.x.slider.value;
    const y = controls.y.slider.value;
    const r = controls.r.slider.value;

    // Aplicar a la imagen
    stageItem.style.width = `${w}px`;
    stageItem.style.left = `${x}px`;
    stageItem.style.top = `${y}px`;
    stageItem.style.transform = `rotate(${r}deg)`;

    // Actualizar telemetría (HUD)
    controls.w.tel.innerText = w;
    controls.x.tel.innerText = x;
    controls.y.tel.innerText = y;
    controls.r.tel.innerText = r;
}

function vincularControles(key) {
    const control = controls[key];
    
    // Si muevo el slider, actualiza el input numérico y la imagen
    control.slider.addEventListener('input', (e) => {
        control.num.value = e.target.value;
        aplicarTransformacion();
    });

    // Si escribo en el input numérico, actualiza el slider y la imagen
    control.num.addEventListener('input', (e) => {
        control.slider.value = e.target.value;
        aplicarTransformacion();
    });
}

// Inicializar vínculos de los controles
['w', 'x', 'y', 'r'].forEach(vincularControles);

// =====================================================================================================================================

// 4.3 Consultar a PHP si ya existe un offset guardado
async function cargarConfiguracionOffset(personajeId, itemId) {
    if (!personajeId || !itemId) return;

    const formData = new FormData();
    formData.append('accion', 'leer_especifico');
    formData.append('personaje_id', personajeId);
    formData.append('item_id', itemId);

    try {
        const response = await fetch(`${API_URL}api_offsets.php`, { method: 'POST', body: formData });
        const result = await response.json();

        if (result.status === 'success' && result.existe) {
            // Si ya existe configuración, se la aplicamos a los controles
            actualizarValoresControl(result.data.width, result.data.pos_x, result.data.pos_y, result.data.rotacion);
            Swal.fire({
                toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
                icon: 'info', title: 'Configuración previa cargada', background: '#151a24', color: '#00f2fe'
            });
        } else {
            // Si es nuevo, reseteamos a los valores por defecto
            resetearAjustes();
        }
    } catch (error) {
        console.error("Error cargando offset:", error);
    }
}

// =====================================================================================================================================

// 4.4 Funciones de Ayuda (Reset y Centrar)
function actualizarValoresControl(w, x, y, r) {
    controls.w.slider.value = controls.w.num.value = w;
    controls.x.slider.value = controls.x.num.value = x;
    controls.y.slider.value = controls.y.num.value = y;
    controls.r.slider.value = controls.r.num.value = r;
    aplicarTransformacion();
}

function resetearAjustes() {
    actualizarValoresControl(100, 0, 0, 0); // Valores por defecto
}

document.getElementById('btnResetAjustes').addEventListener('click', resetearAjustes);

document.getElementById('btnCentrarX').addEventListener('click', () => {
    // Calcula el centro aproximado basado en un canvas de 300px y el ancho actual del ítem
    const anchoItem = parseInt(controls.w.slider.value);
    const centroX = (300 / 2) - (anchoItem / 2);
    controls.x.slider.value = controls.x.num.value = centroX;
    aplicarTransformacion();
});

// =====================================================================================================================================

// 4.5 Guardar la posición exacta en la Base de Datos
document.getElementById('btnGuardarAjuste').addEventListener('click', async () => {
    const personajeId = selectPersonaje.value;
    const itemId = selectItem.value;

    if (!personajeId || !itemId) {
        Swal.fire('Atención', 'Debes seleccionar un personaje y un accesorio primero.', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('accion', 'guardar');
    formData.append('personaje_id', personajeId);
    formData.append('item_id', itemId);
    formData.append('width', controls.w.slider.value);
    formData.append('pos_x', controls.x.slider.value);
    formData.append('pos_y', controls.y.slider.value);
    formData.append('rotacion', controls.r.slider.value);

    try {
        const response = await fetch(`${API_URL}api_offsets.php`, { method: 'POST', body: formData });
        const result = await response.json();

        if (result.status === 'success') {
            Swal.fire({
                title: '¡Posición Guardada!',
                text: 'Las coordenadas exactas se han almacenado.',
                icon: 'success',
                background: '#151a24',
                color: '#fff'
            });
        } else {
            Swal.fire('Error', result.mensaje, 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Problema al guardar la configuración.', 'error');
    }
});

// ==========================================
// 5. MÓDULO DE QUIZZES Y TRIVIA
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    cargarCategoriasQuiz();
    cargarQuizzes();
    cargarListaCategorias()
});

// 5.1 Cargar Categorías en los <select>
async function cargarCategoriasQuiz() {
    try {
        const response = await fetch(`${API_URL}api_categorias.php?accion=leer`);
        const result = await response.json();

        if (result.status === 'success') {
            const selects = document.querySelectorAll('.select-dinamico-cat');
            selects.forEach(select => {
                select.innerHTML = '';
                result.data.forEach(cat => {
                    select.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
                });
            });
        }
    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
}

// =====================================================================================================================================

// 5.2 Lógica del Creador de Quizzes (Memoria Temporal)
let quizMemoria = [];
let preguntaActual = 1;
let totalPreguntas = 3;

const numPreguntasInput = document.getElementById('numPreguntasInput');
const lblNumPregunta = document.getElementById('lblNumPregunta');
const btnPrevPregunta = document.getElementById('btnPrevPregunta');
const btnNextPregunta = document.getElementById('btnNextPregunta');

// Campos de la pregunta actual
const txtPregunta = document.getElementById('txtPregunta');
const respA = document.getElementById('respA');
const respB = document.getElementById('respB');
const respC = document.getElementById('respC');
const respD = document.getElementById('respD');
const respCorrecta = document.getElementById('respCorrecta');

// Inicializar memoria al cambiar cantidad de preguntas
numPreguntasInput.addEventListener('change', (e) => {
    totalPreguntas = parseInt(e.target.value) || 1;
    quizMemoria = Array(totalPreguntas).fill(null).map(() => ({
        enunciado: '', a: '', b: '', c: '', d: '', correcta: 'A'
    }));
    preguntaActual = 1;
    actualizarVistaPregunta();
});

// Guardar la pregunta actual en la memoria de JS
function guardarPreguntaActualEnMemoria() {
    if(quizMemoria.length === 0) {
        // Inicialización forzada si está vacío
        quizMemoria = Array(totalPreguntas).fill(null).map(() => ({
            enunciado: '', a: '', b: '', c: '', d: '', correcta: 'A'
        }));
    }
    
    quizMemoria[preguntaActual - 1] = {
        enunciado: txtPregunta.value,
        a: respA.value,
        b: respB.value,
        c: respC.value,
        d: respD.value,
        correcta: respCorrecta.value
    };
}

// Actualizar los inputs con los datos de la memoria
function actualizarVistaPregunta() {
    lblNumPregunta.innerText = `${preguntaActual} de ${totalPreguntas}`;
    
    let datos = quizMemoria[preguntaActual - 1] || { enunciado: '', a: '', b: '', c: '', d: '', correcta: 'A' };
    
    txtPregunta.value = datos.enunciado;
    respA.value = datos.a;
    respB.value = datos.b;
    respC.value = datos.c;
    respD.value = datos.d;
    respCorrecta.value = datos.correcta;

    // Controlar visibilidad de botones
    btnPrevPregunta.style.visibility = preguntaActual > 1 ? 'visible' : 'hidden';
    btnNextPregunta.innerText = preguntaActual < totalPreguntas ? 'Siguiente >' : 'Última Pregunta';
}

// Botones de Navegación de Preguntas
btnNextPregunta.addEventListener('click', () => {
    guardarPreguntaActualEnMemoria();
    if (preguntaActual < totalPreguntas) {
        preguntaActual++;
        actualizarVistaPregunta();
    }
});

btnPrevPregunta.addEventListener('click', () => {
    guardarPreguntaActualEnMemoria();
    if (preguntaActual > 1) {
        preguntaActual--;
        actualizarVistaPregunta();
    }
});

// =====================================================================================================================================

// 5.3 Guardar TODO el Quiz en la Base de Datos
const formQuiz = document.getElementById('form-quiz');
if(formQuiz) {
    formQuiz.addEventListener('submit', async (e) => {
        e.preventDefault();
        guardarPreguntaActualEnMemoria(); // Guardar la última pregunta en pantalla

        // Validar que ninguna pregunta esté vacía
        const incompleta = quizMemoria.some(p => !p.enunciado || !p.a || !p.b || !p.c || !p.d);
        if(incompleta) {
            Swal.fire('Formulario Incompleto', 'Por favor llena todas las preguntas y opciones antes de guardar.', 'warning');
            return;
        }

        Swal.fire({
            title: 'Guardando...',
            text: 'Creando Quiz y subiendo preguntas',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading() }
        });

        // 1. Crear el Quiz Principal
        const formDataQuiz = new FormData();
        formDataQuiz.append('accion', 'crear');
        formDataQuiz.append('q_titulo', document.getElementById('quiz-nombre').value);
        formDataQuiz.append('q_categoria', document.getElementById('quiz-categoria').value);
        formDataQuiz.append('q_dificultad', document.getElementById('quiz-nivel').value);
        formDataQuiz.append('q_tiempo', document.getElementById('quiz-tiempo').value);

        try {
            const resQuiz = await fetch(`${API_URL}api_quizzes.php`, { method: 'POST', body: formDataQuiz });
            const dataQuiz = await resQuiz.json();

            if (dataQuiz.status === 'success' && dataQuiz.id) {
                const quizId = dataQuiz.id;

                // 2. Crear todas las preguntas ligadas a ese Quiz ID
                for (let p of quizMemoria) {
                    let formPregunta = new FormData();
                    formPregunta.append('accion', 'crear');
                    formPregunta.append('quiz_id', quizId);
                    formPregunta.append('p_enunciado', p.enunciado);
                    formPregunta.append('p_opcion_a', p.a);
                    formPregunta.append('p_opcion_b', p.b);
                    formPregunta.append('p_opcion_c', p.c);
                    formPregunta.append('p_opcion_d', p.d);
                    formPregunta.append('p_respuesta', p.correcta);

                    await fetch(`${API_URL}api_preguntas.php`, { method: 'POST', body: formPregunta });
                }

                Swal.fire('¡Éxito!', 'El Quiz y sus preguntas se guardaron correctamente.', 'success');
                formQuiz.reset();
                numPreguntasInput.dispatchEvent(new Event('change')); // Reinicia la memoria
            } else {
                Swal.fire('Error', dataQuiz.mensaje, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Hubo un problema de conexión.', 'error');
        }
    });
}

// =====================================================================================================================================

// 5.4 Cargar y Listar Quizzes en el Dashboard (Adaptado para Cards/Grid)
async function cargarQuizzes() {
    try {
        // Ahora buscamos tu contenedor Grid correcto
        const quizGrid = document.getElementById('quizDashboardGrid');
        const statQuizzes = document.getElementById('statQuizzes'); // Tu contador superior
        
        if (!quizGrid) {
            console.warn("No se encontró el contenedor <div id='quizDashboardGrid'> en el HTML.");
            return;
        }

        const response = await fetch(`${API_URL}api_quizzes.php?accion=leer`);
        const result = await response.json();

        if (result.status === 'success') {
            quizGrid.innerHTML = ''; // Limpiamos el grid antes de cargar

            // Actualizamos el número gigante en tu Dashboard
            if (statQuizzes) {
                statQuizzes.innerText = result.data.length;
            }

            if (result.data.length === 0) {
                quizGrid.innerHTML = `<p style="color:var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 20px;">No hay quizzes registrados aún. ¡Anímate a crear uno!</p>`;
                return;
            }

            // Generamos una "tarjeta" por cada quiz
            result.data.forEach(q => {
                quizGrid.innerHTML += `
                    <div class="card" style="border-left: 3px solid var(--primary-neon); display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <h4 style="color: var(--text-main); margin-bottom: 10px; font-size: 1.1rem;">${q.titulo}</h4>
                            <p style="font-size: 0.9em; color: var(--text-muted); margin-bottom: 5px;">
                                <strong>Categoría:</strong> <span style="color: var(--primary-neon);">${q.categoria_nombre || 'General'}</span>
                            </p>
                            <p style="font-size: 0.9em; color: var(--text-muted); margin-bottom: 5px;">
                                <strong>Nivel:</strong> ${q.dificultad}
                            </p>
                            <p style="font-size: 0.9em; color: var(--text-muted); margin-bottom: 15px;">
                                <strong>Tiempo/Preg:</strong> ${q.tiempo_pregunta}s
                            </p>
                        </div>
                        <button class="btn btn-sm" style="background-color: var(--accent-purple); color: white;" onclick="abrirModalEditarQuiz(${q.id})">✏️ Editar</button>
                        <button class="btn btn-sm btn-danger full-width" onclick="eliminarQuiz(${q.id})" style="margin-top: 10px;">🗑️ Eliminar</button>
                    </div>
                `;
            });
        }
    } catch (error) {
        console.error("Error cargando quizzes:", error);
    }
}

// =====================================================================================================================================

// 5.5 Eliminar Quiz (Borrado en cascada)
async function eliminarQuiz(id) {
    const confirmacion = await Swal.fire({
        title: '¿Eliminar Quiz?',
        text: "Se borrará el Quiz y TODAS sus preguntas asociadas. ¡No hay vuelta atrás!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#222b3c',
        confirmButtonText: 'Sí, aniquilarlo',
        background: '#151a24',
        color: '#fff'
    });

    if (confirmacion.isConfirmed) {
        const formData = new FormData();
        formData.append('accion', 'eliminar');
        formData.append('id', id);

        try {
            const response = await fetch(`${API_URL}api_quizzes.php`, { method: 'POST', body: formData });
            const result = await response.json();

            if (result.status === 'success') {
                Swal.fire({
                    title: 'Eliminado',
                    text: 'El Quiz y sus preguntas han sido borrados.',
                    icon: 'success',
                    background: '#151a24',
                    color: '#fff'
                });
                cargarQuizzes(); // Recargar la tabla automáticamente
            } else {
                Swal.fire('Error', result.mensaje, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Hubo un problema de conexión al eliminar.', 'error');
        }
    }
}

// =====================================================================================================================================

// 5.6 GESTIÓN DE QUIZZES (EDICIÓN Y PREGUNTAS)
let preguntasEditando = [];
let pregEditIndex = 0;

// 1. Abrir Modal y Descargar Datos
async function abrirModalEditarQuiz(id) {
    try {
        const response = await fetch(`${API_URL}api_quizzes.php?accion=leer_un_quiz&id=${id}`);
        const result = await response.json();

        if (result.status === 'success') {
            const quiz = result.data.quiz;
            preguntasEditando = result.data.preguntas || []; 
            pregEditIndex = 0;

            // Mapeo corregido con las columnas de tu BD:
            document.getElementById('edit-q-id').value = quiz.id;
            document.getElementById('edit-q-nombre').value = quiz.titulo;
            document.getElementById('edit-q-categoria').value = quiz.categoria_id;
            document.getElementById('edit-q-nivel').value = quiz.dificultad; // <-- 'dificultad' en lugar de 'nivel'
            document.getElementById('edit-q-tiempo').value = quiz.tiempo_pregunta; // <-- 'tiempo_pregunta' en lugar de 'tiempo_segundos'

            // Mostrar la primera pregunta
            if (preguntasEditando.length > 0) {
                cargarPreguntaEditUI();
            }

            // Abrir Modal
            document.getElementById('modal-editar-quiz').style.display = 'flex';
        } else {
            Swal.fire('Error', result.mensaje || 'No se pudo cargar el Quiz', 'error');
        }
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Hubo un fallo de conexión', 'error');
    }
}

// 2. Cargar datos de la pregunta actual en los inputs HTML
function cargarPreguntaEditUI() {
    if (preguntasEditando.length === 0) return;
    
    const p = preguntasEditando[pregEditIndex];
    document.getElementById('lblNumPreguntaEdit').innerText = pregEditIndex + 1;
    
    // Leemos exactamente lo que manda la BD: enunciado y respuesta_correcta
    document.getElementById('editTxtPregunta').value = p.enunciado || p.pregunta || '';
    document.getElementById('editRespA').value = p.opcion_a || '';
    document.getElementById('editRespB').value = p.opcion_b || '';
    document.getElementById('editRespC').value = p.opcion_c || '';
    document.getElementById('editRespD').value = p.opcion_d || '';
    document.getElementById('editRespCorrecta').value = p.respuesta_correcta || p.correcta || 'A';
}

// 3. Guardar lo que está escrito en los inputs dentro del Array Temporal
function guardarPreguntaTemporal() {
    if (preguntasEditando.length === 0) return;

    // Leemos directamente de los IDs del HTML
    preguntasEditando[pregEditIndex] = {
        ...preguntasEditando[pregEditIndex], 
        pregunta: document.getElementById('editTxtPregunta').value,
        opcion_a: document.getElementById('editRespA').value,
        opcion_b: document.getElementById('editRespB').value,
        opcion_c: document.getElementById('editRespC').value,
        opcion_d: document.getElementById('editRespD').value,
        correcta: document.getElementById('editRespCorrecta').value
    };
}

// 4. Botones de Navegación del Modal (Anterior / Siguiente)
document.getElementById('btnPrevPreguntaEdit')?.addEventListener('click', () => {
    if (pregEditIndex > 0) {
        guardarPreguntaTemporal(); // Guardamos antes de cambiar
        pregEditIndex--;
        cargarPreguntaEditUI();
    }
});

document.getElementById('btnNextPreguntaEdit')?.addEventListener('click', () => {
    if (pregEditIndex < preguntasEditando.length - 1) {
        guardarPreguntaTemporal(); // Guardamos antes de cambiar
        pregEditIndex++;
        cargarPreguntaEditUI();
    }
});

// 5. Enviar Formulario Principal (Guardar todo)
const formEditarQuiz = document.getElementById('form-editar-quiz');
if (formEditarQuiz) {
    formEditarQuiz.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que se recargue la página

        // Asegurarnos de guardar la última pregunta que el usuario estaba viendo
        guardarPreguntaTemporal();

        const formData = new FormData(formEditarQuiz);
        formData.append('accion', 'editar');
        
        // Convertimos nuestro Array Temporal de preguntas a texto plano para enviarlo
        formData.append('preguntas_edit', JSON.stringify(preguntasEditando));

        try {
            const response = await fetch(`${API_URL}api_quizzes.php`, { method: 'POST', body: formData });
            const result = await response.json();

            if (result.status === 'success') {
                Swal.fire({
                    toast: true, position: 'top-end', showConfirmButton: false, timer: 2000,
                    icon: 'success', title: 'Quiz actualizado completo', background: '#151a24', color: '#fff'
                });
                document.getElementById('modal-editar-quiz').style.display = 'none'; // Cerramos modal
                cargarQuizzes(); // Recargamos la tabla principal
            } else {
                Swal.fire('Error', result.mensaje, 'error');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Problema al actualizar el Quiz', 'error');
        }
    });
}

// ==========================================
// 6. GESTIÓN DE CATEGORÍAS (DASHBOARD)
// ==========================================

// 6.1 Cargar y Listar Categorías en todas partes
async function cargarListaCategorias() {
    try {
        const response = await fetch(`${API_URL}api_categorias.php?accion=leer`);
        const result = await response.json();

        if (result.status === 'success') {
            const data = result.data;

            // A) Actualizar el contador del Dashboard
            const statCategorias = document.getElementById('statCategorias');
            if (statCategorias) statCategorias.innerText = data.length;

            // B) Llenar la lista del UI (Categorías Existentes)
            const listaUI = document.getElementById('listaCategoriasUI');
            if (listaUI) {
                listaUI.innerHTML = '';
                if (data.length === 0) {
                    listaUI.innerHTML = '<li style="color:var(--text-muted); padding: 10px;">No hay categorías registradas.</li>';
                } else {
                    data.forEach(cat => {
                        listaUI.innerHTML += `
                            <li style="display:flex; justify-content:space-between; align-items:center; padding: 12px; background: var(--bg-sidebar); margin-bottom: 8px; border-radius: 6px; border-left: 3px solid var(--accent-purple);">
                                <strong style="color: var(--text-main);">${cat.nombre}</strong>
                                <button class="btn btn-sm btn-danger" onclick="eliminarCategoria(${cat.id})" style="padding: 4px 8px; font-size: 0.8rem;">🗑️</button>
                            </li>
                        `;
                    });
                }
            }
            
            // C) Llenar los <select> del creador de Quizzes
            const selects = document.querySelectorAll('.select-dinamico-cat');
            selects.forEach(select => {
                const valorActual = select.value; // Guardamos la selección actual para no perderla al recargar
                select.innerHTML = '';
                data.forEach(cat => {
                    select.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
                });
                if (valorActual) select.value = valorActual;
            });
        }
    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
}

// 6.2 Crear Nueva Categoría
const formCategoria = document.getElementById('form-categoria');
if (formCategoria) {
    formCategoria.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(formCategoria);
        formData.append('accion', 'crear');

        try {
            const response = await fetch(`${API_URL}api_categorias.php`, { method: 'POST', body: formData });
            const result = await response.json();
            
            if (result.status === 'success') {
                Swal.fire({
                    toast: true, position: 'top-end', showConfirmButton: false, timer: 2000,
                    icon: 'success', title: 'Categoría creada', background: '#151a24', color: '#fff'
                });
                formCategoria.reset();
                cargarListaCategorias(); // Recargar todo visualmente
            } else {
                Swal.fire('Error', result.mensaje, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Problema al crear categoría.', 'error');
        }
    });
}

// 6.3 Eliminar Categoría
async function eliminarCategoria(id) {
    const confirmacion = await Swal.fire({
        title: '¿Eliminar Categoría?',
        text: "Ten cuidado, si eliminas una categoría podrías afectar a los Quizzes que la estén usando.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#222b3c',
        confirmButtonText: 'Sí, eliminar',
        background: '#151a24', color: '#fff'
    });

    if (confirmacion.isConfirmed) {
        const formData = new FormData();
        formData.append('accion', 'eliminar');
        formData.append('id', id);

        try {
            const response = await fetch(`${API_URL}api_categorias.php`, { method: 'POST', body: formData });
            const result = await response.json();
            
            if (result.status === 'success') {
                cargarListaCategorias();
                cargarQuizzes(); // Recargamos el dashboard por si algún quiz quedó huérfano
            } else {
                Swal.fire('Error', result.mensaje, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Problema al eliminar.', 'error');
        }
    }
}