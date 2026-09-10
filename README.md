# NetSecure Lab — Laboratorio de Seguridad de Redes

Aplicación web educativa para practicar conceptos de **seguridad de redes, autenticación, autorización y auditoría** (Unidad 2 de la asignatura Seguridad Informática), sin usar Cisco Packet Tracer ni instalar software.

Es una web **100% estática** (HTML + CSS + JavaScript). No usa backend, base de datos, cuentas de usuario ni servicios externos. El avance del estudiante se guarda de forma **opcional** en el `localStorage` del navegador, y los resultados pueden **descargarse en JSON** o **imprimirse** como informe.

Caso de estudio incluido: **FríoSur Distribución**, una empresa ficticia de distribución de alimentos refrigerados.

---

## 1. Estructura del proyecto

```
netsecure-lab/
├── index.html              → estructura de la aplicación (una sola página)
├── css/
│   └── style.css           → estilos (tema tipo centro de operaciones de seguridad)
├── js/
│   ├── config.js           → registro de casos de estudio disponibles
│   ├── app.js               → núcleo: navegación, estado, guardado, progreso, informe
│   └── modulos.js           → renderizado y evaluación pedagógica de los 6 módulos
├── data/
│   └── casos/
│       └── friosur.json    → datos editables del caso "FríoSur Distribución"
└── README.md
```

No hay pasos de compilación (build). El proyecto se publica tal cual.

---

## 2. Cómo probarlo localmente

Los navegadores bloquean por seguridad la carga de archivos JSON locales (`fetch`) cuando se abre `index.html` con doble clic (protocolo `file://`). Por eso, para probar localmente se necesita un servidor local simple (no requiere instalar nada adicional):

```bash
cd netsecure-lab
python3 -m http.server 8000
```

Luego abre `http://localhost:8000` en el navegador.

Alternativas equivalentes: la extensión "Live Server" de VS Code, o `npx serve`.

---

## 3. Cómo publicarlo en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo, `netsecure-lab`).
2. Sube todo el contenido de esta carpeta a la raíz del repositorio (o a una carpeta `docs/`, ver más abajo).
3. En GitHub, entra a **Settings → Pages**.
4. En **Build and deployment → Source**, selecciona **Deploy from a branch**.
5. En **Branch**, elige `main` (o la que uses) y la carpeta `/ (root)` — o `/docs` si subiste el proyecto ahí.
6. Guarda. GitHub mostrará la URL pública (algo como `https://tu-usuario.github.io/netsecure-lab/`) en unos minutos.
7. Comparte esa URL con los estudiantes. No requiere configuración adicional: GitHub Pages sirve los archivos por HTTPS, lo que permite que `fetch()` cargue el JSON sin problemas.

---

## 4. Cómo modificar el caso, las preguntas, las respuestas y los puntajes (para el docente)

Todo el contenido pedagógico vive en **`data/casos/friosur.json`**. No es necesario tocar el código JavaScript para:

- Cambiar textos, nombres de componentes, roles, recursos o logs.
- Agregar o quitar filas en las tablas (reglas de firewall, situaciones AAA, logs, preguntas del caso integrador).
- Cambiar las respuestas correctas.
- Cambiar el texto de retroalimentación.
- Cambiar la nota de aprobación (`puntajes.notaAprobacion`).

### Reglas al editar el JSON

- Mantén el formato JSON válido (comillas dobles, sin comas colgantes). Puedes validar el archivo en <https://jsonlint.com/> antes de publicarlo, o con `python3 -m json.tool data/casos/friosur.json`.
- Cada `id` (de componentes, zonas, reglas, roles, recursos, situaciones, logs, preguntas) debe ser **único** dentro de su lista, porque el código los usa para vincular la respuesta del estudiante con la retroalimentación correcta.
- Si agregas un componente nuevo en `modulo1.componentes`, asegúrate de indicar su `zonaCorrecta` con el `id` de una zona existente en `modulo1.zonas`.
- Si agregas una regla nueva en `modulo2.reglas`, agrega también las tres claves de `feedback` (`permitir`, `bloquear`, `permitir_registrar`) para que el estudiante reciba retroalimentación sin importar qué opción elija.
- Si agregas un rol o recurso nuevo en `modulo3`, agrega también su entrada correspondiente en `matrizCorrecta`.
- Los campos `conceptosEsperados` (módulo 6) son palabras/frases clave que el sistema busca en la respuesta del estudiante para dar una retroalimentación más específica; no es una corrección exacta de texto libre, sino una guía orientativa.

### Dónde se ajusta el puntaje

- `puntajes.notaAprobacion`: porcentaje mínimo (sobre 100%) para que el resumen final muestre "Nivel logrado".
- Cada módulo se evalúa sobre 100 puntos y todos tienen el mismo peso en el puntaje total (600 puntos posibles). Si se requiere ponderar módulos de forma distinta, se debe ajustar la función `calcularPuntajeTotal()` en `js/app.js`.
- La lógica de cálculo detallada de cada módulo está en `js/modulos.js`, en las funciones `evaluarModulo1` a `evaluarModulo6`, con comentarios explicativos. Los criterios de evaluación de mayor peso conceptual (por ejemplo, los 5 criterios del módulo 1) están descritos también dentro del JSON (`modulo1.criterios`) para quien solo quiera ajustar los textos.

---

## 5. Cómo agregar nuevos casos (banca, salud, energía, logística, salmonicultura, etc.)

La aplicación está preparada para soportar más de un caso de estudio sin duplicar código:

1. Copia `data/casos/friosur.json` a un nuevo archivo, por ejemplo `data/casos/banca.json`.
2. Edita ese archivo con los componentes, zonas, reglas, roles, situaciones, logs y preguntas del nuevo sector (manteniendo la misma estructura de claves).
3. Abre `js/config.js` y agrega una línea a `CASOS_DISPONIBLES`, por ejemplo:

   ```js
   { id: "banca", nombre: "Caso Banca", archivo: "data/casos/banca.json" }
   ```

4. El caso puede seleccionarse agregando `?caso=banca` a la URL de la aplicación (por ejemplo, `https://tu-usuario.github.io/netsecure-lab/?caso=banca`). Si no se indica ningún parámetro, se carga el primer caso de la lista.

No es necesario modificar `index.html`, `app.js` ni `modulos.js` para agregar un caso nuevo: toda la estructura de módulos (diseño de red, firewall, autenticación/autorización, AAA, logs, caso integrador) es genérica y se alimenta del archivo JSON correspondiente.

---

## 6. Módulos del laboratorio

1. **Diseño de una red** — el estudiante organiza los componentes del caso en zonas de red (usuarios, administrativa, servidores, cámaras, sensores, acceso remoto, Internet) y justifica su propuesta.
2. **Reglas de firewall** — para cada comunicación origen/destino/servicio, el estudiante decide permitir, bloquear o permitir y registrar, con justificación.
3. **Autenticación y autorización** — matriz de roles × recursos × acciones permitidas (ingresar, consultar, crear, modificar, eliminar, administrar).
4. **Modelo AAA** — clasificación de situaciones como autenticación, autorización o auditoría (accounting).
5. **Análisis de registros (logs)** — identificación de eventos sospechosos en una bitácora de actividad y preguntas de análisis.
6. **Caso integrador** — escenario de incidente con siete preguntas abiertas de respuesta y contención.

Cada módulo entrega retroalimentación explicando el concepto aplicado, por qué una decisión es adecuada, qué riesgo se reduce, qué error conceptual se cometió y cómo mejorar la respuesta — no solo "correcto/incorrecto". El sistema **no revela las respuestas correctas antes de que el estudiante presione "Revisar respuestas"**.

Al final, el **Resumen final** muestra el puntaje por módulo y el puntaje total, y permite descargar los resultados en JSON o imprimir un informe (usa la función de impresión del navegador, con un estilo optimizado para papel).

---

## 7. Notas importantes

- No se solicitan ni almacenan credenciales reales.
- No se usan nombres de empresas reales; todos los casos son ficticios.
- El progreso guardado en `localStorage` es local al navegador del estudiante: si borra los datos del sitio o cambia de navegador/dispositivo, perderá el avance guardado (pero puede volver a completar el laboratorio en cualquier momento).
- La aplicación es responsive: se adapta a computador y a tablet. En pantallas pequeñas, la navegación entre módulos se desplaza horizontalmente.
