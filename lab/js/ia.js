/* ============================================================
   NetSecure Lab — ia.js
   Evaluación semántica de respuestas de texto libre usando un
   modelo de embeddings que corre 100% en el navegador del
   estudiante (Transformers.js + modelo cuantizado en ONNX).

   - No hay backend, no hay API key, no hay costo por uso.
   - El modelo se descarga UNA vez desde un CDN público (~100 MB)
     y el navegador lo cachea; después funciona sin red.
   - Ningún dato del estudiante se envía a ningún servidor: todo
     el cálculo de similitud ocurre localmente.
   - Si el modelo no logra cargar (sin conexión, navegador muy
     antiguo, primera visita con red muy lenta, etc.), el sistema
     cae automáticamente a comparación por palabras clave — igual
     que el comportamiento original — para que el laboratorio
     nunca quede bloqueado.
   ============================================================ */

(function () {
  const MODELO = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
  const CDN = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";
  // Similitud coseno mínima para contar un concepto como "presente".
  // Calibrado empíricamente con este modelo: respuestas irrelevantes u
  // off-topic caen en ~0.0–0.30, un concepto de seguridad distinto al
  // esperado ronda ~0.35–0.40, y una paráfrasis genuina del concepto
  // esperado se ubica en ~0.45 en adelante. 0.46 separa bien ambos casos.
  const UMBRAL_SIMILITUD = 0.46;

  let pipelinePromise = null;
  let modeloDisponible = null; // null = aún no se sabe

  async function obtenerPipeline() {
    if (!pipelinePromise) {
      pipelinePromise = (async () => {
        try {
          const { pipeline } = await import(CDN);
          const extractor = await pipeline("feature-extraction", MODELO);
          modeloDisponible = true;
          return extractor;
        } catch (e) {
          console.warn(
            "NetSecure Lab: no se pudo cargar el modelo de IA local; se usará comparación por palabras clave.",
            e
          );
          modeloDisponible = false;
          return null;
        }
      })();
    }
    return pipelinePromise;
  }

  function similitudCoseno(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  }

  async function embeber(extractor, texto) {
    const salida = await extractor(texto, { pooling: "mean", normalize: true });
    return Array.from(salida.data);
  }

  function normaliza(str) {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  }

  function calcularCoincidenciasPorPalabras(texto, conceptos) {
    const t = normaliza(texto);
    let hits = 0;
    conceptos.forEach((frase) => {
      const palabrasClave = normaliza(frase).split(/\s+/).filter((w) => w.length > 4);
      if (palabrasClave.some((w) => t.includes(w))) hits++;
    });
    return { hits, detalle: null, metodo: "palabras_clave" };
  }

  /* Compara un texto libre contra una lista de conceptos esperados.
     Devuelve cuántos de esos conceptos están presentes, ya sea por
     similitud semántica (si el modelo de IA cargó) o por coincidencia
     de palabras clave (respaldo). */
  async function calcularCoincidencias(texto, conceptos) {
    if (!texto || !conceptos || conceptos.length === 0) {
      return { hits: 0, detalle: null, metodo: "vacio" };
    }
    const extractor = await obtenerPipeline();
    if (!extractor) {
      return calcularCoincidenciasPorPalabras(texto, conceptos);
    }
    try {
      const embTexto = await embeber(extractor, texto);
      let hits = 0;
      const detalle = [];
      for (const concepto of conceptos) {
        const embConcepto = await embeber(extractor, concepto);
        const sim = similitudCoseno(embTexto, embConcepto);
        if (sim >= UMBRAL_SIMILITUD) hits++;
        detalle.push({ concepto, similitud: Math.round(sim * 100) / 100 });
      }
      return { hits, detalle, metodo: "ia" };
    } catch (e) {
      console.warn("NetSecure Lab: fallo al calcular similitud con IA; se usará comparación por palabras clave.", e);
      return calcularCoincidenciasPorPalabras(texto, conceptos);
    }
  }

  /* Empieza a descargar el modelo en segundo plano apenas carga la
     página, para que esté listo (o casi) cuando el estudiante llegue
     a una pregunta de texto libre. Si falla, no bloquea nada. */
  function precargar() {
    obtenerPipeline();
  }

  window.IA = {
    calcularCoincidencias,
    precargar,
    get modeloDisponible() { return modeloDisponible; }
  };
})();
