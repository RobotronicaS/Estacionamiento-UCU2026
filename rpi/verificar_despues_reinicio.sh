#!/usr/bin/env bash
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
