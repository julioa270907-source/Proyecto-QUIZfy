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
                confirmButtonColor: '#00f2fe'
            });
            document.getElementById('form-registro').reset();
            mostrarTabAuth('login');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error de registro',
                text: res.mensaje,
                confirmButtonColor: '#ff4d6d'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error del Servidor',
            text: 'No se pudo procesar la solicitud en la base de datos.',
            confirmButtonColor: '#ff4d6d'
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
                confirmButtonColor: '#ff4d6d'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: 'Ocurrió un problema al conectar con la API.',
            confirmButtonColor: '#ff4d6d'
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
// NAVEGACIÓN Y GESTIÓN DE VISTAS
// ----------------------------------------------------
function mostrarVista(vista) {
    const vistaAuth = document.getElementById('vista-auth');
    const vistaDashboard = document.getElementById('vista-dashboard');
    const vistaTienda = document.getElementById('vista-tienda');

    // Ocultar todas las vistas primero
    vistaAuth.classList.add('d-none');
    vistaDashboard.classList.add('d-none');
    if (vistaTienda) vistaTienda.classList.add('d-none');

    // Mostrar la vista solicitada
    if (vista === 'auth') {
        vistaAuth.classList.remove('d-none');
    } else if (vista === 'dashboard') {
        vistaDashboard.classList.remove('d-none');
    } else if (vista === 'tienda') {
        if (vistaTienda) vistaTienda.classList.remove('d-none');
    }
}

function renderizarUsuario(usuario) {
    const lblNombre = document.getElementById('lbl-nombre-usuario');
    const btnNombre = document.getElementById('btn-nombre-usuario');

    if (lblNombre) lblNombre.innerText = usuario.nombre_usuario;
    if (btnNombre) btnNombre.innerText = usuario.nombre_usuario;

    mostrarVista('dashboard');
    cargarAvatarUsuario();
    animarMensajeBienvenida(usuario);
}

// ----------------------------------------------------
// ANIMACIÓN TEMPORAL DE BIENVENIDA
// ----------------------------------------------------
function animarMensajeBienvenida(usuario) {
    const contenedorMensaje = document.querySelector('.mensaje-sistema');
    if (!contenedorMensaje) return;

    contenedorMensaje.style.transition = 'all 0.5s ease';
    contenedorMensaje.innerHTML = `¡Bienvenido! Tienes <strong id="lbl-monedas">${usuario.monedas}</strong> monedas.`;
    contenedorMensaje.style.opacity = '1';
    contenedorMensaje.style.display = 'block';

    setTimeout(() => {
        contenedorMensaje.style.opacity = '0';
        contenedorMensaje.style.transform = 'scale(0.9)';

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

    const imgBase = document.createElement('img');
    imgBase.src = avatar.ruta_imagen;
    imgBase.alt = avatar.personaje_nombre || 'Personaje Base';
    imgBase.style.width = '100%';
    imgBase.style.height = '100%';
    imgBase.style.objectFit = 'contain';
    imgBase.style.position = 'absolute';
    imgBase.style.zIndex = '1';
    contenedor.appendChild(imgBase);

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

// ----------------------------------------------------
// MÓDULO DE TIENDA Y PERFIL
// ----------------------------------------------------
function abrirTienda() {
    mostrarVista('tienda');
}

function cerrarTienda() {
    mostrarVista('dashboard');
}

function guardarCambios() {
    Swal.fire("Guardado", "Tu avatar se actualizó", "success");
}

function quitarTodo() {
    Swal.fire("Reiniciado", "Tu avatar volvió al estado base", "info");
}

function editarSeccion(seccion) {
    Swal.fire("Editar sección", "Aquí editarás: " + seccion, "info");
}

// FUNCIÓN CORREGIDA PARA EL BOTÓN DE PERFIL

// 1. Declaramos la función globalmente para que siempre esté disponible
async function abrirPerfil() {
    console.log("1. ¡Se presionó el botón de perfil!");

    try {
        const response = await fetch('api/api_auth.php?accion=verificar_sesion');
        
        // Verifica si la respuesta HTTP es válida (200 OK)
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const res = await response.json();
        console.log("2. Respuesta del servidor:", res);

        if (res.status === 'authenticated') {
            const user = res.usuario;

            Swal.fire({
                title: 'Información de Usuario',
                html: `
                    <div class="cyber-content">
                        <p style="margin: 10px 0;"><strong>👤 Usuario:</strong> ${user.nombre_usuario}</p>
                        <p style="margin: 10px 0;"><strong>📧 Correo:</strong> ${user.correo}</p>
                    </div>
                `,
                customClass: { popup: 'cyber-modal' },
                confirmButtonText: 'CERRAR',
                confirmButtonColor: '#00f2fe',
                background: '#0b0f19',
                color: '#fff'
            });
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Sesión no iniciada',
                text: 'Por favor, inicia sesión para ver tu perfil.',
                confirmButtonColor: '#ff4d6d'
            });
        }
    } catch (error) {
        console.error('Error al abrir el perfil:', error);
        // Alerta visual para saber qué falló exactamente
        Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: 'No se pudo obtener la información. Asegúrate de estar ejecutando el proyecto en un servidor local (XAMPP/WAMP).',
            confirmButtonColor: '#ff4d6d'
        });
    }
}

// 2. Conexión segura usando delegación de eventos global (Funciona siempre aunque el botón aparezca después)
document.addEventListener('click', (event) => {
    // Verificamos si el elemento clickeado es el botón de perfil o está dentro de él
    const btnPerfil = event.target.closest('#btn-perfil');
    if (btnPerfil) {
        event.preventDefault();
        abrirPerfil();
    }
});

function abrirSeleccionQuiz() {
    Swal.fire("¡Próximamente!", "La selección de quizzes estará disponible muy pronto.", "info");
}

// Conectar el botón de perfil de forma segura al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const btnPerfil = document.getElementById('btn-perfil');
    if (btnPerfil) {
        btnPerfil.addEventListener('click', abrirPerfil);
    }
});