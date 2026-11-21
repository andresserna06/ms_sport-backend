---
name: notificaciones
description: Envío de correos desde ms_sports a través del microservicio ms_notificaciones (FastAPI) al crear un partido, registrar una anotación o finalizar un partido. Úsala al implementar, modificar o probar cualquier notificación.
---

# Notificaciones por correo

ms_sports **no envía correos por sí mismo**. Delega en el microservicio del
grupo `ms_notificaciones` (Python FastAPI + Gmail API), igual que ya lo hace ms_security.

## Contrato de ms_notificaciones (no se modifica desde este repo)

```
POST {NOTIFICATIONS_SERVICE_URL}/send-email        (por defecto http://localhost:8000)
Content-Type: application/json

{ "to": "aficionado@correo.com", "subject": "Asunto", "html_content": "<p>Cuerpo en HTML</p>" }
```

- Un solo destinatario por petición: para N aficionados se hacen N peticiones.
- `html_content` es solo el contenido: el servicio lo envuelve en la plantilla
  corporativa de JPA Sports con el logo.
- Respuestas: 200 `{ "message": "Correo enviado", "id": "..." }`;
  422 si falta un campo o está vacío (validación de FastAPI);
  502 si Gmail rechaza el envío.

## Eventos

| Evento | Historia | Cuándo se emite | Destinatarios |
|---|---|---|---|
| `match.created` | GC-06 | Tras guardar un partido nuevo | Aficionados que asistieron (boleto) a partidos anteriores de cualquiera de los dos equipos [PENDIENTE: confirmar si también cuentan apuestas o AficionadoEquipo] |
| `scoring-event.created` | GC-07 | Tras guardar una anotación | Aficionados con boleto o apuesta para ese partido |
| `match.finished` | GC-07 | Tras finalizar el partido con su resultado | Aficionados con boleto o apuesta para ese partido, con el resumen (marcador y anotaciones) |

Cada destinatario recibe un solo correo por evento aunque tenga boleto y apuesta.

## Diseño en ms_sports

```
MatchService ──emits event──▶ NotificationsListener ──▶ NotificationClient (interface)
 (saves first)               (resolves recipients      └─ HttpNotificationClient (axios)
                              and builds the HTML)         POST /send-email
```

- El service de dominio solo **emite el evento** (EventEmitter de Nest) después
  de guardar correctamente. No conoce correos ni URLs.
- El módulo `notifications` tiene:
  - un listener por evento que obtiene los destinatarios a través de los
    services de los otros módulos y arma `subject` y `html_content` (el
    contenido va en funciones de plantilla, no mezclado con la lógica);
  - `NotificationClient`: interfaz inyectada por token (principio D) con el
    método `sendEmail(to, subject, htmlContent)`;
  - `HttpNotificationClient`: implementación con `axios` (ya está en las
    dependencias) que llama a `/send-email` con un tiempo de espera corto.
- La URL se lee de `NOTIFICATIONS_SERVICE_URL` (agregarla a `.env.example`).
- Código en inglés; el `subject` y el `html_content` de los correos, en español.
- Los envíos a varios destinatarios se lanzan con `Promise.allSettled` para que
  la falla de uno no impida los demás; cada falla se registra en el log con el correo y el error.
- **Diferencia con ms_security:** allá un fallo del correo devuelve error al
  usuario, porque sin el código 2FA no puede entrar. Aquí **la operación
  principal nunca falla por el correo**: el partido o la anotación quedan
  guardados y la respuesta HTTP es la normal, aunque ms_notificaciones esté caído.
- Si un aficionado no tiene correo registrado, se omite y se registra en el log.

## Pruebas

- Unitarias (Jest), con `NotificationClient` simulado:
  - el listener calcula bien los destinatarios y no duplica correos;
  - una falla del cliente no propaga la excepción;
  - el HTML incluye los datos del partido o la anotación.
- Postman: verifica solo la operación principal (crear partido, registrar
  anotación). El correo se verifica levantando ms_notificaciones y revisando el
  buzón o su log; no se crean endpoints especiales.
- Para probar ms_sports sin enviar correos reales basta con no levantar
  ms_notificaciones: la operación debe seguir respondiendo bien y el log debe mostrar el fallo.
