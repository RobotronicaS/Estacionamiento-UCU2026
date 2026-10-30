#!/usr/bin/env python3
"""Instalar, verificar y respaldar el proyecto de la propia cuenta Linux."""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime, timezone
import json
import os
from pathlib import Path, PurePosixPath
import py_compile
import re
import shutil
import stat
import subprocess
import sys
import tempfile
from urllib.error import HTTPError
from urllib.request import ProxyHandler, build_opener
from zipfile import ZipFile, ZIP_DEFLATED, BadZipFile

CONTROL = "/usr/local/sbin/estacionamiento-grupo"
FUENTE = Path(__file__).resolve().parent
OMITIR = {".venv", "__pycache__", ".git"}
META = "RESPALDO_PI2.json"


@dataclass(frozen=True)
class Cuenta:
    usuario: str
    home: Path

    def __post_init__(self):
        if re.fullmatch(r"grupo[1-4]", self.usuario) is None:
            raise ValueError("Usar una cuenta grupo1 a grupo4.")

    @property
    def numero(self):
        return int(self.usuario[-1])

    @property
    def proyecto(self):
        return self.home / "PI2" / "estacionamiento"

    @property
    def respaldos(self):
        return self.home / "PI2" / "respaldos"


def cuenta_actual():
    if os.name != "posix":
        raise ValueError("Ejecutar dentro de la Raspberry, en la sesion SSH del grupo.")
    import pwd
    p = pwd.getpwuid(os.getuid())
    cuenta = Cuenta(p.pw_name, Path(p.pw_dir))
    if cuenta.home != Path("/home") / cuenta.usuario:
        raise ValueError("El docente debe revisar el directorio personal de la cuenta.")
    return cuenta


def controlar(accion, capturar=False):
    r = subprocess.run(["sudo", "-n", CONTROL, accion], text=True,
                       capture_output=capturar, check=False)
    if r.returncode:
        mensaje = (r.stderr or r.stdout or "").strip() if capturar else ""
        raise ValueError(mensaje or
                         "El control no aprobo. Revisar estado/mensajes; "
                         "si falta el permiso, avisar al docente.")
    return r.stdout.strip() if capturar else ""


def dependencias(proyecto):
    entorno = proyecto / ".venv"
    subprocess.run([sys.executable, "-m", "venv", str(entorno)], check=True)
    python = entorno / "bin" / "python"
    subprocess.run([str(python), "-m", "pip", "install", "-r",
                    str(proyecto / "requirements.txt")], check=True)
    py_compile.compile(str(proyecto / "servidor_estacionamiento.py"), doraise=True)


def instalar(cuenta):
    proyecto = cuenta.proyecto
    if proyecto.exists() and any(proyecto.iterdir()):
        raise ValueError("La carpeta ya tiene trabajo. Se conserva sin cambios. "
                         "Usar estado y comprobar; instalar se reserva para una carpeta nueva.")
    for nombre in ("servidor_estacionamiento.py", "requirements.txt"):
        if not (FUENTE / nombre).is_file():
            raise ValueError("Falta el archivo de referencia: " + nombre)
    proyecto.mkdir(parents=True, mode=0o750, exist_ok=True)
    (cuenta.home / "PI2").chmod(0o750)
    for nombre in ("servidor_estacionamiento.py", "requirements.txt"):
        shutil.copy2(FUENTE / nombre, proyecto / nombre)
    dependencias(proyecto)
    controlar("activar")
    print(f"Instalacion de {cuenta.usuario} lista. Puerto {5000 + cuenta.numero}.")
    print("Ejecutar comprobar; despues obtener url y conectar la APK.")


def validar_estado(d, grupo):
    if d.get("grupo") != grupo or d.get("simulado") is not True:
        raise ValueError("La respuesta no corresponde al simulador del propio grupo.")
    plazas = d.get("plazas", [])
    if len(plazas) != 6 or {p["id"] for p in plazas} != {f"E{i:03d}" for i in range(1, 7)}:
        raise ValueError("Se esperaban exactamente E001 a E006.")
    if any(p["estado"] not in ("libre", "ocupado") for p in plazas):
        raise ValueError("Hay plazas sin una lectura vigente.")
    fecha = datetime.fromisoformat(d["ultima_lectura"].replace("Z", "+00:00"))
    edad = (datetime.now(timezone.utc) - fecha).total_seconds()
    if not -5 <= edad <= 20:
        raise ValueError("La lectura tiene mas de 20 s o el reloj necesita revision.")


def comprobar(cuenta, publica=False):
    base = (controlar("url", capturar=True) if publica else
            f"http://127.0.0.1:{5000 + cuenta.numero}")
    cliente = build_opener(ProxyHandler({}))
    with cliente.open(f"{base}/api/estado?grupo={cuenta.numero}", timeout=10) as r:
        d = json.load(r)
        if r.headers.get("Cache-Control") != "no-store":
            raise ValueError("Falta Cache-Control: no-store.")
    validar_estado(d, cuenta.numero)
    with cliente.open(f"{base}/api/historial?grupo={cuenta.numero}&limite=3",
                      timeout=10) as r:
        eventos = json.load(r)["eventos"]
        if not isinstance(eventos, list) or not 0 < len(eventos) <= 3:
            raise ValueError("El historial no devolvio de 1 a 3 eventos.")
    equivocado = cuenta.numero % 4 + 1
    try:
        with cliente.open(f"{base}/api/estado?grupo={equivocado}", timeout=10):
            pass
    except HTTPError as error:
        if error.code != 404:
            raise
    else:
        raise ValueError("El servidor acepto una consulta dirigida a otro grupo.")
    print(f"OK {cuenta.usuario}: seis plazas simuladas, lectura vigente, "
          f"historial y rechazo de otro grupo. {'HTTPS' if publica else 'LOCAL'}")


def marca():
    return datetime.now().strftime("%Y%m%d_%H%M%S_%f")


def respaldar(cuenta):
    if not (cuenta.proyecto / "servidor_estacionamiento.py").is_file():
        raise ValueError("No hay proyecto instalado para respaldar.")
    cuenta.respaldos.mkdir(parents=True, mode=0o750, exist_ok=True)
    destino = cuenta.respaldos / f"{cuenta.usuario}_{marca()}.zip"
    archivos = 0
    with ZipFile(destino, "x", compression=ZIP_DEFLATED) as z:
        for raiz, directorios, nombres in os.walk(cuenta.proyecto, followlinks=False):
            ruta = Path(raiz)
            directorios[:] = [d for d in directorios
                              if d not in OMITIR and not (ruta / d).is_symlink()]
            for nombre in sorted(nombres):
                archivo = ruta / nombre
                if archivo.is_symlink() or nombre == META:
                    continue
                z.write(archivo, archivo.relative_to(cuenta.proyecto).as_posix())
                archivos += 1
        z.writestr(META, json.dumps({
            "formato": 1, "grupo": cuenta.numero, "usuario": cuenta.usuario,
            "fecha": datetime.now(timezone.utc).isoformat(),
            "alcance": "Codigo y archivos del proyecto. Sin .venv ni historial en memoria.",
            "archivos": archivos,
        }, ensure_ascii=False, indent=2))
    destino.chmod(0o600)
    print("Respaldo:", destino)
    return destino


def validar_respaldo(cuenta, archivo):
    archivo = archivo.resolve(strict=True)
    if not archivo.is_relative_to(cuenta.respaldos.resolve()):
        raise ValueError("Elegir un ZIP dentro de la carpeta de respaldos propia.")
    with ZipFile(archivo) as z:
        miembros = z.infolist()
        if sum(i.file_size for i in miembros) > 100 * 1024 * 1024:
            raise ValueError("El respaldo supera 100 MiB descomprimidos; revisar manualmente.")
        for item in miembros:
            p = PurePosixPath(item.filename)
            if (p.is_absolute() or ".." in p.parts or "\\" in item.filename or
                    ":" in item.filename or not p.parts or
                    any(parte in OMITIR for parte in p.parts) or
                    stat.S_ISLNK(item.external_attr >> 16)):
                raise ValueError("Ruta no admitida dentro del respaldo.")
        if len({i.filename for i in miembros}) != len(miembros):
            raise ValueError("El respaldo contiene nombres duplicados.")
        meta = json.loads(z.read(META))
        if meta.get("grupo") != cuenta.numero or meta.get("usuario") != cuenta.usuario:
            raise ValueError("El respaldo pertenece a otro grupo.")
        for obligatorio in ("servidor_estacionamiento.py", "requirements.txt"):
            if obligatorio not in z.namelist():
                raise ValueError("Falta un archivo obligatorio en el respaldo.")
    return archivo


def restaurar(cuenta, nombre):
    archivo = validar_respaldo(cuenta, cuenta.respaldos / nombre)
    # El respaldo elegido se valida antes de detener el servicio o tocar el proyecto.
    with ZipFile(archivo) as z:
        contenido = z.read("servidor_estacionamiento.py")
        compile(contenido, "servidor_estacionamiento.py", "exec")
    anterior = None
    if cuenta.proyecto.exists():
        respaldar(cuenta)
    zona = cuenta.home / "PI2"
    zona.mkdir(parents=True, exist_ok=True)
    temporal = Path(tempfile.mkdtemp(prefix="restauracion-", dir=zona))
    with ZipFile(archivo) as z:
        for item in z.infolist():
            if item.filename != META:
                z.extract(item, temporal)
    controlar("detener")
    anteriores = zona / "anteriores"
    anteriores.mkdir(mode=0o750, exist_ok=True)
    reemplazado = False
    try:
        if cuenta.proyecto.exists():
            anterior = anteriores / ("estacionamiento_" + marca())
            cuenta.proyecto.rename(anterior)
        temporal.rename(cuenta.proyecto)
        reemplazado = True
        dependencias(cuenta.proyecto)
        controlar("iniciar")
    except Exception:
        if reemplazado and cuenta.proyecto.exists():
            fallida = anteriores / ("restauracion_fallida_" + marca())
            cuenta.proyecto.rename(fallida)
            print("Restauracion fallida conservada en:", fallida, file=sys.stderr)
        if anterior is not None and anterior.exists() and not cuenta.proyecto.exists():
            anterior.rename(cuenta.proyecto)
        if cuenta.proyecto.exists():
            try:
                controlar("iniciar")
            except Exception:
                print("Aviso: revisar el arranque del proyecto anterior.", file=sys.stderr)
        raise
    print("Restaurado:", archivo.name)
    if anterior is not None:
        print("Carpeta anterior conservada en:", anterior)
    print("El entorno .venv se recreo. Comprobar la API y consultar la URL nueva.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    comandos = parser.add_subparsers(dest="accion", required=True)
    for accion in ("instalar", "estado", "iniciar", "detener", "reiniciar",
                   "mensajes", "url", "respaldar", "listar-respaldos",
                   "preparar-entorno"):
        comandos.add_parser(accion)
    prueba = comandos.add_parser("comprobar")
    prueba.add_argument("--publica", action="store_true")
    recuperacion = comandos.add_parser("restaurar")
    recuperacion.add_argument("nombre", help="Nombre exacto del ZIP propio (sin carpetas).")
    opciones = parser.parse_args()
    cuenta = cuenta_actual()
    if opciones.accion == "instalar":
        instalar(cuenta)
    elif opciones.accion == "preparar-entorno":
        if not (cuenta.proyecto / "servidor_estacionamiento.py").is_file():
            raise ValueError("Primero instalar el proyecto.")
        dependencias(cuenta.proyecto)
        controlar("activar")
    elif opciones.accion == "comprobar":
        comprobar(cuenta, opciones.publica)
    elif opciones.accion == "respaldar":
        respaldar(cuenta)
    elif opciones.accion == "listar-respaldos":
        for archivo in sorted(cuenta.respaldos.glob("*.zip")):
            print(archivo.name)
    elif opciones.accion == "restaurar":
        if Path(opciones.nombre).name != opciones.nombre:
            raise ValueError("Indicar solamente el nombre del ZIP listado.")
        restaurar(cuenta, opciones.nombre)
    else:
        controlar(opciones.accion)


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, KeyError, SyntaxError, BadZipFile, subprocess.CalledProcessError,
            py_compile.PyCompileError) as error:
        print("ERROR:", error, file=sys.stderr)
        raise SystemExit(1)
