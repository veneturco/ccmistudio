# AUDITORÍA TÉCNICA DEL DISEÑO STITCH Y PLAN DE INTEGRACIÓN SEGURA
## CORTEX AXIS — CENTRO CLÍNICO MÉDICO INTEGRAL (CCMI)

---

## 1. RESUMEN EJECUTIVO

Se ha realizado la inspección técnica exhaustiva del material de diseño generado por **Google Stitch** (`stitch_cortex_axis_clinical_platform`).

### Principio Rector
$$\text{STITCH} = \text{CAPA DE PRESENTACIÓN / UX / UI}$$
$$\text{CCMI EXISTENTE} = \text{FUENTE CANÓNICA DE VERDAD (DATOS, LÓGICA, SEGURIDAD, SERVICIOS, AUDITORÍA, ENGINE)} $$

- **Estado de Código Actual:** Ningún archivo de producción ha sido modificado, reemplazado ni refactorizado en este paso.
- **Protected Core:** 100% blindado e intacto.
- **Evaluación General:** El material de Stitch aporta una renovación visual de alta fidelidad con estética médica oscura (*Dark Premium Clinical Technology*), diseño de tarjetas con elevación sutil, tipografía médica legible y componentes de métricas que enriquecen significativamente la experiencia del especialista. Sin embargo, su código fuente consiste en maquetación HTML estática con simulaciones interactivas básicas (JS vanilla) y datos ficticios (*mock data*). La integración debe realizarse transformando progresivamente esas maquetaciones en componentes React tipados conectados a los hooks y repositorios existentes de CCMI.

---

## 2. INVENTARIO DE ARCHIVOS DE STITCH

El paquete contiene 7 módulos visuales estructurados de la siguiente forma:

| Ruta / Carpeta | Tipo de Archivo | Propósito / Contenido |
| :--- | :--- | :--- |
| `stitch_cortex_axis_clinical_platform/cortex_axis_ccmi_logo/` | `code.html`<br>`screen.png` | Isotipo vectorial y branding institucional de CORTEX AXIS / CCMI con gradientes cian-azul y tipografía técnica. |
| `stitch_cortex_axis_clinical_platform/dashboard_cl_nico/` | `code.html`<br>`screen.png` | Dashboard clínico principal: métricas rápidas (citas del día, pacientes activos, pendientes, estudios), flujo de actividad reciente y accesos rápidos. |
| `stitch_cortex_axis_clinical_platform/agenda_quir_rgica_y_citas/` | `code.html`<br>`screen.png` | Vista de agenda médica y quirúrgica: selector de fecha, listado de citas por estado, tiempos de quirófano y formulario modal de agendamiento. |
| `stitch_cortex_axis_clinical_platform/nueva_consulta_y_asistente_ia/` | `code.html`<br>`screen.png` | Espacio de atención clínica: sección de dictado por voz, panel lateral de sugerencias de IA, previsualización de recetas y plan terapéutico. |
| `stitch_cortex_axis_clinical_platform/patient_360_expediente_inteligente/` | `code.html`<br>`screen.png` | Expediente longitudinal 360°: cabecera del paciente, resumen de antecedentes/alergias, línea temporal cronológica de episodios y pestañas de estudios. |
| `stitch_cortex_axis_clinical_platform/professional_clinical_doctor_headshot_portrait_friendly_distinguished_male/` | `screen.png` | Retrato fotográfico profesional del especialista médico (avatar de alta resolución para la cabecera y tarjeta del facultativo). |
| `stitch_cortex_axis_clinical_platform/dark_premium_clinical_technology/` | `DESIGN.md` | Constitución visual del Design System: paleta de colores, tipografía, escalas de espaciado, elevaciones, bordes y directrices de UI. |

---

## 3. ANÁLISIS DE PANTALLAS DE STITCH

| Pantalla Stitch | Qué Contiene | Elementos Reutilizables | Elementos que Deben Adaptarse | Pantalla CCMI Existente |
| :--- | :--- | :--- | :--- | :--- |
| **`dashboard_cl_nico`** | Tarjetas de métricas (KPIs), pacientes del día, accesos rápidos a consultas/estudios, selector de filtros y feed de actividad clínica reciente. | Tarjetas de KPI estilizadas, layout de rejilla responsiva, badges de estado de sincronización y estilo visual de filas de pacientes. | Conectar las métricas con `computeDashboardPulseMetrics`, `getPatientSpotlightData` y `getUnifiedClinicalFeed`. Reemplazar avatars estáticos por los pacientes reales de Firestore/OCC. | `SynapsisHome.tsx` + `ClinicalPulsePanel.tsx` + `QuickActionHub.tsx` |
| **`agenda_quir_rgica_y_citas`** | Calendario mensual/semanal, lista de pacientes en espera/consulta, bloques de quirófano programados y modal de nueva reserva. | Diseño de bloques de tiempo horarios, estilos para slots libres vs ocupados, modales de confirmación con estética oscura. | Conectar estrictamente a `ClinicalAgendaRepository.ts`, `availabilityEngine.ts` y `appointmentStateMachine.ts`. Eliminar cualquier creación de cita en cliente que no valide el tenant `CCMI-DR-SAMIR`. | `ClinicalAgendaView.tsx` |
| **`nueva_consulta_y_asistente_ia`** | Interfaz de consulta con botón de grabación de voz, caja de transcripción, tarjeta de sugerencias IA y borrador de récipe. | Visualización del botón de micrófono con feedback de pulso, tarjeta de "Diferenciación IA vs Médico", selectores de diagnóstico. | La IA debe mantenerse como sugerencia tentativa. La emisión documental debe usar el pipeline canónico y `ClinicalConfirmationService`. El dictado debe enlazarse con el motor existente de Speech/IA. | `ClinicalActionSelector.tsx` + `ClinicalReviewScreen.tsx` + `DocumentSelectorWorkspace.tsx` |
| **`patient_360_expediente_inteligente`** | Cabecera clínica con foto/cédula/edad/alergias, timeline vertical con iconos por tipo de evento, visor de documentos y estudios de imagen. | Estructura visual de timeline moderno con nodos iluminados, badges de severidad de alergias, cards de episodios colapsables. | Conectar con `buildPatient360ViewModel`, `getPatient360ByCedula` y `Patient360Adapter`. No inventar diagnósticos ni antecedentes sintéticos; mostrar el expediente real. | `src/patient360/Patient360View.tsx` + `Patient360Timeline.tsx` + `Patient360Header.tsx` |
| **`cortex_axis_ccmi_logo`** | Isotipo de red neuronal / columna vertebral con gradiente y tipografía geométrica. | SVG optimizado del imagotipo y gradientes CSS corporativos. | Empaquetar como componente React `<BrandLogo />` configurable en tamaño y variante de color. | `src/components/BrandLogo.tsx` |

---

## 4. ANÁLISIS DE CÓDIGO HTML DE STITCH

### 4.1 Estructura y Tecnologías
- **Estructura HTML:** Marcado semántico basado en `div`, `section`, `header`, `aside` y `main`.
- **CSS:** Clases utilitarias de Tailwind CSS (versión moderna) combinadas con variables CSS para temas oscuros (`--bg-primary: #0a0f1d`, `--card-bg: #111827`, `--accent-cyan: #06b6d4`, `--accent-blue: #3b82f6`).
- **JavaScript:** Scripts en línea minimalistas para simular apertura de modales, cambio de tabs y toggles de menús. No poseen validación de datos, sanitización, manejo de concurrencia ni autenticación.
- **Iconografía:** SVGs incrustados que corresponden directamente a la biblioteca **Lucide Icons** (ya instalada en CCMI).
- **Tipografía:** Dependencia de Google Fonts (`Inter` y `JetBrains Mono` / `Plus Jakarta Sans`).

### 4.2 Distinción Crítica: Interacción Simulada vs Lógica Real

| Característica | Interacción Simulada de Stitch (UI) | Funcionalidad Real de CCMI (Backend / Domain) |
| :--- | :--- | :--- |
| **Agendar Cita** | Agrega un elemento visual al DOM con `innerHTML`. | Ejecuta `calculateAvailableSlots`, detecta solapamientos horarios con `hasTimeConflict`, audita en `ClinicalAuditService` con hash SHA-256 y persiste en Firestore tenant-scoped (`tenants/CCMI-DR-SAMIR/appointments`). |
| **Cambio de Estado** | Cambia una clase CSS de color verde a azul. | Ejecuta la máquina de estados determinista `assertValidAppointmentTransition`, registra el actor y rol en `stateHistory`, y actualiza el expediente longitudinal. |
| **Sugerencia IA** | Texto hardcodeado estático en el HTML. | Inferencia con SDK `@google/genai` (`gemini-2.5-flash`), validación de contraindicaciones, cálculo de dosis farmacológica y paso obligatorio por `ClinicalConfirmationService`. |
| **Historial Paciente** | Lista estática de 3 consultas simuladas. | Adaptador reactivo `Patient360Adapter` que unifica episodios de consulta, recetas emitidas, órdenes de laboratorio calibradas y estudios DICOM reales. |

---

## 5. MAPEO STITCH $\rightarrow$ CCMI EXISTENTE

| Módulo / Capacidad CCMI | Archivo / Componente Actual | Pantalla Stitch Correspondiente | Nivel de Integración |
| :--- | :--- | :--- | :--- |
| **Dashboard Principal** | `src/components/SynapsisHome.tsx` | `dashboard_cl_nico` | **MEDIO:** Reemplazar el layout visual de tarjetas por la estética de Stitch, manteniendo intactos los selectores de métricas (`DashboardSelectors.ts`). |
| **Agenda Clínica** | `src/components/ClinicalAgendaView.tsx` | `agenda_quir_rgica_y_citas` | **MEDIO:** Inyectar las clases visuales y componentes de tarjeta de Stitch en el grid de slots calculado por `availabilityEngine.ts`. |
| **Nueva Consulta / Dictado** | `src/components/ClinicalActionSelector.tsx` | `nueva_consulta_y_asistente_ia` | **BAJO/MEDIO:** Adaptar la presentación del selector de acciones y la visualización de propuestas de IA, sin tocar el validador clínico. |
| **Expediente Patient 360** | `src/patient360/Patient360View.tsx` | `patient_360_expediente_inteligente` | **MEDIO:** Actualizar la cabecera y el diseño de la línea temporal (`Patient360Timeline.tsx`) con la estética oscura de Stitch. |
| **Directorio de Pacientes** | `src/components/PatientsDirectoryView.tsx` | Lista integrada en Dashboard / 360 | **BAJO:** Aplicar el estilo de tabla/cards de Stitch al listado de pacientes. |
| **Workspace de Emisión Documental** | `src/components/DocumentSelectorWorkspace.tsx` | N/A (Exclusivo de CCMI) | **CERO (PROTEGIDO):** No tocar. Es el motor canónico A4 y media carta de alta precisión física. |
| **Auditoría Clínica Forense** | `src/audit/AuditTrailViewer.tsx` | N/A (Exclusivo de CCMI) | **CERO (PROTEGIDO):** Mantener el visor de integridad criptográfica y append-only log. |
| **Interoperabilidad FHIR** | `src/components/interoperability/FHIRInteroperabilityCenter.tsx` | N/A (Exclusivo de CCMI) | **CERO (PROTEGIDO):** Mantener la consola de validación e intercambio FHIR R4. |

---

## 6. INVENTARIO DEL PROTECTED CORE (INMUTABLE)

Los siguientes componentes forman el núcleo certificado de la aplicación y **NO DEBEN SER MODIFICADOS** bajo ninguna circunstancia durante la integración del diseño:

1. `src/calibration/masters/*` (Masters canónicos LAB-001, Récipe, etc.)
2. `src/calibration/DynamicMasterStorage.ts` y `src/calibration/MasterStateMachine.ts`
3. `src/utils/PDFDocumentPipelineV2.ts`, `VectorOverlayEngineV2.ts`, `CanonicalDocumentGeneratorV2.ts` y `OverlayRenderer.ts`
4. `src/clinical/ClinicalConfirmationService.ts`
5. `src/clinical/proposalStateMachine.ts`, `confirmationValidator.ts` y `proposalValidator.ts`
6. `src/clinical/ClinicalTimelineEngine.ts`
7. `src/fhir/FHIRInteroperabilityService.ts` y `src/fhir/FHIRValidator.ts`
8. `src/security/clinicalAuthorizer.ts` y `src/security/deviceAuthenticator.ts`
9. `src/agenda/appointmentStateMachine.ts` (Transiciones deterministas de citas)
10. `src/agenda/availabilityEngine.ts` (Motor de cálculo matemático de slots)
11. `src/audit/ClinicalAuditService.ts` (Append-only log con SHA-256)
12. `firestore.rules` (Aislamiento de seguridad multi-tenant `CCMI-DR-SAMIR`)

---

## 7. ANÁLISIS DE LA AGENDA CLÍNICA

- **Situación Actual:** La agenda clínica cuenta con persistencia Firestore tenant-scoped, motor de disponibilidad de slots de 30 minutos, soporte de bloqueos por quirófano, prevención de colisiones horarias y trazabilidad completa de estados (`CONFIRMADA` $\rightarrow$ `CHECK_IN` $\rightarrow$ `SALA_ESPERA` $\rightarrow$ `EN_CONSULTA` $\rightarrow$ `FINALIZADA`).
- **Aporte de Stitch:** Un diseño refinado de vista de calendario, selectores de fecha con micro-interacciones, badges de tiempo estimado y una interfaz limpia para la sala de espera.
- **Estrategia de Integración:** La presentación visual de Stitch se adoptará como la vista superficial (`ClinicalAgendaView.tsx`), pero cada interacción disparará exclusivamente las llamadas al repositorio canónico `ClinicalAgendaRepository.ts`.

---

## 8. ANÁLISIS DE PATIENT 360

- **Situación Actual:** `Patient360View` opera mediante un modelo canónico de vista (`Patient360ViewModel`) alimentado por `Patient360Adapter`, que indexa cronológicamente eventos médicos sin duplicidad.
- **Aporte de Stitch:** Un encabezado de paciente de alto impacto visual con micro-tarjetas de signos vitales recientes, timeline continuo con conectores bioluminiscentes y selector de categorías con filtrado inmediato.
- **Estrategia de Integración:** Adaptar únicamente los componentes de presentación (`Patient360Header.tsx`, `Patient360Summary.tsx`, `Patient360Timeline.tsx`). Todos los datos mostrados deben seguir proviniendo de `Patient360Record` real de Firestore / localStorage. Los datos de prueba de Stitch (ej. "Hipertensión Grado II", "Alergia a Penicilina") se descartan por completo.

---

## 9. ANÁLISIS DE NUEVA CONSULTA Y ASISTENTE IA

- **Situación Actual:** Flujo en 3 pasos: Selector Express de Paciente $\rightarrow$ Selector de Acción Clínica / Dictado $\rightarrow$ Revisión Inteligente con `ClinicalReviewScreen` $\rightarrow$ Emisión Oficial en Workspace.
- **Aporte de Stitch:** Panel visual dividido con área de notas clínicas a la izquierda y tarjeta de copiloto IA a la derecha, con botones de acción para insertar sugerencias directamente al récipe o informe.
- **Estrategia de Integración:** Incorporar el layout estético de Stitch protegiendo la barrera de seguridad clínica: las sugerencias de la IA deben continuar marcadas como `AI_INFERENCE` y requerir confirmación explícita del médico antes de incorporarse a los documentos oficiales.

---

## 10. IDENTIDAD VISUAL Y PROPUESTA DE DESIGN SYSTEM

Basado en el análisis de `DESIGN.md` de Stitch:

### 10.1 Paleta de Colores
- **Fondos (Dark Tech Surface):**
  - Base: `#060b16` (Deep Navy / Midnight)
  - Tarjetas / Superficies: `#0c1527` (Navy Slate)
  - Bordes y Líneas Divisorias: `#1e293b` / `#172554`
- **Acentos Clínicos:**
  - Primario (Neurocirugía / Identidad): `#06b6d4` (Cyan Médica) a `#3b82f6` (Azul Real)
  - Éxito / Confirmado / Disponible: `#10b981` (Emerald)
  - Quirófano / Bloqueo / Advertencia: `#f59e0b` (Amber)
  - Cancelación / Urgencia: `#f43f5e` (Rose)
  - Sugerencia IA: Gradiente `#8b5cf6` (Purple) a `#06b6d4` (Cyan)

### 10.2 Tipografía
- **Titulares e Interfaz:** `Inter` / `Plus Jakarta Sans` (seminegrita y negrita para legibilidad clínica rápida).
- **Datos Técnicos, Fechas y Cédulas:** `JetBrains Mono` / Font Mono nativa (evita confusiones numéricas en dosis y horarios).

### 10.3 Geometría y Elevación
- **Radios de Borde:** `rounded-xl` (12px) para tarjetas y `rounded-lg` (8px) para botones y badges.
- **Sombras:** Sombras oscuras con tinte azulado sutil (`shadow-[0_4px_20px_-4px_rgba(6,182,212,0.1)]`).

---

## 11. COMPONENTES VISUALES REUTILIZABLES DE STITCH

Componentes a abstraer en React:

1. **`StitchStatCard`**: Tarjeta de métrica con icono, valor grande, etiqueta y badge de tendencia.
2. **`StitchPatientBadge`**: Chip de identificación del paciente con avatar, cédula y estado.
3. **`StitchTimelineNode`**: Nodo cronológico con línea conectora iluminada y tarjeta de evento.
4. **`StitchAIAssistantCard`**: Contenedor estilizado para propuestas de IA con borde gradiente y botones de aceptación/edición.
5. **`StitchSlotBadge`**: Botón de horario con estado visual (disponible, ocupado, bloqueo de quirófano).
6. **`StitchModal`**: Contenedor de diálogo modal oscuro con backdrop blur.

---

## 12. COMPONENTES CCMI EXISTENTES: ¿REUTILIZAR O CREAR NUEVO?

| Componente | ¿Existe en CCMI? | Decisión Arquitectónica |
| :--- | :---: | :--- |
| **`BrandLogo`** | Sí (`BrandLogo.tsx`) | **Reutilizar y actualizar:** Adaptar el SVG con los gradientes del isotipo Stitch. |
| **`QuickActionHub`** | Sí (`QuickActionHub.tsx`) | **Reutilizar:** Actualizar clases Tailwind al estilo Stitch. |
| **`ClinicalPulsePanel`** | Sí (`ClinicalPulsePanel.tsx`) | **Reutilizar:** Aplicar el diseño de `StitchStatCard`. |
| **`PatientSpotlightCard`** | Sí (`PatientSpotlightCard.tsx`) | **Reutilizar:** Enriquecer con los micro-estados visuales de Stitch. |
| **`UnifiedClinicalFeed`** | Sí (`UnifiedClinicalFeed.tsx`) | **Reutilizar:** Aplicar los estilos de fila de Stitch. |
| **`ClinicalAgendaView`** | Sí (`ClinicalAgendaView.tsx`) | **Reutilizar:** Adoptar el layout de Stitch manteniendo la lógica. |
| **`Patient360Header`** | Sí (`Patient360Header.tsx`) | **Reutilizar:** Integrar el estilo visual y el avatar profesional de Stitch. |
| **`Patient360Timeline`** | Sí (`Patient360Timeline.tsx`) | **Reutilizar:** Estilizar nodos cronológicos. |
| **`StitchAIAssistantCard`** | Parcial (`ClinicalReviewScreen.tsx`) | **Crear nuevo componente de UI:** Para encapsular la presentación del asistente. |

---

## 13. ADAPTABILIDAD RESPONSIVE

El diseño de Stitch presenta una estructura pensada principalmente para pantallas de escritorio (1280px+). Para la realidad de consulta médica en CCMI se debe garantizar:

- **Desktop ($\ge 1024\text{px}$):** Disposición en 2 o 3 columnas (Sidebar + Contenido Principal + Panel Lateral de IA/Agenda).
- **Tablet ($768\text{px} - 1023\text{px}$):** Panel lateral colapsable en drawer emergente; grid de slots a 4 columnas.
- **Mobile ($< 768\text{px}$):** Columna única; menú inferior o hamburguesa (ya implementado en `Dashboard.tsx`); tabs deslizables para el timeline y tarjetas de consulta; botones de acción táctil de mínimo 44px de altura.

---

## 14. ARQUITECTURA DE NAVEGACIÓN Y COMPATIBILIDAD

El mapa de navegación propuesto por Stitch se alinea perfectamente con la máquina de navegación actual de `Dashboard.tsx`:

```
LOGIN (Auth CCMI)
└── DASHBOARD (SynapsisHome estilizado)
    ├── AGENDA CLÍNICA (ClinicalAgendaView)
    │   ├── Nueva Cita (Modal agendamiento)
    │   ├── Reprogramación
    │   └── Cancelación con motivo auditable
    ├── PACIENTES (PatientsDirectoryView)
    │   └── EXPEDIENTE 360° (Patient360View)
    ├── NUEVA CONSULTA (ClinicalActionSelector / ClinicalReviewScreen)
    ├── ESPACIO DE TRABAJO DOCUMENTAL (DocumentSelectorWorkspace - PROTEGIDO)
    ├── AUDITORÍA FORENSE (AuditTrailViewer - PROTEGIDO)
    ├── INTEROPERABILIDAD FHIR (FHIRInteroperabilityCenter - PROTEGIDO)
    └── ADMINISTRACIÓN Y CALIBRACIÓN (SynapsisAdministration - PROTEGIDO)
```

No se requieren cambios en las rutas ni en los estados del router de React.

---

## 15. CATÁLOGO DE DATOS MOCK DE STITCH A DESCARTAR

| Archivo Stitch | Variable / Texto Simulado | Dónde Aparece | Dato Real CCMI que lo Sustituirá |
| :--- | :--- | :--- | :--- |
| `dashboard_cl_nico` | `"48 Pacientes Activos"`, `"12 Citas Hoy"` | KPIs superiores | `computeDashboardPulseMetrics(patients, appointments)` |
| `dashboard_cl_nico` | `"Dr. Alexander Wright, MD - Neurosurgeon"` | Cabecera / Perfil | `"Dr. Samir Moucharrafie Naime"` (`INSTITUTIONAL_FACULTY_DIRECTORY`) |
| `agenda_quir_rgica_y_citas` | `"Laminectomía L4-L5 - 08:30 AM"` | Slot simulado | `getDoctorAppointmentsByDate` (`ClinicalAppointment[]`) |
| `nueva_consulta_y_asistente_ia` | `"Paciente: Elena Rostova, 34 años"` | Encabezado de consulta | `activePatient` (`PatientData` seleccionado de la agenda o directorio) |
| `nueva_consulta_y_asistente_ia` | `"Sugerencia IA: Pregabalina 75mg cada 12h"` | Card de IA | `generateClinicalProposal` con inferencia Gemini real |
| `patient_360_expediente_inteligente`| `"Alergia: Penicilina (Severa)"`, `"Episodio #4092"` | Ficha clínica | `patientRecord.clinicalHistory.allergies` y `patientRecord.episodes` reales |

---

## 16. ANÁLISIS DE DEPENDENCIAS

| Dependencia Identificada | Estado en CCMI | Acción Requerida |
| :--- | :---: | :--- |
| **Tailwind CSS v4** | Ya instalada (`tailwindcss: ^4.1.14`) | Ninguna. Se utilizarán las clases estándar de Tailwind ya operativas. |
| **Lucide Icons** | Ya instalada (`lucide-react: ^0.546.0`) | Ninguna. Todos los iconos de Stitch existen en Lucide. |
| **Framer Motion / Motion** | Ya instalada (`framer-motion`, `motion`) | Ninguna. Disponible para transiciones suaves de tarjetas. |
| **Google Fonts (Inter / Mono)** | Disponible vía Tailwind font-sans/font-mono | Configurar fuentes en `@import` si se desea fidelidad tipográfica exacta. |
| **Librerías externas nuevas** | Ninguna requerida | **CERO NUEVAS DEPENDENCIAS.** No se instalará ningún paquete adicional. |

---

## 17. MATRIZ DE RIESGOS Y MEDIDAS DE MITIGACIÓN

| Riesgo Técnico / Clínico | Severidad | Mitigación Arquitectónica |
| :--- | :---: | :--- |
| **Ruptura de calibración física de PDFs** | CRÍTICA | No aplicar estilos de Stitch dentro de `DocumentSelectorWorkspace` ni en `src/calibration/masters/*`. El motor de renderizado vectorial A4/Media Carta permanece inalterado. |
| **Contaminación de datos reales con datos mock** | ALTA | Prohibido copiar y pegar HTML directo de Stitch. La integración se hace abstrayendo únicamente estilos CSS en componentes funcionales vinculados a props de React. |
| **Pérdida de trazabilidad de auditoría en la Agenda** | ALTA | Las acciones visuales de Stitch deben enlazarse a los métodos existentes de `ClinicalAgendaRepository` que disparan `clinicalAuditService.recordEvent`. |
| **Inferencia no supervisada de IA** | ALTA | Mantener el flujo obligatorio de confirmación médica en `ClinicalReviewScreen` antes de generar prescripciones. |
| **Regresión en pruebas unitarias/E2E** | MEDIA | Ejecución obligatoria de la suite completa (566 pruebas) tras cada fase de integración visual. |

---

## 18. IMPACTO EN EL PROTECTED CORE

$$\text{Impacto en Protected Core} = \mathbf{0\% \text{ (CERO MODIFICACIONES)}}$$

El Protected Core opera en una capa de abstracción independiente de la capa de presentación visual. La integración de Stitch se limita exclusivamente a componentes de interfaz en `src/components/` y `src/dashboard/`.

---

## 19. PLAN DE INTEGRACIÓN SEGURA POR FASES

La integración segura debe ejecutarse en 4 etapas controladas:

```
FASE S1: Design System & Tokens
(Variables CSS, BrandLogo, paleta oscura en Tailwind)
         ↓
FASE S2: Dashboard & Navigation UI
(SynapsisHome, KPIs, Feed de actividad y QuickActionHub)
         ↓
FASE S3: Agenda Clínica & Patient 360 UI
(ClinicalAgendaView y cabecera/timeline de Patient360)
         ↓
FASE S4: Nueva Consulta & Copiloto IA UI
(ClinicalActionSelector y presentación de propuestas)
```

---

## 20. ORDEN RECOMENDADO DE IMPLEMENTACIÓN

1. **Paso 1 (Tokens Visuales):** Actualizar las variables de color y estilos de fondo en `index.html` / `src/index.css` y actualizar `BrandLogo.tsx`.
2. **Paso 2 (Dashboard):** Reemplazar la presentación visual de `SynapsisHome.tsx` con el diseño de `dashboard_cl_nico` de Stitch, manteniendo las fuentes de datos de `DashboardSelectors.ts`.
3. **Paso 3 (Agenda):** Aplicar la presentación de `agenda_quir_rgica_y_citas` a `ClinicalAgendaView.tsx`, verificando que la máquina de estados y slots continúen respondiendo al repositorio.
4. **Paso 4 (Patient 360):** Renovar `Patient360Header.tsx` y `Patient360Timeline.tsx` con la estética de `patient_360_expediente_inteligente`.
5. **Paso 5 (Nueva Consulta):** Aplicar el layout de copiloto en `ClinicalActionSelector.tsx` y `ClinicalReviewScreen.tsx`.

---

## 21. BATERÍA DE PRUEBAS DE NO-REGRESIÓN

Tras cada paso de integración visual se ejecutarán obligatoriamente:
1. `npx tsc --noEmit` $\rightarrow$ 0 errores de tipado.
2. `npm run lint` $\rightarrow$ 0 warnings / errores.
3. `npx tsx scripts/testAgendaPhase2.ts` $\rightarrow$ 25/25 pruebas de agenda superadas.
4. `npx tsx scripts/testOperationalE2EPhase4Strict.ts` $\rightarrow$ 22/22 pruebas operativas E2E superadas.
5. `npm run test` (`scripts/runRegressionSuite.ts`) $\rightarrow$ 519/519 pruebas del Core superadas.
6. `npm run build` $\rightarrow$ Compilación limpia de producción.

---

## 22. CRITERIOS DE ACEPTACIÓN

1. La interfaz visual refleja fielmente el diseño moderno y profesional de Google Stitch.
2. Ningún dato ficticio de Stitch aparece en consultas reales de pacientes.
3. El aislamiento multi-tenant `CCMI-DR-SAMIR` y las reglas de Firebase permanecen inviolables.
4. La generación canónica de PDFs (Media Carta y A4) conserva dimensiones físicas exactas e integridad SHA-256.
5. El 100% de la suite de pruebas automatizadas (566 pruebas) se mantiene en estado VERDE.

---

> **ESTADO DE LA DIRECTIVA:**
> **AUDITORÍA Y PLAN DE INTEGRACIÓN COMPLETADOS.**
> No se ha modificado ningún archivo de código funcional.
> El sistema permanece en espera de su autorización explícita para iniciar la Fase S1 cuando lo determine oportuno.
