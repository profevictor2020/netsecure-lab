/* ============================================================
   NetSecure Lab — app.js
   Núcleo de la aplicación: carga de datos, navegación, estado,
   almacenamiento local, progreso, puntaje e informe final.
   No requiere backend ni conexión a servicios externos.
   ============================================================ */

const NSL = (function () {
  const STORAGE_KEY = "netsecure_lab_v1";
  const MODULOS_ORDEN = ["modulo1", "modulo2", "modulo3", "modulo4", "modulo5", "modulo6"];

  let CASO = null;           // datos del caso (JSON cargado)
  let state = crearEstadoVacio();

  function crearEstadoVacio() {
    return {
      casoId: null,
      alumno: "",
      iniciado: new Date().toISOString(),
      actualizado: null,
      respuestas: {},   // respuestas crudas por módulo
      resultados: {},   // { score, feedback[], completado } por módulo
      moduloActual: "inicio"
    };
  }

  /* ---------------- Carga de datos ---------------- */
  async function cargarCaso() {
    const casoConfig = obtenerCasoActivo();
    const resp = await fetch(casoConfig.archivo, { cache: "no-store" });
    if (!resp.ok) throw new Error("No fue posible cargar el archivo de datos del caso (" + casoConfig.archivo + ").");
    CASO = await resp.json();
    state.casoId = CASO.caso.id;
    return CASO;
  }

  /* ---------------- Persistencia local ---------------- */
  function guardarEstado(mostrarToast) {
    state.actualizado = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (mostrarToast) mostrarMensaje("Avance guardado en este navegador.");
    } catch (e) {
      if (mostrarToast) mostrarMensaje("No se pudo guardar (almacenamiento local no disponible).");
    }
  }

  function cargarEstadoGuardado() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const guardado = JSON.parse(raw);
      if (guardado && guardado.casoId === CASO.caso.id) {
        state = Object.assign(crearEstadoVacio(), guardado);
        return true;
      }
    } catch (e) { /* ignorar estado corrupto */ }
    return false;
  }

  function reiniciarEstado() {
    state = crearEstadoVacio();
    state.casoId = CASO.caso.id;
    guardarEstado(false);
  }

  /* ---------------- Navegación ---------------- */
  function irAModulo(id) {
    state.moduloActual = id;
    renderVistaActual();
    actualizarNav();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function actualizarNav() {
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      const mod = btn.dataset.modulo;
      btn.classList.toggle("active", mod === state.moduloActual);
      const completado = state.resultados[mod] && state.resultados[mod].completado;
      btn.classList.toggle("complete", !!completado);
    });
    actualizarProgreso();
  }

  function actualizarProgreso() {
    const total = MODULOS_ORDEN.length;
    const hechos = MODULOS_ORDEN.filter((m) => state.resultados[m] && state.resultados[m].completado).length;
    const pct = Math.round((hechos / total) * 100);
    document.getElementById("progressBar").style.width = pct + "%";

    const puntajeTotal = calcularPuntajeTotal();
    const badge = document.getElementById("scoreBadge");
    const val = document.getElementById("scoreValue");
    if (hechos > 0) {
      badge.hidden = false;
      val.textContent = puntajeTotal.obtenido;
      badge.title = puntajeTotal.obtenido + " de " + puntajeTotal.maximo + " puntos posibles";
    } else {
      badge.hidden = true;
    }
  }

  function calcularPuntajeTotal() {
    let obtenido = 0, maximo = 0;
    MODULOS_ORDEN.forEach((m) => {
      maximo += 100;
      if (state.resultados[m]) obtenido += Math.round(state.resultados[m].score || 0);
    });
    return { obtenido, maximo };
  }

  /* ---------------- Registro de resultados de módulo ---------------- */
  function registrarResultado(moduloId, resultado) {
    state.resultados[moduloId] = {
      score: resultado.score,
      feedback: resultado.feedback,
      completado: true,
      fecha: new Date().toISOString()
    };
    guardarEstado(false);
    actualizarNav();
  }

  function guardarRespuestas(moduloId, respuestas) {
    state.respuestas[moduloId] = respuestas;
  }

  /* ---------------- Render dispatcher ---------------- */
  function renderVistaActual() {
    const app = document.getElementById("app");
    app.innerHTML = "";
    const id = state.moduloActual;
    if (id === "inicio") return Modulos.renderInicio(app, CASO, state);
    if (id === "resumen") return Modulos.renderResumen(app, CASO, state);
    if (MODULOS_ORDEN.includes(id)) return Modulos.renderModulo(app, CASO, state, id);
    return Modulos.renderInicio(app, CASO, state);
  }

  /* ---------------- Utilidades UI ---------------- */
  let toastTimer = null;
  function mostrarMensaje(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2800);
  }

  /* ---------------- Descarga / informe ---------------- */
  function descargarJSON() {
    const puntaje = calcularPuntajeTotal();
    const informe = {
      aplicacion: "NetSecure Lab",
      caso: CASO.caso.nombre,
      alumno: state.alumno || "(sin nombre registrado)",
      fecha_inicio: state.iniciado,
      fecha_actualizacion: state.actualizado,
      puntaje_total: puntaje.obtenido,
      puntaje_maximo: puntaje.maximo,
      modulos: MODULOS_ORDEN.map((m) => ({
        modulo: m,
        titulo: CASO[m] ? CASO[m].titulo : m,
        completado: !!(state.resultados[m] && state.resultados[m].completado),
        puntaje: state.resultados[m] ? state.resultados[m].score : null,
        respuestas: state.respuestas[m] || null,
        retroalimentacion: state.resultados[m] ? state.resultados[m].feedback : null
      }))
    };
    const blob = new Blob([JSON.stringify(informe, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "netsecure-lab-resultados.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function imprimirInforme() {
    window.print();
  }

  /* ---------------- Inicialización ---------------- */
  async function init() {
    try {
      await cargarCaso();
    } catch (e) {
      document.getElementById("app").innerHTML =
        '<div class="panel"><h2>No se pudo cargar el laboratorio</h2>' +
        "<p>" + e.message + "</p>" +
        "<p>Si abriste el archivo <code>index.html</code> directamente con doble clic, tu navegador puede bloquear la carga de datos locales. " +
        "Ejecuta un servidor local (por ejemplo <code>python -m http.server</code>) en la carpeta del proyecto y abre " +
        "<code>http://localhost:8000</code>, o publica el proyecto en GitHub Pages.</p></div>";
      return;
    }

    const habiaGuardado = cargarEstadoGuardado();

    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => irAModulo(btn.dataset.modulo));
    });
    document.getElementById("btnGuardar").addEventListener("click", () => guardarEstado(true));
    document.getElementById("btnImprimir").addEventListener("click", () => imprimirInforme());

    irAModulo(habiaGuardado ? state.moduloActual : "inicio");
    if (habiaGuardado) mostrarMensaje("Se recuperó un avance guardado en este navegador.");
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    get CASO() { return CASO; },
    get state() { return state; },
    irAModulo,
    guardarEstado,
    reiniciarEstado,
    registrarResultado,
    guardarRespuestas,
    mostrarMensaje,
    descargarJSON,
    imprimirInforme,
    calcularPuntajeTotal,
    MODULOS_ORDEN
  };
})();
