#!/usr/bin/env bash
# DOCENTE: prepara infraestructura comun; conserva los proyectos existentes.
set -Eeuo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
if [ "$(id -un)" != ucu2026 ]; then
  echo 'Ejecutar como ucu2026: bash ~/rpi/preparar_grupos_independientes.sh'
  exit 1
fi
ORIGEN_PI2=$(cd -- "$(dirname -- "$0")" && pwd -P)
for archivo in servidor_estacionamiento.py requirements.txt mi_grupo.py \
 estacionamiento_grupo_admin.py estacionamiento@.service \
 estacionamiento-tunel@.service; do
  test -f "$ORIGEN_PI2/$archivo" || { echo "Falta $archivo"; exit 1; }
done
sudo -v
echo '=== Dependencias comunes ==='
sudo apt-get update
sudo apt-get install -y python3 python3-venv curl ca-certificates \
 openssh-server sudo nano
sudo systemctl enable --now ssh
if ! command -v tailscale >/dev/null 2>&1; then
  echo 'Completar primero Tailscale como indica la pagina 1 del PDF.'
  exit 1
fi
sudo systemctl enable --now tailscaled
if ! tailscale ip -4; then
  echo 'Falta autorizar la Raspberry: ejecutar sudo tailscale up y repetir.'
  exit 1
fi
if ! command -v cloudflared >/dev/null 2>&1; then
  sudo install -d -m 0755 /usr/share/keyrings
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
    | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
  sudo chmod 0644 /usr/share/keyrings/cloudflare-main.gpg
  echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' \
    | sudo tee /etc/apt/sources.list.d/cloudflared.list >/dev/null
  sudo apt-get update
  sudo apt-get install -y cloudflared
fi
if [ "$(command -v cloudflared)" != /usr/bin/cloudflared ]; then
  echo 'Esta plantilla requiere /usr/bin/cloudflared. Revisar la ruta antes de continuar.'
  exit 1
fi
echo '=== Cuentas y carpetas privadas ==='
for numero in 1 2 3 4; do
  cuenta="grupo$numero"
  if ! getent passwd "$cuenta" >/dev/null; then
    sudo useradd --create-home --user-group --shell /bin/bash "$cuenta"
    echo "Elegir la contrasena de $cuenta:"
    sudo passwd "$cuenta"
  fi
  if [ "$(getent passwd "$cuenta" | cut -d: -f6)" != "/home/$cuenta" ] ||
     [ "$(id -gn "$cuenta")" != "$cuenta" ]; then
    echo "Revisar home y grupo principal de $cuenta."
    exit 1
  fi
  for grupo_actual in $(id -nG "$cuenta"); do
    case "$grupo_actual" in
      sudo|wheel|admin|docker|lxd|incus-admin|adm|systemd-journal)
        echo "$cuenta pertenece a $grupo_actual. Revisar ese privilegio antes de continuar."
        exit 1 ;;
    esac
  done
  sudo chmod 0750 "/home/$cuenta"
  sudo install -d -o "$cuenta" -g "$cuenta" -m 0750 "/home/$cuenta/PI2"
done
echo '=== Revisar y registrar plantillas sin reiniciar ==='
# Si una plantilla ya fue personalizada, se detiene antes de cambiarla.
for plantilla in estacionamiento@.service estacionamiento-tunel@.service; do
  destino="/etc/systemd/system/$plantilla"
  if sudo test -f "$destino"; then
    # Comparar contenido semantico: el instalador anterior usa ExecStart en una linea.
    if ! sudo python3 - "$ORIGEN_PI2/$plantilla" "$destino" <<'PY'
import re, sys
def normalizar(path):
    with open(path, encoding="utf-8") as f:
        text = re.sub(r"\\\r?\n[ \t]*", " ", f.read())
    return [" ".join(line.split()) for line in text.splitlines()
            if line.strip() and not line.lstrip().startswith("#")]
raise SystemExit(0 if normalizar(sys.argv[1]) == normalizar(sys.argv[2]) else 1)
PY
    then
      echo "Plantilla distinta: $destino. Se conserva; el docente debe revisarla."
      exit 1
    fi
  else
    sudo install -o root -g root -m 0644 "$ORIGEN_PI2/$plantilla" "$destino"
  fi
done
sudo systemctl daemon-reload
echo '=== Material comun de solo lectura y control limitado ==='
BASE_PI2=/usr/local/share/estacionamiento-ucu
sudo install -d -o root -g root -m 0755 "$BASE_PI2"
for archivo in servidor_estacionamiento.py requirements.txt mi_grupo.py; do
  sudo install -o root -g root -m 0644 "$ORIGEN_PI2/$archivo" "$BASE_PI2/$archivo"
done
sudo install -o root -g root -m 0755 \
 "$ORIGEN_PI2/estacionamiento_grupo_admin.py" \
 /usr/local/sbin/estacionamiento-grupo
sudo python3 -I -m py_compile /usr/local/sbin/estacionamiento-grupo
TEMP_PI2=$(mktemp)
trap 'rm -f -- "$TEMP_PI2"' EXIT
for numero in 1 2 3 4; do
  printf 'grupo%s ALL=(root) NOPASSWD: /usr/local/sbin/estacionamiento-grupo\n' \
    "$numero" >> "$TEMP_PI2"
done
sudo visudo -cf "$TEMP_PI2"
sudo install -o root -g root -m 0440 "$TEMP_PI2" \
 /etc/sudoers.d/estacionamiento-grupos
sudo visudo -cf /etc/sudoers
echo '=== Preparacion terminada ==='
echo 'Se conservaron el codigo, .venv y servicios en ejecucion de cada grupo.'
echo 'Cada estudiante entra con su cuenta y ejecuta:'
echo 'python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py instalar'
echo 'Si ya tiene proyecto, usar estado y comprobar en lugar de instalar.'
echo 'El comando instalar activa solo los dos servicios del propio grupo.'
