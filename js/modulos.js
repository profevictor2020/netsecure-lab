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

  /* Pone el botón "Revisar respuestas" en estado de carga mientras
     la IA local analiza el texto (puede tardar unos segundos,
     especialmente la primera vez que descarga el modelo). */
  function marcarAnalizando(analizando, yaCompletado) {
    const btn = document.getElementById("btnRevisar");
    if (!btn) return;
    btn.disabled = analizando;
    btn.textContent = analizando
      ? "Analizando con IA…"
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
          El laboratorio tiene 6 módulos. Puedes navegar entre ellos con el menú superior. Tu avance se puede guardar
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
      modulo4: renderModulo4, modulo5: renderModulo5, modulo6: renderModulo6
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
        motivo: puntosPreguntas >= 25 ? "Tus respuestas muestran un análisis desarrollado." : "Tus respuestas podrían desarrollarse con más detalle.",
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
