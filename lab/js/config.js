/* ============================================================
   NetSecure Lab — config.js
   Registro de casos de estudio disponibles.
   Para agregar un nuevo caso (banca, salud, energía, logística,
   salmonicultura, etc.), duplica un archivo de /data/casos/,
   edítalo según las instrucciones del README y agrega una línea
   aquí abajo. El caso puede seleccionarse con ?caso=id en la URL;
   si no se indica, se usa el primero de la lista.
   ============================================================ */

const CASOS_DISPONIBLES = [
  { id: "friosur", nombre: "FríoSur Distribución (logística de frío)", archivo: "data/casos/friosur.json" }
  // Ejemplo para agregar más adelante:
  // { id: "banca", nombre: "Caso Banca", archivo: "data/casos/banca.json" },
  // { id: "salud", nombre: "Caso Salud", archivo: "data/casos/salud.json" },
  // { id: "energia", nombre: "Caso Energía", archivo: "data/casos/energia.json" },
  // { id: "logistica", nombre: "Caso Logística", archivo: "data/casos/logistica.json" },
  // { id: "salmonicultura", nombre: "Caso Salmonicultura", archivo: "data/casos/salmonicultura.json" }
];

function obtenerCasoActivo() {
  const params = new URLSearchParams(window.location.search);
  const idSolicitado = params.get("caso");
  const encontrado = CASOS_DISPONIBLES.find((c) => c.id === idSolicitado);
  return encontrado || CASOS_DISPONIBLES[0];
}
