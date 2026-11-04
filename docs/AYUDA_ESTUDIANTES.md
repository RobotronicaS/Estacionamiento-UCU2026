# Ayuda: encontrar el error y continuar

[Volver a la guía paso a paso](../EMPEZAR_AQUI.md) · [Inicio](../README.md)

Leer el mensaje y elegir el caso correspondiente. Los comandos marcados RASPBERRY se ejecutan después de entrar con `ssh` y con la cuenta de su grupo.

## GitHub

### GitHub muestra 404 o no permite descargar

El repositorio es privado. Entrar con su cuenta GitHub y aceptar la invitación del docente. Si aún no tienen acceso, indicar al docente su **nombre de usuario de GitHub** para que pueda invitarlos o entregarles el ZIP del curso.

### No encuentro las carpetas rpi y android

En Windows, extraer todo el ZIP y abrir la carpeta extraída. Puede haber otra carpeta con el nombre del proyecto dentro: entrar hasta ver `README.md`, `rpi` y `android` juntos. No trabajar dentro de la vista del ZIP sin extraerlo.

## SSH

### ssh no se reconoce como un comando

Están en Windows y falta el cliente OpenSSH. Avisar al docente para habilitar **Cliente OpenSSH** en esa PC. Tailscale debe estar conectado antes de probar el acceso remoto.

### Connection timed out, No route to host o Network is unreachable

**PC WINDOWS:**

1. Comprobar Internet.
2. Abrir Tailscale y comprobar que esté conectado con la identidad autorizada para la clase.
3. Verificar que el comando use su cuenta `grupo1`, `grupo2`, `grupo3` o `grupo4` y la dirección que indicó el docente. La de la guía es `100.105.182.81`.
4. Volver a ejecutar el comando SSH de su grupo.

Si sigue sin llegar, informar al docente el mensaje completo: debe comprobar que la Raspberry esté conectada y que esa PC tenga acceso por Tailscale.

### Connection refused al ejecutar ssh

La PC llegó a un equipo, pero el acceso SSH no está atendiendo en esa dirección. Verificar la IP con el docente y pedir que compruebe el servicio SSH de la Raspberry. Este mensaje aparece antes de poder ejecutar comandos dentro del servidor.

### No veo la contraseña al escribir

Es normal que SSH no muestre letras ni puntos. Escribir la contraseña Linux de su grupo y presionar Enter.

### Permission denied al entrar por ssh

1. Comprobar el usuario escrito antes de `@`.
2. Usar la contraseña Linux del grupo, respetando mayúsculas y minúsculas. No usar la de GitHub o Tailscale.
3. Si vuelve a rechazarla, pedir al docente que revise esa cuenta y su acceso. Enviar el mensaje; no enviar la contraseña.

### Primera conexión: pregunta por la huella del servidor

Comparar la huella mostrada con la que comunique el docente. Después de confirmar que corresponde a la Raspberry del curso, responder `yes`. Si la huella no coincide, pedir la comprobación antes de continuar.

### REMOTE HOST IDENTIFICATION HAS CHANGED

Detener esa conexión y mostrar el mensaje al docente. Puede haberse reinstalado la Raspberry o cambiado la dirección. El docente debe verificar la huella actual y orientar la actualización del registro de la PC.

### Aparece grupo1@... en lugar de PS C:\...

Ya están dentro de la Raspberry: es correcto. A partir de ahí usan los bloques **RASPBERRY**. Para volver a Windows, escribir `exit`.

### Aparece >> en PowerShell o quedó un comando sin terminar

Presionar **Ctrl+C** para cancelar la entrada incompleta. Copiar nuevamente un solo comando completo. No copiar el texto del resultado esperado ni el inicio de línea `PS C:\...` o `grupo1@...`.

## Herramienta

### No existe /usr/local/share/estacionamiento-ucu/mi_grupo.py

Comprobar que ya entraron por SSH y ejecutar, en la RASPBERRY:

```bash
whoami
```

```bash
ls /usr/local/share/estacionamiento-ucu/mi_grupo.py
```

Si la cuenta es la correcta y el archivo no existe, avisar al docente: falta preparar la herramienta común. El docente tiene [su página de comprobación](PARA_EL_DOCENTE.md). Las cuentas y Tailscale pueden estar creados aunque falte esta herramienta.

### Usar una cuenta grupo1 a grupo4

Están usando otra cuenta o están intentando ejecutar el programa fuera de la Raspberry. Entrar por SSH con su usuario de grupo y repetir el comando. Si están como `ucu2026`, salir con `exit` y volver a entrar con `grupoN`.

### sudo pide contraseña, permiso denegado o El control no aprobo

En la RASPBERRY, comprobar primero la cuenta con `whoami`. La gestión usa un permiso limitado para sus dos servicios. Si ese permiso falta, debe corregirlo el docente; no necesitan la contraseña del administrador para el trabajo cotidiano.

Indicar al docente qué comando ejecutaron y copiar el mensaje completo.

## Dependencias

### La carpeta ya tiene trabajo. Se conserva sin cambios

La herramienta está protegiendo un proyecto existente. Continuar con:

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py comprobar
```

Si aprueba, seguir con el paso 5 de la guía. Si faltan dependencias o la instalación anterior se interrumpió, usar la recuperación siguiente.

### Falló pip, falta Flask/Waitress o se interrumpió la descarga

**RASPBERRY:** con Internet disponible, completar el entorno conservando el código:

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py preparar-entorno
```

Esperar a que termine correctamente. Luego:

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py reiniciar
```

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py comprobar
```

Si falta `venv` o `ensurepip`, informar al docente: debe revisar `python3-venv` en la preparación común. Si el entorno se prepara pero el servidor sigue fallando, continuar en [Servidor](#servidor).

## Servidor

### comprobar da Connection refused o el servidor no responde

**RASPBERRY:** consultar el estado:

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py estado
```

Debe mostrar sus dos servicios. `active (running)` indica que están ejecutándose. `inactive` o `failed` requieren revisión.

Si están detenidos, iniciar sus servicios:

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py iniciar
```

Esperar 10 segundos y repetir `comprobar`. Si sigue fallando, consultar los mensajes:

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py mensajes
```

Si cambiaron código, revisar también [cómo corregir un error de Python](PRIMER_CAMBIO_Y_RESPALDO.md#si-el-cambio-tiene-un-error).

### Hay plazas sin lectura vigente o la lectura tiene más de 20 segundos

Esperar unos segundos y repetir `comprobar`. Si continúa, consultar `estado` y `mensajes` con los comandos anteriores. Si el mensaje menciona el reloj, informar al docente para revisar la hora de la Raspberry.

## URL del servidor

### url dice que el túnel está detenido

**RASPBERRY:** iniciar sus servicios con el comando `iniciar` de la sección anterior. Esperar unos segundos y repetir:

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py url
```

### La URL nueva aún no aparece o no se identifica la ejecución

Esperar 10 segundos y repetir `url`. Si continúa el error, consultar `estado` y `mensajes`. La URL la genera el túnel de su propio grupo.

### LOCAL aprueba pero HTTPS falla

La API responde dentro de la Raspberry; hay que revisar el acceso por Internet:

1. Obtener nuevamente `url` desde su cuenta.
2. Esperar unos segundos si el túnel acaba de iniciarse.
3. Repetir `comprobar --publica`.
4. Si falla otra vez, consultar `estado` y `mensajes`, y guardar el error completo para el docente.

### Reinicié mi servidor y dejó de funcionar la app

La orden `reiniciar` también recrea su túnel: puede cambiar la URL. Obtener la nueva con `url`, comprobar con `comprobar --publica` y reemplazar la dirección en Ajustes de la app.

## Teléfono

### En el navegador veo texto en lugar del mapa

Es la respuesta JSON del servidor y es normal. Abrir la APK Android para ver el mapa y las plazas.

### La app no conecta, dice otro equipo o muestra una demostración

1. Comprobar Internet en el teléfono.
2. En Ajustes, desactivar Modo demostración.
3. Pegar la URL base actual obtenida con `url`: empieza por `https://` y termina en `.trycloudflare.com`.
4. Quitar espacios al copiar. No agregar `/api/estado`, `?grupo=...` ni `:5001`.
5. Elegir el número de equipo que coincide con su cuenta Linux.
6. Tocar Guardar y conectar.
7. En la Raspberry, confirmar que `comprobar --publica` apruebe.

La app puede mostrar la última lectura guardada después de una desconexión. Revisar su indicación de conexión y vigencia, además de los colores.

### El mapa de fondo no carga

Probar la pestaña **Plazas** para consultar los estados. El fondo del mapa necesita Internet adicional para descargar sus imágenes. La distribución de las seis plazas es una propuesta de clase.

## Si necesitan ayuda del docente

Indicar **su grupo**, el **paso de la guía**, el **comando utilizado** y el **mensaje completo** o una captura de la pantalla. Esto permite ubicar el problema. No incluir contraseñas.
