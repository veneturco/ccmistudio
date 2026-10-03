# PROMPT MAESTRO FINAL — ACTIVACIÓN DE PRODUCCIÓN REAL
## SYNAPSIS / SOCS / CCMI

---

### ARQUITECTURA DE CIERRE Y FLUJO OPERATIVO

```text
PROTECTED CORE FROZEN
        │
        ▼
NO FUNCTIONAL CHANGES
        │
        ▼
ACTIVACIÓN DE INFRAESTRUCTURA REAL
        │
        ├── 1. FIRESTORE PRODUCTION
        │
        ├── 2. FHIR R4 INSTITUTIONAL HANDSHAKE
        │
        ├── 3. BACKUP + RESTORE REAL
        │
        └── 4. PRODUCTION SMOKE TEST
                    │
                    ▼
             EVIDENCIA REAL
                    │
             ┌──────┴──────┐
             ▼             ▼
           PASS          FAIL/PENDIENTE
             │             │
             ▼             ▼
      GO-LIVE FINAL     NO LANZAR
```

---

### REGLA DE ORO DE INCIDENCIAS
Si aparece un problema durante la activación institucional:
- **CONFIGURATION** → configurar parámetros de entorno, no modificar código del dominio.
- **INFRASTRUCTURE** → resolver servicios de red, cloud o contenedores.
- **SECURITY BLOCKER** → detener el despliegue hasta resolver la vulnerabilidad o brecha de aislamiento.
- **EXTERNAL DEPENDENCY** → configurar y validar la integración con la dependencia externa.
- **Protected Core** → **NO TOCAR BAJO NINGUNA CIRCUNSTANCIA**.

---

### LA DIFERENCIA CRÍTICA DE ESTATUS
- **GO-LIVE READY:** El software ha superado todas las pruebas estáticas, de hardening, unitarias, de integración y de seguridad en entorno controlado (Fases 2, 3 y 4).
- **INSTITUTIONAL GO-LIVE:** El sistema opera exitosamente conectado a la infraestructura real, habiendo superado los cuatro Gates definitivos con evidencia cuantitativa.

---

### LOS CUATRO GATES DEFINITIVOS (G1 — G4)

| Gate | Métrica / Objetivo | Condición Obligatoria para Cierre |
| :--- | :--- | :--- |
| **G1 — Firestore** | Persistencia y Auth Reales | Firebase Auth, Firestore y reglas definitivas funcionando; aislamiento multi-tenant y de paciente verificado con identidad real. |
| **G2 — FHIR** | Interoperabilidad Institucional | Servidor FHIR R4 real conectado, endpoint `/metadata` consultado, `CapabilityStatement` verificado y Staging Sanctuary operativo. |
| **G3 — Backup / Restore** | ResGUARDO y Recuperación | Backup y restauración reales ejecutados y comprobados, con verificación de versiones e inmutabilidad del Audit Trail (sin rollbacks destructivos). |
| **G4 — E2E Smoke** | Flujo Clínico Definitivo | Flujo completo verificado (*Login Real → Patient 360 → Consulta → Propuesta IA → Revisión → Confirmación → Episodio → Timeline → Estudios → PDF Vectorial → Audit Event → OCC Sync → FHIR*) funcionando contra la infraestructura definitiva. |

---

### CONCLUSIÓN
A partir de este momento, **SYNAPSIS deja oficialmente de estar en fase de construcción y entra en fase de activación controlada**. Toda acción futura se rige estrictamente por los 4 Gates definidos y el respeto absoluto al código certificado del Protected Core.

---
*Fin del Prompt Maestro Final — Activación de Producción Real*
