# Estacionamiento UCU 2026

## Estudiantes: empezar aquí

### [Abrir la guía paso a paso](EMPEZAR_AQUI.md)

**Objetivo de la primera práctica:** ver en el celular las seis plazas con los datos de su propio servidor.

La Raspberry Pi y las cuatro cuentas de grupo están preparadas. Cada grupo entra desde su PC por Tailscale y trabaja en su propia cuenta. La guía explica qué copiar, dónde escribirlo y qué resultado debe aparecer.

| Recorrido | Dónde se hace |
| --- | --- |
| 1. Descargar el proyecto | PC Windows |
| 2. Entrar con la cuenta del grupo | PowerShell de Windows |
| 3. Instalar la copia del grupo | Dentro de la Raspberry |
| 4. Comprobar las seis plazas | Dentro de la Raspberry |
| 5. Obtener la dirección del servidor | Dentro de la Raspberry |
| 6. Conectar la aplicación | Teléfono Android |

**Seguir [EMPEZAR_AQUI.md](EMPEZAR_AQUI.md) en ese orden.** Si la copia ya estaba instalada, la guía indica cómo continuar conservando el trabajo existente.

## Ayuda y siguiente práctica

- [Tengo un error: buscar el mensaje y resolverlo](docs/AYUDA_ESTUDIANTES.md).
- [Ya funciona: hacer un primer cambio y guardar un respaldo](docs/PRIMER_CAMBIO_Y_RESPALDO.md).
- [Docente: revisar accesos y preparación común](docs/PARA_EL_DOCENTE.md).

## Qué estamos construyendo

El servidor es un programa Python que se ejecuta en la Raspberry. Genera estados de seis plazas y los envía a la app cuando esta los consulta. GitHub guarda el código y las guías.

En esta etapa los datos son **simulados**: cambian automáticamente para poder practicar. La conexión MPF-1, los sensores y el almacenamiento permanente se incorporarán en etapas posteriores. La ubicación de las seis plazas en el mapa es una propuesta pendiente de relevamiento.

| Grupo | Cuenta en la Raspberry | Puerto de su servidor | Equipo en la app |
| --- | --- | --- | --- |
| 1 | grupo1 | 5001 | Equipo 1 |
| 2 | grupo2 | 5002 | Equipo 2 |
| 3 | grupo3 | 5003 | Equipo 3 |
| 4 | grupo4 | 5004 | Equipo 4 |

Cada grupo desarrolla su copia de las mismas seis plazas E001-E006. Todos comparten la Raspberry, su red y sus recursos.

<details>
<summary>Referencia técnica, preparación docente y material complementario</summary>

La primera práctica de estudiantes comienza en [EMPEZAR_AQUI.md](EMPEZAR_AQUI.md). Los apartados siguientes conservan la documentación técnica para consulta posterior.

Proyecto Integrador 2 de Microprocesadores — UCU Salto.

Servidor Python en Raspberry Pi y aplicación Android para consultar seis plazas de estacionamiento. La práctica permite que **cuatro grupos trabajen por separado**, cada uno con su cuenta Linux, su servidor y su puerto.

**Estado actual:** el servidor genera datos simulados. La lectura del MPF-1, los sensores y el almacenamiento persistente son etapas pendientes. Los rectángulos del mapa son una propuesta, pendiente de relevamiento.

## Cómo funciona

El servidor de cada grupo genera el estado de las seis plazas y lo entrega como JSON. La APK consulta ese servidor a través de una dirección HTTPS de Cloudflare. Las PC de los estudiantes se conectan por SSH a la Raspberry mediante Tailscale.

GitHub conserva y distribuye el código y la documentación. El servidor Python se ejecuta en la Raspberry; cargar este repositorio no lo inicia ni publica automáticamente una aplicación web. GitHub Pages no ejecuta este servidor Python.

## Qué contiene

| Ruta | Contenido |
| --- | --- |
| [rpi/](rpi/) | Servidor Flask/Waitress, instaladores, administración por grupo, pruebas y servicios systemd. |
| [android/Estaciona-Salto-UCU-0.1.3.apk](android/Estaciona-Salto-UCU-0.1.3.apk) | Aplicación Android de clase ya compilada; requiere Android 8 o posterior. |
| [android/fuente/](android/fuente/) | Código Java, HTML, CSS y JavaScript de la app, recursos y compilador PowerShell. |
| [laminas/Estacionamiento_UCU_Completo_A3.pdf](laminas/Estacionamiento_UCU_Completo_A3.pdf) | Manual A3 completo. |
| [GUIA_TRABAJO_INDEPENDIENTE.md](GUIA_TRABAJO_INDEPENDIENTE.md) | Preparación docente y trabajo independiente de los cuatro grupos. |
| [GUIA_DEL_ZIP.md](GUIA_DEL_ZIP.md) | Recorrido detallado por los archivos y comandos de la entrega original. |
| [docs/GITHUB_Y_PRIMEROS_PASOS.md](docs/GITHUB_Y_PRIMEROS_PASOS.md) | Descargar desde GitHub, copiar a la Raspberry y colaborar. |
| [pruebas/](pruebas/) | Pruebas locales de permisos, respaldos y separación de estados. |
| [evidencia/](evidencia/) | Registro histórico de validaciones y sus límites. |

Las guías históricas conservan sus direcciones y fechas originales. **Obtener la IP actual con `tailscale ip -4` en la Raspberry** y sustituir las IP antiguas al copiar comandos. Las URL `trycloudflare.com` también cambian al reiniciar los túneles. El PDF contiene todas las páginas; los PNG individuales de las láminas no se duplican aquí.

## Empezar con los cuatro grupos

1. Descargar el repositorio desde **Code → Download ZIP**, con la sesión de GitHub iniciada, y extraerlo.
2. Seguir [los primeros pasos](docs/GITHUB_Y_PRIMEROS_PASOS.md) para copiar `rpi` desde Windows.
3. El docente prepara la infraestructura común como `ucu2026`; cada equipo entra luego como `grupo1`, `grupo2`, `grupo3` o `grupo4`.

| Grupo | Cuenta Linux | Puerto HTTP en la Raspberry | Servicio de API |
| --- | --- | --- | --- |
| 1 | grupo1 | 5001 | estacionamiento@1 |
| 2 | grupo2 | 5002 | estacionamiento@2 |
| 3 | grupo3 | 5003 | estacionamiento@3 |
| 4 | grupo4 | 5004 | estacionamiento@4 |

Cada proceso representa las mismas seis plazas E001–E006 para el desarrollo del grupo. Las cuatro copias no representan 24 lugares físicos.

## Probar solamente el servidor en una PC

Requiere Python 3.10 o posterior. Desde la raíz del repositorio, en PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r rpi/requirements.txt
.\.venv\Scripts\python.exe rpi/servidor_estacionamiento.py --grupo 1
```

Abrir <http://127.0.0.1:5001/api/estado?grupo=1> mientras ese programa continúa ejecutándose. Para otro grupo cambiar `--grupo`; el puerto predeterminado es 5000 + número de grupo. Esta prueba local de API no configura el acceso HTTPS de la APK ni los servicios de la Raspberry.

## Conectar la APK

Instalar la APK del repositorio. En **Ajustes**, desactivar la demostración local, elegir el grupo e ingresar la URL HTTPS vigente de su servidor. Pegar solo la dirección base, sin `/api/estado` ni el puerto. Tocar **Guardar y conectar**.

La APK conserva una dirección temporal antigua como valor inicial: cambiarla en Ajustes. El teléfono que usa el túnel público no necesita una cuenta Linux ni Tailscale.

## Comprobar el código

```powershell
python -m unittest discover -s pruebas -v
node android/fuente/tests/core.test.js
node android/fuente/tests/geometry.cjs
```

La prueba de geometría regenera los dos archivos de posiciones de ejemplo. Las pruebas de interfaz con navegador incluidas en el código fuente requieren herramientas adicionales; no son necesarias para ejecutar el servidor.

## Firma Android y configuración

Las claves de firma, contraseñas, tokens, entornos virtuales y productos temporales de compilación quedan fuera del repositorio. La APK de clase se conserva con su firma existente. Para recompilar una actualización compatible hay que disponer de la clave original fuera de GitHub; una firma nueva requiere desinstalar la app anterior y pierde sus ajustes.

La API actual ofrece consultas de datos simulados sin autenticación de usuario. Las cuentas Linux y Tailscale se usan para administrar el equipo. El contrato de consulta está en [android/fuente/api/CONTRATO.md](android/fuente/api/CONTRATO.md).

</details>
