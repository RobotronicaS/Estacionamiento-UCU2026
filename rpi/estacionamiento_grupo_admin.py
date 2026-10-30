#!/usr/bin/python3 -I
"""Control limitado de los dos servicios del usuario que invoca sudo."""
import os
import re
import subprocess
import sys

ACCIONES = {"activar", "iniciar", "detener", "reiniciar", "estado", "mensajes", "url"}
SYSTEMCTL = "/usr/bin/systemctl"
JOURNALCTL = "/usr/bin/journalctl"


def unidades(usuario):
    if re.fullmatch(r"grupo[1-4]", usuario or "") is None:
        raise ValueError("Solo se permite una cuenta grupo1, grupo2, grupo3 o grupo4.")
    numero = usuario[-1]
    return (f"estacionamiento@{numero}.service",
            f"estacionamiento-tunel@{numero}.service")


def ordenes(usuario, accion):
    api, tunel = unidades(usuario)
    if accion not in ACCIONES:
        raise ValueError("Accion no permitida.")
    prefijo = [SYSTEMCTL, "--no-pager"]
    if accion == "activar":
        return [prefijo + ["enable", api, tunel],
                prefijo + ["start", api], prefijo + ["start", tunel]]
    if accion == "iniciar":
        return [prefijo + ["start", api], prefijo + ["start", tunel]]
    if accion == "detener":
        return [prefijo + ["stop", tunel, api]]
    if accion == "reiniciar":
        return [prefijo + ["stop", tunel], prefijo + ["restart", api],
                prefijo + ["start", tunel]]
    if accion == "estado":
        return [prefijo + ["--full", "status", api, tunel]]
    if accion == "mensajes":
        return [[JOURNALCTL, "-b", "--no-pager", "-n", "60",
                 "-o", "cat", "-u", api, "-u", tunel]]
    return []


def url_actual(usuario, ejecutar=subprocess.run):
    _, tunel = unidades(usuario)
    activo = ejecutar([SYSTEMCTL, "is-active", "--quiet", tunel], check=False)
    if activo.returncode:
        raise ValueError("El tunel propio esta detenido. Iniciarlo primero.")
    consulta = ejecutar([SYSTEMCTL, "show", "--property=InvocationID",
                         "--value", tunel], capture_output=True, text=True, check=True)
    invocacion = consulta.stdout.strip()
    if re.fullmatch(r"[a-fA-F0-9]{32}", invocacion) is None or set(invocacion) == {"0"}:
        raise ValueError("No se identifico la ejecucion actual del tunel.")
    registro = ejecutar(
        [JOURNALCTL, "-b", "--no-pager", "-o", "cat", "-u", tunel,
         "_SYSTEMD_INVOCATION_ID=" + invocacion],
        capture_output=True, text=True, check=True)
    urls = re.findall(r"https://[-a-z0-9]+\.trycloudflare\.com\b", registro.stdout)
    if not urls:
        raise ValueError("La URL nueva aun no aparece; esperar unos segundos y repetir.")
    return urls[-1]


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if not hasattr(os, "geteuid") or os.geteuid() != 0:
        raise ValueError("Este control debe invocarse mediante sudo autorizado.")
    usuario = os.environ.get("SUDO_USER", "")
    unidades(usuario)
    if len(argv) != 1 or argv[0] not in ACCIONES:
        raise ValueError("Indicar una sola accion valida; el grupo se deduce de la cuenta.")
    # Las rutas, unidades y argumentos son fijos. No se invoca un shell.
    os.environ.clear()
    os.environ.update(PATH="/usr/sbin:/usr/bin:/sbin:/bin",
                      LANG="C.UTF-8", SYSTEMD_PAGER="cat", SYSTEMD_COLORS="0")
    accion = argv[0]
    if accion == "url":
        print(url_actual(usuario))
        return 0
    resultado = 0
    for orden in ordenes(usuario, accion):
        r = subprocess.run(orden, check=False)
        if r.returncode:
            if accion == "estado":
                resultado = r.returncode
            else:
                return r.returncode
    return resultado


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print("ERROR:", error, file=sys.stderr)
        raise SystemExit(1)
