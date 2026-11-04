# Segunda práctica: modificar su servidor y guardar el trabajo

[Inicio](../README.md) · [Primera práctica](../EMPEZAR_AQUI.md) · [Ayuda](AYUDA_ESTUDIANTES.md)

Empezar cuando la comprobación LOCAL y HTTPS ya aprueben y puedan ver las seis plazas en la app.

**Objetivo:** guardar una copia, cambiar un mensaje de su servidor y comprobar que el cambio se aplicó. Todos los comandos de esta práctica se escriben dentro de la **RASPBERRY**, después de entrar con su cuenta de grupo.

## 1. Guardar un respaldo antes de cambiar algo

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py respaldar
```

**Resultado esperado:** aparece una ruta que empieza con `/home/grupo1/PI2/respaldos/`, con su número de grupo, y termina en `.zip`. Guardar el nombre exacto del ZIP para poder recuperar esta versión.

El respaldo guarda su código y los archivos del proyecto. El entorno `.venv` se recrea al restaurar; el historial del simulador está en memoria y se pierde al reiniciar la API.

## 2. Abrir su archivo Python

```bash
cd ~/PI2/estacionamiento
```

```bash
nano servidor_estacionamiento.py
```

Se abre el editor Nano dentro de la terminal. Cerca del comienzo del archivo hay una línea que empieza por `AVISO =`.

## 3. Cambiar solo el mensaje

Para el grupo1, dejar esa línea así:

```python
AVISO = "Equipo 1 - datos simulados para la practica UCU."
```

Los otros grupos escriben su propio número. Mantener las comillas y modificar solamente esa línea. El ejemplo Python se escribe **dentro del editor**, en el archivo; no se pega como comando en la terminal.

Para guardar y salir de Nano:

1. Presionar **Ctrl+O** para guardar: es la letra O.
2. Presionar **Enter** para confirmar el nombre del archivo.
3. Presionar **Ctrl+X** para salir del editor.

**Resultado esperado:** vuelve a aparecer la línea de comandos de su grupo.

## 4. Revisar la sintaxis antes de reiniciar

Todavía en `~/PI2/estacionamiento`:

```bash
.venv/bin/python -m py_compile servidor_estacionamiento.py
```

**Resultado esperado:** vuelve la línea de comandos sin mostrar un error. Si muestra `SyntaxError` u otro mensaje, corregirlo antes de continuar.

## 5. Aplicar y comprobar el cambio

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py reiniciar
```

Esperar unos segundos y ejecutar:

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py comprobar
```

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py url
```

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py comprobar --publica
```

**Resultado esperado:** las comprobaciones aprueban. Pegar la URL actual en el navegador de la PC: dentro de la respuesta debe aparecer el campo `aviso` con su nuevo mensaje.

Este cambio se ve en la respuesta del servidor en el navegador. La APK tiene sus propios textos de aviso; el mensaje editado en este ejercicio no modifica esos textos de la app.

Como el túnel se recreó, actualizar su URL en Ajustes de la app si cambió.

## 6. Conservar la versión que funciona

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py respaldar
```

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py listar-respaldos
```

**Resultado esperado:** aparecen los nombres de sus ZIP, incluyendo el respaldo anterior y el nuevo. Conservar el nombre de cada uno y anotar qué versión guardaron.

## Si el cambio tiene un error

1. Si siguen en Nano y prefieren descartar la edición sin guardar, presionar Ctrl+X y elegir no guardar.
2. Si ya guardaron, volver a abrir con `nano servidor_estacionamiento.py`, corregir las comillas o la línea indicada por Python, guardar y repetir la comprobación de sintaxis.
3. Si necesitan recuperar la versión anterior, listar los respaldos:

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py listar-respaldos
```

Luego usar este comando **reemplazando `NOMBRE_DEL_ZIP` por el nombre exacto que guardaron en el paso 1**, incluida la terminación `.zip`:

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py restaurar NOMBRE_DEL_ZIP
```

La restauración valida el ZIP, conserva la carpeta anterior y recrea el entorno de Python. Esperar a que termine; necesita Internet para descargar las dependencias que falten. Después repetir las comprobaciones LOCAL, URL y HTTPS del paso 5.

## Comprobación final

- [ ] Guardé un respaldo antes del cambio.
- [ ] Modifiqué un archivo de mi propia cuenta.
- [ ] La revisión de sintaxis terminó sin errores.
- [ ] Vi mi nuevo mensaje en la respuesta del servidor en el navegador.
- [ ] Comprobé LOCAL y HTTPS y actualicé la URL de la app si cambió.
- [ ] Guardé un respaldo de la versión que funciona.

Los archivos editados están en la Raspberry. Este ejercicio todavía no sube cambios a GitHub; para esa etapa el docente indicará cómo trabajar con una rama de cada grupo.
