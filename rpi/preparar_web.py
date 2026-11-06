"""Preparar la app web a partir de la interfaz compartida con Android."""
from __future__ import annotations

import argparse
from pathlib import Path


RPI = Path(__file__).resolve().parent
ANDROID = RPI.parent / "android" / "fuente"
DESTINO = RPI / "web_dist"
RECURSOS_ANDROID = ("app.js", "core.js", "ucu-map.js", "style.css", "safe-layout.css")
RECURSOS_WEB = ("cliente-web.js", "iphone.css", "manifest.webmanifest")


def preparar(destino=DESTINO):
    assets = ANDROID / "assets"
    pagina = (assets / "index.html").read_text(encoding="utf-8")
    arranque_android = '  <script defer src="app.js"></script>'
    if pagina.count(arranque_android) != 1:
        raise ValueError("Revisar el punto de entrada de la interfaz compartida.")
    pagina = pagina.replace(arranque_android, """  <link rel="manifest" href="manifest.webmanifest">
  <link rel="apple-touch-icon" href="icono.png">
  <link rel="stylesheet" href="iphone.css">
  <script defer src="cliente-web.js"></script>""")
    recursos = {nombre: (assets / nombre).read_bytes() for nombre in RECURSOS_ANDROID}
    recursos.update({nombre: (RPI / "web" / nombre).read_bytes() for nombre in RECURSOS_WEB})
    recursos["icono.png"] = (ANDROID / "res" / "drawable-xxxhdpi" / "ic_launcher.png").read_bytes()
    destino.mkdir(parents=True, exist_ok=True)
    for nombre, datos in recursos.items():
        (destino / nombre).write_bytes(datos)
    (destino / "index.html").write_bytes(pagina.encode("utf-8"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--destino", type=Path, default=DESTINO)
    destino = parser.parse_args().destino
    preparar(destino)
    print(f"Interfaz web preparada en {destino}")
