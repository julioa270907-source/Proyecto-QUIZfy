document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
});

// ----------------------------------------------------
// 1. ALTERNAR PESTAÑAS (LOGIN / REGISTRO)
// ----------------------------------------------------
function mostrarTabAuth(tab) {
    const formLogin = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');
    const btnLogin = document.getElementById('btn-tab-login');
    const btnRegistro = document.getElementById('btn-tab-registro');

    if (tab === 'login') {
        formLogin.classList.remove('d-none');
        formRegistro.classList.add('d-none');
        btnLogin.classList.add('active');
        btnRegistro.classList.remove('active');
    } else {
        formLogin.classList.add('d-none');
        formRegistro.classList.remove('d-none');
        btnLogin.classList.remove('active');
        btnRegistro.classList.add('active');
    }
}

// ----------------------------------------------------
// 2. REGISTRAR USUARIO
// ----------------------------------------------------
async function registrarUsuario(event) {
    event.preventDefault();

    const usuario = document.getElementById('reg-usuario').value.trim();
    const correo = document.getElementById('reg-correo').value.trim();
    const contrasena = document.getElementById('reg-password').value;

    const formData = new FormData();
    formData.append('accion', 'registrar');
    formData.append('nombre_usuario', usuario);
    formData.append('correo', correo);
    formData.append('contrasena', contrasena);

    try {
        const response = await fetch('api/api_auth.php', {
            method: 'POST',
            body: formData
        });

        const res = await response.json();

        if (res.status === 'success') {
            Swal.fire({
                icon: 'success',
                title: '¡Cuenta creada con éxito!',
                text: res.mensaje,
                confirmColor: '#00f2fe'
            });
            document.getElementById('form-registro').reset();
            mostrarTabAuth('login');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error de registro',
                text: res.mensaje,
                confirmColor: '#ff4d6d'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error del Servidor',
            text: 'No se pudo procesar la solicitud en la base de datos.',
            confirmColor: '#ff4d6d'
        });
    }
}

// ----------------------------------------------------
// 3. INICIAR SESIÓN (LOGIN)
// ----------------------------------------------------
async function iniciarSesion(event) {
    event.preventDefault();

    const usuarioCorreo = document.getElementById('login-usuario').value.trim();
    const contrasena = document.getElementById('login-password').value;

    const formData = new FormData();
    formData.append('accion', 'login');
    formData.append('usuario_correo', usuarioCorreo);
    formData.append('contrasena', contrasena);

    try {
        const response = await fetch('api/api_auth.php', {
            method: 'POST',
            body: formData
        });

        const res = await response.json();

        if (res.status === 'success') {
            Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: res.mensaje,
                timer: 1500,
                showConfirmButton: false
            });
            renderizarUsuario(res.usuario);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Acceso Denegado',
                text: res.mensaje,
                confirmColor: '#ff4d6d'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: 'Ocurrió un problema al conectar con la API.',
            confirmColor: '#ff4d6d'
        });
    }
}

// ----------------------------------------------------
// 4. VERIFICAR SESIÓN ACTIVA AL CARGAR
// ----------------------------------------------------
async function verificarSesion() {
    try {
        const response = await fetch('api/api_auth.php?accion=verificar_sesion');
        const res = await response.json();

        if (res.status === 'authenticated') {
            renderizarUsuario(res.usuario);
        } else {
            mostrarVista('auth');
        }
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        mostrarVista('auth');
    }
}

// ----------------------------------------------------
// 5. CERRAR SESIÓN (LOGOUT)
// ----------------------------------------------------
async function cerrarSesion() {
    try {
        const response = await fetch('api/api_auth.php?accion=logout');
        const res = await response.json();

        if (res.status === 'success') {
            mostrarVista('auth');
            document.getElementById('form-login').reset();
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// ----------------------------------------------------
// NAVEGACIÓN Y RENDERIZADO
// ----------------------------------------------------
function mostrarVista(vista) {
    const vistaAuth = document.getElementById('vista-auth');
    const vistaDashboard = document.getElementById('vista-dashboard');

    if (vista === 'auth') {
        vistaAuth.classList.remove('d-none');
        vistaDashboard.classList.add('d-none');
    } else if (vista === 'dashboard') {
        vistaAuth.classList.add('d-none');
        vistaDashboard.classList.remove('d-none');
    }
}

function renderizarUsuario(usuario) {
    const lblNombre = document.getElementById('lbl-nombre-usuario');
    const btnNombre = document.getElementById('btn-nombre-usuario');

    if (lblNombre) lblNombre.innerText = usuario.nombre_usuario;
    if (btnNombre) btnNombre.innerText = usuario.nombre_usuario;

    mostrarVista('dashboard');
    cargarAvatarUsuario();
    
    // Ejecutar la animación de bienvenida de entrada
    animarMensajeBienvenida(usuario);
}

// ----------------------------------------------------
// NUEVA FUNCIÓN: ANIMACIÓN TEMPORAL DE BIENVENIDA
// ----------------------------------------------------
function animarMensajeBienvenida(usuario) {
    const contenedorMensaje = document.querySelector('.mensaje-sistema');
    if (!contenedorMensaje) return;

    // Aseguramos transiciones suaves para la salida
    contenedorMensaje.style.transition = 'all 0.5s ease';
    
    // 1. Mostrar de inmediato el texto con las monedas
    contenedorMensaje.innerHTML = `Bienvenido, tienes <strong id="lbl-monedas">${usuario.monedas}</strong> monedas`;

    // 2. Pasados 2.5 segundos, lo desvanecemos y ocultamos
    setTimeout(() => {
        contenedorMensaje.style.opacity = '0';
        contenedorMensaje.style.transform = 'scale(0.9)'; // Efecto sutil de achicamiento al desaparecer

        // Esperamos 500ms (lo que dura la transición) para ocultar el elemento por completo
        setTimeout(() => {
            contenedorMensaje.style.display = 'none';
        }, 500);

    }, 2500);
}

// ==========================================
// ESTADO GLOBAL (Al inicio para evitar cierres de alcance)
// ==========================================
let inventarioGlobal = [];
let estadoAvatar = {
    ruta_imagen_base: 'img/avatars/default.svg',
    nombre_base: 'Personaje',
    equipados: {
        'Cabeza': null,
        'Rostro': null,
        'Cuerpo': null
    }
};

// ==========================================
// GESTIÓN Y RENDERIZADO DEL AVATAR
// ==========================================

async function cargarAvatarUsuario() {
    try {
        const response = await fetch('api/api_avatar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'obtener_avatar' })
        });
        const res = await response.json();

        if (res.status === 'success' && res.avatar) {
            estadoAvatar.ruta_imagen_base = res.avatar.ruta_imagen;
            estadoAvatar.nombre_base = res.avatar.personaje_nombre;
            
            res.avatar.items_equipados.forEach(item => {
                estadoAvatar.equipados[item.categoria] = item;
            });
        }
    } catch (error) {
        console.error("Error al cargar avatar", error);
    } finally {
        renderizarAvatarEnDOM('canvas-avatar');
        renderizarAvatarEnDOM('display-lobby-avatar'); 
    }
}

function renderizarAvatarEnDOM(contenedorId) {
    const contenedor = document.getElementById(contenedorId) || document.querySelector('.avatar-display');
    if (!contenedor) return;

    contenedor.style.cssText = `
        position: relative;
        overflow: hidden;
        background-color: transparent;
    `;
    contenedor.innerHTML = ''; 

    // 1. Capa Base: Personaje
    const imgBase = document.createElement('img');
    imgBase.src = estadoAvatar.ruta_imagen_base || 'img/avatars/default.svg';
    imgBase.alt = estadoAvatar.nombre_base || 'Personaje';
    imgBase.style.cssText = 'width: 100%; height: 100%; object-fit: contain; position: absolute; z-index: 1; top: 0; left: 0;';
    contenedor.appendChild(imgBase);

    // 2. Capas de Accesorios Equipados
    Object.values(estadoAvatar.equipados).forEach((item) => {
        if (item) {
            const imgItem = document.createElement('img');
            imgItem.src = item.ruta_svg;
            imgItem.className = 'capa-accesorio';
            
            let zIndex = 2;
            if (item.categoria === 'Cuerpo') zIndex = 2;
            if (item.categoria === 'Rostro') zIndex = 3;
            if (item.categoria === 'Cabeza') zIndex = 4;

            // Comprobamos si el ítem trae coordenadas de la base de datos
            const tieneOffsets = item.width !== undefined && item.pos_x !== undefined && item.pos_y !== undefined;

            if (tieneOffsets) {
                // Escala relativa basada en la cuadrícula de 300px
                const porcentajeAncho = (Number(item.width) / 300) * 100;
                const porcentajeX = (Number(item.pos_x) / 300) * 100;
                const porcentajeY = (Number(item.pos_y) / 300) * 100;

                imgItem.style.cssText = `
                    position: absolute;
                    width: ${porcentajeAncho}%;
                    left: ${porcentajeX}%;
                    top: ${porcentajeY}%;
                    transform: rotate(${item.rotacion || 0}deg);
                    z-index: ${zIndex};
                    pointer-events: none;
                `;
            } else {
                // Posicionamiento de respaldo cuando se prueba un ítem nuevo desde la tienda
                imgItem.style.cssText = `
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    object-fit: contain;
                    z-index: ${zIndex};
                    pointer-events: none;
                `;
            }

            contenedor.appendChild(imgItem);
        }
    });
}

function renderizarAvatarDefecto() {
    const contenedor = document.getElementById('canvas-avatar') || document.querySelector('.avatar-display');
    if (!contenedor) return;

    contenedor.style.position = 'relative';
    contenedor.innerHTML = `
        <img src="img/avatars/default.svg" 
             alt="Avatar por defecto" 
             style="width:100%; height:100%; object-fit:contain; position:absolute; z-index:1;">
    `;
}

// ==========================================
// MÓDULO: NAVEGACIÓN Y VISTAS
// ==========================================

function mostrarVista(vista) {
    const vistaAuth = document.getElementById('vista-auth');
    const vistaDashboard = document.getElementById('vista-dashboard');
    const vistaTienda = document.getElementById('vista-tienda');

    if (vistaAuth) vistaAuth.classList.toggle('d-none', vista !== 'auth');
    if (vistaDashboard) vistaDashboard.classList.toggle('d-none', vista !== 'dashboard');
    if (vistaTienda) vistaTienda.classList.toggle('d-none', vista !== 'tienda');
}

function abrirTienda() {
    mostrarVista('tienda');
    
    const vistaTienda = document.getElementById('vista-tienda');
    if (vistaTienda) {
        vistaTienda.classList.add('animate__animated', 'animate__fadeIn');
    }
    
    const elNombreActual = document.getElementById('lbl-nombre-usuario');
    const elNombreEditor = document.getElementById('editor-nombre-usuario');
    if (elNombreActual && elNombreEditor) {
        elNombreEditor.innerText = elNombreActual.innerText;
    }

    const tabCabeza = document.querySelector('.tab-tienda');
    if (tabCabeza) {
        tabCabeza.click();
    } else {
        renderizarGridInventario('Cabeza');
    }
}

function cerrarTienda() {
    mostrarVista('dashboard');
}

// ==========================================
// MÓDULO: TIENDA E INVENTARIO
// ==========================================

function cambiarPestanaTienda(event, categoria) {
    const tabs = document.querySelectorAll('.tab-tienda');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    }

    renderizarGridInventario(categoria);
}

function renderizarGridInventario(categoria) {
    const grid = document.getElementById('grid-inventario');
    if (!grid) return;
    
    grid.innerHTML = '';

    const itemsFiltrados = inventarioGlobal.filter(
        item => item.categoria.toLowerCase() === categoria.toLowerCase()
    );

    if (itemsFiltrados.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 20px;">No hay accesorios disponibles en esta categoría.</p>`;
    } else {
        itemsFiltrados.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'item-card animate__animated animate__fadeInUp';
            card.style.animationDelay = `${index * 0.05}s`;

            card.innerHTML = `
                <div class="item-icon-wrap">
                    <img src="${item.ruta_svg}" alt="${item.nombre}" style="width: 50px; height: 50px; object-fit: contain;">
                </div>
                <span class="item-name">${item.nombre}</span>
                <span class="item-price">🪙 ${Number(item.precio).toFixed(0)}</span>
            `;

            card.addEventListener('click', () => seleccionarItem(item));
            grid.appendChild(card);
        });
    }

    const avatarPreview = document.getElementById('canvas-avatar');
    if (avatarPreview) {
        avatarPreview.classList.remove('animate__animated', 'animate__pulse');
        void avatarPreview.offsetWidth;
        avatarPreview.classList.add('animate__animated', 'animate__pulse');
    }
}

// ==========================================
// ACCIONES DE LA TIENDA (PREVIEW Y GUARDADO)
// ==========================================

function seleccionarItem(item) {
    estadoAvatar.equipados[item.categoria] = item;
    renderizarAvatarEnDOM('canvas-avatar');
}

function quitarTodo() {
    estadoAvatar.equipados = {
        'Cabeza': null,
        'Rostro': null,
        'Cuerpo': null
    };
    
    renderizarAvatarEnDOM('canvas-avatar');
    
    Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: 'info',
        title: 'Se han quitado todos los accesorios',
        showConfirmButton: false,
        timer: 2000
    });
}

async function guardarCambiosAvatar() {
    const idsEquipados = Object.values(estadoAvatar.equipados)
        .filter(item => item !== null)
        .map(item => item.item_id || item.id);

    try {
        const response = await fetch('api/api_avatar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                accion: 'guardar_equipamiento',
                items_ids: idsEquipados
            })
        });

        const res = await response.json();

        if (res.status === 'success') {
            Swal.fire({
                icon: 'success',
                title: '¡Look Guardado!',
                text: 'Tu avatar se ha actualizado con éxito.',
                confirmColor: '#00e0ff',
                background: '#151a24',
                color: '#fff'
            }).then(() => {
                renderizarAvatarEnDOM('display-lobby-avatar');
                cerrarTienda();
            });
        } else {
            throw new Error(res.mensaje);
        }
    } catch (error) {
        Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
    }
}

// ==========================================
// PETICIONES API E INICIALIZACIÓN
// ==========================================

async function cargarItemsTienda() {
    try {
        const respuesta = await fetch('api/api_items.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'leer' })
        });

        const datos = await respuesta.json();

        if (datos.status === 'success') {
            inventarioGlobal = datos.data;
            renderizarGridInventario('Cabeza');
        }
    } catch (error) {
        // Captura silenciosa de errores
    }
}

async function cargarMonedasUsuario() {
    try {
        const respuesta = await fetch('api/api_auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'verificar_sesion' })
        });
        
        const datos = await respuesta.json();
        
        if (datos.status === 'authenticated' && datos.usuario) {
            const elMonedas = document.getElementById('user-coins');
            if (elMonedas) {
                elMonedas.textContent = Number(datos.usuario.monedas).toLocaleString();
            }
        }
    } catch (error) {
        // Captura silenciosa de errores
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarItemsTienda();
    cargarAvatarUsuario();
    cargarMonedasUsuario();
});