"""Pruebas locales sin root, sin reiniciar servicios ni contactar Internet."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from zipfile import ZipFile

RAIZ = Path(__file__).resolve().parents[1]


def cargar(nombre, archivo):
    spec = importlib.util.spec_from_file_location(nombre, archivo)
    module = importlib.util.module_from_spec(spec)
    sys.modules[nombre] = module
    spec.loader.exec_module(module)
    return module


admin = cargar("pi2_admin", RAIZ / "rpi/estacionamiento_grupo_admin.py")
alumno = cargar("pi2_alumno", RAIZ / "rpi/mi_grupo.py")
servidor = cargar("pi2_servidor", RAIZ / "rpi/servidor_estacionamiento.py")


class Permisos(unittest.TestCase):
    def test_operaciones_solo_unidades_propias(self):
        for numero in range(1, 5):
            for accion in admin.ACCIONES - {"url"}:
                for orden in admin.ordenes(f"grupo{numero}", accion):
                    self.assertIn(orden[0], (admin.SYSTEMCTL, admin.JOURNALCTL))
                    for argumento in orden:
                        if argumento.startswith("estacionamiento"):
                            self.assertTrue(argumento.endswith(f"@{numero}.service"))

    def test_identidades_y_acciones_rechazadas(self):
        for usuario in ("", "root", "ucu2026", "grupo0", "grupo5",
                        "grupo1;id", "grupo12", "../grupo1"):
            with self.assertRaises(ValueError):
                admin.unidades(usuario)
        for accion in ("bash", "daemon-reload", "reiniciar grupo2", ""):
            with self.assertRaises(ValueError):
                admin.ordenes("grupo1", accion)

    def test_argumento_extra_rechazado(self):
        with patch.object(os, "geteuid", return_value=0, create=True):
            with patch.dict(os.environ, {"SUDO_USER": "grupo1"}):
                with self.assertRaises(ValueError):
                    admin.main(["detener", "estacionamiento@2"])

    def test_usuario_sin_root_rechazado(self):
        with patch.object(os, "geteuid", return_value=1001, create=True):
            with self.assertRaises(ValueError):
                admin.main(["estado"])

    def test_url_solo_ejecucion_actual(self):
        consultas = []
        invocacion = "1234567890abcdef1234567890abcdef"
        def ejecutar(orden, **kwargs):
            consultas.append(orden)
            texto = ""
            if "show" in orden:
                texto = invocacion + "\n"
            if orden[0] == admin.JOURNALCTL:
                texto = "https://actual-grupo-dos.trycloudflare.com"
            return subprocess.CompletedProcess(orden, 0, texto, "")
        self.assertEqual(admin.url_actual("grupo2", ejecutar),
                         "https://actual-grupo-dos.trycloudflare.com")
        self.assertIn("_SYSTEMD_INVOCATION_ID=" + invocacion, consultas[-1])
        self.assertIn("estacionamiento-tunel@2.service", consultas[-1])

    def test_tunel_inactivo_no_devuelve_url_vieja(self):
        def ejecutar(orden, **kwargs):
            return subprocess.CompletedProcess(orden, 3, "", "")
        with self.assertRaises(ValueError):
            admin.url_actual("grupo1", ejecutar)


class Proyecto(unittest.TestCase):
    def setUp(self):
        zona = RAIZ.parent / "test_temp"
        zona.mkdir(exist_ok=True)
        self.tmp = tempfile.TemporaryDirectory(dir=zona)
        self.cuenta = alumno.Cuenta("grupo1", Path(self.tmp.name) / "grupo1")
        self.cuenta.proyecto.mkdir(parents=True)
        (self.cuenta.proyecto / "servidor_estacionamiento.py").write_text("VERSION = 1\n")
        (self.cuenta.proyecto / "requirements.txt").write_text("")
        (self.cuenta.proyecto / ".venv").mkdir()
        (self.cuenta.proyecto / ".venv/secreto").write_text("no copiar")
        (self.cuenta.proyecto / "config.json").write_text('{"grupo": 1}')
        self.otro = Path(self.tmp.name) / "grupo2/PI2/estacionamiento/ajuste.txt"
        self.otro.parent.mkdir(parents=True)
        self.otro.write_text("conservar grupo2")

    def tearDown(self):
        self.tmp.cleanup()

    def test_respaldo_excluye_venv_y_conserva_configuracion(self):
        ruta = alumno.respaldar(self.cuenta)
        with ZipFile(ruta) as z:
            self.assertIn("config.json", z.namelist())
            self.assertFalse(any(".venv" in s for s in z.namelist()))
            self.assertEqual(json.loads(z.read(alumno.META))["grupo"], 1)
        self.assertEqual(alumno.validar_respaldo(self.cuenta, ruta), ruta.resolve())

    def test_instalacion_no_sobrescribe_proyecto_existente(self):
        antes = (self.cuenta.proyecto / "config.json").read_bytes()
        with self.assertRaises(ValueError):
            alumno.instalar(self.cuenta)
        self.assertEqual((self.cuenta.proyecto / "config.json").read_bytes(), antes)

    def test_rechaza_respaldo_de_otro_grupo(self):
        ruta = alumno.respaldar(self.cuenta)
        otro = alumno.Cuenta("grupo2", self.cuenta.home)
        with self.assertRaises(ValueError):
            alumno.validar_respaldo(otro, ruta)

    def test_rechaza_rutas_fuera_del_proyecto(self):
        self.cuenta.respaldos.mkdir(parents=True)
        ruta = self.cuenta.respaldos / "malicioso.zip"
        with ZipFile(ruta, "w") as z:
            z.writestr("../grupo2/ataque.txt", "x")
        with self.assertRaises(ValueError):
            alumno.validar_respaldo(self.cuenta, ruta)
        self.assertFalse((self.cuenta.home / "grupo2/ataque.txt").exists())

    def test_restauracion_conserva_anterior_y_otro_grupo(self):
        ruta = alumno.respaldar(self.cuenta)
        fuente = self.cuenta.proyecto / "servidor_estacionamiento.py"
        fuente.write_text("VERSION = 2\n")
        with patch.object(alumno, "dependencias"), patch.object(alumno, "controlar") as control:
            alumno.restaurar(self.cuenta, ruta.name)
        self.assertEqual(fuente.read_text(), "VERSION = 1\n")
        self.assertEqual(self.otro.read_text(), "conservar grupo2")
        anteriores = self.cuenta.home / "PI2/anteriores"
        self.assertTrue(any((p / "servidor_estacionamiento.py").read_text() == "VERSION = 2\n"
                            for p in anteriores.iterdir()))
        self.assertEqual([c.args[0] for c in control.call_args_list], ["detener", "iniciar"])

    def test_restauracion_fallida_recupera_codigo_anterior(self):
        ruta = alumno.respaldar(self.cuenta)
        fuente = self.cuenta.proyecto / "servidor_estacionamiento.py"
        fuente.write_text("VERSION = 2\n")
        with patch.object(alumno, "dependencias", side_effect=ValueError("sin red")):
            with patch.object(alumno, "controlar"):
                with self.assertRaises(ValueError):
                    alumno.restaurar(self.cuenta, ruta.name)
        self.assertEqual(fuente.read_text(), "VERSION = 2\n")
        self.assertTrue((self.cuenta.proyecto / ".venv/secreto").is_file())
        self.assertEqual(self.otro.read_text(), "conservar grupo2")

    def test_rechaza_codigo_invalido_antes_de_detener(self):
        ruta = alumno.respaldar(self.cuenta)
        malo = self.cuenta.respaldos / "sintaxis.zip"
        with ZipFile(ruta) as z, ZipFile(malo, "w") as salida:
            for nombre in z.namelist():
                salida.writestr(nombre, b"def(" if nombre.endswith(".py") else z.read(nombre))
        with patch.object(alumno, "controlar") as control:
            with self.assertRaises(SyntaxError):
                alumno.restaurar(self.cuenta, malo.name)
        control.assert_not_called()


class Datos(unittest.TestCase):
    def test_cuatro_estados_independientes(self):
        grupos = [servidor.Estacionamiento(i) for i in range(1, 5)]
        for i, grupo in enumerate(grupos):
            grupo.registrar(servidor.MASCARAS[i])
            alumno.validar_estado(grupo.estado(), i + 1)
        antes = [g.estado() for g in grupos]
        grupos[0].registrar(63)
        for i in (1, 2, 3):
            self.assertEqual(grupos[i].estado(), antes[i])
        with self.assertRaises(ValueError):
            alumno.validar_estado(grupos[0].estado(), 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
