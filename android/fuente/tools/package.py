"""Build a compact source package without temporary outputs or old build products."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import shutil

root = Path(__file__).resolve().parents[1]
output = root.parent / 'output'
output.mkdir(exist_ok=True)
apk_name = 'Estaciona-Salto-UCU-0.1.3.apk'
apk = output / apk_name
apk_source = root / 'dist' / apk_name
if not apk_source.is_file():
    apk_source = root.parent / apk_name
shutil.copy2(apk_source, apk)
archive = output / 'Estaciona-Salto-UCU-0.1.3-codigo.zip'
include_dirs = ['src', 'assets', 'res', 'api', 'tests', 'tools']
include_files = ['AndroidManifest.xml', 'build.ps1', 'README.md', 'COMO_PROGRAMAR.md', 'VERIFICACION.md', '.gitignore']
with ZipFile(archive, 'w', ZIP_DEFLATED) as z:
    for name in include_files:
        path = root / name
        z.write(path, 'Estaciona-Salto/' + name)
    for name in include_dirs:
        for path in sorted((root / name).rglob('*')):
            if path.is_file() and '__pycache__' not in path.parts:
                z.write(path, 'Estaciona-Salto/' + path.relative_to(root).as_posix())
    z.write(apk, 'Estaciona-Salto/' + apk_name)
for path in [apk, archive]:
    print(path.name, path.stat().st_size, 'bytes', 'SHA256', hashlib.sha256(path.read_bytes()).hexdigest())
with ZipFile(apk) as z:
    for name in ['AndroidManifest.xml', 'classes.dex', 'assets/index.html', 'assets/app.js', 'assets/core.js', 'assets/ucu-map.js', 'assets/style.css', 'assets/safe-layout.css']:
        if name not in z.namelist():
            raise SystemExit('Missing APK file: ' + name)
    for name in ['index.html','app.js','core.js','ucu-map.js','style.css','safe-layout.css']:
        if z.read('assets/' + name) != (root / 'assets' / name).read_bytes():
            raise SystemExit('APK asset differs from source: ' + name)
print('Contenido de la APK coincide con las fuentes. Paquete verificado.')
