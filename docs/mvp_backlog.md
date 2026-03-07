# RecuperaVentas - MVP Backlog Priorizado

Alcance estricto aplicado:
- Detectar conversación inactiva.
- Enviar mensaje de recuperación.
- Rastrear conversaciones recuperadas.

Excluido explícitamente:
- IA avanzada.
- Analytics avanzado (dashboards complejos, cohortes, predicción).
- Funcionalidades no críticas para el flujo MVP.

## Sprint 1

Objetivo: ingestar conversaciones y detectar inactividad de forma confiable.

### Componentes
- `ingestion` (webhook WhatsApp)
- `conversation` (estado de conversación)
- `storage` (PostgreSQL + migraciones base)
- `auth/tenant` (scope por workspace)

### Tareas
1. Crear esquema DB mínimo: `workspaces`, `channels`, `contacts`, `conversations`, `messages`, `domain_event_logs`.
2. Implementar `GET /webhooks/whatsapp` (verificación Meta).
3. Implementar `POST /webhooks/whatsapp` con validación de firma e idempotencia por `provider_message_id`.
4. Normalizar mensajes inbound/outbound y persistir en `messages`.
5. Crear/actualizar `conversations` al recibir mensajes.
6. Implementar job de detección de inactividad (`DEFAULT_IDLE_HOURS`, default 24h).
7. Emitir y persistir evento `conversation_idle`.
8. Exponer `GET /conversations?status=idle|open|closed`.

## Sprint 2

Objetivo: disparar y enviar recovery automático cuando la conversación esté idle.

### Componentes
- `recovery` (reglas y elegibilidad)
- `messaging` (scheduler + delivery worker)
- `templates` (plantilla activa MVP)

### Tareas
1. Crear esquema DB: `templates`, `recovery_rules`, `recovery_attempts`.
2. Implementar plantilla única activa por workspace (`GET /templates`, `POST /templates`).
3. Implementar lógica de elegibilidad recovery:
   - conversación `idle`
   - no `closed`
   - no `opt_out`
   - evitar duplicado reciente
4. Crear `recovery_attempt` al detectar `conversation_idle`.
5. Implementar cola/scheduler para envío diferido o inmediato.
6. Implementar worker de envío a WhatsApp Cloud API.
7. Persistir estados de intento (`scheduled|sent|failed`) y `failure_reason`.
8. Emitir eventos `recovery_triggered`, `recovery_sent`, `recovery_failed`.
9. Endpoint manual de contingencia: `POST /recoveries/trigger`.

## Sprint 3

Objetivo: rastrear recuperación de conversación y cierre de venta recuperada.

### Componentes
- `tracking` (attribution reply -> recovery)
- `conversation` (estado recuperado/cierre)
- `recovery` (resultado final)

### Tareas
1. Detectar respuesta del cliente posterior al recovery y vincularla al último `recovery_attempt` activo.
2. Actualizar estado de intento a `replied` y timestamp `replied_at`.
3. Emitir evento `customer_replied`.
4. Crear esquema DB: `sale_outcomes`.
5. Implementar endpoint `POST /recoveries/{recovery_id}/mark-sale`.
6. Marcar conversación como recuperada/cerrada al confirmar venta.
7. Emitir evento `sale_recovered`.
8. Exponer tracking básico en APIs:
   - `GET /conversations/{conversation_id}` con `latest_recovery`
   - campos `is_recovered`, `sale_recovered`, `recovered_amount`
9. QA E2E del flujo completo:
   - inbound message -> idle -> recovery sent -> customer reply -> sale recovered.

## Dependencias entre sprints

1. Sprint 2 depende de Sprint 1 (sin estado de conversación no hay idle confiable).
2. Sprint 3 depende de Sprint 2 (sin `recovery_attempt` no hay attribution de respuesta).

## Definición de listo por sprint (DoD mínimo)

1. Tests de integración para endpoints y jobs críticos del sprint.
2. Logs estructurados con `workspace_id`, `conversation_id`, `recovery_id` (cuando aplique).
3. Manejo de errores consistente con `docs/contract.md`.
