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
