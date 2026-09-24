/* ============================================================
   NetSecure Lab — Simulador de Firewall — motor.js
   Lógica pura del firewall: coincidencia de reglas, evaluación
   de tráfico y heurísticas de riesgo. Sin DOM, sin red, sin
   ejecución de comandos: es una simulación lógica en el navegador.
   ============================================================ */

const Motor = (function () {

  /* ---------------- Utilidades de coincidencia ---------------- */

  function esComodin(valor) {
    return valor === undefined || valor === null || valor === "" || String(valor).toLowerCase() === "cualquiera";
  }

  function coincideCampo(valorRegla, valorPaquete) {
    if (esComodin(valorRegla)) return true;
    return String(valorRegla).toLowerCase() === String(valorPaquete).toLowerCase();
  }

  function coincidePuerto(puertoRegla, puertoPaquete) {
    if (esComodin(puertoRegla)) return true;
    return String(puertoRegla).toLowerCase() === String(puertoPaquete).toLowerCase();
  }

  function coincideIP(ipRegla, ipPaquete) {
    if (!ipRegla || esComodin(ipRegla)) return true;
    if (!ipPaquete) return false;
    return ipRegla.trim().toLowerCase() === ipPaquete.trim().toLowerCase();
  }

  /* Una regla coincide con un paquete de prueba si está habilitada
     y todos sus campos (los que no son comodín) calzan con el paquete. */
  function reglaCoincide(regla, paquete) {
    if (!regla.habilitada) return false;
    if (!coincideCampo(regla.origen, paquete.origen)) return false;
    if (!coincideCampo(regla.destino, paquete.destino)) return false;
    const protocoloRegla = regla.protocolo === "Cualquiera" ? "cualquiera" : regla.protocolo;
    if (!coincideCampo(protocoloRegla, paquete.protocolo)) return false;
    if (!coincidePuerto(regla.puerto, paquete.puerto)) return false;
    if (!coincideIP(regla.ipOrigen, paquete.ipOrigen)) return false;
    if (!coincideIP(regla.ipDestino, paquete.ipDestino)) return false;
    return true;
  }

  /* Evalúa las reglas de arriba hacia abajo y aplica la primera que
     coincide (first-match). Si ninguna coincide, aplica la política
     por defecto: denegar. */
  function evaluarTrafico(reglas, paquete) {
    for (let i = 0; i < reglas.length; i++) {
      if (reglaCoincide(reglas[i], paquete)) {
        return {
          indice: i,
          reglaAplicada: reglas[i],
          resultado: reglas[i].accion === "bloquear" ? "bloqueado" : "permitido",
          registrado: reglas[i].accion === "permitir_registrar" || reglas[i].accion === "bloquear"
        };
      }
    }
    return { indice: -1, reglaAplicada: null, resultado: "bloqueado", registrado: true };
  }

  /* ---------------- Advertencias en tiempo real sobre una regla ---------------- */
  /* No dependen de "la respuesta correcta": son señales de buenas
     prácticas de firewall, calculadas sobre la regla tal como la
     dejó el estudiante. */
  function analizarRegla(regla, contexto) {
    const avisos = [];
    const zonaOrigen = contexto.zonaDe(regla.origen);
    const zonaDestino = contexto.zonaDe(regla.destino);

    if (esComodin(regla.origen) && esComodin(regla.destino) && regla.accion !== "bloquear") {
      avisos.push({ tipo: "insegura", texto: "Insegura: permite cualquier origen hacia cualquier destino, sin restricción." });
    }

    const servicioAmplio = regla.protocolo === "Cualquiera" || esComodin(regla.puerto);
    if (servicioAmplio && zonaDestino && zonaDestino.confianza >= 4 && regla.accion !== "bloquear") {
      avisos.push({ tipo: "advertencia", texto: "Servicio sin restricción (cualquier puerto/protocolo) hacia una zona crítica." });
    }

    if (zonaOrigen && zonaOrigen.confianza === 0 && zonaDestino && zonaDestino.confianza >= 4 && regla.accion !== "bloquear") {
      avisos.push({ tipo: "advertencia", texto: "Permite que una zona no confiable llegue directo a una zona crítica." });
    }

    if (zonaOrigen && (zonaOrigen.id === "camaras" || zonaOrigen.id === "sensores") &&
        zonaDestino && zonaDestino.id === "internet" && servicioAmplio && regla.accion !== "bloquear") {
      avisos.push({ tipo: "advertencia", texto: "Dispositivo IoT con salida sin restricción a Internet (riesgo de botnet)." });
    }

    if (regla.accion === "permitir" && zonaDestino && zonaDestino.confianza >= 4) {
      avisos.push({ tipo: "sugerencia", texto: "Considera 'permitir y registrar' para mantener trazabilidad sobre un recurso crítico." });
    }

    return avisos;
  }

  /* ---------------- Riesgo de permitir una comunicación ---------------- */
  /* Evalúa qué tan riesgoso sería PERMITIR este paquete, independiente de
     si una regla ya lo permitió o es solo hipotético. La reutilizan tanto
     generarFeedback() (para explicar un resultado real) como
     sugerirAccion() (para proponer qué acción debería tener una regla
     nueva). No es una clave de respuestas: son señales de buenas
     prácticas según la confianza de cada zona. */
  function evaluarRiesgoSiPermitido(paquete, contexto, opts) {
    const zonaOrigen = contexto.zonaDe(paquete.origen);
    const zonaDestino = contexto.zonaDe(paquete.destino);
    const sinRegistro = !!(opts && opts.sinRegistro);

    if (zonaOrigen && zonaOrigen.confianza === 0 && zonaDestino && zonaDestino.confianza >= 4) {
      return { verdict: "bad", riesgo: `Estás permitiendo que una zona no confiable (${zonaOrigen.nombre}) llegue directo a una zona crítica (${zonaDestino.nombre}). Esto amplía enormemente la superficie de ataque.` };
    }
    if (zonaOrigen && (zonaOrigen.id === "camaras" || zonaOrigen.id === "sensores") && paquete.destino === "internet") {
      return { verdict: "bad", riesgo: `Un dispositivo IoT (${zonaOrigen.nombre}) con salida a Internet sin restricción es un riesgo típico: podría formar parte de una botnet si es comprometido.` };
    }
    if (zonaOrigen && zonaOrigen.id === "internet" && zonaDestino && (zonaDestino.id === "camaras" || zonaDestino.id === "sensores")) {
      return { verdict: "bad", riesgo: `Exponer un dispositivo IoT (${zonaDestino.nombre}) directamente a Internet permite que cualquiera en la red pública intente acceder a él sin pasar por ningún control. Debería ser alcanzable solo desde dentro de la red.` };
    }
    if (paquete.origen === "proveedor_externo" && paquete.destino !== "servidor_despacho") {
      return { verdict: "bad", riesgo: "Un proveedor externo debería acceder solo al recurso puntual que necesita (por ejemplo, el servidor de despacho), no a otros sistemas críticos." };
    }
    if (paquete.origen === "usuario_vpn" && paquete.destino === "base_datos") {
      return { verdict: "bad", riesgo: "Incluso desde una VPN autenticada, el acceso directo a la base de datos debería evitarse: la aplicación (servidor web) debería ser el único intermediario." };
    }
    if (paquete.destino === "base_datos" && paquete.origen !== "servidor_web") {
      return { verdict: "bad", riesgo: "El acceso directo a la base de datos, sin pasar por la aplicación, amplía el riesgo de modificación, extracción o destrucción de información." };
    }
    if (sinRegistro && zonaDestino && zonaDestino.confianza >= 4) {
      return { verdict: "warn", riesgo: `Esta comunicación llega a una zona crítica (${zonaDestino.nombre}) y quedó permitida sin registrar. Para trazabilidad, conviene usar "permitir y registrar" en accesos a recursos sensibles.` };
    }
    return { verdict: "ok", riesgo: undefined };
  }

  /* Sugiere una acción razonable para una regla nueva que resuelva este
     paquete: si permitirlo sería riesgoso, sugiere bloquear; si no,
     sugiere permitir y registrar (con trazabilidad por defecto). */
  function sugerirAccion(paquete, contexto) {
    const r = evaluarRiesgoSiPermitido(paquete, contexto);
    return r.verdict === "bad" ? "bloquear" : "permitir_registrar";
  }

  /* ---------------- Retroalimentación de una prueba de tráfico ---------------- */
  function generarFeedback(paquete, evaluacion, contexto) {
    const zonaDestino = contexto.zonaDe(paquete.destino);
    const zonaOrigen = contexto.zonaDe(paquete.origen);
    const nombreOrigen = contexto.nombreDe(paquete.origen);
    const nombreDestino = contexto.nombreDe(paquete.destino);
    const { resultado, reglaAplicada, indice } = evaluacion;

    let motivo, riesgo, mejora, notaRetorno;
    let verdict = "ok";

    if (resultado === "permitido") {
      motivo = `La regla #${indice + 1} ("${reglaAplicada.nombre || "sin nombre"}") permitió esta comunicación.`;
      notaRetorno = "Al permitir esta conexión, el firewall también permite automáticamente el tráfico de retorno correspondiente (una conexión con estado no necesita una regla aparte para la respuesta).";

      const evalRiesgo = evaluarRiesgoSiPermitido(paquete, contexto, { sinRegistro: reglaAplicada.accion === "permitir" });
      verdict = evalRiesgo.verdict;
      riesgo = evalRiesgo.riesgo;

      if (verdict === "bad") {
        mejora = `Revisa la regla #${indice + 1} ("${reglaAplicada.nombre || "sin nombre"}"): probablemente sea demasiado amplia, o debería bloquear en vez de permitir esta combinación.`;
      } else if (verdict === "warn") {
        mejora = `Cambia la acción de la regla #${indice + 1} a "permitir y registrar", o crea una regla más específica para este caso.`;
      }
    } else {
      // bloqueado
      if (reglaAplicada) {
        motivo = `La regla #${indice + 1} ("${reglaAplicada.nombre || "sin nombre"}") bloqueó esta comunicación explícitamente.`;
        if (zonaOrigen && zonaOrigen.confianza >= 2 && zonaDestino && zonaDestino.confianza <= 2 && zonaOrigen.id !== "internet") {
          riesgo = "Bloqueaste una comunicación entre zonas de bajo riesgo relativo; confirma que efectivamente no sea necesaria para la operación.";
          verdict = "warn";
          mejora = `Si esta comunicación sí es necesaria, ajusta o reordena la regla #${indice + 1}.`;
        }
      } else {
        motivo = "Ninguna regla coincidió con esta comunicación, así que el firewall aplicó la política por defecto: denegar todo lo que no está explícitamente permitido.";
        riesgo = "Si esta comunicación SÍ es necesaria para la operación de FríoSur, el firewall nunca la permitirá mientras no exista una regla explícita para ella.";
        verdict = "warn";
        mejora = `Ve a "Reglas de firewall" y crea una regla específica: ${nombreOrigen} → ${nombreDestino} (${paquete.servicio}).`;
      }
    }

    return {
      verdict, // 'ok' | 'warn' | 'bad'
      resultado, // 'permitido' | 'bloqueado'
      reglaAplicada,
      indice,
      registrado: evaluacion.registrado,
      motivo,
      riesgo,
      mejora,
      notaRetorno,
      // Cuando verdict !== 'ok', una regla nueva con esta acción (insertada
      // primero) resolvería este paquete exactamente. La UI la ofrece como
      // botón de creación automática — el estudiante puede editarla después.
      accionSugerida: verdict === "ok" ? null : sugerirAccion(paquete, contexto)
    };
  }

  function crearReglaVacia(nombreSugerido) {
    return {
      id: "r" + Date.now() + Math.floor(Math.random() * 10000),
      nombre: nombreSugerido || "Nueva regla",
      direccion: "entrada",
      origen: "cualquiera",
      destino: "cualquiera",
      ipOrigen: "",
      ipDestino: "",
      protocolo: "Cualquiera",
      puerto: "cualquiera",
      accion: "bloquear",
      habilitada: true,
      comentario: ""
    };
  }

  return {
    reglaCoincide, evaluarTrafico, analizarRegla, generarFeedback, crearReglaVacia, esComodin,
    evaluarRiesgoSiPermitido, sugerirAccion
  };
})();
