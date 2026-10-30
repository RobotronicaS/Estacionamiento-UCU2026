# GitHub y primeros pasos

## Descargar y ubicar los archivos

1. Iniciar sesión en GitHub y abrir <https://github.com/RobotronicaS/Estacionamiento-UCU2026>.
2. Seleccionar **Code → Download ZIP**.
3. En Windows, extraer todo en una carpeta nueva. Abrir la carpeta que contiene `README.md`, `rpi` y `android`.
4. Abrir PowerShell en esa carpeta: los comandos siguientes deben encontrar `rpi`.

Al ser privado, el repositorio solo puede abrirlo el propietario o las cuentas invitadas que hayan aceptado el acceso.

## Copiar a la Raspberry

En la terminal de la Raspberry, como docente, obtener la dirección actual:

```bash
tailscale ip -4
```

En PowerShell de la PC, desde la carpeta extraída, reemplazar el texto de la variable por esa IP:

```powershell
$ipRpiCurso = 'REEMPLAZAR_POR_IP_TAILSCALE_ACTUAL'
Test-Path .\rpi\preparar_grupos_independientes.sh
scp -r .\rpi "ucu2026@${ipRpiCurso}:"
ssh "ucu2026@$ipRpiCurso"
```

`Test-Path` debe devolver `True`. La PC necesita tener acceso autorizado por Tailscale y la Raspberry debe tener SSH habilitado. Si ya existe `~/rpi` con cambios propios, copiar primero a una carpeta nueva y revisar las diferencias antes de sustituir archivos.

## Preparación del docente

Dentro de la sesión SSH, como `ucu2026`, con Tailscale previamente autorizado:

```bash
bash ~/rpi/preparar_grupos_independientes.sh
```

Este paso instala dependencias y prepara cuentas, plantillas y control limitado por grupo. Requiere Internet y `sudo`. El script conserva los proyectos de los grupos y se detiene si encuentra plantillas personalizadas o privilegios que necesitan revisión. Seguir [GUIA_TRABAJO_INDEPENDIENTE.md](../GUIA_TRABAJO_INDEPENDIENTE.md) para las comprobaciones completas.

## Trabajo de cada grupo

Cada equipo inicia su propia sesión desde PowerShell, por ejemplo:

```powershell
ssh "grupo1@$ipRpiCurso"
```

Dentro de la Raspberry, para un grupo que todavía no tenga proyecto:

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py instalar
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py comprobar
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py url
```

Si el proyecto ya está instalado, omitir `instalar` y usar `estado`, `comprobar` y `url`. Los archivos propios quedan en `/home/grupoN/PI2/estacionamiento`. El grupo modifica esa copia y administra solamente sus servicios. El docente coordina los cambios que afectan toda la Raspberry.

## Compartir el repositorio con los equipos

El propietario puede entrar en **Settings → Collaborators**, invitar las cuentas GitHub de los compañeros y pedirles que acepten. Para obtener el ZIP privado no deben compartir una contraseña ni un token entre equipos.

Una cuenta GitHub permite trabajar en el repositorio. La cuenta Linux `grupoN` permite entrar a la Raspberry. La autorización Tailscale permite que la PC llegue a ese equipo. Se configuran por separado.

Para desarrollar con Git, cada equipo puede crear una rama con su nombre y proponer sus cambios mediante un pull request. Modificar archivos en GitHub no actualiza automáticamente la copia que ejecuta cada cuenta Linux: la actualización en la Raspberry se revisa y aplica por separado.

## Alcance de la primera carga

El repositorio reúne el servidor y las guías de la entrega de cuatro grupos, la APK Android 0.1.3 y sus fuentes. Se comprobaron localmente las pruebas de separación, respaldos y permisos, la lógica de la app y las geometrías. La preparación de cuentas, `sudoers`, systemd y la conexión física MPF-1 requieren verificación en la Raspberry. Esta carga no modifica el equipo ni sus servicios.
