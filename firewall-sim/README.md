# Simulador de Firewall — NetSecure Lab

Herramienta de **práctica libre, sin nota**: el estudiante crea sus propias reglas de firewall, prueba comunicaciones concretas y ve en tiempo real si se permiten o bloquean, con retroalimentación educativa. No requiere backend, no simula tráfico real, no se conecta a ninguna red y no ejecuta comandos del sistema.

Es una de las dos herramientas del repositorio `netsecure-lab` — ver el [README general](../README.md) para la vista completa (incluye el laboratorio evaluado de 10 módulos en [`lab/`](../lab/)).

---

## 1. Estructura

```
firewall-sim/
├── index.html           → estructura de la aplicación (una sola página, 3 vistas)
├── css/
│   └── style.css        → estilos (mismo tema que el laboratorio principal)
├── js/
│   ├── motor.js         → lógica pura del firewall: coincidencia de reglas, evaluación
│   │                       de tráfico y heurísticas de riesgo (sin DOM)
│   ├── app.js            → estado, persistencia en localStorage, orquestación
│   └── ui.js             → renderizado de las 3 vistas y eventos de la interfaz
└── data/
    └── escenario.json   → zonas, nodos, servicios, roles y escenarios sugeridos (editable)
```

No hay build ni pasos de compilación.

## 2. Cómo probarlo localmente

```bash
cd netsecure-lab
python3 -m http.server 8000
```

Abre `http://localhost:8000/firewall-sim/`.

## 3. Cómo funciona el motor del firewall

La lógica vive en `js/motor.js` y es una simulación fiel (aunque simplificada) del comportamiento real de un firewall:

1. **Las reglas se evalúan de arriba hacia abajo.**
2. **Se aplica la primera regla habilitada que coincide** (first-match). El estudiante puede reordenarlas con las flechas ▲▼.
3. **Si ninguna regla coincide, se aplica la política por defecto: denegar.** Esto no es una regla editable — es el comportamiento base de cualquier firewall bien configurado.
4. Cada regla puede **habilitarse o deshabilitarse** sin eliminarla.
5. El motor calcula **advertencias en vivo** sobre cada regla (no dependen de una "respuesta correcta"; son señales de buenas prácticas):
   - Regla insegura: permite cualquier origen hacia cualquier destino sin restricción.
   - Servicio sin restricción (cualquier puerto/protocolo) hacia una zona crítica.
   - Zona no confiable con acceso directo a una zona crítica.
   - Dispositivo IoT (cámaras/sensores) con salida sin restricción a Internet.
   - Sugerencia de usar "permitir y registrar" en accesos a recursos críticos.
6. Al **permitir** una comunicación, el simulador muestra una nota sobre el **tráfico de retorno**: un firewall con estado permite automáticamente la respuesta de una conexión permitida, sin necesitar una regla aparte.
7. Cada prueba de tráfico queda en el **registro de pruebas** de la sesión (auditoría ligera), con hora, origen, destino, servicio, resultado, regla aplicada y si quedó registrada.

### Simplificaciones deliberadas (es un simulador, no un firewall real)

- Las **IP origen/destino** son texto libre opcional con coincidencia exacta (o comodín "cualquiera") — no hay soporte de rangos/CIDR, porque no es necesario para el objetivo pedagógico y evita dar una falsa sensación de estar configurando hardware real.
- El campo **Dirección** (entrada/salida) es informativo — no participa en la coincidencia de reglas, que se basa en zona/nodo origen y destino.

## 4. Cómo modificar el escenario

Todo el contenido vive en **`data/escenario.json`**:

- `zonas`: cada zona tiene un `id`, `nombre`, nivel de `confianza` (0 a 4, usado por las heurísticas) y `confianzaLabel`/`descripcion` (texto mostrado al estudiante).
- `nodos`: los puntos de red concretos que aparecen en los selectores de origen/destino (cada uno pertenece a una `zona`).
- `protocolos` y `servicios`: opciones disponibles en los formularios (los `servicios` también alimentan los chips de autocompletado en el editor de reglas).
- `roles`: opciones del campo "usuario o rol" en la prueba de tráfico (informativo).
- `solicitudesSugeridas`: los escenarios de práctica sugeridos (chips de autocompletado en "Prueba de tráfico"). Cada uno tiene `origen`/`destino` (ids de `nodos`), `servicio`, `puerto`, `protocolo` y un `contexto` (texto explicativo, se muestra como mensaje al hacer clic).

Reglas al editar:

- Cada `id` debe ser único dentro de su lista, porque el código los usa para relacionar zonas, nodos y servicios.
- Si agregas un nodo nuevo, asegúrate de que su `zona` sea el `id` de una zona existente.
- Puedes validar el JSON en <https://jsonlint.com/> o con `python3 -m json.tool data/escenario.json`.

## 5. Cómo modificar las heurísticas de retroalimentación

Las heurísticas de riesgo (qué combinación de zonas/servicios genera una advertencia) están escritas en JavaScript, no en el JSON, porque son reglas de razonamiento (no datos tabulares):

- `Motor.analizarRegla()` en `js/motor.js` — advertencias sobre una regla del editor.
- `Motor.generarFeedback()` en `js/motor.js` — retroalimentación al probar una comunicación (motivo, riesgo, cómo mejorar, nota de tráfico de retorno).

Ambas funciones están comentadas y usan el nivel de `confianza` de las zonas (definido en el JSON) más algunos casos específicos del caso FríoSur (por ejemplo, que el proveedor externo solo debería llegar al servidor de despacho). Para adaptar el simulador a otro caso de estudio, ajusta también estos casos específicos.

## 6. Notas importantes

- No se solicitan ni almacenan credenciales reales.
- El avance (reglas configuradas y registro de pruebas) se guarda en `localStorage`, local al navegador del estudiante.
- Es una herramienta de **práctica libre**: no hay una "respuesta correcta" única que el sistema compare — la retroalimentación evalúa las *consecuencias* de la configuración que el propio estudiante construyó.
