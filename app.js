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

// ----------------------------------------------------
// GESTIÓN Y RENDERIZADO DEL AVATAR
// ----------------------------------------------------
async function cargarAvatarUsuario() {
    try {
        const response = await fetch('api/api_avatar.php?accion=obtener_avatar');
        const res = await response.json();

        if (res.status === 'success' && res.avatar) {
            renderizarAvatarHTML(res.avatar);
        } else {
            renderizarAvatarDefecto();
        }
    } catch (error) {
        console.error('Error al cargar el avatar:', error);
        renderizarAvatarDefecto();
    }
}

function renderizarAvatarHTML(avatar) {
    const contenedor = document.querySelector('.avatar-display');
    if (!contenedor) return;

    contenedor.style.position = 'relative';
    contenedor.innerHTML = ''; 

    // 1. Capa Base: Personaje
    const imgBase = document.createElement('img');
    imgBase.src = avatar.ruta_imagen;
    imgBase.alt = avatar.personaje_nombre || 'Personaje Base';
    imgBase.style.width = '100%';
    imgBase.style.height = '100%';
    imgBase.style.objectFit = 'contain';
    imgBase.style.position = 'absolute';
    imgBase.style.zIndex = '1';
    contenedor.appendChild(imgBase);

    // 2. Capas de Accesorios Equipados
    if (avatar.items_equipados && Array.isArray(avatar.items_equipados)) {
        avatar.items_equipados.forEach((item, index) => {
            const imgItem = document.createElement('img');
            imgItem.src = item.ruta_svg;
            imgItem.alt = item.item_nombre;
            imgItem.style.position = 'absolute';
            imgItem.style.width = `${item.width}px`;
            imgItem.style.left = `${item.pos_x}px`;
            imgItem.style.top = `${item.pos_y}px`;
            imgItem.style.transform = `rotate(${item.rotacion}deg)`;
            imgItem.style.zIndex = (index + 2).toString();
            
            contenedor.appendChild(imgItem);
        });
    }
}

function renderizarAvatarDefecto() {
    const contenedor = document.querySelector('.avatar-display');
    if (!contenedor) return;

    contenedor.style.position = 'relative';
    contenedor.innerHTML = `
        <img src="img/avatars/default.svg" 
             alt="Avatar por defecto" 
             style="width:100%; height:100%; object-fit:contain; position:absolute; z-index:1;">
    `;
}

// MODULO DE TIENDA, INGRESAR A LA TIENDA

// Extensión de mostrarVista para incluir la tienda
function mostrarVista(vista) {
    const vistaAuth = document.getElementById('vista-auth');
    const vistaDashboard = document.getElementById('vista-dashboard');
    const vistaTienda = document.getElementById('vista-tienda');

    if (vista === 'auth') {
        vistaAuth.classList.remove('d-none');
        vistaDashboard.classList.add('d-none');
        vistaTienda.classList.add('d-none');
    } else if (vista === 'dashboard') {
        vistaAuth.classList.add('d-none');
        vistaDashboard.classList.remove('d-none');
        vistaTienda.classList.add('d-none');
    } else if (vista === 'tienda') {
        vistaAuth.classList.add('d-none');
        vistaDashboard.classList.add('d-none');
        vistaTienda.classList.remove('d-none');
    }
}

// Reutiliza mostrarVista en tus funciones de tienda
function abrirTienda() {
  mostrarVista('tienda');
}

function cerrarTienda() {
  mostrarVista('dashboard');
}

// ==========================================
// MÓDULO: AVATAR STUDIO (TIENDA)
// ==========================================

function abrirTienda() {
    document.getElementById('vista-dashboard').classList.add('d-none');
    const vistaTienda = document.getElementById('vista-tienda');
    vistaTienda.classList.remove('d-none');
    
    // Animación de entrada para todo el modal
    vistaTienda.classList.add('animate__animated', 'animate__fadeIn');
    
    const nombreActual = document.getElementById('lbl-nombre-usuario').innerText;
    document.getElementById('editor-nombre-usuario').innerText = nombreActual;

    document.querySelector('.tab-tienda').click();
}

function cerrarTienda() {
    document.getElementById('vista-tienda').classList.add('d-none');
    document.getElementById('vista-dashboard').classList.remove('d-none');
}

function cambiarPestanaTienda(event, categoria) {
    // 1. Quitar la clase 'active' de todos los botones de la tienda
    const tabs = document.querySelectorAll('.tab-tienda');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // 2. Activar el botón presionado
    event.target.classList.add('active');

    // 3. Renderizar los ítems en el Grid (Aquí conectarás tu fetch a PostgreSQL después)
    renderizarGridInventario(categoria);
}

function renderizarGridInventario(categoria) {
    const grid = document.getElementById('grid-inventario');
    
    // Le agregamos animate__fadeInUp a las tarjetas para que suban al aparecer
    grid.innerHTML = `
        <div class="item-card animate__animated animate__fadeInUp" style="animation-delay: 0.1s;">📦 Ítem 1 (${categoria})</div>
        <div class="item-card animate__animated animate__fadeInUp" style="animation-delay: 0.2s;">📦 Ítem 2 (${categoria})</div>
        <div class="item-card animate__animated animate__fadeInUp" style="animation-delay: 0.3s;">📦 Ítem 3 (${categoria})</div>
    `;
    
    // Animación de "latido" al cuadro del avatar cuando cambias de pestaña
    const avatarPreview = document.getElementById('canvas-avatar');
    avatarPreview.classList.remove('animate__animated', 'animate__pulse');
    void avatarPreview.offsetWidth; // Truco para reiniciar la animación en JS
    avatarPreview.classList.add('animate__animated', 'animate__pulse');
}

function quitarTodo() {
    // Lógica para vaciar el canvas y desequipar (Más adelante harás update a 'usuario_items')
    const canvas = document.getElementById('canvas-avatar');
    canvas.innerHTML = '<span>DESNUDO 🫣</span>'; // Broma de programador
    
    Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: 'info',
        title: 'Se han quitado todos los accesorios',
        showConfirmButton: false,
        timer: 2000
    });
}

function guardarCambiosAvatar() {
    // Aquí ejecutarás el fetch POST a tu base de datos para guardar el equipamiento
    Swal.fire({
        icon: 'success',
        title: '¡Look Guardado!',
        text: 'Tu avatar se ha actualizado con éxito.',
        confirmColor: '#00e0ff',
        background: '#151a24',
        color: '#fff'
    }).then(() => {
        cerrarTienda(); // Volvemos al lobby automáticamente
    });
}
