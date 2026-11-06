# Docente: accesos y revisión de la preparación común

[Inicio](../README.md) · [Guía que siguen los estudiantes](../EMPEZAR_AQUI.md)

El recorrido de estudiantes parte de la Raspberry ya preparada, cuatro cuentas Linux creadas y acceso por Tailscale. Esta página permite comprobar la base común si aparece un problema; no es una instalación que deba repetir cada equipo.

## Datos que necesita cada grupo

| Dato | Entrega |
| --- | --- |
| Número de grupo | 1, 2, 3 o 4. |
| Cuenta Linux | grupo1, grupo2, grupo3 o grupo4. |
| Contraseña Linux | Comunicarla al grupo correspondiente. |
| Dirección Tailscale | La guía usa 100.105.182.81; confirmar la actual con `tailscale ip -4` en la Raspberry. |
| Acceso desde la PC | Tailscale conectado y autorizado para acceder a la Raspberry por SSH. |
| Acceso al repositorio | Invitar su cuenta GitHub o distribuir el ZIP de clase. |

El repositorio es privado. Una cuenta GitHub, una cuenta Linux y la autorización Tailscale cumplen funciones distintas. Para invitar estudiantes, el propietario administra colaboradores del repositorio y los estudiantes aceptan la invitación.

## Verificar la herramienta común

En la Raspberry, como `ucu2026`:

```bash
getent passwd grupo1 grupo2 grupo3 grupo4
```

```bash
ls -l /usr/local/share/estacionamiento-ucu/mi_grupo.py /usr/local/share/estacionamiento-ucu/servidor_estacionamiento.py /usr/local/share/estacionamiento-ucu/requirements.txt
```

```bash
ls -l /usr/local/sbin/estacionamiento-grupo
```

```bash
sudo visudo -cf /etc/sudoers
```

```bash
sudo -l -U grupo1
```

Repetir la consulta de permisos para grupo2, grupo3 y grupo4. Debe existir el permiso limitado para `/usr/local/sbin/estacionamiento-grupo`. Las cuentas de estudiantes no necesitan sudo general.

Comprobar las dos plantillas:

```bash
systemctl cat estacionamiento@.service estacionamiento-tunel@.service
```

Las cuentas pueden existir y Tailscale funcionar aunque falten la herramienta común o el permiso de control. Si falta alguno, completar la preparación de [GitHub y primeros pasos](GITHUB_Y_PRIMEROS_PASOS.md) y [la guía técnica](../GUIA_TRABAJO_INDEPENDIENTE.md) con la copia actual del repositorio. La preparación correspondiente es `rpi/preparar_grupos_independientes.sh`.

El instalador general `rpi/instalar_estacionamiento_ucu.sh` copia de nuevo servidores y reinicia los cuatro grupos; queda como referencia de instalación general. Para esta clase se usa la preparación común y luego la gestión individual `mi_grupo.py`.

## Comprobar una cuenta sin cambiar su proyecto

Por ejemplo, para grupo1:

```bash
sudo -H -u grupo1 python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py comprobar
```

Esta comprobación requiere que el grupo ya haya instalado su proyecto. Antes de esa instalación, puede no haber API activa; no es una razón para reinstalar el sistema.

## Huella del acceso SSH

```bash
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

Comunicar la huella a los estudiantes para la primera conexión. Una alerta de cambio de clave requiere verificar el equipo antes de actualizar el registro de la PC.

## Preparar la app web para iPhone

Seguir la [guía de iPhone para el docente](GUIA_IPHONE_DOCENTE.md). Incluye la preparación en Windows, la publicación en la Raspberry, la activación para servidores existentes y el control de los cuatro grupos desde Safari.

## Recorrido y criterios de finalización

La primera práctica está en `EMPEZAR_AQUI.md`: conexión por cuenta propia, instalación o uso de una copia existente, comprobación LOCAL, comprobación HTTPS y seis plazas visibles en la app con datos del servidor.

Después se usa `docs/PRIMER_CAMBIO_Y_RESPALDO.md`. Las consultas frecuentes se resuelven en `docs/AYUDA_ESTUDIANTES.md`. Si interviene el docente, pedir grupo, paso, comando y error completo.

La documentación utiliza los comandos reales de la gestión del repositorio. Publicar estas guías en GitHub no ejecuta una nueva prueba sobre la Raspberry ni actualiza sus archivos automáticamente. La prueba de clase debe confirmar el recorrido completo en el equipo actual.
