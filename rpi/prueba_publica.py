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
