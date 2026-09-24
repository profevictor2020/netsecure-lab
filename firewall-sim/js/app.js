/* ============================================================
   NetSecure Lab — Simulador de Firewall — app.js
   Estado, persistencia local y orquestación. Sin backend: todo
   vive en el navegador (localStorage) y se calcula con Motor.js.
   ============================================================ */

const App = (function () {
  const STORAGE_KEY = "netsecure_firewall_sim_v1";

  let ESCENARIO = null;
  let zonasPorId = {};
  let nodosPorId = {};
  let serviciosPorNombre = {};

  let state = {
    reglas: [],
    registro: [],
    progreso: {} // { [idEscenarioSugerido]: "ok" | "warn" | "bad" } — último resultado de cada escenario probado, no es una nota
  };

  /* ---------------- Carga de datos ---------------- */
  async function cargarEscenario() {
    const resp = await fetch("data/escenario.json", { cache: "no-store" });
    if (!resp.ok) throw new Error("No fue posible cargar los datos del escenario.");
    ESCENARIO = await resp.json();
    ESCENARIO.zonas.forEach((z) => (zonasPorId[z.id] = z));
    ESCENARIO.nodos.forEach((n) => (nodosPorId[n.id] = n));
    ESCENARIO.servicios.forEach((s) => (serviciosPorNombre[s.nombre] = s));
    return ESCENARIO;
  }

  const contexto = {
    zonaDe(nodoId) {
      if (!nodoId || Motor.esComodin(nodoId)) return null;
      const n = nodosPorId[nodoId];
      return n ? zonasPorId[n.zona] : null;
    },
    nombreDe(nodoId) {
      if (!nodoId || Motor.esComodin(nodoId)) return "Cualquiera";
      const n = nodosPorId[nodoId];
      return n ? n.nombre : nodoId;
    }
  };

  /* ---------------- Persistencia ---------------- */
  function guardarEstado(mostrarToast) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (mostrarToast) UI.mostrarMensaje("Avance guardado en este navegador.");
    } catch (e) {
      if (mostrarToast) UI.mostrarMensaje("No se pudo guardar (almacenamiento local no disponible).");
    }
  }

  function cargarEstadoGuardado() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const guardado = JSON.parse(raw);
      if (guardado && Array.isArray(guardado.reglas)) {
        state = Object.assign({ reglas: [], registro: [], progreso: {} }, guardado);
        return true;
      }
    } catch (e) { /* ignorar estado corrupto */ }
    return false;
  }

  function reiniciarSimulador() {
    state = { reglas: [], registro: [], progreso: {} };
    guardarEstado(false);
    UI.renderTodo();
    UI.mostrarMensaje("Simulador reiniciado.");
  }

  /* ---------------- Reglas ---------------- */
  function agregarRegla() {
    state.reglas.push(Motor.crearReglaVacia("Regla " + (state.reglas.length + 1)));
    guardarEstado(false);
  }

  function eliminarRegla(id) {
    state.reglas = state.reglas.filter((r) => r.id !== id);
    guardarEstado(false);
  }

  function actualizarRegla(id, cambios) {
    const r = state.reglas.find((x) => x.id === id);
    if (r) Object.assign(r, cambios);
    guardarEstado(false);
  }

  function moverRegla(id, delta) {
    const i = state.reglas.findIndex((r) => r.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= state.reglas.length) return;
    const tmp = state.reglas[i];
    state.reglas[i] = state.reglas[j];
    state.reglas[j] = tmp;
    guardarEstado(false);
  }

  function analizarReglaPorId(id) {
    const r = state.reglas.find((x) => x.id === id);
    return r ? Motor.analizarRegla(r, contexto) : [];
  }

  /* Crea una regla que resuelve exactamente el paquete recién probado, con
     la acción sugerida por el motor, y la coloca PRIMERA en la lista para
     garantizar que se aplique (first-match) sin importar qué otras reglas
     existan debajo. El estudiante puede editarla o reordenarla después —
     es un punto de partida, no una respuesta impuesta. */
  function crearReglaSugerida(paquete, accion) {
    const nombreOrigen = contexto.nombreDe(paquete.origen);
    const nombreDestino = contexto.nombreDe(paquete.destino);
    const regla = Motor.crearReglaVacia(`${nombreOrigen} → ${nombreDestino}`);
    Object.assign(regla, {
      origen: paquete.origen,
      destino: paquete.destino,
      protocolo: paquete.protocolo === "Cualquiera" ? "Cualquiera" : paquete.protocolo,
      puerto: paquete.puerto,
      ipOrigen: paquete.ipOrigen || "",
      ipDestino: paquete.ipDestino || "",
      accion,
      comentario: "Regla creada automáticamente desde Prueba de tráfico — revisa si tiene sentido y ajústala si es necesario."
    });
    state.reglas.unshift(regla);
    guardarEstado(false);
    return regla;
  }

  /* ---------------- Prueba de tráfico ---------------- */

  /* Si el paquete probado coincide exactamente con uno de los escenarios
     sugeridos, devuelve su id (para llevar el checklist de progreso). */
  function identificarEscenario(paquete) {
    const s = (ESCENARIO.solicitudesSugeridas || []).find((e) =>
      e.origen === paquete.origen &&
      e.destino === paquete.destino &&
      e.servicio === paquete.servicio
    );
    return s ? s.id : null;
  }

  function probarTrafico(paquete) {
    const evaluacion = Motor.evaluarTrafico(state.reglas, paquete);
    const feedback = Motor.generarFeedback(paquete, evaluacion, contexto);

    state.registro.unshift({
      hora: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      origen: contexto.nombreDe(paquete.origen),
      destino: contexto.nombreDe(paquete.destino),
      servicio: paquete.servicio,
      puerto: paquete.puerto,
      protocolo: paquete.protocolo,
      resultado: feedback.resultado,
      verdict: feedback.verdict,
      regla: evaluacion.reglaAplicada ? `#${evaluacion.indice + 1} ${evaluacion.reglaAplicada.nombre}` : "Denegado por defecto",
      registrado: feedback.registrado
    });
    if (state.registro.length > 50) state.registro.length = 50;

    const idEscenario = identificarEscenario(paquete);
    if (idEscenario) {
      state.progreso[idEscenario] = feedback.verdict;
      feedback.idEscenario = idEscenario;
    }

    guardarEstado(false);
    return feedback;
  }

  /* Resumen del checklist de escenarios sugeridos: cuenta "resuelto" solo
     cuando quedó sin ningún riesgo (verdict "ok"). No es un puntaje, es un
     conteo de tareas — warn/bad quedan visibles pero no cuentan como listas. */
  function progresoResumen() {
    const total = (ESCENARIO.solicitudesSugeridas || []).length;
    const resueltos = Object.values(state.progreso).filter((v) => v === "ok").length;
    return { resueltos, total };
  }

  function limpiarRegistro() {
    state.registro = [];
    guardarEstado(false);
  }

  /* ---------------- Descargas ---------------- */
  function descargarJSON(objeto, nombreArchivo) {
    const blob = new Blob([JSON.stringify(objeto, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function descargarReglas() {
    descargarJSON({ reglas: state.reglas }, "firewall-sim-reglas.json");
  }

  function descargarRegistro() {
    descargarJSON({ registro: state.registro }, "firewall-sim-registro.json");
  }

  /* ---------------- Inicialización ---------------- */
  async function init() {
    try {
      await cargarEscenario();
    } catch (e) {
      document.getElementById("app").innerHTML =
        '<div class="panel"><h2>No se pudo cargar el simulador</h2><p>' + e.message + "</p>" +
        "<p>Si abriste <code>index.html</code> con doble clic, tu navegador bloquea la carga de datos locales. " +
        "Ejecuta un servidor local (<code>python -m http.server</code>) o abre el simulador publicado en GitHub Pages.</p></div>";
      return;
    }
    cargarEstadoGuardado();
    UI.init(ESCENARIO, { zonasPorId, nodosPorId, serviciosPorNombre });
    UI.renderTodo();
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    get ESCENARIO() { return ESCENARIO; },
    get state() { return state; },
    get zonasPorId() { return zonasPorId; },
    get nodosPorId() { return nodosPorId; },
    get serviciosPorNombre() { return serviciosPorNombre; },
    contexto,
    guardarEstado,
    reiniciarSimulador,
    agregarRegla,
    eliminarRegla,
    actualizarRegla,
    moverRegla,
    analizarReglaPorId,
    crearReglaSugerida,
    probarTrafico,
    progresoResumen,
    limpiarRegistro,
    descargarReglas,
    descargarRegistro
  };
})();
