/* ============================================================
   NetSecure Lab — modulos.js
   Renderizado y evaluación pedagógica de cada módulo.
   Toda la lógica de evaluación es local (sin backend ni IA remota).
   ============================================================ */

const Modulos = (function () {

  /* ---------------- Utilidades ---------------- */
  function esc(str) {
    if (str === undefined || str === null) return "";
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function el(html) {
    const div = document.createElement("div");
    div.innerHTML = html.trim();
    return div.firstElementChild;
  }
  function verdictLabel(v) {
    return v === "ok" ? "Adecuado" : v === "warn" ? "Mejorable" : "A corregir";
  }

  function feedbackBoxHTML(score, items) {
    let html = '<div class="feedback-box"><div class="feedback-header">' +
      '<h3 style="margin:0;color:var(--text)">Retroalimentación</h3>' +
      '<span class="fh-score">' + Math.round(score) + '<span style="font-size:13px;color:var(--text-muted)">/100</span></span>' +
      '</div><div class="feedback-body">';
    items.forEach((it) => {
      html += '<div class="fb-item">';
      html += '<span class="fb-verdict ' + it.verdict + '">' + verdictLabel(it.verdict) + '</span>';
      html += '<h4 style="margin:2px 0">' + esc(it.titulo) + '</h4>';
      html += '<dl>';
      if (it.concepto) html += '<dt>Concepto aplicado</dt><dd>' + esc(it.concepto) + '</dd>';
      if (it.motivo) html += '<dt>Por qué</dt><dd>' + esc(it.motivo) + '</dd>';
      if (it.riesgo) html += '<dt>Riesgo asociado</dt><dd>' + esc(it.riesgo) + '</dd>';
      if (it.mejora) html += '<dt>Cómo mejorar</dt><dd>' + esc(it.mejora) + '</dd>';
      html += '</dl></div>';
    });
    html += '</div></div>';
    return html;
  }

  function moduleActionsHTML(moduloId, yaCompletado) {
    return '<div class="module-actions">' +
      '<button class="btn btn-primary" id="btnRevisar">' + (yaCompletado ? "Volver a revisar" : "Revisar respuestas") + '</button>' +
      '<button class="btn btn-secondary" id="btnGuardarModulo">Guardar avance</button>' +
      '</div>';
  }

  /* Pone el botón "Revisar respuestas" en estado de carga mientras se
     evalúan las respuestas (puede tardar unos segundos si el modelo de
     IA local aún se está descargando/inicializando). El texto es
     neutro a propósito: en este punto todavía no se sabe si la IA
     logrará actuar o si se usará el respaldo por palabras clave — eso
     solo se indica después, en la retroalimentación, y solo si la IA
     realmente participó. */
  function marcarAnalizando(analizando, yaCompletado) {
    const btn = document.getElementById("btnRevisar");
    if (!btn) return;
    btn.disabled = analizando;
    btn.textContent = analizando
      ? "Analizando respuestas…"
      : (yaCompletado ? "Volver a revisar" : "Revisar respuestas");
  }

  /* ============================================================
     INICIO
     ============================================================ */
  function renderInicio(app, CASO, state) {
    const c = CASO.caso;
    app.appendChild(el(`
      <section class="panel">
        <span class="tag">Caso de estudio</span>
        <h2>${esc(c.nombre)}</h2>
        <p class="intro-text">${esc(c.sector)}</p>
        <p>${esc(c.descripcion)}</p>
        <div class="case-brief">
          <div class="case-card"><h4>Sistema de pedidos</h4><p>Gestiona pedidos de clientes.</p></div>
          <div class="case-card"><h4>Servidor de despacho</h4><p>Coordina rutas y salida de mercadería.</p></div>
          <div class="case-card"><h4>Registros de temperatura</h4><p>Evidencia de la cadena de frío.</p></div>
          <div class="case-card"><h4>Cámaras y sensores</h4><p>Videovigilancia y monitoreo IoT.</p></div>
          <div class="case-card"><h4>Personal</h4><p>Administrativos, supervisores y proveedores externos.</p></div>
          <div class="case-card"><h4>Acceso remoto</h4><p>Conexiones externas hacia la red interna.</p></div>
        </div>
        <label class="field-label" for="inputAlumno">Nombre del estudiante (opcional, solo se guarda en este navegador)</label>
        <input class="full" type="text" id="inputAlumno" maxlength="80" placeholder="Ej: Juan Pérez" value="${esc(state.alumno)}">
        <p style="margin-top:16px;color:var(--text-muted);font-size:13px">
          El laboratorio tiene 10 módulos. Puedes navegar entre ellos con el menú superior. Tu avance se puede guardar
          en este navegador con el botón <strong>Guardar avance</strong>. Al finalizar, revisa el resumen final para
          descargar o imprimir tu informe.
        </p>
        <div class="module-actions">
          <button class="btn btn-primary" id="btnComenzar">Comenzar · Módulo 1</button>
          <button class="btn btn-danger-outline" id="btnReiniciar">Reiniciar laboratorio</button>
        </div>
      </section>
    `));
    document.getElementById("inputAlumno").addEventListener("change", (e) => {
      state.alumno = e.target.value.trim();
      NSL.guardarEstado(false);
    });
    document.getElementById("btnComenzar").addEventListener("click", () => NSL.irAModulo("modulo1"));
    document.getElementById("btnReiniciar").addEventListener("click", () => {
      if (confirm("Esto borrará el avance guardado en este navegador. ¿Continuar?")) {
        NSL.reiniciarEstado();
        NSL.irAModulo("inicio");
      }
    });
  }

  /* ============================================================
     DISPATCHER DE MÓDULO
     ============================================================ */
  function renderModulo(app, CASO, state, id) {
    const renderers = {
      modulo1: renderModulo1, modulo2: renderModulo2, modulo3: renderModulo3,
      modulo4: renderModulo4, modulo5: renderModulo5, modulo6: renderModulo6,
      modulo7: renderModulo7, modulo8: renderModulo8, modulo9: renderModulo9, modulo10: renderModulo10
    };
    renderers[id](app, CASO, state);
  }

  /* ============================================================
     MÓDULO 1 — DISEÑO DE RED
     ============================================================ */
  function renderModulo1(app, CASO, state) {
    const M = CASO.modulo1;
    const guardado = state.respuestas.modulo1 || { asignaciones: {}, justificacion: "" };
    const yaCompletado = !!(state.resultados.modulo1 && state.resultados.modulo1.completado);

    const zonasHTML = M.zonas.map((z) => `
      <div class="zone-dropzone" data-zona="${z.id}">
        <h4>${esc(z.nombre)}</h4>
        <div class="zone-desc">${esc(z.descripcion)}</div>
        <div class="zone-items" data-zona-items="${z.id}"></div>
      </div>`).join("");

    app.appendChild(el(`
      <section class="panel">
        <span class="tag">${esc(M.titulo)}</span>
        <h2>Segmentación de la red de ${esc(CASO.caso.nombre)}</h2>
        <p class="intro-text">${esc(M.introduccion)}</p>
        <p class="mobile-assign-hint">Asigna cada componente a una zona usando el menú desplegable de cada tarjeta (también puedes arrastrarlas sobre una zona).</p>
        <h3>Componentes a organizar</h3>
        <div class="component-pool" id="pool"></div>
        <h3>Zonas de red</h3>
        <div class="zones-board" id="board">${zonasHTML}</div>
        <label class="field-label" for="justificacion1">Justifica tu propuesta de segmentación</label>
        <textarea class="full" id="justificacion1" placeholder="Explica por qué separaste los componentes de esta manera, qué riesgos evitas y qué principios de seguridad aplicaste.">${esc(guardado.justificacion)}</textarea>
        <div id="feedbackContainer1"></div>
        ${moduleActionsHTML("modulo1", yaCompletado)}
      </section>
    `));

    // construir chips
    const pool = document.getElementById("pool");
    const asignaciones = Object.assign({}, guardado.asignaciones);

    function opcionesZona(seleccionActual) {
      let opts = '<option value="">— Sin asignar —</option>';
      M.zonas.forEach((z) => {
        opts += `<option value="${z.id}" ${seleccionActual === z.id ? "selected" : ""}>${esc(z.nombre)}</option>`;
      });
      return opts;
    }

    function crearChip(comp) {
      const chip = el(`
        <div class="component-chip ${comp.critico ? "critico" : ""}" draggable="true" data-comp="${comp.id}" title="${esc(comp.descripcion)}">
          ${esc(comp.nombre)}
          <select data-comp-select="${comp.id}">${opcionesZona(asignaciones[comp.id])}</select>
        </div>`);
      chip.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", comp.id);
      });
      chip.querySelector("select").addEventListener("change", (e) => {
        asignaciones[comp.id] = e.target.value || null;
        ubicarChip(comp.id);
      });
      return chip;
    }

    const chips = {};
    M.componentes.forEach((comp) => {
      const chip = crearChip(comp);
      chips[comp.id] = chip;
    });

    function ubicarChip(compId) {
      const zona = asignaciones[compId];
      const destino = zona ? document.querySelector(`[data-zona-items="${zona}"]`) : pool;
      if (destino) destino.appendChild(chips[compId]);
    }

    M.componentes.forEach((comp) => ubicarChip(comp.id));

    // drag & drop sobre zonas
    document.querySelectorAll(".zone-dropzone").forEach((zoneEl) => {
      zoneEl.addEventListener("dragover", (e) => { e.preventDefault(); zoneEl.classList.add("dragover"); });
      zoneEl.addEventListener("dragleave", () => zoneEl.classList.remove("dragover"));
      zoneEl.addEventListener("drop", (e) => {
        e.preventDefault();
        zoneEl.classList.remove("dragover");
        const compId = e.dataTransfer.getData("text/plain");
        if (!compId) return;
        const zonaId = zoneEl.dataset.zona;
        asignaciones[compId] = zonaId;
        chips[compId].querySelector("select").value = zonaId;
        ubicarChip(compId);
      });
    });
    pool.addEventListener("dragover", (e) => e.preventDefault());
    pool.addEventListener("drop", (e) => {
      e.preventDefault();
      const compId = e.dataTransfer.getData("text/plain");
      if (!compId) return;
      asignaciones[compId] = null;
      chips[compId].querySelector("select").value = "";
      ubicarChip(compId);
    });

    function recolectar() {
      return {
        asignaciones: Object.assign({}, asignaciones),
        justificacion: document.getElementById("justificacion1").value
      };
    }

    document.getElementById("btnGuardarModulo").addEventListener("click", () => {
      NSL.guardarRespuestas("modulo1", recolectar());
      NSL.guardarEstado(true);
    });

    document.getElementById("btnRevisar").addEventListener("click", () => {
      const respuestas = recolectar();
      NSL.guardarRespuestas("modulo1", respuestas);
      const resultado = evaluarModulo1(M, respuestas);
      NSL.registrarResultado("modulo1", resultado);
      document.getElementById("feedbackContainer1").innerHTML = feedbackBoxHTML(resultado.score, resultado.feedback);
      NSL.guardarEstado(false);
      document.getElementById("feedbackContainer1").scrollIntoView({ behavior: "smooth" });
    });

    if (yaCompletado) {
      const r = state.resultados.modulo1;
      document.getElementById("feedbackContainer1").innerHTML = feedbackBoxHTML(r.score, r.feedback);
    }
  }

  function evaluarModulo1(M, respuestas) {
    const asign = respuestas.asignaciones || {};
    const porId = {};
    M.componentes.forEach((c) => (porId[c.id] = c));

    function correcto(id) { return asign[id] === porId[id].zonaCorrecta; }

    // 1. Activos críticos
    const activos = ["sistema_pedidos", "servidor_despacho", "registros_temperatura"];
    const activosOK = activos.filter(correcto).length;
    const critVerdict1 = activosOK === activos.length ? "ok" : activosOK > 0 ? "warn" : "bad";

    // 2. Aislamiento cámaras/sensores
    const iot = ["camaras_seguridad", "sensores_refrigeracion"];
    const iotOK = iot.filter(correcto).length;
    const iotEnAdmin = iot.some((id) => asign[id] === "red_administrativa");
    const critVerdict2 = iotOK === iot.length && !iotEnAdmin ? "ok" : (iotOK > 0 && !iotEnAdmin) ? "warn" : "bad";

    // 3. Protección de servidores (sin contaminación)
    const contaminantes = M.componentes.filter(
      (c) => asign[c.id] === "red_servidores" && c.zonaCorrecta !== "red_servidores"
    );
    const servidoresOK = activos.filter(correcto).length === activos.length;
    const critVerdict3 = servidoresOK && contaminantes.length === 0 ? "ok" : servidoresOK ? "warn" : "bad";

    // 4. Acceso remoto controlado
    const remoto = ["proveedores_externos", "acceso_remoto"];
    const remotoOK = remoto.filter(correcto).length;
    const critVerdict4 = remotoOK === remoto.length ? "ok" : remotoOK > 0 ? "warn" : "bad";

    // 5. Justificación
    const just = (respuestas.justificacion || "").trim();
    const critVerdict5 = just.length >= 60 ? "ok" : just.length >= 20 ? "warn" : "bad";

    const totalComponentes = M.componentes.length;
    const correctos = M.componentes.filter((c) => correcto(c.id)).length;
    const pctCorrecto = correctos / totalComponentes;
    const puntosJustificacion = critVerdict5 === "ok" ? 20 : critVerdict5 === "warn" ? 10 : 0;
    const score = Math.round(pctCorrecto * 80 + puntosJustificacion);

    const criterios = {};
    M.criterios.forEach((c) => (criterios[c.id] = c));

    const feedback = [
      {
        titulo: criterios.activos_criticos.nombre,
        verdict: critVerdict1,
        concepto: "Segmentación de activos críticos: los sistemas que sostienen la operación del negocio deben aislarse en una red de servidores propia.",
        motivo: critVerdict1 === "ok"
          ? "Ubicaste los tres sistemas críticos (pedidos, despacho, temperatura) en la red de servidores."
          : "No todos los sistemas críticos quedaron en la red de servidores (" + activosOK + "/" + activos.length + ").",
        riesgo: "Si un sistema crítico comparte red con estaciones de usuario, un equipo comprometido puede alcanzarlo directamente.",
        mejora: critVerdict1 === "ok" ? undefined : "Revisa la ubicación del sistema de pedidos, el servidor de despacho y los registros de temperatura."
      },
      {
        titulo: criterios.aislamiento_iot.nombre,
        verdict: critVerdict2,
        concepto: "Los dispositivos IoT (cámaras, sensores) tienen firmware limitado y son objetivos frecuentes de ataque; deben aislarse en redes propias.",
        motivo: critVerdict2 === "ok"
          ? "Cámaras y sensores quedaron en sus propias redes, separados de la red administrativa."
          : iotEnAdmin
            ? "Colocaste dispositivos IoT en la red administrativa, lo que expone cuentas privilegiadas a dispositivos de bajo nivel de seguridad."
            : "Cámaras y/o sensores no quedaron en su zona correspondiente.",
        riesgo: "Un dispositivo IoT comprometido en la misma red que equipos administrativos facilita el movimiento lateral de un atacante.",
        mejora: critVerdict2 === "ok" ? undefined : "Ubica cámaras en 'Red de cámaras' y sensores en 'Red de sensores', separadas de la red administrativa."
      },
      {
        titulo: criterios.proteccion_servidores.nombre,
        verdict: critVerdict3,
        concepto: "La red de servidores debe contener únicamente los sistemas críticos, sin mezclarse con estaciones de usuario o dispositivos IoT.",
        motivo: critVerdict3 === "ok"
          ? "La red de servidores quedó protegida y sin componentes que no correspondían."
          : contaminantes.length > 0
            ? "Colocaste en la red de servidores componentes que no son servidores críticos (" + contaminantes.map((c) => c.nombre).join(", ") + ")."
            : "Los servidores críticos no quedaron correctamente agrupados.",
        riesgo: "Mezclar servidores con otros dispositivos amplía la superficie de ataque hacia los sistemas más sensibles del negocio.",
        mejora: critVerdict3 === "ok" ? undefined : "Deja en la red de servidores solo el sistema de pedidos, el servidor de despacho y los registros de temperatura."
      },
      {
        titulo: criterios.acceso_remoto_controlado.nombre,
        verdict: critVerdict4,
        concepto: "Todo acceso externo (proveedores, teletrabajo) debe pasar por una zona controlada antes de llegar a la red interna.",
        motivo: critVerdict4 === "ok"
          ? "El acceso remoto y los proveedores externos quedaron en la zona de acceso controlado."
          : "El acceso remoto y/o los proveedores no quedaron en la zona de acceso controlado (" + remotoOK + "/" + remoto.length + ").",
        riesgo: "Sin una zona de acceso remoto controlada, un tercero o un equipo externo comprometido podría ingresar directo a la red interna.",
        mejora: critVerdict4 === "ok" ? undefined : "Ubica proveedores externos y acceso remoto en la 'Zona de acceso remoto'."
      },
      {
        titulo: criterios.justificacion.nombre,
        verdict: critVerdict5,
        concepto: "Un diseño de seguridad debe poder justificarse: qué riesgo reduce cada decisión.",
        motivo: critVerdict5 === "ok"
          ? "Entregaste una justificación desarrollada de tu propuesta."
          : critVerdict5 === "warn"
            ? "Tu justificación es breve; podría profundizar más en los riesgos que evitas."
            : "No entregaste una justificación suficiente para tu propuesta.",
        riesgo: undefined,
        mejora: critVerdict5 === "ok" ? undefined : "Explica, para al menos dos zonas, qué riesgo evitas al separarlas del resto."
      }
    ];

    return { score, feedback };
  }

  /* ============================================================
     MÓDULO 2 — REGLAS DE FIREWALL
     ============================================================ */
  function renderModulo2(app, CASO, state) {
    const M = CASO.modulo2;
    const guardado = state.respuestas.modulo2 || {};
    const yaCompletado = !!(state.resultados.modulo2 && state.resultados.modulo2.completado);

    const filas = M.reglas.map((r) => {
      const g = guardado[r.id] || { decision: "", justificacion: "" };
      const radios = M.opciones.map((o) => `
        <label><input type="radio" name="dec-${r.id}" value="${o.id}" ${g.decision === o.id ? "checked" : ""}> ${esc(o.nombre)}</label>
      `).join("");
      return `
        <tr data-regla="${r.id}">
          <td>${esc(r.origen)}</td>
          <td>${esc(r.destino)}</td>
          <td>${esc(r.servicio)}</td>
          <td><div class="decision-group">${radios}</div></td>
          <td><textarea data-just="${r.id}" placeholder="Justificación breve...">${esc(g.justificacion)}</textarea></td>
        </tr>`;
    }).join("");

    app.appendChild(el(`
      <section class="panel">
        <span class="tag">${esc(M.titulo)}</span>
        <h2>Reglas de comunicación entre redes</h2>
        <p class="intro-text">${esc(M.introduccion)}</p>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Origen</th><th>Destino</th><th>Servicio</th><th>Decisión</th><th>Justificación</th></tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        <div id="feedbackContainer2"></div>
        ${moduleActionsHTML("modulo2", yaCompletado)}
      </section>
    `));

    function recolectar() {
      const out = {};
      M.reglas.forEach((r) => {
        const sel = document.querySelector(`input[name="dec-${r.id}"]:checked`);
        out[r.id] = {
          decision: sel ? sel.value : "",
          justificacion: document.querySelector(`[data-just="${r.id}"]`).value
        };
      });
      return out;
    }

    document.getElementById("btnGuardarModulo").addEventListener("click", () => {
      NSL.guardarRespuestas("modulo2", recolectar());
      NSL.guardarEstado(true);
    });

    document.getElementById("btnRevisar").addEventListener("click", () => {
      const respuestas = recolectar();
      NSL.guardarRespuestas("modulo2", respuestas);
      const resultado = evaluarModulo2(M, respuestas);
      NSL.registrarResultado("modulo2", resultado);
      document.getElementById("feedbackContainer2").innerHTML = feedbackBoxHTML(resultado.score, resultado.feedback);
      NSL.guardarEstado(false);
      document.getElementById("feedbackContainer2").scrollIntoView({ behavior: "smooth" });
    });

    if (yaCompletado) {
      const r = state.resultados.modulo2;
      document.getElementById("feedbackContainer2").innerHTML = feedbackBoxHTML(r.score, r.feedback);
    }
  }

  function evaluarModulo2(M, respuestas) {
    let puntosTotales = 0;
    const pesoRegla = 100 / M.reglas.length;
    const feedback = [];

    M.reglas.forEach((r) => {
      const resp = respuestas[r.id] || { decision: "", justificacion: "" };
      const correcta = resp.decision === r.respuestaCorrecta;
      const justOk = (resp.justificacion || "").trim().length >= 15;
      const puntos = (correcta ? 0.8 : 0) * pesoRegla + (justOk ? 0.2 : 0) * pesoRegla;
      puntosTotales += puntos;

      const textoFeedback = resp.decision
        ? (r.feedback[resp.decision] || "Respuesta no reconocida.")
        : "No seleccionaste una decisión para esta regla.";

      feedback.push({
        titulo: `${r.origen} → ${r.destino} (${r.servicio})`,
        verdict: correcta ? "ok" : "bad",
        concepto: "Una regla de firewall debe responder a una necesidad operacional concreta, con alcance y servicio específicos.",
        motivo: textoFeedback,
        riesgo: !justOk ? "No justificaste tu decisión: en un entorno real, cada regla debe quedar documentada para auditoría." : undefined,
        mejora: correcta && justOk ? undefined : "Relaciona tu decisión con necesidad operacional, riesgo, alcance y registro de actividad."
      });
    });

    return { score: Math.round(puntosTotales), feedback };
  }

  /* ============================================================
     MÓDULO 3 — AUTENTICACIÓN Y AUTORIZACIÓN
     ============================================================ */
  function renderModulo3(app, CASO, state) {
    const M = CASO.modulo3;
    const guardado = state.respuestas.modulo3 || {};
    const yaCompletado = !!(state.resultados.modulo3 && state.resultados.modulo3.completado);

    let filas = "";
    M.roles.forEach((rol) => {
      M.recursos.forEach((rec) => {
        const key = rol.id + "|" + rec.id;
        const seleccion = (guardado[key] || []);
        const checks = M.acciones.map((a) => `
          <label><input type="checkbox" data-cell="${key}" value="${a.id}" ${seleccion.includes(a.id) ? "checked" : ""}> ${esc(a.nombre)}</label>
        `).join("");
        filas += `<tr><td>${esc(rol.nombre)}</td><td>${esc(rec.nombre)}</td><td><div class="matrix-actions">${checks}</div></td></tr>`;
      });
    });

    app.appendChild(el(`
      <section class="panel">
        <span class="tag">${esc(M.titulo)}</span>
        <h2>Matriz de autenticación y autorización</h2>
        <p class="intro-text">${esc(M.introduccion)}</p>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Rol</th><th>Recurso</th><th>Acciones permitidas</th></tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        <div id="feedbackContainer3"></div>
        ${moduleActionsHTML("modulo3", yaCompletado)}
      </section>
    `));

    function recolectar() {
      const out = {};
      M.roles.forEach((rol) => M.recursos.forEach((rec) => {
        const key = rol.id + "|" + rec.id;
        out[key] = Array.from(document.querySelectorAll(`input[data-cell="${key}"]:checked`)).map((c) => c.value);
      }));
      return out;
    }

    document.getElementById("btnGuardarModulo").addEventListener("click", () => {
      NSL.guardarRespuestas("modulo3", recolectar());
      NSL.guardarEstado(true);
    });

    document.getElementById("btnRevisar").addEventListener("click", () => {
      const respuestas = recolectar();
      NSL.guardarRespuestas("modulo3", respuestas);
      const resultado = evaluarModulo3(M, respuestas);
      NSL.registrarResultado("modulo3", resultado);
      document.getElementById("feedbackContainer3").innerHTML = feedbackBoxHTML(resultado.score, resultado.feedback);
      NSL.guardarEstado(false);
      document.getElementById("feedbackContainer3").scrollIntoView({ behavior: "smooth" });
    });

    if (yaCompletado) {
      const r = state.resultados.modulo3;
      document.getElementById("feedbackContainer3").innerHTML = feedbackBoxHTML(r.score, r.feedback);
    }
  }

  function evaluarModulo3(M, respuestas) {
    let sumaExactitud = 0;
    let combos = 0;
    let excesos = [];
    let faltantesAdmin = 0;

    M.roles.forEach((rol) => {
      M.recursos.forEach((rec) => {
        const key = rol.id + "|" + rec.id;
        combos++;
        const correctoSet = new Set(M.matrizCorrecta[rol.id][rec.id] || []);
        const estudianteSet = new Set(respuestas[key] || []);
        const union = new Set([...correctoSet, ...estudianteSet]);
        let interseccion = 0;
        union.forEach((a) => { if (correctoSet.has(a) && estudianteSet.has(a)) interseccion++; });
        const exactitud = union.size === 0 ? 1 : interseccion / union.size;
        sumaExactitud += exactitud;

        // detectar exceso de privilegio: rol distinto de administrador con 'eliminar' o 'administrar'
        if (rol.id !== "administrador") {
          if (estudianteSet.has("eliminar") || estudianteSet.has("administrar")) {
            excesos.push(`${rol.nombre} sobre ${rec.nombre}`);
          }
        }
        if (rol.id === "administrador" && !estudianteSet.has("administrar") && correctoSet.has("administrar")) {
          faltantesAdmin++;
        }
        // proveedor externo fuera de alcance
        if (rol.id === "proveedor_externo" && rec.id !== "sistema_despacho" && estudianteSet.size > 0) {
          excesos.push(`Proveedor externo sobre ${rec.nombre} (fuera del alcance autorizado)`);
        }
      });
    });

    const score = Math.round((sumaExactitud / combos) * 100);

    const vExcesos = excesos.length === 0 ? "ok" : excesos.length <= 2 ? "warn" : "bad";
    const vMinPriv = score >= 85 ? "ok" : score >= 60 ? "warn" : "bad";
    const vAdmin = faltantesAdmin === 0 ? "ok" : "warn";

    const feedback = [
      {
        titulo: "Mínimo privilegio",
        verdict: vMinPriv,
        concepto: "Cada rol debe tener solo los permisos estrictamente necesarios para cumplir su función.",
        motivo: `Tu matriz coincide en un ${score}% con una configuración de mínimo privilegio razonable para este caso.`,
        riesgo: "Otorgar más permisos de los necesarios aumenta el daño posible si esa cuenta es comprometida o usada por error.",
        mejora: vMinPriv === "ok" ? undefined : "Revisa recurso por recurso si el rol realmente necesita cada acción marcada."
      },
      {
        titulo: "Separación de funciones y permisos excesivos",
        verdict: vExcesos,
        concepto: "Las acciones de mayor riesgo (eliminar, administrar) deben reservarse a roles con responsabilidad específica sobre ellas.",
        motivo: excesos.length === 0
          ? "No se detectaron permisos de eliminación/administración fuera del rol de administrador, ni accesos del proveedor fuera de su alcance."
          : "Se detectaron posibles permisos excesivos: " + excesos.slice(0, 5).join("; ") + (excesos.length > 5 ? "…" : "") + ".",
        riesgo: "Permisos excesivos en roles operativos o en terceros externos amplían el impacto de un error humano o una cuenta comprometida.",
        mejora: excesos.length === 0 ? undefined : "Limita 'eliminar' y 'administrar' al rol de administrador, y restringe al proveedor externo solo al sistema de despacho."
      },
      {
        titulo: "Rol de administrador",
        verdict: vAdmin,
        concepto: "El administrador es el único rol que debería poder administrar la configuración de red y la gestión de usuarios.",
        motivo: faltantesAdmin === 0
          ? "El rol de administrador conserva las capacidades de administración necesarias para operar la infraestructura."
          : "Le quitaste al administrador algunas capacidades de administración necesarias para su función.",
        riesgo: undefined,
        mejora: faltantesAdmin === 0 ? undefined : "Asegúrate de que el administrador conserve 'administrar' sobre configuración de red y gestión de usuarios."
      },
      {
        titulo: "Diferencia entre autenticación y autorización",
        verdict: "ok",
        concepto: "Esta matriz define autorización (qué puede hacer un usuario ya autenticado), no autenticación (verificar su identidad). Ambos controles son necesarios pero distintos: un usuario autenticado puede no estar autorizado para una acción concreta.",
        motivo: CASO_TEXT_MODULO3_EXPLICACION(M),
        riesgo: undefined,
        mejora: undefined
      }
    ];

    return { score, feedback };
  }
  function CASO_TEXT_MODULO3_EXPLICACION(M) { return M.explicacionGeneral; }

  /* ============================================================
     MÓDULO 4 — MODELO AAA
     ============================================================ */
  function renderModulo4(app, CASO, state) {
    const M = CASO.modulo4;
    const guardado = state.respuestas.modulo4 || {};
    const yaCompletado = !!(state.resultados.modulo4 && state.resultados.modulo4.completado);

    const conceptosHTML = M.conceptos.map((c) => `
      <div class="case-card"><h4>${esc(c.nombre)}</h4><p>${esc(c.descripcion)}</p></div>
    `).join("");

    const situacionesHTML = M.situaciones.map((s) => {
      const opciones = M.conceptos.map((c) => `
        <label><input type="radio" name="sit-${s.id}" value="${c.id}" ${guardado[s.id] === c.id ? "checked" : ""}> ${esc(c.nombre.split(" (")[0])}</label>
      `).join("");
      return `<tr><td>${esc(s.texto)}</td><td><div class="decision-group">${opciones}</div></td></tr>`;
    }).join("");

    app.appendChild(el(`
      <section class="panel">
        <span class="tag">${esc(M.titulo)}</span>
        <h2>Modelo AAA</h2>
        <p class="intro-text">${esc(M.introduccion)}</p>
        <div class="case-brief">${conceptosHTML}</div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Situación</th><th>Clasificación</th></tr></thead>
            <tbody>${situacionesHTML}</tbody>
          </table>
        </div>
        <div id="feedbackContainer4"></div>
        ${moduleActionsHTML("modulo4", yaCompletado)}
      </section>
    `));

    function recolectar() {
      const out = {};
      M.situaciones.forEach((s) => {
        const sel = document.querySelector(`input[name="sit-${s.id}"]:checked`);
        out[s.id] = sel ? sel.value : "";
      });
      return out;
    }

    document.getElementById("btnGuardarModulo").addEventListener("click", () => {
      NSL.guardarRespuestas("modulo4", recolectar());
      NSL.guardarEstado(true);
    });

    document.getElementById("btnRevisar").addEventListener("click", () => {
      const respuestas = recolectar();
      NSL.guardarRespuestas("modulo4", respuestas);
      const resultado = evaluarModulo4(M, respuestas);
      NSL.registrarResultado("modulo4", resultado);
      document.getElementById("feedbackContainer4").innerHTML = feedbackBoxHTML(resultado.score, resultado.feedback);
      NSL.guardarEstado(false);
      document.getElementById("feedbackContainer4").scrollIntoView({ behavior: "smooth" });
    });

    if (yaCompletado) {
      const r = state.resultados.modulo4;
      document.getElementById("feedbackContainer4").innerHTML = feedbackBoxHTML(r.score, r.feedback);
    }
  }

  function evaluarModulo4(M, respuestas) {
    const conceptosPorId = {};
    M.conceptos.forEach((c) => (conceptosPorId[c.id] = c));
    let correctas = 0;
    const feedback = M.situaciones.map((s) => {
      const resp = respuestas[s.id];
      const ok = resp === s.respuestaCorrecta;
      if (ok) correctas++;
      return {
        titulo: s.texto,
        verdict: resp ? (ok ? "ok" : "bad") : "bad",
        concepto: "Clasificación correcta: " + (conceptosPorId[s.respuestaCorrecta] ? conceptosPorId[s.respuestaCorrecta].nombre : s.respuestaCorrecta) + ".",
        motivo: s.explicacion,
        riesgo: ok ? undefined : "Confundir estas etapas del modelo AAA puede llevar a diseñar controles en el lugar equivocado (por ejemplo, reforzar contraseñas cuando el problema real es de permisos).",
        mejora: ok ? undefined : "Relee las definiciones de autenticación, autorización y auditoría antes de reclasificar esta situación."
      };
    });
    const score = Math.round((correctas / M.situaciones.length) * 100);
    return { score, feedback };
  }

  /* ============================================================
     MÓDULO 5 — ANÁLISIS DE REGISTROS
     ============================================================ */
  function renderModulo5(app, CASO, state) {
    const M = CASO.modulo5;
    const guardado = state.respuestas.modulo5 || { marcas: {}, respuestas: {} };
    const yaCompletado = !!(state.resultados.modulo5 && state.resultados.modulo5.completado);

    const filas = M.logs.map((log) => `
      <tr>
        <td>${esc(log.fecha)}</td><td>${esc(log.hora)}</td><td>${esc(log.usuario)}</td>
        <td>${esc(log.ip)}</td><td>${esc(log.recurso)}</td><td>${esc(log.accion)}</td>
        <td>${esc(log.resultado)}</td>
        <td class="center"><input type="checkbox" data-log="${log.id}" ${guardado.marcas[log.id] ? "checked" : ""}></td>
      </tr>`).join("");

    const preguntasHTML = M.preguntasAnalisis.map((p) => `
      <label class="field-label">${esc(p.texto)}</label>
      <textarea class="full" data-pregunta="${p.id}">${esc((guardado.respuestas || {})[p.id] || "")}</textarea>
    `).join("");

    app.appendChild(el(`
      <section class="panel">
        <span class="tag">${esc(M.titulo)}</span>
        <h2>Análisis de registros de actividad</h2>
        <p class="intro-text">${esc(M.introduccion)}</p>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Fecha</th><th>Hora</th><th>Usuario</th><th>IP</th><th>Recurso</th><th>Acción</th><th>Resultado</th><th>¿Sospechoso?</th></tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        <h3 style="margin-top:20px">Preguntas de análisis</h3>
        ${preguntasHTML}
        <div id="feedbackContainer5"></div>
        ${moduleActionsHTML("modulo5", yaCompletado)}
      </section>
    `));

    function recolectar() {
      const marcas = {};
      M.logs.forEach((log) => {
        marcas[log.id] = document.querySelector(`input[data-log="${log.id}"]`).checked;
      });
      const respuestasTexto = {};
      M.preguntasAnalisis.forEach((p) => {
        respuestasTexto[p.id] = document.querySelector(`[data-pregunta="${p.id}"]`).value;
      });
      return { marcas, respuestas: respuestasTexto };
    }

    document.getElementById("btnGuardarModulo").addEventListener("click", () => {
      NSL.guardarRespuestas("modulo5", recolectar());
      NSL.guardarEstado(true);
    });

    document.getElementById("btnRevisar").addEventListener("click", async () => {
      const respuestas = recolectar();
      NSL.guardarRespuestas("modulo5", respuestas);
      marcarAnalizando(true);
      const resultado = await evaluarModulo5(M, respuestas);
      marcarAnalizando(false, true);
      NSL.registrarResultado("modulo5", resultado);
      document.getElementById("feedbackContainer5").innerHTML = feedbackBoxHTML(resultado.score, resultado.feedback);
      NSL.guardarEstado(false);
      document.getElementById("feedbackContainer5").scrollIntoView({ behavior: "smooth" });
    });

    if (yaCompletado) {
      const r = state.resultados.modulo5;
      document.getElementById("feedbackContainer5").innerHTML = feedbackBoxHTML(r.score, r.feedback);
    }
  }

  async function evaluarModulo5(M, respuestas) {
    const marcas = respuestas.marcas || {};
    let aciertos = 0;
    const detallesLogs = [];
    M.logs.forEach((log) => {
      const marcado = !!marcas[log.id];
      const ok = marcado === log.sospechoso;
      if (ok) aciertos++;
      if (log.sospechoso) {
        detallesLogs.push({
          titulo: `${log.fecha} ${log.hora} · ${log.usuario} · ${log.recurso} (${log.accion})`,
          verdict: marcado ? "ok" : "bad",
          concepto: "Análisis de registros: correlación de eventos para detectar comportamiento anómalo.",
          motivo: log.motivo,
          riesgo: marcado ? undefined : "No identificar este evento como sospechoso podría retrasar la detección de un incidente real.",
          mejora: marcado ? undefined : "Compara horario, IP de origen y el tipo de recurso/acción con el comportamiento habitual del usuario."
        });
      }
    });

    const puntosLogs = (aciertos / M.logs.length) * 70;

    // Preguntas de análisis: longitud mínima + cobertura semántica de los
    // conceptos esperados (evaluada con IA local si está disponible; si no,
    // cae a coincidencia de palabras clave — ver js/ia.js).
    let puntosPreguntas = 0;
    let usoIA = false; // true solo si la IA local llegó a actuar en al menos una pregunta
    const textos = respuestas.respuestas || {};
    for (const p of M.preguntasAnalisis) {
      const t = (textos[p.id] || "").trim();
      let fraccion = 0;
      if (t.length >= 15) fraccion = 0.4;
      if (t.length >= 40) fraccion = Math.max(fraccion, 0.55);
      if (t && p.conceptosEsperados && p.conceptosEsperados.length) {
        const r = window.IA
          ? await window.IA.calcularCoincidencias(t, p.conceptosEsperados)
          : { hits: 0 };
        if (r.metodo === "ia") usoIA = true;
        if (r.hits >= 1) fraccion = Math.max(fraccion, 0.85);
        if (r.hits >= 2) fraccion = 1;
      }
      puntosPreguntas += fraccion * 7.5;
    }

    const score = Math.round(puntosLogs + puntosPreguntas);

    const cuentasComprometidas = [...new Set(M.logs.filter((l) => l.sospechoso).map((l) => l.usuario))];

    const feedback = [
      {
        titulo: "Identificación de eventos sospechosos",
        verdict: aciertos === M.logs.length ? "ok" : aciertos >= M.logs.length * 0.7 ? "warn" : "bad",
        concepto: "Un registro se analiza en conjunto: horario, origen, cuenta involucrada, recurso y resultado.",
        motivo: `Identificaste correctamente ${aciertos} de ${M.logs.length} eventos.`,
        riesgo: "Pasar por alto eventos sospechosos retrasa la respuesta ante un incidente en curso.",
        mejora: aciertos === M.logs.length ? undefined : "Revisa especialmente los accesos en horario no laboral, desde IP desconocida o seguidos de una modificación de datos críticos."
      },
      ...detallesLogs,
      {
        titulo: "Cuentas potencialmente comprometidas",
        verdict: "warn",
        concepto: "Correlación de intentos fallidos seguidos de un ingreso exitoso desde origen inusual.",
        motivo: "Con base en este registro, la cuenta con mayor indicio de compromiso es: " + cuentasComprometidas.join(", ") + ".",
        riesgo: "Una cuenta administrativa comprometida puede usarse para modificar datos críticos y acceder a sistemas adicionales.",
        mejora: undefined
      },
      {
        titulo: "Preguntas de análisis",
        verdict: puntosPreguntas >= 25 ? "ok" : puntosPreguntas >= 10 ? "warn" : "bad",
        concepto: "La respuesta a un incidente debe documentar evidencias, cuentas afectadas y medidas de respuesta.",
        motivo: (puntosPreguntas >= 25 ? "Tus respuestas muestran un análisis desarrollado." : "Tus respuestas podrían desarrollarse con más detalle.")
          + (usoIA ? " (Evaluado con ayuda de un modelo de IA que corrió en tu navegador.)" : ""),
        riesgo: undefined,
        mejora: puntosPreguntas >= 25 ? undefined : "Menciona explícitamente qué logs conservarías como evidencia y qué acción tomarías primero (por ejemplo, bloquear la cuenta afectada)."
      }
    ];

    return { score, feedback };
  }

  /* ============================================================
     MÓDULO 6 — CASO INTEGRADOR
     ============================================================ */
  function renderModulo6(app, CASO, state) {
    const M = CASO.modulo6;
    const guardado = state.respuestas.modulo6 || {};
    const yaCompletado = !!(state.resultados.modulo6 && state.resultados.modulo6.completado);

    const preguntasHTML = M.preguntas.map((p, i) => `
      <label class="field-label">${i + 1}. ${esc(p.texto)}</label>
      <textarea class="full" data-preg="${p.id}">${esc(guardado[p.id] || "")}</textarea>
    `).join("");

    app.appendChild(el(`
      <section class="panel">
        <span class="tag">${esc(M.titulo)}</span>
        <h2>Caso integrador</h2>
        <div class="case-card" style="margin-top:10px"><p style="margin:0;color:var(--text)">${esc(M.escenario)}</p></div>
        ${preguntasHTML}
        <div id="feedbackContainer6"></div>
        ${moduleActionsHTML("modulo6", yaCompletado)}
      </section>
    `));

    function recolectar() {
      const out = {};
      M.preguntas.forEach((p) => { out[p.id] = document.querySelector(`[data-preg="${p.id}"]`).value; });
      return out;
    }

    document.getElementById("btnGuardarModulo").addEventListener("click", () => {
      NSL.guardarRespuestas("modulo6", recolectar());
      NSL.guardarEstado(true);
    });

    document.getElementById("btnRevisar").addEventListener("click", async () => {
      const respuestas = recolectar();
      NSL.guardarRespuestas("modulo6", respuestas);
      marcarAnalizando(true);
      const resultado = await evaluarModulo6(M, respuestas);
      marcarAnalizando(false, true);
      NSL.registrarResultado("modulo6", resultado);
      document.getElementById("feedbackContainer6").innerHTML = feedbackBoxHTML(resultado.score, resultado.feedback);
      NSL.guardarEstado(false);
      document.getElementById("feedbackContainer6").scrollIntoView({ behavior: "smooth" });
    });

    if (yaCompletado) {
      const r = state.resultados.modulo6;
      document.getElementById("feedbackContainer6").innerHTML = feedbackBoxHTML(r.score, r.feedback);
    }
  }

  // La evaluación semántica de conceptos vive en js/ia.js (window.IA),
  // que corre un modelo de embeddings local en el navegador y cae
  // automáticamente a comparación por palabras clave si el modelo no
  // está disponible.
  async function evaluarModulo6(M, respuestas) {
    let puntosTotales = 0;
    const pesoPregunta = 100 / M.preguntas.length;
    const feedback = [];

    for (let i = 0; i < M.preguntas.length; i++) {
      const p = M.preguntas[i];
      const texto = (respuestas[p.id] || "").trim();
      const r = texto && window.IA
        ? await window.IA.calcularCoincidencias(texto, p.conceptosEsperados)
        : { hits: 0 };
      const hits = r.hits;
      let fraccion = 0;
      if (texto.length >= 15) fraccion = 0.4;
      if (hits >= 1) fraccion = Math.max(fraccion, 0.7);
      if (hits >= 2) fraccion = 1;
      puntosTotales += fraccion * pesoPregunta;

      const verdict = fraccion >= 0.7 ? "ok" : fraccion >= 0.4 ? "warn" : "bad";
      feedback.push({
        titulo: `${i + 1}. ${p.texto}`,
        verdict,
        concepto: "Respuesta esperada orientativa (no literal): " + p.conceptosEsperados.join("; ") + ".",
        motivo: texto
          ? "Tu respuesta fue registrada y comparada" + (r.metodo === "ia" ? " con IA local" : "") + " con los conceptos clave esperados para esta pregunta."
          : "No respondiste esta pregunta.",
        riesgo: verdict === "bad" ? "Sin identificar este punto, una parte importante de la respuesta al incidente quedaría incompleta." : undefined,
        mejora: verdict === "ok" ? undefined : "Incorpora explícitamente los conceptos listados arriba en tu respuesta."
      });
    }

    return { score: Math.round(puntosTotales), feedback };
  }

  /* ============================================================
     MÓDULO 7 — PROTECCIÓN DE DISPOSITIVOS DE RED
     ============================================================ */
  function renderModulo7(app, CASO, state) {
    const M = CASO.modulo7;
    const guardado = state.respuestas.modulo7 || { asignaciones: {}, justificacion: "" };
    const yaCompletado = !!(state.resultados.modulo7 && state.resultados.modulo7.completado);

    const filas = M.dispositivos.map((d) => {
      const seleccion = guardado.asignaciones[d.id] || [];
      const checks = M.controles.map((c) => `
        <label><input type="checkbox" data-disp="${d.id}" value="${c.id}" ${seleccion.includes(c.id) ? "checked" : ""}> ${esc(c.nombre)}</label>
      `).join("");
      return `
        <tr>
          <td><strong>${esc(d.nombre)}</strong><div class="zone-desc">${esc(d.descripcion)}</div></td>
          <td><div class="matrix-actions">${checks}</div></td>
        </tr>`;
    }).join("");

    app.appendChild(el(`
      <section class="panel">
        <span class="tag">${esc(M.titulo)}</span>
        <h2>Protección de dispositivos de red</h2>
        <p class="intro-text">${esc(M.introduccion)}</p>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Dispositivo</th><th>Controles a aplicar</th></tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        <label class="field-label" for="justificacion7">${esc(M.preguntaJustificacion)}</label>
        <textarea class="full" id="justificacion7" placeholder="Explica qué podría pasar si ese control no se aplicara...">${esc(guardado.justificacion)}</textarea>
        <div id="feedbackContainer7"></div>
        ${moduleActionsHTML("modulo7", yaCompletado)}
      </section>
    `));

    function recolectar() {
      const asignaciones = {};
      M.dispositivos.forEach((d) => {
        asignaciones[d.id] = Array.from(document.querySelectorAll(`input[data-disp="${d.id}"]:checked`)).map((c) => c.value);
      });
      return { asignaciones, justificacion: document.getElementById("justificacion7").value };
    }

    document.getElementById("btnGuardarModulo").addEventListener("click", () => {
      NSL.guardarRespuestas("modulo7", recolectar());
      NSL.guardarEstado(true);
    });

    document.getElementById("btnRevisar").addEventListener("click", async () => {
      const respuestas = recolectar();
      NSL.guardarRespuestas("modulo7", respuestas);
      marcarAnalizando(true);
      const resultado = await evaluarModulo7(M, respuestas);
      marcarAnalizando(false, true);
      NSL.registrarResultado("modulo7", resultado);
      document.getElementById("feedbackContainer7").innerHTML = feedbackBoxHTML(resultado.score, resultado.feedback);
      NSL.guardarEstado(false);
      document.getElementById("feedbackContainer7").scrollIntoView({ behavior: "smooth" });
    });

    if (yaCompletado) {
      const r = state.resultados.modulo7;
      document.getElementById("feedbackContainer7").innerHTML = feedbackBoxHTML(r.score, r.feedback);
    }
  }

  async function evaluarModulo7(M, respuestas) {
    const asign = respuestas.asignaciones || {};
    const controlesPorId = {};
    M.controles.forEach((c) => (controlesPorId[c.id] = c));

    let sumaExactitud = 0;
    const feedbackDispositivos = [];
    const riesgosSeleccionados = new Set();

    M.dispositivos.forEach((d) => {
      const correctoSet = new Set(M.controlesCorrectos[d.id] || []);
      const estudianteSet = new Set(asign[d.id] || []);
      const union = new Set([...correctoSet, ...estudianteSet]);
      let interseccion = 0;
      union.forEach((c) => { if (correctoSet.has(c) && estudianteSet.has(c)) interseccion++; });
      const exactitud = union.size === 0 ? 1 : interseccion / union.size;
      sumaExactitud += exactitud;

      const faltantes = [...correctoSet].filter((c) => !estudianteSet.has(c));
      const riesgosos = [...estudianteSet].filter((c) => M.controlesRiesgosos.includes(c));
      riesgosos.forEach((r) => riesgosSeleccionados.add(r));

      const verdict = exactitud >= 0.85 ? "ok" : exactitud >= 0.5 ? "warn" : "bad";
      feedbackDispositivos.push({
        titulo: d.nombre,
        verdict,
        concepto: "Cada dispositivo debe protegerse con controles básicos de hardening: credenciales propias, gestión cifrada y restringida, y actualización.",
        motivo: verdict === "ok"
          ? "Seleccionaste un conjunto de controles adecuado para este dispositivo."
          : (faltantes.length > 0
              ? "Te faltaron controles importantes: " + faltantes.map((id) => controlesPorId[id].nombre).join(", ") + "."
              : "El conjunto de controles seleccionado no es el más adecuado para este dispositivo."),
        riesgo: riesgosos.length > 0
          ? "Marcaste controles riesgosos para este dispositivo: " + riesgosos.map((id) => controlesPorId[id].nombre).join(", ") + "."
          : undefined,
        mejora: verdict === "ok" ? undefined : "Revisa qué controles básicos (credenciales, gestión cifrada, actualización) le faltan a " + d.nombre + "."
      });
    });

    const pctCorrecto = sumaExactitud / M.dispositivos.length;

    const texto = (respuestas.justificacion || "").trim();
    let fraccionJust = 0;
    if (texto.length >= 15) fraccionJust = 0.4;
    if (texto.length >= 40) fraccionJust = Math.max(fraccionJust, 0.55);
    let metodoJust = "vacio";
    if (texto && M.conceptosJustificacion && M.conceptosJustificacion.length) {
      const r = window.IA ? await window.IA.calcularCoincidencias(texto, M.conceptosJustificacion) : { hits: 0 };
      metodoJust = r.metodo;
      if (r.hits >= 1) fraccionJust = Math.max(fraccionJust, 0.85);
      if (r.hits >= 2) fraccionJust = 1;
    }

    const score = Math.round(pctCorrecto * 70 + fraccionJust * 30);

    const feedback = [
      ...feedbackDispositivos,
      {
        titulo: "Controles riesgosos evitados",
        verdict: riesgosSeleccionados.size === 0 ? "ok" : riesgosSeleccionados.size <= 2 ? "warn" : "bad",
        concepto: "Algunas prácticas parecen convenientes pero introducen riesgo: gestión sin restricción, credenciales compartidas, desactivar registros o dejar redes abiertas.",
        motivo: riesgosSeleccionados.size === 0
          ? "No marcaste ninguno de los controles riesgosos incluidos como distractor."
          : "Marcaste como buena práctica: " + [...riesgosSeleccionados].map((id) => controlesPorId[id].nombre).join("; ") + ".",
        riesgo: riesgosSeleccionados.size > 0 ? "Estas prácticas amplían la superficie de ataque o dificultan detectar un incidente." : undefined,
        mejora: riesgosSeleccionados.size === 0 ? undefined : "Revisa por qué esas opciones son riesgosas y quítalas de tu selección."
      },
      {
        titulo: "Justificación",
        verdict: fraccionJust >= 0.7 ? "ok" : fraccionJust >= 0.4 ? "warn" : "bad",
        concepto: "Reconocer qué pasaría sin un control ayuda a entender por qué es necesario, no solo a memorizar una lista.",
        motivo: texto
          ? "Tu respuesta fue registrada" + (metodoJust === "ia" ? " y comparada con IA local" : "") + " con los conceptos esperados."
          : "No respondiste la justificación.",
        riesgo: undefined,
        mejora: fraccionJust >= 0.7 ? undefined : "Explica en concreto qué podría hacer un atacante si ese control no estuviera aplicado."
      }
    ];

    return { score, feedback };
  }

  /* ============================================================
     MÓDULO 8 — DISEÑO DE VPN DE ACCESO REMOTO
     ============================================================ */
  function renderModulo8(app, CASO, state) {
    const M = CASO.modulo8;
    const guardado = state.respuestas.modulo8 || {};
    const yaCompletado = !!(state.resultados.modulo8 && state.resultados.modulo8.completado);

    const perfilesHTML = M.perfiles.map((p) => {
      const g = guardado[p.id] || { tipoAcceso: "", autenticacion: [], recursos: [], restricciones: [] };
      const tipoHTML = M.tiposAcceso.map((t) => `
        <label><input type="radio" name="tipo-${p.id}" value="${t.id}" ${g.tipoAcceso === t.id ? "checked" : ""}> ${esc(t.nombre)}</label>
      `).join("");
      const authHTML = M.autenticacion.map((a) => `
        <label><input type="checkbox" data-auth="${p.id}" value="${a.id}" ${(g.autenticacion || []).includes(a.id) ? "checked" : ""}> ${esc(a.nombre)}</label>
      `).join("");
      const recHTML = M.recursos.map((r) => `
        <label><input type="checkbox" data-rec="${p.id}" value="${r.id}" ${(g.recursos || []).includes(r.id) ? "checked" : ""}> ${esc(r.nombre)}</label>
      `).join("");
      const restHTML = M.restricciones.map((r) => `
        <label><input type="checkbox" data-rest="${p.id}" value="${r.id}" ${(g.restricciones || []).includes(r.id) ? "checked" : ""}> ${esc(r.nombre)}</label>
      `).join("");
      return `
        <div class="case-card" style="padding:16px">
          <h4 style="font-size:14.5px">${esc(p.nombre)}</h4>
          <p>${esc(p.descripcion)}</p>
          <label class="field-label" style="margin-top:12px">Tipo de acceso</label>
          <div class="radio-row">${tipoHTML}</div>
          <label class="field-label" style="margin-top:12px">Autenticación requerida</label>
          <div class="matrix-actions">${authHTML}</div>
          <label class="field-label" style="margin-top:12px">Recursos permitidos</label>
          <div class="matrix-actions">${recHTML}</div>
          <label class="field-label" style="margin-top:12px">Restricciones adicionales</label>
          <div class="matrix-actions">${restHTML}</div>
        </div>`;
    }).join("");

    app.appendChild(el(`
      <section class="panel">
        <span class="tag">${esc(M.titulo)}</span>
        <h2>Diseño de VPN de acceso remoto</h2>
        <p class="intro-text">${esc(M.introduccion)}</p>
        <div class="case-brief" style="grid-template-columns:1fr">${perfilesHTML}</div>
        <div id="feedbackContainer8"></div>
        ${moduleActionsHTML("modulo8", yaCompletado)}
      </section>
    `));

    function recolectar() {
      const out = {};
      M.perfiles.forEach((p) => {
        const tipoSel = document.querySelector(`input[name="tipo-${p.id}"]:checked`);
        out[p.id] = {
          tipoAcceso: tipoSel ? tipoSel.value : "",
          autenticacion: Array.from(document.querySelectorAll(`input[data-auth="${p.id}"]:checked`)).map((c) => c.value),
          recursos: Array.from(document.querySelectorAll(`input[data-rec="${p.id}"]:checked`)).map((c) => c.value),
          restricciones: Array.from(document.querySelectorAll(`input[data-rest="${p.id}"]:checked`)).map((c) => c.value)
        };
      });
      return out;
    }

    document.getElementById("btnGuardarModulo").addEventListener("click", () => {
      NSL.guardarRespuestas("modulo8", recolectar());
      NSL.guardarEstado(true);
    });

    document.getElementById("btnRevisar").addEventListener("click", () => {
      const respuestas = recolectar();
      NSL.guardarRespuestas("modulo8", respuestas);
      const resultado = evaluarModulo8(M, respuestas);
      NSL.registrarResultado("modulo8", resultado);
      document.getElementById("feedbackContainer8").innerHTML = feedbackBoxHTML(resultado.score, resultado.feedback);
      NSL.guardarEstado(false);
      document.getElementById("feedbackContainer8").scrollIntoView({ behavior: "smooth" });
    });

    if (yaCompletado) {
      const r = state.resultados.modulo8;
      document.getElementById("feedbackContainer8").innerHTML = feedbackBoxHTML(r.score, r.feedback);
    }
  }

  function jaccard(correctoArr, estudianteArr) {
    const correctoSet = new Set(correctoArr || []);
    const estudianteSet = new Set(estudianteArr || []);
    const union = new Set([...correctoSet, ...estudianteSet]);
    if (union.size === 0) return 1;
    let interseccion = 0;
    union.forEach((v) => { if (correctoSet.has(v) && estudianteSet.has(v)) interseccion++; });
    return interseccion / union.size;
  }

  function evaluarModulo8(M, respuestas) {
    const nombresPorId = {};
    M.autenticacion.forEach((a) => (nombresPorId[a.id] = a.nombre));
    M.recursos.forEach((r) => (nombresPorId[r.id] = r.nombre));
    M.restricciones.forEach((r) => (nombresPorId[r.id] = r.nombre));

    let sumaExactitud = 0;
    let cuentas = 0;
    const feedback = [];

    M.perfiles.forEach((p) => {
      const correcto = M.configuracionCorrecta[p.id];
      const est = respuestas[p.id] || { tipoAcceso: "", autenticacion: [], recursos: [], restricciones: [] };

      const tipoOk = est.tipoAcceso === correcto.tipoAcceso;
      const jAuth = jaccard(correcto.autenticacion, est.autenticacion);
      const jRec = jaccard(correcto.recursos, est.recursos);
      const jRest = jaccard(correcto.restricciones, est.restricciones);
      const exactitud = (tipoOk ? 1 : 0) * 0.25 + jAuth * 0.25 + jRec * 0.3 + jRest * 0.2;
      sumaExactitud += exactitud;
      cuentas++;

      const verdict = exactitud >= 0.85 ? "ok" : exactitud >= 0.55 ? "warn" : "bad";
      const problemas = [];
      if (!tipoOk) problemas.push("el tipo de acceso no es el más adecuado para este perfil");
      if (jRec < 0.7) problemas.push("los recursos permitidos no respetan bien el mínimo privilegio");
      if (jAuth < 0.7) problemas.push("la autenticación exigida es insuficiente o excesiva para el riesgo del perfil");
      if (jRest < 0.7) problemas.push("faltan restricciones adicionales recomendadas (IP, registro de sesión, horario)");

      feedback.push({
        titulo: p.nombre,
        verdict,
        concepto: "Una VPN de acceso remoto debe usar el tipo de conexión adecuado, exigir una autenticación proporcional al riesgo, limitar los recursos al mínimo necesario y aplicar restricciones adicionales.",
        motivo: problemas.length === 0
          ? "La configuración de este perfil está bien resuelta: acceso, autenticación, recursos y restricciones son consistentes con el riesgo del perfil."
          : "Puntos a revisar: " + problemas.join("; ") + ".",
        riesgo: problemas.length > 0 ? "Una VPN mal configurada puede dar más acceso del necesario o quedar sin trazabilidad ante un incidente." : undefined,
        mejora: problemas.length === 0 ? undefined : "Revisa el perfil considerando qué necesita realmente para su función, ni más ni menos."
      });
    });

    const score = Math.round((sumaExactitud / cuentas) * 100);
    return { score, feedback };
  }

  /* ============================================================
     MÓDULO 9 — SERVIDOR AAA EN ACCIÓN
     ============================================================ */
  function renderModulo9(app, CASO, state) {
    const M = CASO.modulo9;
    const guardado = state.respuestas.modulo9 || {};
    const yaCompletado = !!(state.resultados.modulo9 && state.resultados.modulo9.completado);

    const filas = M.escenarios.map((e) => {
      const g = guardado[e.id] || { autenticacion: "", autorizacion: "", registro: [] };
      const authHTML = M.opcionesAutenticacion.map((o) => `
        <label><input type="radio" name="auth-${e.id}" value="${o.id}" ${g.autenticacion === o.id ? "checked" : ""}> ${esc(o.nombre)}</label>
      `).join("");
      const autzHTML = M.opcionesAutorizacion.map((o) => `
        <label><input type="radio" name="autz-${e.id}" value="${o.id}" ${g.autorizacion === o.id ? "checked" : ""}> ${esc(o.nombre)}</label>
      `).join("");
      const regHTML = M.camposRegistro.map((c) => `
        <label><input type="checkbox" data-reg="${e.id}" value="${c.id}" ${(g.registro || []).includes(c.id) ? "checked" : ""}> ${esc(c.nombre)}</label>
      `).join("");
      return `
        <tr>
          <td>${esc(e.texto)}</td>
          <td><div class="decision-group">${authHTML}</div></td>
          <td><div class="decision-group">${autzHTML}</div></td>
          <td><div class="matrix-actions">${regHTML}</div></td>
        </tr>`;
    }).join("");

    app.appendChild(el(`
      <section class="panel">
        <span class="tag">${esc(M.titulo)}</span>
        <h2>Servidor AAA en acción</h2>
        <p class="intro-text">${esc(M.introduccion)}</p>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Escenario</th><th>Authentication</th><th>Authorization</th><th>Accounting: qué registrar</th></tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        <div id="feedbackContainer9"></div>
        ${moduleActionsHTML("modulo9", yaCompletado)}
      </section>
    `));

    function recolectar() {
      const out = {};
      M.escenarios.forEach((e) => {
        const authSel = document.querySelector(`input[name="auth-${e.id}"]:checked`);
        const autzSel = document.querySelector(`input[name="autz-${e.id}"]:checked`);
        out[e.id] = {
          autenticacion: authSel ? authSel.value : "",
          autorizacion: autzSel ? autzSel.value : "",
          registro: Array.from(document.querySelectorAll(`input[data-reg="${e.id}"]:checked`)).map((c) => c.value)
        };
      });
      return out;
    }

    document.getElementById("btnGuardarModulo").addEventListener("click", () => {
      NSL.guardarRespuestas("modulo9", recolectar());
      NSL.guardarEstado(true);
    });

    document.getElementById("btnRevisar").addEventListener("click", () => {
      const respuestas = recolectar();
      NSL.guardarRespuestas("modulo9", respuestas);
      const resultado = evaluarModulo9(M, respuestas);
      NSL.registrarResultado("modulo9", resultado);
      document.getElementById("feedbackContainer9").innerHTML = feedbackBoxHTML(resultado.score, resultado.feedback);
      NSL.guardarEstado(false);
      document.getElementById("feedbackContainer9").scrollIntoView({ behavior: "smooth" });
    });

    if (yaCompletado) {
      const r = state.resultados.modulo9;
      document.getElementById("feedbackContainer9").innerHTML = feedbackBoxHTML(r.score, r.feedback);
    }
  }

  function evaluarModulo9(M, respuestas) {
    const pesoEscenario = 100 / M.escenarios.length;
    let puntosTotales = 0;
    const feedback = [];

    M.escenarios.forEach((e) => {
      const resp = respuestas[e.id] || { autenticacion: "", autorizacion: "", registro: [] };
      const authOk = resp.autenticacion === e.autenticacionCorrecta;
      const autzOk = resp.autorizacion === e.autorizacionCorrecta;
      const registroCompleto = M.camposRegistro.every((c) => (resp.registro || []).includes(c.id));
      const puntos = (authOk ? 0.35 : 0) * pesoEscenario + (autzOk ? 0.35 : 0) * pesoEscenario + (registroCompleto ? 0.3 : 0) * pesoEscenario;
      puntosTotales += puntos;

      const verdict = authOk && autzOk && registroCompleto ? "ok" : authOk && autzOk ? "warn" : "bad";
      const problemas = [];
      if (!authOk) problemas.push("el resultado de autenticación no coincide con el escenario");
      if (!autzOk) problemas.push("la decisión de autorización no es la correcta para este rol y recurso");
      if (!registroCompleto) problemas.push("no marcaste todos los campos que el accounting debería registrar");

      feedback.push({
        titulo: e.texto,
        verdict,
        concepto: "El accounting siempre registra el evento completo (usuario, hora, recurso, resultado, IP), sin importar si el acceso fue exitoso, denegado o si falló la autenticación.",
        motivo: problemas.length === 0 ? e.explicacion : "Revisa: " + problemas.join("; ") + ". " + e.explicacion,
        riesgo: !registroCompleto ? "Un registro incompleto dificulta reconstruir qué pasó durante una investigación." : undefined,
        mejora: verdict === "ok" ? undefined : "Vuelve a leer el escenario identificando primero si la credencial es válida (authentication), luego si el rol tiene permiso (authorization)."
      });
    });

    return { score: Math.round(puntosTotales), feedback };
  }

  /* ============================================================
     MÓDULO 10 — ANÁLISIS DE RIESGO DE RED
     ============================================================ */
  function renderModulo10(app, CASO, state) {
    const M = CASO.modulo10;
    const guardado = state.respuestas.modulo10 || { filas: {}, justificacion: "" };
    const yaCompletado = !!(state.resultados.modulo10 && state.resultados.modulo10.completado);

    const filas = M.filas.map((f) => {
      const g = guardado.filas[f.id] || { impacto: "", controles: [] };
      const impactoHTML = ["bajo", "medio", "alto"].map((niv) => `
        <label><input type="radio" name="imp-${f.id}" value="${niv}" ${g.impacto === niv ? "checked" : ""}> ${niv[0].toUpperCase() + niv.slice(1)}</label>
      `).join("");
      const controlesHTML = M.controles.map((c) => `
        <label><input type="checkbox" data-riesgo="${f.id}" value="${c.id}" ${(g.controles || []).includes(c.id) ? "checked" : ""}> ${esc(c.nombre)}</label>
      `).join("");
      return `
        <tr>
          <td><strong>${esc(f.activo)}</strong></td>
          <td>${esc(f.amenaza)}</td>
          <td>${esc(f.vulnerabilidad)}</td>
          <td><div class="decision-group">${impactoHTML}</div></td>
          <td><div class="matrix-actions">${controlesHTML}</div></td>
        </tr>`;
    }).join("");

    app.appendChild(el(`
      <section class="panel">
        <span class="tag">${esc(M.titulo)}</span>
        <h2>Análisis de riesgo de red</h2>
        <p class="intro-text">${esc(M.introduccion)}</p>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Activo</th><th>Amenaza</th><th>Vulnerabilidad</th><th>Impacto</th><th>Control(es) recomendado(s)</th></tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        <label class="field-label" for="justificacion10">Elige una de las filas anteriores y explica qué pasaría si ninguno de los controles que propusiste se aplicara.</label>
        <textarea class="full" id="justificacion10" placeholder="Explica la consecuencia concreta...">${esc(guardado.justificacion)}</textarea>
        <div id="feedbackContainer10"></div>
        ${moduleActionsHTML("modulo10", yaCompletado)}
      </section>
    `));

    function recolectar() {
      const filasOut = {};
      M.filas.forEach((f) => {
        const impSel = document.querySelector(`input[name="imp-${f.id}"]:checked`);
        filasOut[f.id] = {
          impacto: impSel ? impSel.value : "",
          controles: Array.from(document.querySelectorAll(`input[data-riesgo="${f.id}"]:checked`)).map((c) => c.value)
        };
      });
      return { filas: filasOut, justificacion: document.getElementById("justificacion10").value };
    }

    document.getElementById("btnGuardarModulo").addEventListener("click", () => {
      NSL.guardarRespuestas("modulo10", recolectar());
      NSL.guardarEstado(true);
    });

    document.getElementById("btnRevisar").addEventListener("click", () => {
      const respuestas = recolectar();
      NSL.guardarRespuestas("modulo10", respuestas);
      const resultado = evaluarModulo10(M, respuestas);
      NSL.registrarResultado("modulo10", resultado);
      document.getElementById("feedbackContainer10").innerHTML = feedbackBoxHTML(resultado.score, resultado.feedback);
      NSL.guardarEstado(false);
      document.getElementById("feedbackContainer10").scrollIntoView({ behavior: "smooth" });
    });

    if (yaCompletado) {
      const r = state.resultados.modulo10;
      document.getElementById("feedbackContainer10").innerHTML = feedbackBoxHTML(r.score, r.feedback);
    }
  }

  function evaluarModulo10(M, respuestas) {
    const controlesPorId = {};
    M.controles.forEach((c) => (controlesPorId[c.id] = c));
    const filasResp = respuestas.filas || {};

    let sumaExactitud = 0;
    const feedback = [];

    M.filas.forEach((f) => {
      const est = filasResp[f.id] || { impacto: "", controles: [] };
      const impactoOk = est.impacto === f.impactoCorrecto;
      const jControles = jaccard(f.controlesCorrectos, est.controles);
      const exactitud = (impactoOk ? 1 : 0) * 0.4 + jControles * 0.6;
      sumaExactitud += exactitud;

      const verdict = exactitud >= 0.85 ? "ok" : exactitud >= 0.5 ? "warn" : "bad";
      feedback.push({
        titulo: `${f.activo} — ${f.amenaza}`,
        verdict,
        concepto: "Vulnerabilidad: " + f.vulnerabilidad,
        motivo: (impactoOk ? "Identificaste correctamente el nivel de impacto (" + f.impactoCorrecto + ")." : "El impacto correcto para este riesgo es " + f.impactoCorrecto + ".")
          + " " + (jControles >= 0.85 ? "Los controles seleccionados son adecuados." : "Revisa qué controles de la lista realmente mitigan esta amenaza."),
        riesgo: verdict !== "ok" ? "Subestimar el impacto o elegir controles que no atacan la causa real deja el riesgo sin mitigar." : undefined,
        mejora: verdict === "ok" ? undefined : "Relaciona la vulnerabilidad descrita con los controles que la corrigen directamente."
      });
    });

    const pctFilas = sumaExactitud / M.filas.length;

    const texto = (respuestas.justificacion || "").trim();
    const vJust = texto.length >= 40 ? "ok" : texto.length >= 15 ? "warn" : "bad";
    const puntosJust = vJust === "ok" ? 1 : vJust === "warn" ? 0.5 : 0;

    feedback.push({
      titulo: "Justificación de consecuencias",
      verdict: vJust,
      concepto: "Un análisis de riesgo se valida explicando qué pasaría en la práctica si el control no existiera.",
      motivo: vJust === "ok" ? "Desarrollaste una explicación concreta de la consecuencia de no aplicar el control." : "Tu explicación podría desarrollarse con más detalle.",
      riesgo: undefined,
      mejora: vJust === "ok" ? undefined : "Describe un escenario concreto: qué haría un atacante y qué dato o sistema se vería afectado."
    });

    const score = Math.round(pctFilas * 85 + puntosJust * 15);
    return { score, feedback };
  }

  /* ============================================================
     RESUMEN FINAL
     ============================================================ */
  function renderResumen(app, CASO, state) {
    const total = NSL.calcularPuntajeTotal();
    const notaAprob = CASO.puntajes.notaAprobacion;
    const pctFinal = total.maximo ? Math.round((total.obtenido / total.maximo) * 100) : 0;
    const aprobado = pctFinal >= notaAprob;
    const todosCompletos = NSL.MODULOS_ORDEN.every((m) => state.resultados[m] && state.resultados[m].completado);

    const cardsHTML = NSL.MODULOS_ORDEN.map((m) => {
      const r = state.resultados[m];
      const titulo = CASO[m].titulo.replace(/^Módulo \d+ · /, "");
      return `
        <div class="summary-card">
          <h4>${esc(titulo)}</h4>
          <div class="big">${r ? Math.round(r.score) : "—"}${r ? "/100" : ""}</div>
          <p style="margin-top:4px;font-size:12px;color:${r ? "var(--ok)" : "var(--text-faint)"}">${r ? "Completado" : "Pendiente"}</p>
        </div>`;
    }).join("");

    app.appendChild(el(`
      <section class="panel">
        <span class="tag">Resumen final</span>
        <h2>Informe de resultados — ${esc(CASO.caso.nombre)}</h2>
        <p class="intro-text">Estudiante: ${esc(state.alumno || "(sin nombre registrado)")}</p>
        <div class="summary-total">
          <div class="big-score">${pctFinal}%</div>
          <p style="margin:4px 0 0;color:var(--text-muted)">${total.obtenido} de ${total.maximo} puntos</p>
          <span class="status-pill ${aprobado ? "ok" : "bad"}">${aprobado ? "Nivel logrado" : "Requiere refuerzo"}</span>
          ${!todosCompletos ? '<p style="margin-top:10px;color:var(--warn);font-size:13px">Aún hay módulos sin completar. El puntaje final considera solo los módulos revisados.</p>' : ""}
        </div>
        <div class="summary-grid">${cardsHTML}</div>
        <div class="module-actions">
          <button class="btn btn-primary" id="btnFinalizar">Finalizar laboratorio</button>
          <button class="btn btn-secondary" id="btnDescargarJSON">Descargar resultados (JSON)</button>
          <button class="btn btn-secondary" id="btnImprimirResumen">Imprimir informe</button>
        </div>
        <div id="finalizarMsg" style="margin-top:14px;color:var(--text-muted);font-size:13px"></div>
      </section>
    `));

    document.getElementById("btnDescargarJSON").addEventListener("click", () => NSL.descargarJSON());
    document.getElementById("btnImprimirResumen").addEventListener("click", () => NSL.imprimirInforme());
    document.getElementById("btnFinalizar").addEventListener("click", () => {
      NSL.guardarEstado(false);
      const msg = document.getElementById("finalizarMsg");
      if (!todosCompletos) {
        msg.textContent = "Laboratorio guardado como finalizado. Ten en cuenta que algunos módulos aún no fueron revisados.";
      } else {
        msg.textContent = "Laboratorio finalizado. Puedes descargar o imprimir tu informe cuando quieras.";
      }
      NSL.mostrarMensaje("Laboratorio finalizado.");
    });
  }

  return { renderInicio, renderResumen, renderModulo };
})();
