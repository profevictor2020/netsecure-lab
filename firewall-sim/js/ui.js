/* ============================================================
   NetSecure Lab — Simulador de Firewall — ui.js
   Renderizado y eventos. Sin frameworks: DOM directo.
   ============================================================ */

const UI = (function () {
  let ESCENARIO = null;
  let zonasPorId = {};
  let nodosPorId = {};
  let vistaActual = "introduccion";
  let toastTimer = null;

  const SERVICIOS_RAPIDOS = [
    { nombre: "HTTPS", puerto: "443", protocolo: "TCP" },
    { nombre: "HTTP", puerto: "80", protocolo: "TCP" },
    { nombre: "SSH", puerto: "22", protocolo: "TCP" },
    { nombre: "PostgreSQL", puerto: "5432", protocolo: "TCP" },
    { nombre: "RDP", puerto: "3389", protocolo: "TCP" },
    { nombre: "DNS", puerto: "53", protocolo: "UDP" },
    { nombre: "ICMP (ping)", puerto: "", protocolo: "ICMP" },
    { nombre: "Cualquier servicio", puerto: "cualquiera", protocolo: "Cualquiera" }
  ];

  function esc(str) {
    if (str === undefined || str === null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function el(html) {
    const div = document.createElement("div");
    div.innerHTML = html.trim();
    return div.firstElementChild;
  }

  function init(escenario, maps) {
    ESCENARIO = escenario;
    zonasPorId = maps.zonasPorId;
    nodosPorId = maps.nodosPorId;

    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => irAVista(btn.dataset.vista));
    });
    document.getElementById("btnGuardar").addEventListener("click", () => App.guardarEstado(true));
    document.getElementById("btnReiniciar").addEventListener("click", () => {
      if (confirm("Esto borrará todas tus reglas y el registro de pruebas guardados en este navegador. ¿Continuar?")) {
        App.reiniciarSimulador();
      }
    });
  }

  function irAVista(id) {
    vistaActual = id;
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.vista === id));
    renderVista();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderTodo() {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.vista === vistaActual));
    renderVista();
    actualizarProgresoBadge();
  }

  /* El badge del encabezado muestra cuántos de los 10 escenarios sugeridos
     quedaron resueltos sin riesgo. No es una nota: es un check-list de
     tareas, para que el estudiante sepa qué le falta por resolver. */
  function actualizarProgresoBadge() {
    const { resueltos, total } = App.progresoResumen();
    const badge = document.getElementById("progresoBadge");
    const val = document.getElementById("progresoValue");
    const max = document.getElementById("progresoMax");
    if (!badge) return;
    val.textContent = resueltos;
    max.textContent = total;
    badge.hidden = resueltos === 0;
  }

  function renderVista() {
    const app = document.getElementById("app");
    app.innerHTML = "";
    if (vistaActual === "reglas") return renderReglas(app);
    if (vistaActual === "prueba") return renderPrueba(app);
    return renderIntroduccion(app);
  }

  function mostrarMensaje(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2800);
  }

  /* ============================================================
     INTRODUCCIÓN
     ============================================================ */
  function renderIntroduccion(app) {
    const zonasHTML = ESCENARIO.zonas.map((z) => `
      <div class="case-card">
        <h4>${esc(z.nombre)} <span class="trust-badge trust-${z.confianza}">${esc(z.confianzaLabel)}</span></h4>
        <p>${esc(z.descripcion)}</p>
      </div>`).join("");

    const { resueltos, total } = App.progresoResumen();

    app.appendChild(el(`
      <section class="panel">
        <span class="tag">Simulador de firewall</span>
        <h2>${esc(ESCENARIO.caso.nombre)}</h2>
        <p class="intro-text">${esc(ESCENARIO.caso.descripcion)}</p>

        <div class="objetivo-box">
          <h3 style="margin-top:0">🎯 Tu objetivo</h3>
          <p style="margin-bottom:0">
            FríoSur necesita resolver <strong>10 comunicaciones reales</strong> entre sus sistemas
            (por ejemplo: "¿los usuarios deben poder entrar al sistema de pedidos?", "¿una cámara
            debería poder salir libremente a Internet?"). Tu tarea es <strong>crear las reglas de
            firewall</strong> necesarias para que cada una quede resuelta correctamente — permitida
            cuando corresponde, bloqueada cuando no. La lista completa está en
            <strong>Prueba de tráfico</strong>, con tu progreso: <strong>${resueltos} de ${total}</strong> resueltas sin riesgo hasta ahora.
          </p>
        </div>

        <h3 style="margin-top:22px">Cómo hacerlo, paso a paso</h3>
        <ol class="how-it-works">
          <li>Ve a <strong>Prueba de tráfico</strong> y elige uno de los 10 escenarios de la lista.</li>
          <li>Presiona <strong>Probar</strong> y observa el resultado: si el firewall aún no tiene reglas, todo queda <strong>bloqueado por defecto</strong> — es normal, es el punto de partida.</li>
          <li>Lee la retroalimentación: te dice si el resultado tiene algún riesgo y qué deberías ajustar.</li>
          <li>Si necesitas cambiar el resultado, ve a <strong>Reglas de firewall</strong> y crea (o edita) una regla: origen, destino, servicio y si se permite, se bloquea, o se permite y registra.</li>
          <li>Vuelve a <strong>Prueba de tráfico</strong> y prueba de nuevo el mismo escenario para confirmar que ahora queda bien resuelto. Repite hasta cubrir los 10.</li>
        </ol>
        <p class="intro-text" style="margin-top:-4px">No hay nota ni puntaje — puedes probar, corregir y volver a probar todas las veces que quieras. El contador de arriba es solo para que sepas cuánto te falta.</p>

        <h3 style="margin-top:22px">Zonas de red de este caso</h3>
        <div class="case-brief">${zonasHTML}</div>

        <div class="module-actions">
          <button class="btn btn-primary" id="btnComenzar">Empezar: ir a Prueba de tráfico →</button>
          <button class="btn btn-secondary" id="btnIrReglas">Ir a Reglas de firewall</button>
        </div>
      </section>
    `));
    document.getElementById("btnComenzar").addEventListener("click", () => irAVista("prueba"));
    document.getElementById("btnIrReglas").addEventListener("click", () => irAVista("reglas"));
  }

  /* ============================================================
     REGLAS DE FIREWALL
     ============================================================ */
  function opcionesNodos(seleccion, incluirCualquiera) {
    let opts = incluirCualquiera ? `<option value="cualquiera" ${seleccion === "cualquiera" ? "selected" : ""}>Cualquiera</option>` : "";
    ESCENARIO.nodos.forEach((n) => {
      opts += `<option value="${n.id}" ${seleccion === n.id ? "selected" : ""}>${esc(n.nombre)}</option>`;
    });
    return opts;
  }
  function opcionesProtocolo(seleccion) {
    return ESCENARIO.protocolos.map((p) => `<option value="${p}" ${seleccion === p ? "selected" : ""}>${p}</option>`).join("");
  }

  function reglaCardHTML(regla, index, total) {
    const avisos = App.analizarReglaPorId(regla.id);
    const avisosHTML = avisos.map((a) => `<span class="aviso aviso-${a.tipo}">${a.tipo === "insegura" ? "⛔" : a.tipo === "advertencia" ? "⚠" : "💡"} ${esc(a.texto)}</span>`).join("");

    return `
      <div class="regla-card ${regla.habilitada ? "" : "regla-deshabilitada"}" data-regla="${regla.id}">
        <div class="regla-top">
          <span class="regla-num">#${index + 1}</span>
          <input type="text" class="regla-nombre" data-campo="nombre" value="${esc(regla.nombre)}" placeholder="Nombre de la regla">
          <label class="regla-toggle">
            <input type="checkbox" data-campo="habilitada" ${regla.habilitada ? "checked" : ""}> Habilitada
          </label>
          <div class="regla-mover">
            <button class="btn-icon" data-accion="subir" ${index === 0 ? "disabled" : ""} title="Mover arriba">▲</button>
            <button class="btn-icon" data-accion="bajar" ${index === total - 1 ? "disabled" : ""} title="Mover abajo">▼</button>
            <button class="btn-icon btn-icon-danger" data-accion="eliminar" title="Eliminar regla">🗑</button>
          </div>
        </div>

        <div class="regla-grid">
          <div class="campo">
            <label>Dirección</label>
            <select data-campo="direccion">
              <option value="entrada" ${regla.direccion === "entrada" ? "selected" : ""}>Entrada</option>
              <option value="salida" ${regla.direccion === "salida" ? "selected" : ""}>Salida</option>
            </select>
          </div>
          <div class="campo">
            <label>Zona / nodo origen</label>
            <select data-campo="origen">${opcionesNodos(regla.origen, true)}</select>
          </div>
          <div class="campo">
            <label>Zona / nodo destino</label>
            <select data-campo="destino">${opcionesNodos(regla.destino, true)}</select>
          </div>
          <div class="campo">
            <label>IP origen (opcional)</label>
            <input type="text" data-campo="ipOrigen" value="${esc(regla.ipOrigen)}" placeholder="cualquiera">
          </div>
          <div class="campo">
            <label>IP destino (opcional)</label>
            <input type="text" data-campo="ipDestino" value="${esc(regla.ipDestino)}" placeholder="cualquiera">
          </div>
          <div class="campo">
            <label>Protocolo</label>
            <select data-campo="protocolo">${opcionesProtocolo(regla.protocolo)}</select>
          </div>
          <div class="campo">
            <label>Puerto / servicio</label>
            <input type="text" data-campo="puerto" value="${esc(regla.puerto)}" placeholder="cualquiera">
          </div>
        </div>

        <div class="servicios-rapidos">
          ${SERVICIOS_RAPIDOS.map((s) => `<button type="button" class="chip" data-servicio-rapido="${esc(s.nombre)}" data-puerto="${esc(s.puerto)}" data-protocolo="${esc(s.protocolo)}">${esc(s.nombre)}</button>`).join("")}
        </div>

        <div class="campo" style="margin-top:10px">
          <label>Acción</label>
          <div class="decision-group decision-row">
            <label><input type="radio" name="accion-${regla.id}" value="permitir" ${regla.accion === "permitir" ? "checked" : ""}> Permitir</label>
            <label><input type="radio" name="accion-${regla.id}" value="bloquear" ${regla.accion === "bloquear" ? "checked" : ""}> Bloquear</label>
            <label><input type="radio" name="accion-${regla.id}" value="permitir_registrar" ${regla.accion === "permitir_registrar" ? "checked" : ""}> Permitir y registrar</label>
          </div>
        </div>

        <div class="campo" style="margin-top:10px">
          <label>Justificación</label>
          <textarea data-campo="comentario" placeholder="¿Por qué esta regla es necesaria?">${esc(regla.comentario)}</textarea>
        </div>

        ${avisosHTML ? `<div class="avisos-box">${avisosHTML}</div>` : ""}
      </div>`;
  }

  function renderReglas(app) {
    const reglas = App.state.reglas;
    const listaHTML = reglas.length
      ? reglas.map((r, i) => reglaCardHTML(r, i, reglas.length)).join("")
      : `<div class="panel-empty">
          <strong>Todavía no tienes ninguna regla — por eso el firewall bloquea todo (denegado por defecto).</strong>
          <ol class="how-it-works" style="text-align:left;max-width:440px;margin:14px auto 0">
            <li>Presiona <strong>"+ Agregar regla"</strong> abajo.</li>
            <li>Elige el origen y el destino (por ejemplo, Usuarios → Servidor web).</li>
            <li>Elige el servicio (o usa un chip rápido como HTTPS).</li>
            <li>Elige la acción: permitir, bloquear, o permitir y registrar.</li>
            <li>Ve a <strong>Prueba de tráfico</strong> y comprueba el resultado.</li>
          </ol>
        </div>`;

    app.appendChild(el(`
      <section class="panel">
        <span class="tag">Configuración</span>
        <h2>Reglas de firewall</h2>
        <p class="intro-text">Se evalúan de arriba hacia abajo; se aplica la primera que coincide. Si ninguna coincide, se deniega por defecto.</p>
        <div id="reglasLista">${listaHTML}</div>
        <div class="module-actions">
          <button class="btn btn-primary" id="btnAgregarRegla">+ Agregar regla</button>
          <button class="btn btn-secondary" id="btnDescargarReglas">Descargar reglas (JSON)</button>
          <button class="btn btn-secondary" id="btnIrPrueba">Ir a Prueba de tráfico →</button>
        </div>
      </section>
    `));

    document.getElementById("btnAgregarRegla").addEventListener("click", () => { App.agregarRegla(); renderVista(); });
    document.getElementById("btnDescargarReglas").addEventListener("click", () => App.descargarReglas());
    document.getElementById("btnIrPrueba").addEventListener("click", () => irAVista("prueba"));

    document.querySelectorAll(".regla-card").forEach((card) => {
      const id = card.dataset.regla;

      card.querySelectorAll("[data-campo]").forEach((campo) => {
        const nombre = campo.dataset.campo;
        const evento = campo.tagName === "SELECT" || campo.type === "checkbox" ? "change" : "input";
        campo.addEventListener(evento, () => {
          const valor = campo.type === "checkbox" ? campo.checked : campo.value;
          App.actualizarRegla(id, { [nombre]: valor });
          if (nombre === "origen" || nombre === "destino" || nombre === "protocolo" || nombre === "puerto" || nombre === "accion") {
            renderVista();
          }
        });
      });

      card.querySelectorAll(`input[name="accion-${id}"]`).forEach((radio) => {
        radio.addEventListener("change", () => {
          App.actualizarRegla(id, { accion: radio.value });
          renderVista();
        });
      });

      card.querySelectorAll("[data-servicio-rapido]").forEach((chip) => {
        chip.addEventListener("click", () => {
          App.actualizarRegla(id, { protocolo: chip.dataset.protocolo, puerto: chip.dataset.puerto });
          renderVista();
        });
      });

      card.querySelectorAll("[data-accion]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const accion = btn.dataset.accion;
          if (accion === "subir") App.moverRegla(id, -1);
          if (accion === "bajar") App.moverRegla(id, 1);
          if (accion === "eliminar") {
            if (confirm("¿Eliminar esta regla?")) App.eliminarRegla(id);
          }
          renderVista();
        });
      });
    });
  }

  /* ============================================================
     PRUEBA DE TRÁFICO
     ============================================================ */
  function opcionesNodosConcretos(seleccion) {
    return ESCENARIO.nodos.map((n) => `<option value="${n.id}" ${seleccion === n.id ? "selected" : ""}>${esc(n.nombre)}</option>`).join("");
  }
  function opcionesServicios(seleccion) {
    return ESCENARIO.servicios.map((s) => `<option value="${esc(s.nombre)}" ${seleccion === s.nombre ? "selected" : ""}>${esc(s.nombre)}</option>`).join("");
  }
  function opcionesRoles(seleccion) {
    let opts = `<option value="">— No especificado —</option>`;
    ESCENARIO.roles.forEach((r) => { opts += `<option value="${r.id}" ${seleccion === r.id ? "selected" : ""}>${esc(r.nombre)}</option>`; });
    return opts;
  }

  function feedbackHTML(fb, paquete) {
    const resultadoLabel = fb.resultado === "permitido" ? "PERMITIDO" : "BLOQUEADO";
    // El color del badge sigue el veredicto (riesgo real), no solo el resultado:
    // un "permitido" riesgoso se ve en rojo, no en verde.
    const claseVerdict = fb.verdict === "ok" ? "resultado-ok" : fb.verdict === "warn" ? "resultado-warn" : "resultado-bad";
    const nombreOrigen = nodosPorId[paquete.origen] ? nodosPorId[paquete.origen].nombre : paquete.origen;
    const nombreDestino = nodosPorId[paquete.destino] ? nodosPorId[paquete.destino].nombre : paquete.destino;
    let html = `<div class="feedback-box">`;
    html += `<div class="comunicacion-probada">Comunicación probada: <strong>${esc(nombreOrigen)} → ${esc(nombreDestino)}</strong> (${esc(paquete.servicio)}${paquete.puerto && paquete.puerto !== "cualquiera" ? ", puerto " + esc(paquete.puerto) : ""})</div>`;
    html += `<div class="resultado-badge ${claseVerdict}">${resultadoLabel}</div>`;
    html += `<dl class="feedback-dl">`;
    html += `<dt>Regla aplicada</dt><dd>${fb.reglaAplicada ? "#" + (fb.indice + 1) + " — " + esc(fb.reglaAplicada.nombre) : "Ninguna (denegado por defecto)"}</dd>`;
    html += `<dt>Motivo</dt><dd>${esc(fb.motivo)}</dd>`;
    if (fb.riesgo) html += `<dt>Riesgo asociado</dt><dd class="dd-riesgo">${esc(fb.riesgo)}</dd>`;
    if (fb.mejora) html += `<dt>Cómo mejorar</dt><dd>${esc(fb.mejora)}</dd>`;
    if (fb.notaRetorno) html += `<dt>Sobre el tráfico de retorno</dt><dd class="dd-info">${esc(fb.notaRetorno)}</dd>`;
    html += `<dt>¿Se generó registro?</dt><dd>${fb.registrado ? "Sí" : "No"}</dd>`;
    html += `</dl></div>`;
    return html;
  }

  function registroTablaHTML() {
    const reg = App.state.registro;
    if (!reg.length) return `<p class="panel-empty">Aún no has probado ninguna comunicación.</p>`;
    const filas = reg.map((r) => `
      <tr>
        <td>${esc(r.hora)}</td>
        <td>${esc(r.origen)}</td>
        <td>${esc(r.destino)}</td>
        <td>${esc(r.servicio)}${r.puerto && r.puerto !== "cualquiera" ? " (" + esc(r.puerto) + ")" : ""}</td>
        <td><span class="badge-resultado ${r.verdict || (r.resultado === "permitido" ? "ok" : "bad")}">${r.resultado === "permitido" ? "Permitido" : "Bloqueado"}</span></td>
        <td>${esc(r.regla)}</td>
        <td class="center">${r.registrado ? "Sí" : "No"}</td>
      </tr>`).join("");
    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Hora</th><th>Origen</th><th>Destino</th><th>Servicio</th><th>Resultado</th><th>Regla aplicada</th><th>Registrado</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>`;
  }

  function estadoEscenario(idEscenario) {
    const v = App.state.progreso[idEscenario];
    if (v === "ok") return { clase: "ok", texto: "Resuelto" };
    if (v === "warn") return { clase: "warn", texto: "Con advertencia" };
    if (v === "bad") return { clase: "bad", texto: "Riesgoso" };
    return { clase: "pendiente", texto: "Sin probar" };
  }

  function checklistHTML() {
    const filas = ESCENARIO.solicitudesSugeridas.map((s) => {
      const estado = estadoEscenario(s.id);
      const nombreOrigen = nodosPorId[s.origen] ? nodosPorId[s.origen].nombre : s.origen;
      const nombreDestino = nodosPorId[s.destino] ? nodosPorId[s.destino].nombre : s.destino;
      return `
        <div class="escenario-item">
          <span class="badge-resultado ${estado.clase}">${estado.texto}</span>
          <div class="escenario-texto">
            <strong>${esc(nombreOrigen)} → ${esc(nombreDestino)}</strong> <span class="escenario-servicio">(${esc(s.servicio)})</span>
            <div class="escenario-contexto">${esc(s.contexto)}</div>
          </div>
          <button type="button" class="btn btn-secondary" data-probar-sugerencia="${s.id}">Probar</button>
        </div>`;
    }).join("");
    return `<div class="checklist">${filas}</div>`;
  }

  function renderPrueba(app) {
    app.appendChild(el(`
      <section class="panel">
        <span class="tag">Simulación</span>
        <h2>Prueba de tráfico</h2>
        <p class="intro-text">Prueba cada uno de los 10 escenarios que FríoSur necesita resolver. Presiona "Probar" para autocompletar y ejecutar la prueba de inmediato.</p>

        <div id="checklistEscenarios">${checklistHTML()}</div>

        <h3 style="margin-top:24px">O arma tu propia prueba</h3>
        <p class="intro-text">Útil para explorar casos que no están en la lista de arriba.</p>

        <div class="regla-grid" style="margin-top:14px">
          <div class="campo">
            <label>Origen</label>
            <select id="pOrigen">${opcionesNodosConcretos("usuarios")}</select>
          </div>
          <div class="campo">
            <label>Destino</label>
            <select id="pDestino">${opcionesNodosConcretos("servidor_web")}</select>
          </div>
          <div class="campo">
            <label>Servicio</label>
            <select id="pServicio">${opcionesServicios("HTTPS")}</select>
          </div>
          <div class="campo">
            <label>Puerto</label>
            <input type="text" id="pPuerto" value="443" readonly>
          </div>
          <div class="campo">
            <label>Protocolo</label>
            <input type="text" id="pProtocolo" value="TCP" readonly>
          </div>
          <div class="campo">
            <label>Usuario o rol (opcional)</label>
            <select id="pRol">${opcionesRoles("")}</select>
          </div>
          <div class="campo">
            <label>IP origen (opcional)</label>
            <input type="text" id="pIpOrigen" placeholder="cualquiera">
          </div>
          <div class="campo">
            <label>IP destino (opcional)</label>
            <input type="text" id="pIpDestino" placeholder="cualquiera">
          </div>
        </div>

        <div class="module-actions">
          <button class="btn btn-primary" id="btnProbar">Probar comunicación</button>
        </div>

        <div id="resultadoPrueba"></div>

        <h3 style="margin-top:26px">Registro de pruebas de esta sesión</h3>
        <div id="registroPruebas">${registroTablaHTML()}</div>
        <div class="module-actions">
          <button class="btn btn-secondary" id="btnDescargarRegistro">Descargar registro (JSON)</button>
          <button class="btn btn-danger-outline" id="btnLimpiarRegistro">Limpiar registro</button>
        </div>
      </section>
    `));

    const servicioSel = document.getElementById("pServicio");
    const puertoInput = document.getElementById("pPuerto");
    const protocoloInput = document.getElementById("pProtocolo");
    const camposManual = ["pOrigen", "pDestino", "pServicio", "pRol", "pIpOrigen", "pIpDestino"];
    let huboUnaPrueba = false;

    function sincronizarServicio() {
      const s = ESCENARIO.servicios.find((x) => x.nombre === servicioSel.value);
      if (s) { puertoInput.value = s.puerto || "cualquiera"; protocoloInput.value = s.protocolo; }
    }
    servicioSel.addEventListener("change", sincronizarServicio);
    sincronizarServicio();

    /* Si el estudiante cambia cualquier campo sin volver a presionar
       "Probar comunicación", el resultado anterior queda obsoleto (ya no
       corresponde a lo que hay en el formulario). Para evitar confusión
       lo limpiamos de inmediato en vez de dejarlo ahí. */
    function marcarResultadoObsoleto() {
      if (!huboUnaPrueba) return;
      document.getElementById("resultadoPrueba").innerHTML =
        `<p class="panel-empty">Cambiaste los datos de la prueba — presiona "Probar comunicación" para ver el resultado actualizado.</p>`;
    }
    camposManual.forEach((id) => {
      document.getElementById(id).addEventListener("input", marcarResultadoObsoleto);
      document.getElementById(id).addEventListener("change", marcarResultadoObsoleto);
    });

    function ejecutarPrueba() {
      const paquete = {
        origen: document.getElementById("pOrigen").value,
        destino: document.getElementById("pDestino").value,
        servicio: servicioSel.value,
        puerto: puertoInput.value,
        protocolo: protocoloInput.value,
        rol: document.getElementById("pRol").value,
        ipOrigen: document.getElementById("pIpOrigen").value,
        ipDestino: document.getElementById("pIpDestino").value
      };
      const fb = App.probarTrafico(paquete);
      huboUnaPrueba = true;
      document.getElementById("resultadoPrueba").innerHTML = feedbackHTML(fb, paquete);
      document.getElementById("registroPruebas").innerHTML = registroTablaHTML();
      document.getElementById("checklistEscenarios").innerHTML = checklistHTML();
      wireChecklist();
      actualizarProgresoBadge();
      document.getElementById("resultadoPrueba").scrollIntoView({ behavior: "smooth" });
    }

    function wireChecklist() {
      document.querySelectorAll("[data-probar-sugerencia]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const s = ESCENARIO.solicitudesSugeridas.find((x) => x.id === btn.dataset.probarSugerencia);
          if (!s) return;
          document.getElementById("pOrigen").value = s.origen;
          document.getElementById("pDestino").value = s.destino;
          servicioSel.value = s.servicio;
          sincronizarServicio();
          ejecutarPrueba();
        });
      });
    }
    wireChecklist();

    document.getElementById("btnProbar").addEventListener("click", ejecutarPrueba);

    document.getElementById("btnDescargarRegistro").addEventListener("click", () => App.descargarRegistro());
    document.getElementById("btnLimpiarRegistro").addEventListener("click", () => {
      if (confirm("¿Borrar el registro de pruebas de esta sesión?")) {
        App.limpiarRegistro();
        document.getElementById("registroPruebas").innerHTML = registroTablaHTML();
      }
    });
  }

  return { init, renderTodo, mostrarMensaje };
})();
