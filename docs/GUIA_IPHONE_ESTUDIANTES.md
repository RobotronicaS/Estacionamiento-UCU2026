# Estaciona UCU en iPhone · Guía para estudiantes

Vas a abrir la app de tu grupo en Safari y agregar su ícono a la pantalla de inicio. La app muestra el mapa, las seis plazas y el historial del servidor del grupo.

## 1. Conseguí el enlace de tu grupo

Si ya tenés el enlace completo que te pasó el docente, seguí al paso 2. Si tenés que buscarlo, entrá desde la PC a la Raspberry con tu cuenta de grupo. Podés seguir la [primera práctica](../EMPEZAR_AQUI.md).

Dentro de tu sesión SSH en la Raspberry, ejecutá este comando y copiá la dirección que devuelve.

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py url
```

La dirección base es similar a `https://TU-TUNEL.trycloudflare.com`. Usá la dirección que devuelve **tu cuenta**.

## 2. Abrí la app en Safari

En el iPhone, abrí **Safari** y pegá la dirección base de tu grupo con `/app/` al final. Si el docente te dio el enlace completo de la app, pegalo tal como lo recibiste.

```text
https://TU-TUNEL.trycloudflare.com/app/
```

En la parte superior debe aparecer **Equipo 1**, **Equipo 2**, **Equipo 3** o **Equipo 4**, según tu grupo. Tocá **Plazas** y comprobá que veas los seis lugares.

### Si la ruta /app/ devuelve 404

Si tu grupo ya tenía su servidor instalado antes de la actualización, ejecutá lo siguiente **en tu sesión SSH de la Raspberry**.

```bash
python3 /usr/local/share/estacionamiento-ucu/mi_grupo.py publicar-web
```

Cuando aparezca **App web habilitada**, abrí en Safari la dirección de tu grupo con esta ruta al final.

```text
https://TU-TUNEL.trycloudflare.com/static/estaciona/index.html
```

Si el comando indica que falta preparar la interfaz o que la acción es inválida, avisale al docente y mostrale el mensaje.

## 3. Agregá el ícono a Inicio

1. Con la app abierta en Safari, tocá **Compartir**. Si el botón está dentro del menú de página, abrí ese menú primero.
2. Tocá **Agregar a Inicio**. Si no aparece, buscala en **Editar acciones**.
3. Si aparece la opción **Abrir como app web**, activala.
4. Tocá **Agregar** y abrí **Estaciona UCU** desde su ícono. [Pasos de Apple para agregar una app web](https://support.apple.com/es-lamr/guide/iphone/iphea86e5236/ios)

## 4. Mostrá que quedó funcionando

Desde el ícono, mostrale al docente **el número de tu equipo, el mapa, las seis plazas y el historial**. La indicación **Datos de prueba del servidor** identifica las lecturas simuladas de esta práctica.

| Si pasa esto | Hacé esto |
| --- | --- |
| Safari muestra texto con llaves y números | Abriste la dirección base. Volvé al paso 2 para usar la dirección de la app. |
| La app muestra otro equipo | Volvé a obtener el enlace desde tu cuenta del grupo. |
| Safari no puede abrir el enlace | Comprobá la conexión a Internet del iPhone y pedí al docente que revise el enlace del grupo. |
| El ícono dejó de abrir después de que cambió el túnel | Obtené la dirección nueva con `url`, abrila en Safari y agregala a Inicio. |

[Volver a la primera práctica](../EMPEZAR_AQUI.md)
