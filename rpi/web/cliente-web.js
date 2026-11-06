(function () {
  'use strict';

  const porId = (id) => document.getElementById(id);
  const actualizar = porId('refresh');
  const limiteRespuesta = 1048576;
  let iniciando = false;

  async function leer(ruta, signal) {
    const respuesta = await fetch(ruta, {
      signal, redirect: 'error', credentials: 'omit', cache: 'no-store'
    });
    if (!respuesta.ok) throw new Error('El servidor respondió HTTP ' + respuesta.status + '.');
    const texto = await respuesta.text();
    if (texto.length > limiteRespuesta) throw new Error('La respuesta excede el tamaño permitido.');
    try {
      return JSON.parse(texto);
    } catch (_) {
      throw new Error('El enlace no devuelve datos del estacionamiento.');
    }
  }

  function mensaje(error) {
    return error.name === 'AbortError' ? 'El servidor no respondió a tiempo.' : error.message;
  }

  async function pedirLectura(id, grupo) {
    const peticion = new AbortController();
    const timer = setTimeout(() => peticion.abort(), 18000);
    let resultado;
    try {
      const estado = await leer('/api/estado?grupo=' + grupo, peticion.signal);
      resultado = { request_id: id, ok: true, estado };
      try {
        resultado.historial = await leer('/api/historial?grupo=' + grupo + '&limite=60', peticion.signal);
      } catch (_) {
        resultado.historial_error = 'No se pudo actualizar el historial.';
      }
    } catch (error) {
      resultado = { request_id: id, ok: false, error: mensaje(error) };
    } finally {
      clearTimeout(timer);
    }
    window.receiveNativeResult(resultado);
  }

  function cargarInterfaz() {
    return new Promise((resolver, rechazar) => {
      const script = document.createElement('script');
      script.src = 'app.js';
      script.onload = resolver;
      script.onerror = () => {
        script.remove();
        rechazar(new Error('No se pudo cargar la interfaz. Tocá Actualizar para reintentar.'));
      };
      document.head.appendChild(script);
    });
  }

  async function iniciar() {
    if (iniciando) return;
    iniciando = true;
    actualizar.disabled = true;
    porId('error-notice').hidden = true;
    porId('connection-label').textContent = 'Conectando con el servidor';
    porId('status-dot').className = 'status-dot';
    const peticion = new AbortController();
    const timer = setTimeout(() => peticion.abort(), 10000);
    try {
      if (location.protocol !== 'https:') {
        throw new Error('Abrí la dirección HTTPS del grupo para consultar e instalar la app.');
      }
      const servidor = await leer('/', peticion.signal);
      const grupo = servidor && servidor.grupo;
      if (!Number.isInteger(grupo) || grupo < 1 || grupo > 4) {
        throw new Error('El servidor no informó un grupo del 1 al 4.');
      }
      const config = { servidor: location.origin, grupo, demo: false };
      window.AppNative = {
        getConfig: () => JSON.stringify(config),
        saveConfig: () => JSON.stringify({ ok: false, error: 'La app usa el grupo del enlace.' }),
        requestUpdate: (id) => pedirLectura(id, grupo)
      };
      await cargarInterfaz();
      actualizar.removeEventListener('click', iniciar);
    } catch (error) {
      porId('connection-label').textContent = 'Sin conexión con el servidor';
      porId('status-dot').className = 'status-dot error';
      porId('error-notice').hidden = false;
      porId('error-text').textContent = mensaje(error);
      actualizar.disabled = false;
    } finally {
      clearTimeout(timer);
      iniciando = false;
    }
  }

  porId('demo-notice').hidden = true;
  porId('settings-form').hidden = true;
  porId('group-label').textContent = 'Equipo —';
  document.querySelector('#page-settings .heading p').textContent =
    'Esta app toma el equipo del enlace que te dio tu grupo.';
  actualizar.addEventListener('click', iniciar);
  iniciar();
})();
