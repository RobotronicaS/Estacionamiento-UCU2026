# Contrato de consulta para la APK · versión 1

Implementar estas rutas en la aplicación de la Raspberry. Cloudflare debe encaminarlas al servicio HTTP de la aplicación. La APK usa el dominio HTTPS configurado en Ajustes. Se conservan aparte las rutas de escritura usadas por la notebook.

## GET /api/estado?grupo=1

Responder HTTP 200 con JSON UTF-8. `grupo` es un entero entre 1 y 4 y debe coincidir con el equipo solicitado. La versión inicial representa seis plazas por equipo; el lector admite hasta 128.

```json
{
  "version": 1,
  "grupo": 1,
  "fuente": "mpf1-serie",
  "simulado": true,
  "ultima_lectura": "2026-10-20T01:30:00Z",
  "vigencia_segundos": 20,
  "plazas": [
    {
      "id": "E001",
      "nombre": "Plaza 1",
      "zona": "Universidad",
      "lat": null,
      "lon": null,
      "estado": "libre",
      "actualizado_en": "2026-10-20T01:30:00Z"
    }
  ]
}
```

Agregar las seis plazas con sus coordenadas relevadas. `lat` y `lon` pueden ser `null`: la plaza se muestra en la lista, sin marcador. Nunca inventar coordenadas como si fueran mediciones. Estados admitidos: `libre`, `ocupado`, `desconocido`. Los identificadores no pueden repetirse.

Todas las fechas son ISO 8601 con `Z` o desplazamiento horario explícito. `ultima_lectura` es la fecha de recepción de la lectura del MPF-1, no la hora en que se atendió este GET. `actualizado_en` representa la última lectura válida que confirmó cada plaza. El servidor debe guardar también las lecturas iguales a la anterior para poder confirmar vigencia sin inventar cambios de estado.

`vigencia_segundos` admite de 1 a 300. Ajustar según el intervalo real de transmisión; la guía usa 20 segundos. El cliente no convierte una respuesta vieja en disponibilidad actual. `simulado` debe ser `true` durante las prácticas con entradas en RAM, aunque la comunicación física MPF-1/RS-232/servidor sea real.

## GET /api/historial?grupo=1&limite=60

```json
{
  "eventos": [
    {
      "id": "1234",
      "plaza_id": "E001",
      "estado": "ocupado",
      "fecha": "2026-10-20T01:28:00Z"
    }
  ]
}
```

Devolver cambios de estado del grupo solicitado. La APK ordena de más reciente a más antiguo. Para no tener eventos, responder `{"eventos":[]}`. No publicar datos de otros equipos. El cliente admite hasta 500 eventos por respuesta y solicita 60.

## Escritura y seguridad

- La notebook sigue enviando las lecturas a la ruta de escritura de su pasarela, por Tailscale. El endpoint `/api/lecturas` del material anterior no es un endpoint de consulta de esta APK.
- El token que permite escribir pertenece a la notebook; no se incrusta en la APK.
- Esta versión consulta información pública sin credenciales. La API debe resolver la selección de grupo con permiso de solo lectura.
- Las respuestas no deben redirigir a HTML ni a un inicio de sesión. La APK informa el problema si recibe una redirección o una página de Access.
- No se aceptan certificados HTTPS inválidos ni conexiones HTTP sin cifrar.
- Mantener PostgreSQL en la Raspberry y detrás de la aplicación; la APK no abre conexiones SQL.
- La APK no requiere CORS: la petición la realiza el cliente HTTPS nativo. Solo una eventual vista previa en navegador requeriría configurar CORS en el servidor.

Las rutas de consulta son el contrato de esta primera APK; todavía deben contrastarse e integrarse con el backend real del curso.
