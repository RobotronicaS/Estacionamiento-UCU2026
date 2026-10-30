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
