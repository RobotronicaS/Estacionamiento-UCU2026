# Registro de verificación — Estacionamiento UCU

Fecha de apertura: 20/10/2026 (America/Montevideo).
Última actualización: 21/10/2026, con la salida completa de la verificación posterior al reinicio compartida por el docente.
Estado: cuatro API y cuatro túneles comprobados antes y después del reinicio; APK funcionando según el usuario antes de ese reinicio. Falta confirmar la APK con su nueva URL. Dominio fijo e integración de sensores fuera de esta prueba.

## Documento de referencia

- Archivo leído: **Estacionamiento_UCU_Completo_A3.pdf**, dos láminas A3, edición 20/10/2026.
- Versión consultada: 1. Referencia: `libfile_c37d7582b8688191970671dd5cc3eac0`.
- La bitácora acompaña al PDF. La edición actualizada del 21/10/2026 del A3 y del paquete incorpora los comandos y resultados comprobados, manteniendo sus archivos de referencia.
- Se registran comandos, lugar de ejecución, evidencia, relación con el documento y correcciones pendientes.
- Las contraseñas, claves privadas y tokens quedan fuera de este registro.

## Criterio de evidencia

- **Verificado por salida:** el usuario compartió el comando y su resultado.
- **Informado por el usuario:** confirmó el paso, sin salida de terminal que permita verificarlo por completo.
- **Indicado, pendiente:** se proporcionó el comando, pero todavía no llegó su resultado.
- **Histórico:** corresponde a la instalación anterior; no acredita el estado después de reinstalar.
- El asistente no consiguió iniciar una sesión SSH propia. Las pruebas de la Raspberry se basan en las salidas que comparte el usuario.
- Los saltos y escapes de formato de los mensajes se normalizan para mostrar comandos copiables. No se introducen resultados supuestos.

## Instalación nueva — registro activo

El usuario decidió instalar un sistema operativo nuevo. `hostnamectl` confirma Debian GNU/Linux 13 (trixie), arquitectura arm64 y kernel de Raspberry Pi. Esta salida no identifica el modelo físico ni acredita la variante Lite.

| ID | Entorno | Comando o acción | Evidencia recibida | Estado | Relación con el A3 |
|---|---|---|---|---|---|
| N01 | Raspberry Pi Imager / Windows | Preparación recomendada: RPi5, Raspberry Pi OS Lite 64 bits, hostname y usuario `ucu2026`, SSH con contraseña, red configurada | El usuario avanzó a localizar el equipo en su red. No se mostró la selección final del sistema ni la finalización de grabación. | Informado parcialmente; comprobar sistema | Prerrequisito del PDF; faltan instrucciones detalladas de grabación |
| N02 | PowerShell / Windows | `ping -4 ucu2026.local` | Resuelve `UCU2026.local [192.168.1.24]`; 4 enviados, 4 recibidos, 0 % perdidos; tiempos 5–12 ms | Verificado por salida | Paso adicional de descubrimiento local; no figura en el PDF |
| N03 | PowerShell / Windows | `ssh ucu2026@192.168.1.24` | El usuario respondió «listo» y luego compartió una sesión con prompt `ucu2026@UCU2026:~ $` | Informado por el usuario; prompt posterior corroborado | Acceso administrativo inicial por LAN; distinto del ejemplo por Tailscale del paso 3 |
| N04 | Bash / Raspberry, usuario `ucu2026` | `hostnamectl` | Hostname UCU2026; Debian GNU/Linux 13 (trixie); kernel Linux 6.18.50+rpt-rpi-2712; arquitectura arm64 | Verificado por salida | Comprobación adicional del sistema; no figura en el PDF |
| N05 | Bash / Raspberry, usuario `ucu2026` | `sudo apt update` | El instalador ejecutó `sudo apt-get update` y luego `sudo apt-get install -y curl ca-certificates openssh-server python3-venv` | Cubierto por comandos equivalentes; ver N08 | Paso 1 del A3; la orden literal indicada fue reemplazada por apt-get en el instalador |
| N06 | PowerShell / Windows | `ssh ucu2026@10.168.71.11` | Banner de UCU2026 y sesión como `ucu2026`; la huella coincide con la de 192.168.1.24 y con la obtenida por ssh-keygen en esta instalación | Verificado por salida | Otra dirección privada local; no es la dirección de Tailscale |
| N07 | Bash / Raspberry, usuario `ucu2026` | Crear `~/instalar_estacionamiento_ucu.sh` mediante heredoc y ejecutar `bash "$HOME/instalar_estacionamiento_ucu.sh"` | Primer pegado cancelado con Ctrl+C; segundo intento alcanza la autorización de Tailscale | Ejecutado parcialmente, etapas 1–8 completas y etapa 9 esperando autorización | Ruta alternativa de instalación por bloque, no incluida en el A3 |
| N08 | Bash / Raspberry | `hostnamectl`; `sudo apt-get update`; `sudo apt-get install -y curl ca-certificates openssh-server python3-venv`; `sudo systemctl enable --now ssh`; `systemctl is-active ssh`; `sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` | Debian 13 arm64; paquetes preparados; cuatro paquetes actualizados; SSH active; huella nueva registrada abajo | Verificado por salida | Paso 1 del A3, con apt-get en lugar de apt |
| N09 | Bash / Raspberry | `curl -fsSL https://tailscale.com/install.sh \| sh`; `sudo systemctl enable --now tailscaled`; `tailscale version` | Tailscale 1.104.2 instalado y servicio habilitado; la autorización sigue pendiente | Instalación verificada; ingreso a la red sin verificar | Paso 1 del A3, instalación completada |
| N10 | Bash / Raspberry | Crear `/usr/share/keyrings/cloudflare-main.gpg`; configurar repositorio `https://pkg.cloudflare.com/cloudflared any main`; `sudo apt-get update`; `sudo apt-get install -y cloudflared`; `cloudflared --version` | cloudflared 2026.10.2 instalado por APT para arm64 | Verificado por salida | Paso 6 del A3; el instalador además fija permisos 0644 de la clave pública |
| N11 | Bash / Raspberry | Para grupo1–grupo4: `sudo useradd --create-home --user-group --shell /bin/bash "$cuenta"`; `sudo passwd "$cuenta"`; `getent passwd grupo1 grupo2 grupo3 grupo4` | Cuatro contraseñas actualizadas sin registrar sus valores; cuatro homes `/home/grupoN` y shell `/bin/bash` | Verificado por salida | Equivale a crear las cuentas del paso 1, con useradd y passwd en lugar de adduser |
| N12 | Bash / Raspberry | Generar servidor y `requirements.txt`; `python3 -m py_compile`; instalar archivos por grupo; crear `.venv`; ejecutar `.venv/bin/python -m pip install -r requirements.txt` como cada grupo | Se completa la etapa 6; cuatro instalaciones exitosas con Flask 3.1.3 y Waitress 3.0.2 | Verificado por salida y avance del instalador | Pasos 4–5: se generaron archivos en la RPi, no se probaron Expand-Archive ni SCP |
| N13 | Bash / Raspberry | Crear `/etc/systemd/system/estacionamiento@.service`; `sudo systemctl daemon-reload`; habilitar y reiniciar estacionamiento@1–@4 | Cuatro enlaces de habilitación y resultados active / enabled para cada servicio | Verificado por salida | Paso 9 del A3; escucha cambiada mediante `--host 0.0.0.0` |
| N14 | Python 3 / Raspberry | Pruebas HTTP locales contra 127.0.0.1:5001–5004, estado, historial y rechazo de otro grupo | Cuatro mensajes OK: seis plazas, datos simulados, fecha vigente, historial y grupo aislado | Verificado por salida | Cubre la parte local de los pasos 5 y 11; amplía la prueba a los cuatro grupos |
| N15 | Bash / Raspberry | `sudo timeout 180s tailscale up </dev/tty >/dev/tty 2>&1` | Muestra enlace de autenticación y espera autorización; se omite el enlace de un uso en esta bitácora | Esperaba autorización al final del archivo; completada después en N17 | Paso 1 del A3; el límite de 180 s es una adición del instalador |
| N16 | Bash / Raspberry | Etapas 10 y 11 del instalador: servicios estacionamiento-tunel@1–@4, obtención de URL y prueba HTTPS | El archivo inicial termina antes de estas etapas; la salida posterior N19–N20 acredita cuatro túneles activos y cuatro URL guardadas | Servicios y direcciones acreditados después; prueba HTTPS todavía sin salida | El acceso desde la APK sigue pendiente |
| N17 | Bash / Raspberry, usuario `ucu2026` | `sudo tailscale up` | Muestra enlace de autenticación y luego `Success.`; vuelve al prompt `ucu2026@UCU2026:~ $` | Autorización completada, verificada por salida | Paso 1 del A3: autorización acreditada; falta registrar la IP asignada |
| N18 | Bash / Raspberry | `tailscale ip -4` | `100.72.228.96` | Verificado por salida | Paso 1 del A3: esta es la IP de Tailscale vigente; sustituye al ejemplo anterior |
| N19 | Bash / Raspberry | `systemctl list-units --all --no-pager 'estacionamiento*'` | Ocho unidades loaded / active / running: API @1–@4 y túneles @1–@4 | Verificado por salida | Diagnóstico conjunto de API y túneles; amplía los pasos 9 y 11 |
| N20 | Bash / Raspberry, usuario `ucu2026` | `cat "$HOME/PI2_instalacion/direcciones_apk.txt"` | Cuatro direcciones trycloudflare, registradas en la tabla de abajo | Verificado por salida | Direcciones guardadas por el instalador; su vigencia requiere probar HTTPS |
| N21 | Bash / Raspberry | Leer las cuatro URL guardadas y consultar `/api/estado?grupo=N` con curl; validar grupo, seis plazas y fecha con Python | Cuatro mensajes `OK HTTPS grupo N: seis plazas simuladas y fecha vigente`, uno por grupo | Verificado por salida: las cuatro consultas HTTPS aprobaron | Cubre la parte pública de los pasos 7 y 11 desde la Raspberry; teléfono y otra red aún pendientes |
| N22 | Teléfono Android / APK | Desactivar Wi-Fi y Tailscale; usar datos móviles; configurar URL base del Equipo 1; desactivar demostración; Guardar y conectar | El usuario responde «anduvo si» después de indicar la prueba de la APK | Funcionamiento de la APK informado por el usuario; sin captura ni datos de red adicionales | Paso 8: funcionamiento confirmado verbalmente; los detalles de red siguen basados en las instrucciones de la prueba |
| N23 | Bash / sesión SSH de la Raspberry | `exit`, después de comprobar la APK; observar durante 30 s que la app siga recibiendo cambios | La respuesta «anduvo si» no detalla si se cerró SSH ni cuánto tiempo se observó la app | No confirmado específicamente | Prueba del paso 11: continuidad después de cerrar SSH; no equivale a reiniciar la Raspberry |
| N24 | PowerShell / Windows | `ssh ucu2026@100.72.228.96` | El usuario respondió «listo» después de indicar reiniciar y reconectar; no compartió el banner de la reconexión | Informado por el usuario; sin salida específica de conexión | Comprobar acceso remoto por la dirección vigente |
| N25 | Bash / Raspberry, usuario `ucu2026` | `sudo systemctl enable estacionamiento@{1..4} estacionamiento-tunel@{1..4} && sudo reboot` | Nuevo Boot ID y pruebas posteriores aprobadas en N26 | Reinicio corroborado y recuperación automática comprobada | Paso 11: las URL cambiaron y se recuperaron correctamente |
| N26 | Bash / Raspberry | Bloque posterior al reinicio: hostnamectl, IP Tailscale, active y enabled de ocho servicios, API locales, URL del arranque actual y pruebas HTTPS; reemplazar direcciones_apk.txt solo si todo aprueba | Boot ID f7458126a9c74da295e97dde5cb7bd7a; IP 100.72.228.96; ocho servicios active/enabled; cuatro API locales OK y cuatro HTTPS OK; marcador final de verificación OK y cuatro URL nuevas guardadas | Verificado por salida completa | Arranque automático aprobado; el archivo de direcciones se regeneró |
| N27 | Teléfono Android / APK | Reemplazar la URL base del Equipo 1 por https://goals-acts-changed-sign.trycloudflare.com; Guardar y conectar; comprobar con datos móviles y Tailscale desconectado | Aún no se recibió confirmación posterior al cambio de URL | Indicado, pendiente | La APK funcionó antes de reiniciar, pero la dirección temporal anterior dejó de ser la indicada |

### Datos vigentes de esta etapa

- Nombre resuelto: `UCU2026.local`.
- IP de red local observada: **192.168.1.24**. Puede cambiar por DHCP.
- Acceso posterior acreditado mediante **10.168.71.11**. El archivo muestra que SSH reconoce la misma clave de host conocida para 192.168.1.24; ambas son direcciones privadas locales.
- Usuario administrativo previsto: `ucu2026`.
- Sistema confirmado: **Debian GNU/Linux 13 (trixie), arm64 (64 bits)**.
- Kernel confirmado: `Linux 6.18.50+rpt-rpi-2712`.
- Modelo físico y variante Lite: no determinados por esta salida de `hostnamectl`.
- IP de Tailscale de la instalación nueva: **100.72.228.96**, confirmada mediante `tailscale ip -4`.
- No reutilizar como dato confirmado la IP Tailscale de la instalación anterior.
- Huella ED25519 de esta instalación: `SHA256:JSR/i/U6rb/MehNms31PXn/xe+pHOgaZj0ANx73hrgs`. Obtenida con ssh-keygen y coincidente con el inicio de sesión posterior. Sustituye como referencia de esta instalación a la huella histórica anterior.
- Cuentas grupo1–grupo4: creadas y verificadas; Flask 3.1.3 y Waitress 3.0.2 instalados en los cuatro entornos.
- Tailscale 1.104.2 instalado, autorización completada con `Success.` e IP 100.72.228.96 registrada. Acceso desde las PC del curso todavía pendiente de comprobar.
- cloudflared 2026.10.2 instalado; cuatro servicios de túnel activos y cuatro direcciones temporales guardadas. Las cuatro consultas HTTPS a esas direcciones aprobaron sus validaciones de grupo, seis plazas, estados y fecha vigente.
- API de grupo1–grupo4: activas y habilitadas; pruebas locales de seis plazas, historial y grupo correcto aprobadas.
- APK del Equipo 1: el usuario informó que funcionó antes de reiniciar; falta confirmar el funcionamiento con la URL nueva.
- Reinicio corroborado: el Boot ID previo en Texto pegado.txt era de0cf05e2362494eb1704a3e291d4488; ahora es f7458126a9c74da295e97dde5cb7bd7a. Se mantiene el mismo Machine ID en las salidas del equipo.
- Después del reinicio: ocho servicios active/enabled, cuatro consultas locales y cuatro HTTPS aprobadas; archivo direcciones_apk.txt actualizado con las nuevas direcciones.
- La salida de APT menciona 82 paquetes no actualizados; no se ejecutó una actualización completa del sistema como parte de este instalador.

## Comparación por secciones del A3

| Sección del documento | Cobertura | Evidencia en instalación nueva | Pendiente o ajuste |
|---|---|---|---|
| Prerrequisitos | RPi con sistema operativo y usuario administrativo | Equipo local localizado; acceso SSH informado; Debian 13 arm64 confirmado | Añadir grabación con Imager, activación inicial de SSH, red y comprobación del sistema |
| 1. Preparar RPi5 y cuentas | Paquetes, Tailscale, SSH y grupos | Paquetes y cuentas preparados; SSH active; Tailscale autorizado y dirección 100.72.228.96 confirmada | Adaptar las IP de ejemplo del A3 y comprobar acceso de las PC del curso |
| 2. Autorizar PC en Tailscale | Identidad, red compartida y permisos | Pendiente | Comprobar desde cada PC del curso |
| 3. Windows y SSH | Tailscale y conexión por IP de ejemplo | Solo se comprobó descubrimiento LAN | Añadir diferencia LAN / Tailscale y usar la IP obtenida en esta instalación |
| 4. Extraer y copiar ZIP | Carpetas y transferencia de archivos | Ruta alternativa: archivos generados por heredoc e instalados por grupo en la RPi | Expand-Archive y SCP del PDF no fueron probados en esta instalación |
| 5. Servidor y dependencias | Entorno virtual, requisitos, API en primer plano | Cuatro entornos preparados y API verificadas como servicios | La variante del instalador evita la prueba en primer plano; consignarlo al corregir el A3 |
| 6. cloudflared | Comprobar versión e instalar si falta | Repositorio APT configurado y cloudflared 2026.10.2 instalado | Instalación y consultas HTTPS de los cuatro grupos acreditadas |
| 7. Túnel rápido | Publicación temporal y prueba HTTPS | Cuatro túneles activos, cuatro URL generadas y cuatro consultas HTTPS aprobadas | Probar cliente en otra red; las direcciones temporales cambian al recrear cada túnel |
| 8. APK | Instalación, URL base, grupo y conexión | El usuario informó que funcionó antes del reinicio | Configurar la URL nueva y volver a comprobar el teléfono |
| 9. Servicio automático de API | Unidad systemd, active y enabled | Ocho servicios active/enabled después del reinicio; cuatro API locales y cuatro HTTPS responden correctamente | Arranque automático aprobado; escucha API configurada en 0.0.0.0 |
| 10. Túnel permanente | Cuenta, dominio, conector y servicio | Pendiente | No se ha aportado un dominio fijo ni acreditado esta configuración |
| 11. Evidencia final | API, registros, teléfono y reinicio | Reinicio y ocho servicios acreditados; cuatro API locales y cuatro HTTPS aprobadas; APK funcionando antes del reinicio según el usuario | Actualizar la URL de la APK y repetir teléfono; prueba aislada de exit no documentada por separado |

### Ajustes identificados hasta ahora

1. El PDF toma un sistema ya instalado como prerrequisito. Para un recetario desde cero falta incorporar la preparación con Imager y el primer acceso por LAN.
2. Añadir `ping -4 ucu2026.local` y `hostnamectl` como comprobaciones iniciales. Ambos tienen salida confirmada: IP LAN 192.168.1.24 y Debian 13 arm64.
3. El PDF usa `100.127.226.105` como IP de Tailscale de la instalación anterior. Después de reinstalar hay que obtener la IP vigente y adaptar los comandos. **192.168.1.24 es una dirección LAN y no reemplaza automáticamente a la de Tailscale.**
4. La caída del servidor anterior acredita que no escuchaba en el puerto 5001 en ese momento. No demuestra por sí sola un error del código o del documento: no se verificó la instalación del servicio automático.
5. Se mantendrán separados los errores por ejecutar comandos en la terminal equivocada de los errores del servidor.
6. La ejecución por bloque usa apt-get, useradd más passwd y generación local de archivos; no reproduce literalmente apt, adduser, Expand-Archive ni SCP. Registrar estas alternativas, sin dar por probada la transferencia del ZIP.
7. El servicio del instalador agrega `--host 0.0.0.0`. Esto permite acceder por LAN y Tailscale sin fijar la IP antigua; el origen previsto para cloudflared es `http://127.0.0.1:500N`. El A3 anterior fija la IP histórica. Adaptar ambos ejemplos al mismo criterio.
8. El código entregado dentro del bloque también cambió el host predeterminado a 127.0.0.1 y añadió `simulado: true` en la raíz. El contrato de estado e historial pasó las pruebas; no se ha comparado por hash el servidor real con el del ZIP anterior.
9. El bloque usa servicios systemd para túneles rápidos de cada grupo. El PDF anterior los inicia en primer plano. Se acreditaron ahora los ocho servicios active/enabled y las consultas locales/HTTPS después de reiniciar. La edición revisada incorpora esta variante; las direcciones siguen siendo temporales.
10. En el archivo aparecen líneas del pegado mezcladas y una cancelación con Ctrl+C. El segundo intento ejecutó las etapas hasta Tailscale y aprobó las cuatro API; no hay evidencia de un error fatal en esa ejecución. No atribuir un fallo del servidor a la presentación visual del pegado.

## Instalación anterior — antecedentes comprobados

Estos resultados son históricos. No deben marcarse como aprobados para la instalación nueva.

| ID | Entorno | Comando o acción | Resultado compartido | Relación con el A3 |
|---|---|---|---|---|
| A01 | Bash / RPi, administrador | `sudo adduser grupo1` · `sudo adduser grupo2` · `sudo adduser grupo3` · `sudo adduser grupo4` | Creación y actualización de contraseña confirmadas por sus salidas | Paso 1; ejecutarlos de nuevo solo si faltan cuentas |
| A02 | Bash / RPi | `getent passwd grupo1 grupo2 grupo3 grupo4` | Cuatro cuentas, homes `/home/grupoN`, shell `/bin/bash`, UID 1001–1004 | Paso 1 |
| A03 | Bash / RPi | `tailscale status` y `tailscale ip -4` | RPi `ucu2026` en `100.127.226.105`; PC `piumaj-mi-pc` en `100.76.246.103` | Paso 1; datos históricos |
| A04 | Bash / RPi | `Test-NetConnection -ComputerName 100.127.226.105 -Port 22` | `-bash: Test-NetConnection: command not found`; ocurrió dos veces | Paso 3 identifica PowerShell como lugar correcto |
| A05 | Bash / RPi, administrador | `sudo systemctl enable --now ssh` y `systemctl is-active ssh` | Servicio habilitado; resultado `active` | Paso 1 |
| A06 | Bash / RPi, administrador | `sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` | Huella ED25519 `SHA256:m8Wl036QL02OI7tp0CA3cTMeCkFetq3JelCrIBa/4DQ` | Paso 1; huella anterior, no validada después de reinstalar |
| A07 | Bash / RPi | `ssh grupo1@100.127.226.105` | Inicio como `grupo1@UCU2026` | Conexión originada en la propia RPi; no demuestra acceso desde una PC de clase |
| A08 | Bash / RPi, grupo1 | `whoami`; `mkdir -p ~/PI2/estacionamiento`; `cd ~/PI2/estacionamiento`; `python3 -m venv .venv`; `source .venv/bin/activate`; `python --version`; `pwd` | `grupo1`; Python 3.13.5; ruta `/home/grupo1/PI2/estacionamiento` | Pasos 4–5 |
| A09 | Bash / RPi, grupo1 | `scp "$env:USERPROFILE\Downloads\servidor_estacionamiento.py" grupo1@100.127.226.105:PI2/estacionamiento/` | `scp: stat local ... No such file or directory` | Sintaxis y ruta de Windows usadas en Bash; SCP del paso 4 debe partir de PowerShell |
| A10 | Bash / RPi, grupo1 | `cd ~/PI2/estacionamiento`; `source .venv/bin/activate`; `python -m pip install "Flask>=3.1,<4" "waitress>=3,<4"` | Flask 3.1.3 y Waitress 3.0.2 instalados | Misma dependencia del paso 5; el PDF usa `-r requirements.txt` |
| A11 | Bash / RPi, grupo1 | `python servidor_estacionamiento.py --grupo 1` | Anuncia servidor, datos simulados y ruta del grupo 1 | Paso 5; arranque anterior en primer plano |
| A12 | Bash / RPi, grupo1 | `nohup .venv/bin/python servidor_estacionamiento.py --grupo 1 > servidor_grupo1.log 2>&1 < /dev/null &` | Trabajo en segundo plano; PID entonces 3694 | Variante histórica; el A3 propone systemd para arranque automático. No reutilizar ese PID |
| A13 | Bash / RPi, grupo1 | `curl -fsS --retry 3 --retry-connrefused http://100.127.226.105:5001/` | JSON: proyecto Estacionamiento UCU Salto, grupo 1, seis plazas y `simulado: true` | Prueba de la raíz; no equivale a comprobar `/api/estado` |
| A14 | Bash / RPi | `cloudflared --version` | Versión 2026.10.1 | Paso 6; no se acreditó instalación desde cero |
| A15 | Bash / RPi, grupo1 | `cloudflared tunnel --url http://100.127.226.105:5001` | Túnel rápido registrado; un timeout QUIC seguido de reconexión | Paso 7; URL histórica temporal `https://oxide-land-psychological-gonna.trycloudflare.com` |
| A16 | PowerShell / Windows | `ssh ucu2026@ucu2026` | Inicio de sesión mostrado como `ucu2026@UCU2026` | Acceso administrativo anterior; el nombre corto no identifica por sí solo la interfaz usada |
| A17 | Bash / RPi, administrador | `curl -fsS --max-time 10 "http://100.127.226.105:5001/api/estado?grupo=1"` | curl (7): conexión rechazada, 0 ms | Prueba de API del paso 5 / 11: fallida en ese momento |
| A18 | Bash / RPi, administrador | `sudo ss -ltnp '( sport = :5001 )'` | Solo encabezado; ningún listener en TCP 5001 | Diagnóstico adicional que no figura en el A3 |
| A19 | Bash / RPi, administrador | `sudo -u grupo1 tail -n 40 /home/grupo1/PI2/estacionamiento/servidor_grupo1.log` | Solo mensajes de arranque y datos simulados; sin motivo de detención | Diagnóstico adicional que no figura en el A3 |
| A20 | Bash / RPi, administrador | `systemctl status estacionamiento@1.service --no-pager -l` | Se indicó, pero no se recibió salida: el usuario decidió reinstalar | No ejecutado de forma acreditada; no se sabe si la unidad existía |

### Salidas relevantes conservadas

**N02 — descubrimiento de la nueva instalación:**

```text
Haciendo ping a UCU2026.local [192.168.1.24] con 32 bytes de datos:
Respuesta desde 192.168.1.24: bytes=32 tiempo=12ms TTL=64
Respuesta desde 192.168.1.24: bytes=32 tiempo=7ms TTL=64
Respuesta desde 192.168.1.24: bytes=32 tiempo=5ms TTL=64
Respuesta desde 192.168.1.24: bytes=32 tiempo=9ms TTL=64
Paquetes: enviados = 4, recibidos = 4, perdidos = 0 (0% perdidos).
Mínimo = 5ms, Máximo = 12ms, Media = 8ms.
```

**N04 — sistema de la nueva instalación (extracto técnico):**

```text
 Static hostname: UCU2026
       Icon name: computer
Operating System: Debian GNU/Linux 13 (trixie)
          Kernel: Linux 6.18.50+rpt-rpi-2712
    Architecture: arm64
```

**A17 — consulta fallida antes de reinstalar:**

```text
curl: (7) Failed to connect to 100.127.226.105 port 5001 after 0 ms: Could not connect to server
```

**A18 — puerto sin proceso a la escucha:**

```text
State      Recv-Q      Send-Q           Local Address:Port           Peer Address:Port     Process
```

**A19 — registro leído:**

```text
Servidor del grupo 1
DATOS SIMULADOS EN PYTHON
http://100.127.226.105:5001/api/estado?grupo=1
Detener con Ctrl+C
```

## Intento de control directo del asistente

El usuario autorizó al asistente a tomar el control y completar la instalación. Se intentó acceder a la IP LAN vigente mediante el ejecutor disponible:

```text
ssh -o ConnectTimeout=8 -o ConnectionAttempts=1 -o StrictHostKeyChecking=yes -o BatchMode=yes ucu2026@192.168.1.24 hostname
ssh: connect to host 192.168.1.24 port 22: Permission denied
```

- Falló antes de autenticarse. No se ejecutó `hostname` en la Raspberry ni se utilizó una contraseña.
- La herramienta de lectura de la terminal de la aplicación también devolvió un error de acceso a la aplicación.
- La habilidad Computer Use está presente en archivos, pero esta sesión no expone el runtime `node_repl` que requiere para controlar ventanas.
- Estos fallos no contradicen el acceso SSH que consiguió el usuario desde su PowerShell ni acreditan una avería de la Raspberry.
- En ese intento del asistente, `sudo apt update` seguía pendiente. El archivo recibido el 21/10/2026 acredita después su equivalente `sudo apt-get update`, ejecutado por el usuario mediante el instalador.

## Evidencia del 21/10/2026

Fuente leída completa: **Texto pegado.txt**, 462 líneas, referencia `libfile_3d961ebb4f7081919fe161e93ac68b6e`, archivo `file_000000002460820e992306fba33cc450`.

El archivo acredita instalación y pruebas locales exitosas. Su última etapa visible es la espera de autorización de Tailscale. No acredita todavía dirección pública, recepción en la APK ni continuidad después de reiniciar.

```text
cloudflared version 2026.10.2 (built 2026-10-20-09:11 UTC)
OK grupo 1: seis plazas, datos simulados, fecha vigente, historial y grupo aislado.
OK grupo 2: seis plazas, datos simulados, fecha vigente, historial y grupo aislado.
OK grupo 3: seis plazas, datos simulados, fecha vigente, historial y grupo aislado.
OK grupo 4: seis plazas, datos simulados, fecha vigente, historial y grupo aislado.
Estado del grupo 1: active / enabled
Estado del grupo 2: active / enabled
Estado del grupo 3: active / enabled
Estado del grupo 4: active / enabled
=== 9. Autorizar Tailscale ===
To authenticate, visit:
[enlace de autorizacion omitido]
```

### Autorización posterior completada

El usuario ejecutó `sudo tailscale up` y compartió esta salida. El enlace temporal se omite:

```text
To authenticate, visit:
[enlace de autorizacion omitido]
Success.
ucu2026@UCU2026:~ $
```

Esto acredita la autorización de Tailscale. No acredita por sí solo un túnel Cloudflare ni la recepción en la APK.

### IP y servicios confirmados después de la autorización

```text
100.72.228.96
estacionamiento-tunel@1.service loaded active running
estacionamiento-tunel@2.service loaded active running
estacionamiento-tunel@3.service loaded active running
estacionamiento-tunel@4.service loaded active running
estacionamiento@1.service loaded active running
estacionamiento@2.service loaded active running
estacionamiento@3.service loaded active running
estacionamiento@4.service loaded active running
8 loaded units listed.
```

### Direcciones públicas temporales registradas antes de la prueba de reinicio

| Equipo | API | Dirección base guardada |
|---|---|---|
| 1 | Puerto 5001, grupo 1 | https://sisters-elvis-secretariat-influenced.trycloudflare.com |
| 2 | Puerto 5002, grupo 2 | https://harvest-committee-moisture-started.trycloudflare.com |
| 3 | Puerto 5003, grupo 3 | https://glasses-seven-desperate-camcorders.trycloudflare.com |
| 4 | Puerto 5004, grupo 4 | https://budapest-officially-van-alto.trycloudflare.com |

El asistente intentó abrir las cuatro rutas públicas de estado con su herramienta web. La herramienta indicó que esas URL no eran accesibles desde ella y no devolvió respuesta HTTP de las API. Ese resultado no demuestra una falla de Cloudflare ni de la Raspberry. Después, el usuario ejecutó la prueba HTTPS desde la Raspberry y las cuatro direcciones aprobaron, como se registra a continuación.

## Prueba HTTPS completada

En la Raspberry, consultar las cuatro direcciones HTTPS y validar sus datos:

```bash
(
set -euo pipefail
while read -r etiqueta numero url; do
  grupo="${numero%:}"
  echo "Probando HTTPS del equipo $grupo..."
  curl -fsS --connect-timeout 5 --max-time 20 --retry 2 \
    --retry-all-errors "$url/api/estado?grupo=$grupo" \
    | python3 -c '
import json, sys
from datetime import datetime, timezone
d = json.load(sys.stdin)
g = int(sys.argv[1])
assert d["grupo"] == g and d["simulado"] is True
assert len(d["plazas"]) == 6
assert {p["id"] for p in d["plazas"]} == {f"E{i:03d}" for i in range(1, 7)}
assert all(p["estado"] in ("libre", "ocupado") for p in d["plazas"])
fecha = datetime.fromisoformat(d["ultima_lectura"].replace("Z", "+00:00"))
assert -5 <= (datetime.now(timezone.utc) - fecha).total_seconds() <= 20
print(f"OK HTTPS grupo {g}: seis plazas simuladas y fecha vigente")
' "$grupo"
done < "$HOME/PI2_instalacion/direcciones_apk.txt"
)
```

Salida recibida:

```text
Probando HTTPS del equipo 1...
OK HTTPS grupo 1: seis plazas simuladas y fecha vigente
Probando HTTPS del equipo 2...
OK HTTPS grupo 2: seis plazas simuladas y fecha vigente
Probando HTTPS del equipo 3...
OK HTTPS grupo 3: seis plazas simuladas y fecha vigente
Probando HTTPS del equipo 4...
OK HTTPS grupo 4: seis plazas simuladas y fecha vigente
ucu2026@UCU2026:~ $
```

El bloque terminó sin error. Las aserciones corroboran, para cada dirección: grupo correspondiente, `simulado: true`, seis plazas únicas E001–E006, estados libre/ocupado y última lectura con antigüedad máxima de 20 s, admitiendo hasta 5 s de adelanto respecto del reloj de la Raspberry.

## Prueba de la APK informada por el usuario

Después de indicar la prueba de la APK del Equipo 1 mediante la URL pública y pedir continuidad tras cerrar SSH, el usuario respondió:

> anduvo si

Se registra como confirmación verbal del funcionamiento de la APK. La respuesta no detalla por separado Wi-Fi, Tailscale, cierre de SSH ni duración de la observación. No se registran esos detalles como evidencia específica.

## Prueba de reinicio indicada

La prueba que falta para comprobar el arranque automático es reiniciar la Raspberry. Si se cerró SSH, reconectar desde PowerShell:

```powershell
ssh ucu2026@100.72.228.96
```

Dentro de la sesión de la Raspberry, habilitar las ocho unidades y reiniciar solo si la habilitación termina correctamente:

```bash
sudo systemctl enable estacionamiento@{1..4} estacionamiento-tunel@{1..4} && sudo reboot
```

El usuario elige cuándo ejecutar esta prueba. Se cortará SSH. Después del arranque se deberá reconectar, comprobar las ocho unidades y las API, obtener las nuevas URL de los túneles rápidos y actualizar la APK. **El archivo direcciones_apk.txt del instalador conservará las URL antiguas hasta que se regenere.** No dar por válidas esas direcciones después de reiniciar.

El usuario respondió «listo» después de esta indicación. Se registra como reinicio y reconexión informados, a la espera de la comprobación de servicios y nuevas direcciones. El dominio permanente sigue pendiente de aportar/configurar. El PDF A3 aún no fue reemplazado por una versión que incorpore estas diferencias.

## Comprobación después del reinicio

El siguiente bloque no reinicia los servicios. Lee las URL del arranque actual y guarda el nuevo archivo de direcciones solo cuando las cuatro API locales, las ocho unidades y las cuatro consultas HTTPS aprueban. Si falla una comprobación, conserva el archivo anterior, que podría contener direcciones caducadas.

```bash
(
set -euo pipefail

hostnamectl
tailscale ip -4

archivo="$HOME/PI2_instalacion/direcciones_apk.txt"
temporal=$(mktemp "$HOME/PI2_instalacion/direcciones_apk.XXXXXX")
trap 'rm -f -- "$temporal"' EXIT

validar() {
  python3 -c '
import json, sys
from datetime import datetime, timezone
d = json.load(sys.stdin)
g = int(sys.argv[1])
assert d["grupo"] == g and d["simulado"] is True
assert len(d["plazas"]) == 6
assert {p["id"] for p in d["plazas"]} == {f"E{i:03d}" for i in range(1, 7)}
assert all(p["estado"] in ("libre", "ocupado") for p in d["plazas"])
fecha = datetime.fromisoformat(d["ultima_lectura"].replace("Z", "+00:00"))
assert -5 <= (datetime.now(timezone.utc) - fecha).total_seconds() <= 20
print(f"OK grupo {g}: seis plazas simuladas y fecha vigente")
' "$1"
}

for grupo in 1 2 3 4; do
  for unidad in "estacionamiento@$grupo" "estacionamiento-tunel@$grupo"; do
    echo "Servicio $unidad:"
    systemctl is-active "$unidad"
    systemctl is-enabled "$unidad"
  done

  echo "API local del equipo $grupo:"
  curl -fsS --connect-timeout 5 --max-time 20 --retry 2 \
    --retry-all-errors \
    "http://127.0.0.1:$((5000 + grupo))/api/estado?grupo=$grupo" \
    | validar "$grupo"

  url=$(sudo journalctl -b -u "estacionamiento-tunel@$grupo" \
    --no-pager -o cat \
    | grep -Eo 'https://[-a-z0-9]+\.trycloudflare\.com' \
    | tail -n 1 || true)

  if [ -z "$url" ]; then
    echo "No se encontro una URL del arranque actual para el equipo $grupo."
    exit 1
  fi

  echo "Equipo $grupo: $url" | tee -a "$temporal"
  echo "HTTPS del equipo $grupo:"
  curl -fsS --connect-timeout 5 --max-time 20 --retry 2 \
    --retry-all-errors "$url/api/estado?grupo=$grupo" \
    | validar "$grupo"
done

mv -- "$temporal" "$archivo"
echo '=== VERIFICACION DESPUES DEL REINICIO: OK ==='
cat "$archivo"
)
```

Resultado recibido: **VERIFICACION DESPUES DEL REINICIO: OK**. El bloque completó las ocho comprobaciones active/enabled y las ocho consultas de API (cuatro locales y cuatro públicas), y reemplazó el archivo de direcciones con éxito.

```text
Boot ID: f7458126a9c74da295e97dde5cb7bd7a
IP Tailscale: 100.72.228.96
API 1: active / enabled; local OK; HTTPS OK
Tunel 1: active / enabled
API 2: active / enabled; local OK; HTTPS OK
Tunel 2: active / enabled
API 3: active / enabled; local OK; HTTPS OK
Tunel 3: active / enabled
API 4: active / enabled; local OK; HTTPS OK
Tunel 4: active / enabled
=== VERIFICACION DESPUES DEL REINICIO: OK ===
```

### Últimas direcciones comprobadas después del reinicio

| Equipo | URL base comprobada |
|---|---|
| 1 | https://goals-acts-changed-sign.trycloudflare.com |
| 2 | https://compact-earlier-previous-appear.trycloudflare.com |
| 3 | https://chicken-casa-walter-charlie.trycloudflare.com |
| 4 | https://frog-resulting-enrolled-arts.trycloudflare.com |

Las cuatro pasaron la validación de seis plazas simuladas y lectura vigente. Son direcciones temporales: cambiarán al volver a crear o reiniciar los túneles. La APK del Equipo 1 debe usar la primera fila hasta el próximo cambio.

## Estado de la comparación y del material actualizado

- Se corrigió la IP de ejemplo a 100.72.228.96 y la referencia de huella de la nueva instalación.
- Se documentaron apt-get, useradd más passwd, cuatro entornos, el servicio API con --host 0.0.0.0 y los cuatro túneles como servicios con origen 127.0.0.1.
- Se incluyeron el instalador íntegro y el verificador de reinicio en el paquete, además de las dos plantillas systemd y los comandos de las láminas.
- Se distingue la ruta ejecutada (bloque pegado en Bash) de la alternativa preparada de distribución por ZIP/SCP, que no se ejecutó en esta prueba.
- El código del servidor entregado en el chat se incorpora con formato uniforme. No se obtuvo una comparación binaria con el archivo remoto. Su contrato de API sí fue comprobado en la Raspberry.
- La APK 0.1.3 se conserva sin recompilar. El dominio permanente, la adquisición por MPF-1, los sensores, la pasarela, la base persistente y el relevamiento de coordenadas no quedan implementados por esta instalación.

### Pendiente inmediato

Actualizar la dirección del Equipo 1 en Ajustes de la APK a https://goals-acts-changed-sign.trycloudflare.com, conservar Equipo 1 y demostración desactivada, y tocar Guardar y conectar. Confirmar otra vez el teléfono después del cambio de dirección. El resto de la prueba de arranque automático está aprobado según la salida recibida.


## Ampliacion: cuatro grupos independientes

Se agregan anexos D-H, preparacion comun y gestion por cuenta. La evidencia historica anterior se conserva. Ver Validacion_Trabajo_Independiente.txt para alcance y pruebas locales; la ruta nueva queda pendiente de ejecutar en la Raspberry.
