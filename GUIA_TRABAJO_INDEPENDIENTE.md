# Estacionamiento UCU: cuatro grupos independientes

> **Estudiantes de primer año:** seguir primero [EMPEZAR_AQUI.md](EMPEZAR_AQUI.md). Allí están el acceso de cada grupo, la instalación individual, las comprobaciones y la conexión de la APK. Esta página conserva los detalles técnicos y la preparación común del docente.

Proyecto Integrador 2 - UCU Salto - 21/10/2026

Esta ampliación corresponde exclusivamente al ESTACIONAMIENTO. Las páginas
1 a 5 del PDF y los archivos anteriores se conservan. Para que cada grupo
realice su instalación y mantenimiento, seguir este recorrido nuevo.
El instalador general anterior continúa como alternativa del docente.
Elegir un recorrido; los estudiantes usan el procedimiento individual.

## 1. Qué queda separado y qué se comparte

| Cuenta | Carpeta de proyecto | Puerto | API y túnel |
|---|---|---:|---|
| grupo1 | /home/grupo1/PI2/estacionamiento | 5001 | estacionamiento@1 / estacionamiento-tunel@1 |
| grupo2 | /home/grupo2/PI2/estacionamiento | 5002 | estacionamiento@2 / estacionamiento-tunel@2 |
| grupo3 | /home/grupo3/PI2/estacionamiento | 5003 | estacionamiento@3 / estacionamiento-tunel@3 |
| grupo4 | /home/grupo4/PI2/estacionamiento | 5004 | estacionamiento@4 / estacionamiento-tunel@4 |

Cada cuenta tiene contraseña, sesión SSH, código, entorno Python .venv,
archivos de proyecto y respaldos propios. El historial del simulador es propio
de cada proceso, pero está en memoria y se pierde al reiniciarlo. Esta
ampliación no implementa una base de datos persistente.

El sistema operativo, la red, Tailscale, cloudflared, RAM, CPU y almacenamiento
físico se comparten. Los permisos de carpeta separan el trabajo; esto no
equivale a cuatro máquinas virtuales ni reserva recursos de hardware.
Los endpoints de consulta siguen siendo públicos por diseño.

Son cuatro desarrollos de SEIS plazas simuladas cada uno. El MPF-1,
sensores, pasarela y lectura real siguen pendientes. Cuando se integren,
se debe definir cómo se distribuyen o asignan sus lecturas.

## 2. Preparación única del docente

La Raspberry debe tener sistema de 64 bits, usuario administrador ucu2026,
SSH y Tailscale autorizado. La preparación de sistema/red está en la
página 1 original. Usar una microSD nueva o respaldada para grabar un sistema.
Esta ampliación funciona sobre esa base y también incorpora las cuentas
de una instalación previa conservando sus proyectos.

Descargar el ZIP actualizado y extraer en una carpeta nueva de Windows.
Ejemplo en PowerShell (usar el nombre real si Windows agregó "(1)"):

    $zip = Join-Path $env:USERPROFILE 'Downloads\Estacionamiento_UCU_Paquete_Completo.zip'
    $carpeta = Join-Path $env:USERPROFILE 'Downloads\Estacionamiento_UCU_4grupos'
    Expand-Archive -LiteralPath $zip -DestinationPath $carpeta
    Test-Path "$carpeta\rpi\preparar_grupos_independientes.sh"
    scp -r "$carpeta\rpi" ucu2026@100.72.228.96:
    ssh ucu2026@100.72.228.96

100.72.228.96 es la IP comprobada previamente, no una IP universal.
Comprobar la dirección actual con tailscale ip -4. Cada PC debe estar
autorizada en Tailscale; verificar la clave del host con el docente.
Test-Path debe devolver True.

En Bash de la Raspberry, como ucu2026:

    whoami
    tailscale ip -4
    bash ~/rpi/preparar_grupos_independientes.sh

El script instala dependencias comunes, comprueba Tailscale, instala
cloudflared si falta y crea las cuentas que no existan. Pide contraseña
solo para cuentas nuevas; conserva las contraseñas existentes.

Prepara carpetas privadas, compara las dos plantillas de servicio e instala
las que falten. Si encuentra una plantilla personalizada distinta, se
detiene para revisión del docente. No reemplaza el código o .venv de los
grupos ni reinicia sus servicios existentes.

Instala:

| Ubicación en Raspberry | Función |
|---|---|
| /usr/local/share/estacionamiento-ucu/ | Referencia común de solo lectura: servidor, requirements.txt y mi_grupo.py |
| /usr/local/sbin/estacionamiento-grupo | Control privilegiado limitado a los dos servicios del usuario que invoca sudo |
| /etc/sudoers.d/estacionamiento-grupos | Permiso específico para ese control |
| /etc/systemd/system/estacionamiento@.service | Plantilla de API |
| /etc/systemd/system/estacionamiento-tunel@.service | Plantilla de túnel |

Revisión del docente:

    getent passwd grupo1 grupo2 grupo3 grupo4
    sudo visudo -cf /etc/sudoers
    sudo -l -U grupo1
    ls -ld /home/grupo1 /home/grupo1/PI2

Repetir la consulta de permisos para grupo2, grupo3 y grupo4.
Los grupos no reciben sudo general ni acceso global al journal.
El script se detiene si detecta pertenencia a grupos administrativos
comunes; revisar con el docente antes de continuar.

En una instalación nueva las unidades se registran, pero el proyecto de
cada grupo comienza cuando ese grupo termina su instalación individual.
En una instalación anterior los servicios existentes conservan su estado.

## 3. Cada estudiante entra con su propia cuenta

Abrir PowerShell en su PC. Elegir SOLO la línea de su cuenta:

    ssh grupo1@100.72.228.96
    ssh grupo2@100.72.228.96
    ssh grupo3@100.72.228.96
    ssh grupo4@100.72.228.96

Las cuatro sesiones pueden estar abiertas simultáneamente. La contraseña
no se muestra al escribir. A partir del prompt de la Raspberry, usar Bash:

    whoami
    echo "$HOME"
    GESTION_PI2=/usr/local/share/estacionamiento-ucu/mi_grupo.py

Debe aparecer el usuario y home de SU grupo. GESTION_PI2 es una variable
de esta terminal: definirla de nuevo al reconectar.

## 4. Instalar la propia copia

Si la carpeta es nueva o está vacía:

    python3 "$GESTION_PI2" instalar
    python3 "$GESTION_PI2" comprobar
    python3 "$GESTION_PI2" estado

La instalación copia el servidor de referencia y requirements.txt a su
carpeta, crea su .venv e instala las dependencias allí. Habilita e inicia
únicamente su API y su túnel. No cambia otros grupos.
Si el primer comprobar falla porque el servicio aún arranca, esperar
unos segundos y repetirlo.

Si YA tiene proyecto, continuar con:

    python3 "$GESTION_PI2" estado
    python3 "$GESTION_PI2" comprobar

El comando instalar rechaza una carpeta con trabajo para evitar
sobrescribirla. Si una instalación se interrumpió al descargar dependencias,
o se modificó requirements.txt, completar el entorno conservando el código:

    python3 "$GESTION_PI2" preparar-entorno
    python3 "$GESTION_PI2" comprobar

Esta operación puede necesitar Internet. Instala dependencias y activa
los servicios propios; para aplicar cambios a un proceso ya activo,
ejecutar reiniciar.

Resultado esperado:

    OK grupo1: seis plazas simuladas, lectura vigente, historial y rechazo de otro grupo. LOCAL

El número debe corresponder a la cuenta. La comprobación usa la API propia,
valida E001 a E006, simulado=true, lectura de hasta 20 s, historial y
respuesta 404 al pedir otro grupo en esa API.

## 5. Programar y operar el propio servidor

    cd ~/PI2/estacionamiento
    python3 "$GESTION_PI2" respaldar
    nano servidor_estacionamiento.py
    .venv/bin/python -m py_compile servidor_estacionamiento.py
    python3 "$GESTION_PI2" reiniciar
    python3 "$GESTION_PI2" comprobar

Si cambia requirements.txt, ejecutar preparar-entorno antes de reiniciar.
Cada modificación se realiza en la carpeta del grupo, no en la referencia
común de /usr/local/share.

Comandos diarios:

    python3 "$GESTION_PI2" estado
    python3 "$GESTION_PI2" iniciar
    python3 "$GESTION_PI2" detener
    python3 "$GESTION_PI2" reiniciar
    python3 "$GESTION_PI2" mensajes
    python3 "$GESTION_PI2" url

estado muestra los dos servicios propios; si están inactivos puede devolver
salida distinta de cero. mensajes muestra los últimos 60 mensajes de esos
servicios del arranque actual. El control deduce el grupo de SUDO_USER;
no admite elegir otro usuario, una unidad arbitraria ni un comando libre.
Las órdenes autorizadas se ejecutan con sudo no interactivo por el
control fijo; el estudiante no necesita la contraseña del administrador.

Si falta el permiso, el docente debe ejecutar la preparación nueva.
Cerrar SSH deja los servicios activos. Para comprobarlo, salir con exit,
reconectar y ejecutar comprobar sin iniciar nuevamente.

## 6. Dirección HTTPS y APK de cada grupo

    python3 "$GESTION_PI2" url
    python3 "$GESTION_PI2" comprobar --publica

url consulta el journal de la ejecución actual del propio túnel y
devuelve solo https://...trycloudflare.com. Si aún no aparece, esperar
unos segundos y repetir. No reutiliza la dirección de una ejecución
anterior. Los servicios y el acceso a Internet deben funcionar.

La URL puede cambiar después de reiniciar el túnel, el servidor completo
o la Raspberry. Volver a obtenerla y actualizar la APK. El archivo global
del docente direcciones_apk.txt puede quedar antiguo después de un cambio
individual; para reconstruirlo, el docente usa el verificador general
cuando los cuatro grupos estén activos.

Transferir android/Estaciona-Salto-UCU-0.1.3.apk al teléfono e instalarla
si falta (Android 8 o posterior). En la aplicación:

1. Ajustes.
2. Desactivar Modo demostración.
3. Pegar la URL base del propio túnel en Dirección del servidor HTTPS.
4. Elegir Equipo 1, 2, 3 o 4 según la cuenta.
5. Guardar y conectar.
6. Probar con datos móviles, Wi-Fi apagado y Tailscale desconectado
   en el teléfono. Deben verse las seis plazas y sus cambios.

El navegador también puede abrir la URL base o /api/estado?grupo=N;
el servidor actual muestra JSON. La interfaz visual es la APK.
El estado de esta etapa sigue siendo simulado en la Raspberry.
La APK se conserva sin recompilar.

## 7. Respaldar y recuperar el trabajo propio

    python3 "$GESTION_PI2" respaldar
    python3 "$GESTION_PI2" listar-respaldos

Los ZIP quedan en /home/grupoN/PI2/respaldos. Guardan código y archivos
del proyecto; excluyen .venv, __pycache__, .git y enlaces simbólicos.
El historial en memoria no se puede recuperar desde este respaldo.
Para una futura base de datos o adquisición real se deberá adaptar
el procedimiento de copia consistente.

Copiar el nombre EXACTO del ZIP listado. Para recuperarlo:

    python3 "$GESTION_PI2" restaurar NOMBRE_REAL_DEL_RESPALDO.zip
    python3 "$GESTION_PI2" comprobar
    python3 "$GESTION_PI2" url

NOMBRE_REAL_DEL_RESPALDO.zip es un campo a reemplazar, no un archivo
incluido. Se admite un ZIP de la carpeta propia, con metadatos del propio
grupo, código Python válido y hasta 100 MiB descomprimidos.

La restauración valida el ZIP antes de detener servicios. Crea además
un respaldo del proyecto actual y conserva su carpeta completa en
~/PI2/anteriores. Detiene solo los servicios propios, recupera la copia
y recrea .venv en su ruta final. Necesita descargar las dependencias
si no están disponibles localmente. Luego inicia el proyecto.

Si falla la preparación del entorno, se intenta devolver la carpeta
anterior a su ruta original y reiniciarla; la copia fallida también se
conserva. Revisar el mensaje y ejecutar estado/mensajes. Ninguna carpeta
de otro grupo forma parte de la operación.

Para llevar un respaldo a Windows, en PowerShell, usando el nombre real:

    scp grupo1@100.72.228.96:/home/grupo1/PI2/respaldos/NOMBRE_REAL_DEL_RESPALDO.zip .

El punto final guarda el archivo en la carpeta actual de PowerShell.
Adaptar cuenta, IP y nombre de respaldo.

## 8. Prueba de independencia en clase

1. Los cuatro grupos se conectan simultáneamente; cada uno ejecuta comprobar.
2. Todos guardan un respaldo de su trabajo.
3. grupo1 ejecuta detener. grupo2, grupo3 y grupo4 repiten comprobar
   y deben seguir aprobando. La APK de grupo1 puede mostrar temporalmente
   datos anteriores hasta detectar el fallo; usar la prueba de API como evidencia.
4. grupo1 ejecuta iniciar, comprobar y url; actualiza su APK si cambió la URL.
5. grupo1 modifica un texto de su código, reinicia y prueba. Los otros
   grupos comprueban sus proyectos y archivos.
6. Repetir la prueba de cierre de SSH sin detener el servicio.
7. Registrar fecha, grupo, resultado local, URL pública y funcionamiento
   de la APK. Las URL públicas no son contraseñas.

Reiniciar toda la Raspberry, cambiar la red o reinstalar el sistema
es una tarea compartida del docente y afecta a todos.

## 9. Archivos nuevos del paquete

| Ruta dentro del ZIP | Uso |
|---|---|
| GUIA_TRABAJO_INDEPENDIENTE.md | Esta guía completa |
| COMANDOS_GRUPOS.txt | Comandos nuevos por terminal y usuario |
| rpi/preparar_grupos_independientes.sh | Preparación única como ucu2026 |
| rpi/mi_grupo.py | Instalación y trabajo desde la cuenta grupoN |
| rpi/estacionamiento_grupo_admin.py | Fuente del control limitado instalado por el docente |
| pruebas/test_trabajo_independiente.py | Pruebas locales sin root ni conexiones externas |
| laminas/..._06.png a ..._10.png | Imágenes de las cinco páginas agregadas |
| evidencia/Validacion_Trabajo_Independiente.txt | Alcance y resultado de la revisión local |

Los archivos y páginas anteriores se conservan. Sus índices y cantidades
describen la edición previa; esta tabla y el listado del ZIP incluyen
la ampliación.

## 10. Validación y límites de esta entrega

La ampliación se preparó y revisó localmente. Las pruebas automáticas
verifican selección de servicios propios, rechazo de identidades y argumentos
extra, URL de la invocación actual, respaldos, recuperación, reversión ante
fallos y separación de estados del simulador.

Las órdenes privilegiadas y la recreación del entorno se simulan en esas
pruebas: no equivalen a haber ejecutado el procedimiento nuevo en la RPi.
La prueba real de las cuatro sesiones, permisos sudoers, systemd y APK
queda para el docente y los grupos en el equipo.
La evidencia histórica anterior se conserva y no se atribuye a estos scripts nuevos.

Fuentes de implementación:
- Python venv: https://docs.python.org/3/library/venv.html
- systemd units: https://www.freedesktop.org/software/systemd/man/latest/systemd.unit.html
- journalctl: https://www.freedesktop.org/software/systemd/man/latest/journalctl.html
- sudoers (Debian): https://manpages.debian.org/trixie/sudo/sudoers.5.en.html
