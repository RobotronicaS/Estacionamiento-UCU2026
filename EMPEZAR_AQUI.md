# Primera práctica: de la PC a las seis plazas en el celular

[Inicio](README.md) · [Ayuda si aparece un error](docs/AYUDA_ESTUDIANTES.md)

**Meta:** entrar con la cuenta de su grupo, hacer funcionar su servidor en la Raspberry y ver sus datos en Android o iPhone.

La Raspberry y las cuentas `grupo1`, `grupo2`, `grupo3` y `grupo4` ya están preparadas. El docente les entrega el número y la contraseña de su grupo. Cada grupo realiza estos pasos por separado.

## Antes de empezar

Necesitan:

- Una PC Windows con Internet y Tailscale conectado con el acceso autorizado para el curso.
- La cuenta y contraseña de su grupo en la Raspberry.
- Un teléfono con Internet. Usen Android 8 o posterior para la APK, o Safari en iPhone para la app web.
- Acceso a este repositorio en GitHub. Si aparece 404, consultar [la ayuda de acceso](docs/AYUDA_ESTUDIANTES.md#github).

Hay tres lugares de trabajo:

| Cuando la guía dice | Dónde escribir |
| --- | --- |
| **PC WINDOWS** | En PowerShell de su PC. |
| **RASPBERRY** | En la misma ventana, después de entrar por SSH. El inicio de la línea mostrará `grupo1@...`, `grupo2@...`, etc. |
| **TELÉFONO** | En la aplicación Android o en Safari del iPhone. |

Copiar **un comando por vez** y presionar Enter. Copiar solo lo que está dentro del bloque de comandos. Los cuadros de “Resultado esperado” se leen; no se ejecutan.

## 1. Descargar el proyecto

**Lugar: PC WINDOWS, navegador y Explorador de archivos.**

1. Abrir [el repositorio](https://github.com/RobotronicaS/Estacionamiento-UCU2026) con la cuenta GitHub autorizada.
2. Tocar el botón **Code** y luego **Download ZIP**.
3. Buscar el ZIP en Descargas, hacer clic derecho y elegir **Extraer todo**. Elegir una carpeta nueva.
4. Abrir la carpeta extraída hasta encontrar `README.md`, `rpi` y `android`.

**Resultado esperado:** ven esas dos carpetas y el archivo README. En `android` está `Estaciona-Salto-UCU-0.1.3.apk`, que usarán en el paso 6.

En esta práctica el servidor se instalará en la Raspberry. Los archivos descargados también permiten consultar el código y copiar la APK al teléfono.

## 2. Entrar a la Raspberry con su grupo

**Lugar: PC WINDOWS, PowerShell.**

1. Comprobar que Tailscale esté conectado en la PC.
2. Abrir Inicio, escribir **PowerShell** y abrirlo. Puede abrirse en cualquier carpeta para este paso.
3. Elegir **solo la línea de su grupo** de esta tabla, copiarla y presionar Enter:

| Su grupo | Comando para entrar |
| --- | --- |
| 1 | `ssh grupo1@100.105.182.81` |
| 2 | `ssh grupo2@100.105.182.81` |
| 3 | `ssh grupo3@100.105.182.81` |
| 4 | `ssh grupo4@100.105.182.81` |

La dirección de esta guía es `100.105.182.81`. Si el docente comunica una dirección nueva, sustituir solo esa dirección en su comando.

4. Si es la primera conexión y pregunta por la autenticidad del equipo, comparar la huella que muestra con la que indique el docente. Una vez confirmada, escribir `yes` y Enter. Si aparece **REMOTE HOST IDENTIFICATION HAS CHANGED**, ir a [la ayuda de SSH](docs/AYUDA_ESTUDIANTES.md#ssh).
5. Escribir la contraseña Linux de su grupo y presionar Enter. **Al escribirla no aparecen letras ni puntos:** es normal. No usar aquí la contraseña de GitHub.

**Resultado esperado:** el comienzo de la línea cambia a algo parecido a `grupo1@UCU2026:~ $`, con su número de grupo.

**Desde ahora están dentro de la Raspberry.** Escribir estos dos comandos, uno por vez:

```bash
whoami
```

```bash
echo "$HOME"
```

**Resultado esperado para grupo1:** `grupo1` y `/home/grupo1`. Para los otros grupos debe aparecer su propio número. Si aparece `ucu2026`, salir con `exit` y entrar con la cuenta de su grupo.

## 3. Instalar su copia del servidor

**Lugar: RASPBERRY, con la cuenta de su grupo.**

Primero comprobar que esté la herramienta preparada para la clase:

```bash
ls /usr/local/share/estacionamiento-ucu/mi_grupo.py
```

**Resultado esperado:** aparece esa misma ruta. Si dice que no existe, seguir [esta indicación](docs/AYUDA_ESTUDIANTES.md#herramienta): el docente debe completar la referencia común antes de continuar.

Para instalar por primera vez:

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py instalar
```

Esperar a que termine. Puede mostrar varias líneas de descarga. Cuando vuelve a aparecer la línea donde pueden escribir, terminó el comando.

**Resultado esperado para grupo1:** `Instalacion de grupo1 lista. Puerto 5001.` Para grupo2, grupo3 y grupo4 cambian el número y el puerto.

**Si dice “La carpeta ya tiene trabajo. Se conserva sin cambios”**, ya existe un proyecto. Continuar con el paso 4. Si después no funciona, usar [la recuperación de dependencias](docs/AYUDA_ESTUDIANTES.md#dependencias). No borrar la carpeta para repetir la instalación.

Esta orden prepara sus archivos, crea el entorno de Python e inicia los dos servicios de su grupo. Los comandos de gestión son iguales para los cuatro grupos: la herramienta reconoce quién inició la sesión.

## 4. Comprobar que el servidor funciona

**Lugar: RASPBERRY.**

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py comprobar
```

**Resultado esperado para grupo1:**

> OK grupo1: seis plazas simuladas, lectura vigente, historial y rechazo de otro grupo. LOCAL

El número debe ser el de su grupo. **LOCAL significa que la prueba se hizo dentro de la Raspberry.**

Si falla justo después de instalar, esperar 10 segundos y repetir el mismo comando. Si vuelve a fallar, ir a [Servidor detenido o sin respuesta](docs/AYUDA_ESTUDIANTES.md#servidor).

El servidor representa seis lugares, identificados de `E001` a `E006`. Cambia sus estados automáticamente cada 10 segundos para simular vehículos. En este paso todavía no se usan sensores físicos.

## 5. Obtener la dirección para el celular

**Lugar: RASPBERRY.**

Primero obtener la dirección HTTPS actual:

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py url
```

**Resultado esperado:** una dirección que empieza con `https://` y termina en `.trycloudflare.com`. Copiar **la dirección completa que devuelve su propia cuenta** y guardarla en una nota.

Comprobar que esa dirección funciona por Internet:

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py comprobar --publica
```

**Resultado esperado:** un mensaje `OK grupo1: ... HTTPS`, con su número de grupo. Si la dirección es nueva, puede tardar en responder: esperar unos segundos y repetir. Si no aparece o sigue fallando, consultar [Dirección y conexión pública](docs/AYUDA_ESTUDIANTES.md#url-del-servidor).

Pueden pegar la dirección base en el navegador de la PC. Debe mostrar datos en texto con el número de su grupo y `simulado: true`. **Ese texto es una respuesta normal del servidor.** La pantalla con el mapa se abre en la app del teléfono.

## 6. Abrir la app en el teléfono

**Lugar: TELÉFONO.**

### iPhone

Usar la [guía de iPhone para estudiantes](docs/GUIA_IPHONE_ESTUDIANTES.md) con la dirección de tu grupo del punto 5. Incluye el acceso desde Safari, el ícono en Inicio y el procedimiento para copias instaladas antes de la actualización.

### Android

#### Instalar la app

1. En la PC, abrir `android` dentro del proyecto descargado.
2. Copiar `Estaciona-Salto-UCU-0.1.3.apk` al teléfono, por ejemplo por USB, a su carpeta Descargas.
3. En el teléfono, abrir Archivos o Mis archivos, entrar en Descargas y tocar la APK para instalarla. Si Android solicita autorizar esa instalación, hacerlo solo para la aplicación que está abriendo este archivo del curso.
4. Si esa versión de la app ya está instalada, abrirla y seguir con Ajustes.

#### Elegir su servidor

1. Abrir la app y entrar en **Ajustes**.
2. **Desactivar Modo demostración.**
3. En **Dirección del servidor HTTPS**, reemplazar lo que haya por la dirección obtenida en el paso 5.
4. Elegir **Equipo 1, 2, 3 o 4**, igual que su cuenta Linux.
5. Tocar **Guardar y conectar**.

Pegar solamente la dirección base `https://...trycloudflare.com`, sin agregar `/api/estado`, parámetros ni el puerto. La dirección que trae la app inicialmente pertenece a una prueba anterior: deben cambiarla.

**Resultado esperado:** aparecen seis plazas en Mapa o Plazas; la app indica que está mostrando datos de prueba del servidor. Observar durante unos 30 segundos para ver los cambios. No tienen que copiar el patrón de colores de otro equipo.

Primero comprobar con Internet en el teléfono. Para confirmar el acceso desde fuera de la red local, si disponen de datos móviles, apagar Wi-Fi y desconectar Tailscale en el teléfono. Volver a comprobar la app.

**Desactivar la demostración local conecta la app con la Raspberry. Los datos de la Raspberry siguen siendo simulados.** El teléfono que consulta por esta dirección pública no necesita usuario Linux ni Tailscale.

## Primera práctica completada

- [ ] Entré con la cuenta de mi grupo.
- [ ] La comprobación LOCAL informó OK para mi grupo.
- [ ] La comprobación HTTPS informó OK para mi grupo.
- [ ] Abrí la app con la URL actual de mi grupo.
- [ ] La app muestra las seis plazas y sus cambios con los datos del servidor.

Anotar su grupo y la URL actual, y conservar una captura del resultado LOCAL y otra de la app para mostrarlas al docente. Las contraseñas no forman parte de la entrega.

## Al cerrar y volver a trabajar

Para salir de la Raspberry:

```bash
exit
```

Los servicios continúan funcionando al cerrar SSH. En la próxima clase, repetir la conexión del paso 2 y ejecutar:

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py comprobar
```

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py url
```

La instalación se hace una vez. Si cambia la URL del túnel, actualizarla en Ajustes de Android. En iPhone, abrir el enlace nuevo en Safari y agregarlo a Inicio.

**Cuando esta práctica funcione:** seguir con [el primer cambio y los respaldos](docs/PRIMER_CAMBIO_Y_RESPALDO.md).
