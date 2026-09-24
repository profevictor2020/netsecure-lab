# NetSecure Lab

Dos herramientas educativas de seguridad de redes para la asignatura **Seguridad Informática — Unidad 2** ("Seguridad de redes, autenticación, autorización y auditoría"), publicadas juntas en el mismo sitio de GitHub Pages. Ambas son **100% estáticas** (HTML + CSS + JavaScript, sin backend, sin base de datos, sin cuentas de usuario) y usan el mismo caso ficticio: **FríoSur Distribución**.

```
netsecure-lab/
├── index.html          → página de inicio: elige entre las dos herramientas
├── css/landing.css     → estilos de la página de inicio
├── lab/                → Laboratorio de Seguridad de Redes (10 módulos, evaluado)
│   └── README.md       → instrucciones detalladas de esta herramienta
└── firewall-sim/       → Simulador de Firewall (práctica libre, sin nota)
    └── README.md       → instrucciones detalladas de esta herramienta
```

## Las dos herramientas

| | [`lab/`](lab/) | [`firewall-sim/`](firewall-sim/) |
|---|---|---|
| **Qué es** | Laboratorio evaluado de 10 módulos: diseño de red, firewall, autenticación/autorización, modelo AAA, auditoría de logs, protección de dispositivos, VPN, análisis de riesgo y caso integrador. | Simulador de firewall de práctica libre: el estudiante crea sus propias reglas y prueba comunicaciones en tiempo real, con retroalimentación educativa inmediata. |
| **Evaluación** | Retroalimentación + puntaje por módulo (evaluación con IA local para las respuestas de texto libre). | Sin nota ni puntaje — feedback contextual en cada prueba, pensado como espacio de práctica antes o junto al laboratorio. |
| **URL una vez publicado** | `https://tu-usuario.github.io/netsecure-lab/lab/` | `https://tu-usuario.github.io/netsecure-lab/firewall-sim/` |

## Cómo publicarlo en GitHub Pages

1. En GitHub, entra a **Settings → Pages** del repositorio.
2. En **Build and deployment → Source**, selecciona **Deploy from a branch**.
3. En **Branch**, elige `main` y la carpeta **/ (root)**.
4. Guarda. GitHub mostrará la URL pública (`https://tu-usuario.github.io/netsecure-lab/`) — esa es la página de inicio con los dos botones.

No hay build ni pasos de compilación: todo el repositorio se publica tal cual.

## Cómo probarlo localmente

Los navegadores bloquean la carga de JSON local (`fetch`) cuando se abre un archivo con doble clic (protocolo `file://`). Para probar localmente:

```bash
cd netsecure-lab
python3 -m http.server 8000
```

Luego abre `http://localhost:8000` (página de inicio), `http://localhost:8000/lab/` o `http://localhost:8000/firewall-sim/`.

## Documentación de cada herramienta

- **[lab/README.md](lab/README.md)** — cómo modificar el caso de estudio, las preguntas, los puntajes, y cómo agregar nuevos casos o módulos al laboratorio.
- **[firewall-sim/README.md](firewall-sim/README.md)** — cómo funciona el motor de reglas del firewall, cómo modificar el escenario, las zonas, los servicios y las heurísticas de retroalimentación.

## Notas importantes

- No se solicitan ni almacenan credenciales reales; no se simula tráfico real ni se ejecutan comandos del sistema.
- No se usan nombres de empresas reales; todos los casos son ficticios.
- El progreso se guarda en `localStorage`, local al navegador de cada estudiante.
- El repositorio de GitHub es **público** (requisito de GitHub Pages en el plan gratuito), por lo que cualquiera puede ver el código fuente y los datos de los escenarios.
