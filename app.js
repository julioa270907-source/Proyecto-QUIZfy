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
// 2. FUNCION: REGISTRAR USUARIO
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
                confirmColor: '#6c5ce7'
            });
            document.getElementById('form-registro').reset();
            mostrarTabAuth('login');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error de registro',
                text: res.mensaje,
                confirmColor: '#ff4757'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error del Servidor',
            text: 'No se pudo procesar la solicitud en la base de datos.',
            confirmColor: '#ff4757'
        });
    }
}

// ----------------------------------------------------
// 3. FUNCION: INICIAR SESIÓN (LOGIN)
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
                confirmColor: '#ff4757'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: 'Ocurrió un problema al conectar con la API.',
            confirmColor: '#ff4757'
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
// FUNCIONES AUXILIARES DE NAVEGACIÓN
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
    document.getElementById('lbl-nombre-usuario').innerText = usuario.nombre_usuario;
    document.getElementById('btn-nombre-usuario').innerText = usuario.nombre_usuario;
    document.getElementById('lbl-monedas').innerText = usuario.monedas;
    mostrarVista('dashboard');
}