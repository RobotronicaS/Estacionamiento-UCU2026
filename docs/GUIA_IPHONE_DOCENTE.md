# Estaciona UCU en iPhone · Guía para el docente

Esta preparación publica la interfaz común en la Raspberry del curso. Después, cada grupo usa su propio enlace HTTPS para abrir la app en Safari. Para la preparación, tener Python y Tailscale en la PC de Windows y acceso a la Raspberry como `ucu2026`.

## 1. Preparar la interfaz en Windows

1. Desde el [repositorio Estacionamiento UCU 2026](https://github.com/RobotronicaS/Estacionamiento-UCU2026), bajar el ZIP de la rama `main` y extraerlo en una carpeta nueva.
2. Abrir PowerShell en la carpeta extraída que contiene `rpi` y `android`.
3. Ejecutar los siguientes comandos uno por vez.

```powershell
python .\rpi\preparar_web.py
Test-Path .\rpi\web_dist\index.html
```

**Control.** El último comando debe devolver `True`. Esa carpeta contiene los archivos que la Raspberry va a servir.

## 2. Copiar y publicar en la Raspberry

Desde el mismo PowerShell de Windows, ejecutar estas líneas uno por vez. Usar la IP Tailscale actual de la Raspberry del curso si cambió.

```powershell
$ipRpiCurso = '100.105.182.81'
ssh "ucu2026@$ipRpiCurso" 'mkdir -p ~/PI2_web'
scp -r .\rpi "ucu2026@${ipRpiCurso}:PI2_web/"
ssh "ucu2026@$ipRpiCurso"
```

Cuando la terminal muestre que estás dentro de `UCU2026` con la cuenta `ucu2026`, pegar este bloque.

```bash
bash -n ~/PI2_web/rpi/preparar_grupos_independientes.sh &&
bash ~/PI2_web/rpi/preparar_grupos_independientes.sh &&
ls -l /usr/local/share/estacionamiento-ucu/web/index.html /usr/local/share/estacionamiento-ucu/web/manifest.webmanifest
```

**Control.** Debe aparecer `Preparacion terminada` y luego el listado de ambos archivos. Si se detiene, revisar las últimas líneas de la salida antes de probar los enlaces de los grupos.

## 3. Obtener el enlace y probarlo por grupo

Con el servidor de cada grupo funcionando, pedir a sus integrantes que ejecuten estas dos órdenes en su cuenta SSH de la Raspberry. Para una prueba desde la sesión del docente, podés entrar con `sudo -iu grupo1` y luego volver con `exit`. Usá el número del grupo que estás comprobando.

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py comprobar --publica
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py url
```

**Control.** La primera orden debe informar `OK grupoN ... HTTPS`. La segunda devuelve la dirección base de ese grupo.

| Estado del servidor del grupo | Cómo obtener el enlace de iPhone |
| --- | --- |
| Instalado con la versión que incluye la app web | Agregar `/app/` al enlace base. |
| Ya instalado y devuelve 404 en `/app/` | Ejecutar `publicar-web` desde la cuenta del grupo y agregar `/static/estaciona/index.html` al enlace base. |

Este es el comando de publicación para una copia existente.

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py publicar-web
```

Si se restauró un respaldo previo, el grupo puede volver a ejecutar `publicar-web` para habilitar ese acceso.

## 4. Comprobar en un iPhone y entregar la guía

Abrir el enlace completo en **Safari**. Confirmar que el número del equipo coincide, que se ven las seis plazas y que carga el historial. Usar **Compartir → Agregar a Inicio** y comprobar que el ícono abre la misma app. Repetir con los cuatro enlaces.

| Cuenta | API por HTTPS | Equipo y seis plazas en Safari | Ícono abre la app |
| --- | --- | --- | --- |
| `grupo1` | — | — | — |
| `grupo2` | — | — | — |
| `grupo3` | — | — | — |
| `grupo4` | — | — | — |

Compartir con cada grupo **su enlace completo** y la [guía para estudiantes](GUIA_IPHONE_ESTUDIANTES.md). Si cambia el dominio del túnel, pedir al grupo que obtenga el enlace actualizado y lo agregue a Inicio.

## Si aparece un error

| Mensaje o síntoma | Qué revisar |
| --- | --- |
| `Test-Path` devuelve `False` en Windows | Verificar que PowerShell esté en la raíz del ZIP extraído y revisar la salida de `preparar_web.py`. |
| `publicar-web` figura como acción inválida | Comprobar que se haya aplicado la preparación del paso 2 con la versión actual del repositorio. |
| Falla `comprobar --publica` | Revisar la URL y el túnel del grupo antes de probar Safari. [Ayuda de la conexión pública](AYUDA_ESTUDIANTES.md#url-del-servidor) |
| La preparación se detiene con `Plantilla distinta` | Revisar la plantilla indicada por el instalador y la configuración del grupo. |

[Volver a la guía general del docente](PARA_EL_DOCENTE.md)
