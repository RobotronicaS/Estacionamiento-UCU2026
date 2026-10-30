#!/usr/bin/env bash
set -Eeuo pipefail
if [ "$(id -un)" != ucu2026 ]; then
  echo 'Ejecutar como ucu2026, sin sudo delante del script.'
  exit 1
fi
umask 077
TRABAJO="$HOME/PI2_instalacion"
mkdir -p "$TRABAJO"
MARCA=$(date +%Y%m%d_%H%M%S)
REGISTRO="$TRABAJO/instalacion_${MARCA}.log"
exec > >(tee -a "$REGISTRO") 2>&1
trap 'echo "ERROR en linea $LINENO. Registro: $REGISTRO"' ERR
sudo -v </dev/tty

echo '=== 1. Preparar sistema y SSH ==='
hostnamectl
sudo apt-get update
sudo apt-get install -y curl ca-certificates openssh-server python3-venv
sudo systemctl enable --now ssh
systemctl is-active ssh
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub

echo '=== 2. Instalar Tailscale ==='
if ! command -v tailscale >/dev/null 2>&1; then
  curl -fsSL https://tailscale.com/install.sh | sh
fi
sudo systemctl enable --now tailscaled
tailscale version

echo '=== 3. Instalar Cloudflare ==='
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
cloudflared --version
CF_BIN=$(command -v cloudflared)

echo '=== 4. Crear cuentas de los grupos ==='
for numero in 1 2 3 4; do
  cuenta="grupo${numero}"
  if ! getent passwd "$cuenta" >/dev/null; then
    sudo useradd --create-home --user-group --shell /bin/bash "$cuenta"
    echo "Elegir una contrasena para $cuenta."
    sudo passwd "$cuenta" </dev/tty
  fi
  if [ "$(getent passwd "$cuenta" | cut -d: -f6)" != "/home/$cuenta" ]; then
    echo "Revisar el directorio personal de $cuenta antes de continuar."
    exit 1
  fi
done
getent passwd grupo1 grupo2 grupo3 grupo4

echo '=== 5. Crear servidor de seis plazas ==='
cat > "$TRABAJO/servidor_estacionamiento.py" <<'PY_SERVIDOR'
"""API de prueba del estacionamiento UCU: seis plazas simuladas."""
from __future__ import annotations

import argparse
from collections import deque
from datetime import datetime, timezone
from threading import Event, Lock, Thread

VIGENCIA = 20
INTERVALO = 10
MASCARAS = (0x15, 0x2D, 0x0C, 0x3F, 0x00, 0x19)
AVISO = "Datos simulados en Python. No representan disponibilidad real."


class Estacionamiento:
    def __init__(self, grupo, reloj=None):
        if type(grupo) is not int or grupo not in range(1, 5):
            raise ValueError("El grupo debe ser un entero del 1 al 4.")
        self.grupo = grupo
        self.reloj = reloj or (lambda: datetime.now(timezone.utc))
        self.lock = Lock()
        self.fecha = None
        self.estados = ["desconocido"] * 6
        self.eventos = deque(maxlen=500)
        self.secuencia = 0

    def registrar(self, mascara):
        if type(mascara) is not int or not 0 <= mascara <= 63:
            raise ValueError("La mascara debe ser un entero entre 0 y 63.")
        fecha = self.reloj()
        marca = fecha.isoformat().replace("+00:00", "Z")
        with self.lock:
            for i in range(6):
                estado = "ocupado" if mascara & (1 << i) else "libre"
                if estado != self.estados[i]:
                    self.secuencia += 1
                    self.eventos.appendleft({
                        "id": str(self.secuencia), "plaza_id": f"E{i+1:03d}",
                        "estado": estado, "fecha": marca,
                    })
                self.estados[i] = estado
            self.fecha = fecha

    def estado(self):
        with self.lock:
            if self.fecha is None:
                return None
            fecha = self.fecha.isoformat().replace("+00:00", "Z")
            edad = (self.reloj() - self.fecha).total_seconds()
            vigente = -5 <= edad <= VIGENCIA
            plazas = [{
                "id": f"E{i+1:03d}", "nombre": f"Plaza P{i+1}",
                "zona": "UCU Salto - estacionamiento del fondo",
                "lat": None, "lon": None,
                "estado": estado if vigente else "desconocido",
                "actualizado_en": fecha,
            } for i, estado in enumerate(self.estados)]
        return {
            "version": 1, "grupo": self.grupo, "fuente": "simulador-python",
            "simulado": True, "ultima_lectura": fecha,
            "vigencia_segundos": VIGENCIA, "aviso": AVISO, "plazas": plazas,
        }

    def historial(self, limite):
        with self.lock:
            return {"eventos": [dict(e) for e in list(self.eventos)[:limite]]}


def crear_app(datos):
    from flask import Flask, jsonify, request
    from werkzeug.exceptions import HTTPException
    app = Flask(__name__)
    app.json.ensure_ascii = False
    app.config["MAX_CONTENT_LENGTH"] = 16384

    def entero(nombre, defecto, minimo, maximo):
        valores = request.args.getlist(nombre)
        if not valores:
            return defecto
        if len(valores) != 1 or not valores[0].isascii() or not valores[0].isdigit():
            raise ValueError(f"{nombre} debe ser un entero entre {minimo} y {maximo}.")
        valor = int(valores[0])
        if not minimo <= valor <= maximo:
            raise ValueError(f"{nombre} debe estar entre {minimo} y {maximo}.")
        return valor

    def comprobar_grupo():
        if entero("grupo", datos.grupo, 1, 4) != datos.grupo:
            return jsonify(error="Este proceso solo atiende al grupo asignado.",
                           grupo=datos.grupo), 404
        return None

    @app.errorhandler(ValueError)
    def parametro_invalido(error):
        return jsonify(error=str(error)), 400

    @app.errorhandler(HTTPException)
    def error_http(error):
        return jsonify(error=error.name), error.code

    @app.after_request
    def sin_cache(respuesta):
        respuesta.headers["Cache-Control"] = "no-store"
        return respuesta

    @app.get("/")
    def inicio():
        return jsonify(proyecto="Estacionamiento UCU Salto", grupo=datos.grupo,
                       aviso=AVISO, simulado=True, plazas=6,
                       rutas=[f"/api/estado?grupo={datos.grupo}",
                              f"/api/historial?grupo={datos.grupo}&limite=60"])

    @app.get("/api/estado")
    def estado():
        error = comprobar_grupo()
        if error is not None:
            return error
        resultado = datos.estado()
        if resultado is None:
            return jsonify(error="Todavia no hay una lectura."), 503
        return jsonify(resultado)

    @app.get("/api/historial")
    def historial():
        error = comprobar_grupo()
        if error is not None:
            return error
        limite = entero("limite", 60, 1, 500)
        return jsonify(datos.historial(limite))

    return app


def simular(datos, detener):
    ciclo = 1
    while not detener.wait(INTERVALO):
        datos.registrar(MASCARAS[(datos.grupo - 1 + ciclo) % len(MASCARAS)])
        ciclo += 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--grupo", type=int, required=True, choices=range(1, 5))
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--puerto", type=int)
    opciones = parser.parse_args()
    puerto = opciones.puerto if opciones.puerto is not None else 5000 + opciones.grupo
    if not 1024 <= puerto <= 65535:
        parser.error("El puerto debe estar entre 1024 y 65535.")
    from waitress import serve
    datos = Estacionamiento(opciones.grupo)
    datos.registrar(MASCARAS[opciones.grupo - 1])
    app = crear_app(datos)
    detener = Event()
    hilo = Thread(target=simular, args=(datos, detener), daemon=True)
    hilo.start()
    print(f"Servidor del grupo {opciones.grupo}", flush=True)
    print(AVISO, flush=True)
    print(f"Escuchando en {opciones.host}:{puerto}", flush=True)
    try:
        serve(app, host=opciones.host, port=puerto, threads=4)
    except KeyboardInterrupt:
        pass
    finally:
        detener.set()
        hilo.join(timeout=1)


if __name__ == "__main__":
    main()
PY_SERVIDOR
printf 'Flask>=3.1,<4\nwaitress>=3,<4\n' > "$TRABAJO/requirements.txt"
python3 -m py_compile "$TRABAJO/servidor_estacionamiento.py"

echo '=== 6. Preparar entorno de cada grupo ==='
for numero in 1 2 3 4; do
  cuenta="grupo${numero}"
  carpeta="/home/$cuenta/PI2/estacionamiento"
  sudo install -d -o "$cuenta" -g "$cuenta" -m 0750 \
    "/home/$cuenta/PI2" "$carpeta"
  if sudo test -f "$carpeta/servidor_estacionamiento.py"; then
    sudo cp -a "$carpeta/servidor_estacionamiento.py" \
      "$carpeta/servidor_estacionamiento.py.bak.$MARCA"
  fi
  sudo install -o "$cuenta" -g "$cuenta" -m 0640 \
    "$TRABAJO/servidor_estacionamiento.py" "$carpeta/servidor_estacionamiento.py"
  sudo install -o "$cuenta" -g "$cuenta" -m 0640 \
    "$TRABAJO/requirements.txt" "$carpeta/requirements.txt"
  sudo -H -u "$cuenta" bash -c '
    set -e
    cd "$1"
    python3 -m venv .venv
    .venv/bin/python -m pip install -r requirements.txt
  ' bash "$carpeta"
done

echo '=== 7. Configurar arranque automatico ==='
if sudo test -f /etc/systemd/system/estacionamiento@.service; then
  sudo cp -a /etc/systemd/system/estacionamiento@.service \
    "/etc/systemd/system/estacionamiento@.service.bak.$MARCA"
fi
sudo tee /etc/systemd/system/estacionamiento@.service >/dev/null <<'SERVICIO_API'
[Unit]
Description=Estacionamiento UCU - grupo %i
Wants=network-online.target
After=network-online.target
StartLimitIntervalSec=0

[Service]
Type=simple
User=grupo%i
Group=grupo%i
WorkingDirectory=/home/grupo%i/PI2/estacionamiento
ExecStart=/home/grupo%i/PI2/estacionamiento/.venv/bin/python /home/grupo%i/PI2/estacionamiento/servidor_estacionamiento.py --grupo %i --host 0.0.0.0
Restart=on-failure
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
SERVICIO_API
sudo systemctl daemon-reload
for numero in 1 2 3 4; do
  sudo systemctl enable "estacionamiento@$numero"
  sudo systemctl restart "estacionamiento@$numero"
done
echo '=== 8. Verificar las cuatro API ==='
python3 - <<'PY_PRUEBA'
import json
import time
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.request import ProxyHandler, build_opener
cliente = build_opener(ProxyHandler({}))
for grupo in range(1, 5):
    base = f"http://127.0.0.1:{5000 + grupo}"
    for intento in range(20):
        try:
            with cliente.open(f"{base}/api/estado?grupo={grupo}", timeout=3) as r:
                datos = json.load(r)
                assert r.headers.get("Cache-Control") == "no-store"
            break
        except (URLError, OSError):
            if intento == 19:
                raise
            time.sleep(1)
    assert datos["grupo"] == grupo and datos["simulado"] is True
    assert len(datos["plazas"]) == 6
    assert {p["id"] for p in datos["plazas"]} == {f"E{i:03d}" for i in range(1, 7)}
    assert all(p["estado"] in ("libre", "ocupado") for p in datos["plazas"])
    fecha = datetime.fromisoformat(datos["ultima_lectura"].replace("Z", "+00:00"))
    assert -5 <= (datetime.now(timezone.utc) - fecha).total_seconds() <= 20
    with cliente.open(f"{base}/api/historial?grupo={grupo}&limite=3", timeout=3) as r:
        eventos = json.load(r)["eventos"]
        assert isinstance(eventos, list) and 0 < len(eventos) <= 3
    try:
        cliente.open(f"{base}/api/estado?grupo={grupo % 4 + 1}", timeout=3)
        raise AssertionError("La API acepto otro grupo")
    except HTTPError as error:
        assert error.code == 404
    print(f"OK grupo {grupo}: seis plazas, datos simulados, fecha vigente, historial y grupo aislado.")
PY_PRUEBA
for numero in 1 2 3 4; do
  echo "Estado del grupo $numero:"
  systemctl is-active "estacionamiento@$numero"
  systemctl is-enabled "estacionamiento@$numero"
done

echo '=== 9. Autorizar Tailscale ==='
echo 'Abrir la URL y autorizar con la cuenta del curso; espera hasta 3 minutos.'
if sudo timeout 180s tailscale up </dev/tty >/dev/tty 2>&1; then
  tailscale ip -4 | tee "$TRABAJO/ip_tailscale.txt"
else
  echo 'PENDIENTE Tailscale: ejecutar sudo tailscale up y autorizar al terminar.'
fi

echo '=== 10. Crear tuneles publicos temporales ==='
sudo tee /etc/systemd/system/estacionamiento-tunel@.service >/dev/null <<SERVICIO_TUNEL
[Unit]
Description=Tunel publico temporal UCU - grupo %i
Wants=network-online.target
After=network-online.target estacionamiento@%i.service
Requires=estacionamiento@%i.service
StartLimitIntervalSec=0

[Service]
Type=simple
User=grupo%i
Group=grupo%i
Environment=HOME=/home/grupo%i
WorkingDirectory=/home/grupo%i/PI2/estacionamiento
ExecStart=$CF_BIN tunnel --no-autoupdate --protocol http2 --url http://127.0.0.1:500%i
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICIO_TUNEL
sudo systemctl daemon-reload
INICIO_TUNELES=$(date --iso-8601=seconds)
for numero in 1 2 3 4; do
  sudo systemctl enable "estacionamiento-tunel@$numero"
  sudo systemctl restart "estacionamiento-tunel@$numero"
done
echo '=== 11. Obtener direcciones para la APK ==='
: > "$TRABAJO/direcciones_apk.txt"
for numero in 1 2 3 4; do
  url=''
  for intento in $(seq 1 30); do
    url=$(sudo journalctl -u "estacionamiento-tunel@$numero" \
      --since "$INICIO_TUNELES" -n 100 --no-pager -o cat \
      | grep -Eo 'https://[-a-z0-9]+\.trycloudflare\.com' | tail -n 1 || true)
    [ -n "$url" ] && break
    sleep 2
  done
  if [ -z "$url" ]; then
    echo "PENDIENTE grupo $numero: no se obtuvo la direccion publica."
    sudo journalctl -u "estacionamiento-tunel@$numero" -n 12 --no-pager
    continue
  fi
  echo "Equipo $numero: $url" | tee -a "$TRABAJO/direcciones_apk.txt"
  if curl -fsS --connect-timeout 5 --max-time 20 --retry 2 --retry-all-errors \
    "$url/api/estado?grupo=$numero" > "$TRABAJO/estado_publico_grupo${numero}.json"; then
    if python3 - "$numero" "$TRABAJO/estado_publico_grupo${numero}.json" <<'PY_PUBLICO'
import json, sys
from datetime import datetime, timezone
with open(sys.argv[2], encoding="utf-8") as archivo:
    d = json.load(archivo)
g = int(sys.argv[1])
assert d["grupo"] == g and d["simulado"] is True
assert len(d["plazas"]) == 6
assert {p["id"] for p in d["plazas"]} == {f"E{i:03d}" for i in range(1, 7)}
assert all(p["estado"] in ("libre", "ocupado") for p in d["plazas"])
fecha = datetime.fromisoformat(d["ultima_lectura"].replace("Z", "+00:00"))
assert -5 <= (datetime.now(timezone.utc) - fecha).total_seconds() <= 20
print("OK HTTPS: grupo correcto, seis plazas y fecha vigente.")
PY_PUBLICO
    then
      :
    else
      echo "PENDIENTE grupo $numero: revisar respuesta HTTPS."
    fi
  else
    echo "PENDIENTE grupo $numero: la URL todavia no responde."
  fi
done
echo '=== RESULTADO ==='
echo 'Las cuatro API locales pasaron las comprobaciones. Revisar los PENDIENTE.'
cat "$TRABAJO/direcciones_apk.txt"
echo "Registro completo: $REGISTRO"
echo 'APK: Ajustes, desactivar demostracion, URL base, Equipo y Guardar y conectar.'
echo 'Datos SIMULADOS; historial en memoria; URL cambian al reiniciar los tuneles.'
echo 'Dominio fijo y adquisicion real: pendientes.'
