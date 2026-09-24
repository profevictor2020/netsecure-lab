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
    registro: []
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
        state = Object.assign({ reglas: [], registro: [] }, guardado);
        return true;
      }
    } catch (e) { /* ignorar estado corrupto */ }
    return false;
  }

  function reiniciarSimulador() {
    state = { reglas: [], registro: [] };
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

  /* ---------------- Prueba de tráfico ---------------- */
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
    guardarEstado(false);
    return feedback;
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
    probarTrafico,
    limpiarRegistro,
    descargarReglas,
    descargarRegistro
  };
})();
