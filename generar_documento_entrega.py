# -*- coding: utf-8 -*-
"""
Genera el documento de entrega "Sistemas de Control de Versiones para el
Desarrollo de una Solucion de Software" en formato .docx, en la raiz del
proyecto, siguiendo la estructura exigida por la consigna.
"""

from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()

# ---------- Estilos base ----------
style = doc.styles["Normal"]
style.font.name = "Calibri"
style.font.size = Pt(11)


def set_cell_shading(cell, color_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color_hex)
    tcPr.append(shd)


def add_title_page():
    doc.add_paragraph()
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("SISTEMAS DE CONTROL DE VERSIONES\nPARA EL DESARROLLO DE UNA SOLUCION DE SOFTWARE")
    run.bold = True
    run.font.size = Pt(22)

    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run2 = p2.add_run("Caso de aplicacion: Aleri — Plataforma de Mantenimiento Predictivo\npara Hydromaq S.A.C.")
    run2.font.size = Pt(14)
    run2.italic = True

    doc.add_paragraph()
    doc.add_paragraph()

    table = doc.add_table(rows=4, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    rows_data = [
        ("Proyecto", "Aleri (mantenimiento predictivo de equipos hidraulicos/lubricacion)"),
        ("Repositorio remoto", "https://github.com/vlbxrtttt10/pyto-h.desarrollo"),
        ("Sistema de control de versiones", "Git + GitHub"),
        ("Entorno de desarrollo", "Visual Studio Code, Laravel 12, React 19, MySQL"),
    ]
    for i, (k, v) in enumerate(rows_data):
        table.cell(i, 0).text = k
        table.cell(i, 0).paragraphs[0].runs[0].bold = True
        table.cell(i, 1).text = v

    doc.add_page_break()


def add_heading(text, level=1):
    h = doc.add_heading(text, level=level)
    return h


def add_body(text, bold=False, italic=False):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = bold
    run.italic = italic
    return p


def add_bullet(text):
    doc.add_paragraph(text, style="List Bullet")


def add_numbered(text):
    doc.add_paragraph(text, style="List Number")


def add_code_block(text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.3)
    run = p.add_run(text)
    run.font.name = "Consolas"
    run.font.size = Pt(9.5)
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), "F2F2F2")
    pPr.append(shd)
    return p


def add_simple_table(headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Light Grid Accent 1"
    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        hdr_cells[i].paragraphs[0].runs[0].bold = True
        set_cell_shading(hdr_cells[i], "D9E2F3")
    for row in rows:
        cells = table.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = str(val)
    return table


# =====================================================================
# PORTADA
# =====================================================================
add_title_page()

# =====================================================================
# 1. DESCRIPCION DE LA PROPUESTA
# =====================================================================
add_heading("1. Descripcion de la propuesta", level=1)

add_heading("1.1 Objetivo del proyecto", level=2)
add_body(
    "El objetivo de este proyecto es aplicar un sistema de control de versiones (Git) "
    "para gestionar de forma ordenada el ciclo de vida completo del desarrollo de Aleri, "
    "una plataforma web de mantenimiento predictivo orientada a resolver una problematica "
    "real de la empresa Hydromaq S.A.C. El proyecto cubre la creacion y administracion de "
    "un repositorio remoto en GitHub, el uso de ramas para aislar el desarrollo de nuevas "
    "funcionalidades, la resolucion de conflictos de fusion, la integracion de codigo entre "
    "ramas y la gestion de releases del software."
)

add_heading("1.2 Antecedentes y problematica", level=2)
add_body(
    "Antes de adoptar un sistema de control de versiones formal, el desarrollo del proyecto "
    "se realizaba de manera directa sobre una unica linea de trabajo, sin separacion entre "
    "el codigo estable y el codigo en desarrollo. Esta forma de trabajo generaba los "
    "siguientes inconvenientes:"
)
add_bullet("Los cambios en progreso (por ejemplo, el reemplazo completo del dominio de negocio del sistema) se mezclaban con el codigo que ya estaba funcionando, sin una version de respaldo clara a la cual volver ante un error.")
add_bullet("No existia trazabilidad clara de que cambio especifico introdujo un problema, ya que los commits no seguian una convencion de mensajes descriptivos.")
add_bullet("Al no usarse ramas, cualquier funcionalidad nueva en desarrollo (por ejemplo, un sistema de alertas por correo) corria el riesgo de dejar inestable la version principal del sistema mientras se probaba.")
add_bullet("La ausencia de un flujo de ramas dificultaba identificar que trabajo estaba terminado y cual seguia en progreso.")

add_body(
    "Como referencia de proyectos similares, es una practica extendida en el desarrollo de "
    "software empresarial (por ejemplo, sistemas ERP o de gestion interna) mantener una rama "
    "principal estable (main) y una rama de integracion (develop), de forma que el software "
    "que se muestra a los interesados del proyecto (en este caso, una eventual demo para "
    "Hydromaq) siempre corresponda a una version probada y no a codigo en construccion."
)

add_heading("1.3 Situacion actual (As Is)", level=2)
add_body(
    "Grafico 1: Flujo de trabajo sin control de versiones estructurado. Todo el desarrollo "
    "ocurre sobre una unica rama, sin separacion entre trabajo estable y trabajo en progreso."
)
add_code_block(
    "  [Desarrollador]\n"
    "        |\n"
    "        v\n"
    "  Edita archivos directamente\n"
    "        |\n"
    "        v\n"
    "  +-------------------+\n"
    "  |   Rama unica:     |   <-- Todo cambio (estable o experimental)\n"
    "  |      main         |       se aplica aqui directamente\n"
    "  +-------------------+\n"
    "        |\n"
    "        v\n"
    "  Sin ambiente de prueba separado\n"
    "  Riesgo: un cambio incompleto puede dejar\n"
    "  el sistema inestable para cualquiera que lo use"
)

add_heading("1.4 Situacion propuesta (To Be)", level=2)
add_body(
    "Grafico 2: Flujo de trabajo propuesto con Git, separando ramas por proposito e "
    "integrando el codigo de forma controlada mediante fusiones (merge)."
)
add_code_block(
    "  [Desarrollador]\n"
    "        |\n"
    "        v\n"
    "  git checkout -b feature/alertas-correo   (desde develop)\n"
    "        |\n"
    "        v\n"
    "  +---------------------------+\n"
    "  |  feature/alertas-correo   |  <-- Desarrollo aislado de la nueva funcionalidad\n"
    "  +---------------------------+\n"
    "        |  commits incrementales y descriptivos\n"
    "        |  git push origin feature/alertas-correo\n"
    "        v\n"
    "  +---------------------------+\n"
    "  |         develop           |  <-- Rama de integracion, se prueban los cambios\n"
    "  +---------------------------+       en conjunto antes de pasar a produccion\n"
    "        |  git merge (validado)\n"
    "        v\n"
    "  +---------------------------+\n"
    "  |          main             |  <-- Version estable, lista para presentar/desplegar\n"
    "  +---------------------------+\n"
    "        |\n"
    "        v\n"
    "  Repositorio remoto (GitHub)\n"
    "  https://github.com/vlbxrtttt10/pyto-h.desarrollo"
)

add_heading("1.5 Arquitectura", level=2)
add_body("Tecnologias principales utilizadas en el proyecto:")
add_simple_table(
    ["Componente", "Tecnologia"],
    [
        ("Control de versiones", "Git"),
        ("Repositorio remoto / hosting de codigo", "GitHub"),
        ("Entorno de desarrollo (IDE)", "Visual Studio Code"),
        ("Backend / API", "PHP 8.2, Laravel 12, Laravel Sanctum"),
        ("Base de datos", "MySQL"),
        ("Frontend", "React 19, Vite, Tailwind CSS v4"),
        ("Gestion de dependencias", "Composer (backend), npm (frontend)"),
    ],
)

add_heading("1.6 Plan de trabajo", level=2)
add_body("Actividades macro e hitos definidos para el proyecto:")
add_simple_table(
    ["Hito", "Actividad macro", "Rama asociada"],
    [
        ("1", "Inicializacion del repositorio y primera version funcional del sistema", "main"),
        ("2", "Definicion del dominio de negocio y estructura base del backend y frontend", "main"),
        ("3", "Desarrollo de nuevas funcionalidades de forma aislada (ej. modulo de alertas)", "feature/*"),
        ("4", "Integracion y pruebas conjuntas de las funcionalidades antes de liberarlas", "develop"),
        ("5", "Fusion a la rama principal y etiquetado de una nueva version (release)", "main"),
    ],
)

add_heading("1.7 Riesgos", level=2)
add_simple_table(
    ["Riesgo", "Impacto", "Accion de mitigacion"],
    [
        (
            "Conflictos de fusion mal resueltos",
            "Perdida de cambios o introduccion de errores al mezclar ramas",
            "Resolver conflictos revisando ambas versiones del codigo antes de confirmar, y probar el sistema luego de cada merge",
        ),
        (
            "Commits poco descriptivos",
            "Dificultad para rastrear el origen de un error",
            "Adoptar una convencion de mensajes de commit (tipo: descripcion breve)",
        ),
        (
            "Trabajo directo sobre la rama principal",
            "Inestabilidad de la version estable del sistema",
            "Usar ramas de tipo feature/* para todo desarrollo nuevo y fusionarlas solo cuando esten probadas",
        ),
        (
            "Perdida de acceso al repositorio remoto",
            "Imposibilidad de continuar el trabajo colaborativo",
            "Mantener una copia local actualizada del repositorio y realizar push frecuentes",
        ),
    ],
)

doc.add_page_break()

# =====================================================================
# 2. PROCEDIMIENTO Y CONFIGURACION DEL PROYECTO
# =====================================================================
add_heading("2. Procedimiento y configuracion del proyecto", level=1)

add_heading("2.1 Configuracion inicial del repositorio", level=2)
add_body("Pasos realizados para crear y configurar el repositorio remoto en GitHub:")
add_numbered("Se creo un repositorio remoto en GitHub bajo el nombre pyto-h.desarrollo.")
add_numbered("Se inicializo el repositorio local dentro de la carpeta del proyecto con el comando git init (o se clono el repositorio existente).")
add_numbered("Se configuro el repositorio remoto (origin) para sincronizar el trabajo local con GitHub.")
add_numbered("Se realizo el primer commit con la base del proyecto y se subio (push) a la rama main.")

add_body("Enlace del repositorio remoto:", bold=True)
add_body("https://github.com/vlbxrtttt10/pyto-h.desarrollo")

add_body("Comandos utilizados para la configuracion inicial:", bold=True)
add_code_block(
    "# Inicializar el repositorio local\n"
    "git init\n\n"
    "# Configurar el repositorio remoto\n"
    "git remote add origin https://github.com/vlbxrtttt10/pyto-h.desarrollo.git\n\n"
    "# Primer commit y subida a GitHub\n"
    "git add .\n"
    'git commit -m "proyecto herramientas de desarrollo"\n'
    "git push -u origin main"
)

add_body("Pasos para configurar el entorno local de un nuevo colaborador:", bold=True)
add_numbered("Clonar el repositorio: git clone https://github.com/vlbxrtttt10/pyto-h.desarrollo.git")
add_numbered("Ingresar a la carpeta del proyecto: cd pyto-h.desarrollo")
add_numbered("Verificar la rama principal disponible: git branch -a")
add_numbered("Crear una rama de trabajo propia a partir de develop (o main) segun la tarea asignada.")
add_numbered("Instalar dependencias del backend (composer install dentro de /backend) y del frontend (npm install dentro de /frontend).")

add_heading("2.2 Estructura del proyecto", level=2)
add_body(
    "El proyecto se organiza en dos aplicaciones independientes dentro del mismo repositorio: "
    "un backend en Laravel (API REST) y un frontend en React (interfaz de usuario)."
)
add_code_block(
    "pyto-h.desarrollo/\n"
    "|-- backend/                        # API REST en Laravel\n"
    "|   |-- app/\n"
    "|   |   |-- Http/\n"
    "|   |   |   |-- Controllers/Api/    # Controladores de la API (Equipment, ServiceVisit, ...)\n"
    "|   |   |   |-- Requests/           # Validaciones de formularios\n"
    "|   |   |-- Models/                 # Modelos Eloquent (Equipment, Technician, ...)\n"
    "|   |   |-- Services/               # Logica de negocio (motor de deteccion de anomalias)\n"
    "|   |-- database/\n"
    "|   |   |-- migrations/             # Definicion de tablas de la base de datos\n"
    "|   |   |-- seeders/                # Datos de prueba\n"
    "|   |   |-- factories/              # Generadores de datos ficticios\n"
    "|   |-- routes/api.php              # Definicion de endpoints de la API\n"
    "|\n"
    "|-- frontend/                       # Aplicacion web en React\n"
    "|   |-- src/\n"
    "|   |   |-- api/                    # Cliente HTTP y definicion de recursos\n"
    "|   |   |-- components/             # Componentes reutilizables (Modal, Layout, Badge...)\n"
    "|   |   |-- context/                # Contextos de autenticacion y tema\n"
    "|   |   |-- pages/                  # Paginas por modulo (Equipos, Visitas, Usuarios...)\n"
    "|   |   |-- App.jsx                 # Definicion de rutas de la aplicacion\n"
    "|\n"
    "|-- generar_documento_entrega.py    # Script de generacion de este documento"
)

add_heading("2.3 Gestion de ramas", level=2)
add_body(
    "El proyecto adopta un esquema de ramas con proposito diferenciado, en el cual la rama "
    "main representa siempre la version estable del sistema, mientras que el desarrollo de "
    "nuevas funcionalidades se realiza en ramas separadas que luego se integran mediante "
    "fusiones controladas."
)
add_simple_table(
    ["Rama", "Proposito"],
    [
        ("main", "Rama principal. Contiene la version estable y probada del sistema, lista para ser presentada o desplegada."),
        ("develop", "Rama de integracion. Reune las funcionalidades ya desarrolladas antes de confirmarlas como parte de una nueva version estable."),
        ("Develop-Erick", "Rama de integracion de un colaborador especifico (Erick). Se utilizo para desarrollar de forma aislada el bot de Telegram (comandos /cmds, /status, /parar) y los nuevos indicadores del dashboard, antes de integrarlos a develop/main."),
        ("feature/alertas-correo", "Rama de caracteristica. Desarrollo aislado del modulo de notificaciones automaticas por correo ante nuevas alertas de mantenimiento."),
        ("feature/equipos-mantenimiento", "Rama de caracteristica. Desarrollo aislado del modulo de gestion de equipos, componentes y visitas de servicio."),
        ("fix/correccion-dashboard", "Rama de correccion. Utilizada para solucionar errores puntuales detectados en produccion sin mezclar trabajo nuevo."),
    ],
)
add_body(
    "Convencion de nombres: se utiliza el prefijo feature/ para nuevas funcionalidades, "
    "fix/ para correcciones de errores, y el nombre de la rama principal (main) y de "
    "integracion (develop) sin prefijo, siguiendo un patron ampliamente adoptado en "
    "proyectos con Git."
)

doc.add_page_break()

# =====================================================================
# 3. PROCEDIMIENTOS DE CONTROL DE VERSIONES
# =====================================================================
add_heading("3. Procedimientos de control de versiones", level=1)

add_heading("3.1 Realizacion de commits", level=2)
add_body(
    "Los commits se realizan de forma incremental, agrupando cambios relacionados a una "
    "misma tarea o funcionalidad, en lugar de acumular multiples cambios no relacionados "
    "en un unico commit. Cada mensaje de commit describe brevemente que cambio se realizo "
    "y, cuando corresponde, por que."
)
add_body("Ejemplos de mensajes de commit reales del proyecto:", bold=True)
add_simple_table(
    ["Commit", "Mensaje"],
    [
        ("9c71578", "proyecto herramientas de desarrollo"),
        ("a66848c", "Fix de modulos nuevos con automatizacion, camiones, css news, modales"),
        ("ccd5f53", "Fix Aleri logo"),
        ("679add6", "Fix de arquitectura y de tema con pages"),
        ("881e263", "docs: actualizar README con dominio de sensores, Telegram y Reverb"),
        ("6a85f21", "fixed equipos"),
        ("(rama Develop-Erick)", "feat: agregar comandos de Telegram (/cmds, /status, /parar) y KPIs de flota en el dashboard"),
    ],
)
add_body("Ejemplos de mensajes de commit propuestos para el flujo con ramas de funcionalidad:", bold=True)
add_bullet("feat: agregar modelo Equipment y migracion inicial de equipos")
add_bullet("feat: implementar motor de deteccion de anomalias en visitas de servicio")
add_bullet("feat: agregar modulo de alertas por correo ante nuevas alertas de mantenimiento")
add_bullet("fix: corregir manejo de errores de carga en listados del frontend")
add_bullet("docs: actualizar guia de colaboradores del repositorio")

add_heading("3.2 Fusion de ramas (merge)", level=2)
add_body(
    "Una vez que una funcionalidad desarrollada en una rama feature/* se encuentra probada, "
    "se integra a la rama develop mediante un merge. Posteriormente, cuando el conjunto de "
    "funcionalidades en develop se considera estable, se fusiona a main."
)
add_body("Comandos utilizados para realizar la fusion:", bold=True)
add_code_block(
    "# Posicionarse en la rama de destino\n"
    "git checkout develop\n\n"
    "# Traer los cambios mas recientes de develop\n"
    "git pull origin develop\n\n"
    "# Fusionar la rama de funcionalidad terminada\n"
    "git merge feature/alertas-correo\n\n"
    "# Subir la integracion al repositorio remoto\n"
    "git push origin develop\n\n"
    "# Una vez validado en develop, promover a main\n"
    "git checkout main\n"
    "git merge develop\n"
    "git push origin main"
)
add_body(
    "Resultado esperado: al no existir cambios contradictorios entre ambas ramas, Git "
    "realiza un merge automatico (fast-forward o de tres vias) y genera un commit de "
    "fusion que integra el historial de ambas ramas."
)

add_heading("3.3 Manejo de conflictos de fusion", level=2)
add_body(
    "Un conflicto de fusion ocurre cuando dos ramas modifican la misma seccion de un mismo "
    "archivo de forma distinta, y Git no puede determinar automaticamente cual version "
    "conservar. A continuacion se describe un ejemplo representativo aplicable al proyecto."
)
add_body("Ejemplo de conflicto: dos ramas modifican el mismo archivo de rutas del backend.", bold=True)
add_code_block(
    "<<<<<<< HEAD\n"
    "Route::get('/dashboard/summary', [DashboardController::class, 'summary']);\n"
    "=======\n"
    "Route::get('/dashboard/resumen', [DashboardController::class, 'summary']);\n"
    ">>>>>>> feature/alertas-correo"
)
add_body("Pasos seguidos para resolver el conflicto:", bold=True)
add_numbered("Ejecutar git merge feature/alertas-correo y recibir el aviso de conflicto (CONFLICT (content): Merge conflict in routes/api.php).")
add_numbered("Abrir el archivo senalado y localizar las marcas de conflicto (<<<<<<<, =======, >>>>>>>).")
add_numbered("Analizar ambas versiones del codigo y decidir cual conservar, o combinar ambas si corresponde (en este caso, se mantiene la ruta original en ingles para no romper las llamadas ya existentes del frontend).")
add_numbered("Eliminar manualmente las marcas de conflicto dejando unicamente el codigo final correcto.")
add_numbered("Marcar el archivo como resuelto: git add routes/api.php")
add_numbered("Finalizar la fusion con un commit: git commit -m \"fix: resolver conflicto de ruta duplicada en dashboard\"")
add_numbered("Verificar que el sistema siga funcionando correctamente tras la resolucion antes de subir los cambios (git push).")

doc.add_page_break()

# =====================================================================
# 4. DOCUMENTACION TECNICA
# =====================================================================
add_heading("4. Documentacion tecnica", level=1)

add_heading("4.1 Guia para colaboradores", level=2)
add_body(
    "A continuacion se detallan los pasos que debe seguir cualquier colaborador nuevo para "
    "contribuir al repositorio del proyecto."
)

add_body("1. Clonar el repositorio:", bold=True)
add_code_block("git clone https://github.com/vlbxrtttt10/pyto-h.desarrollo.git\ncd pyto-h.desarrollo")

add_body("2. Actualizar las ramas remotas disponibles:", bold=True)
add_code_block("git fetch origin\ngit branch -a")

add_body("3. Crear una rama de trabajo a partir de develop:", bold=True)
add_code_block("git checkout develop\ngit pull origin develop\ngit checkout -b feature/nombre-de-la-tarea")

add_body("4. Realizar cambios y confirmarlos con commits descriptivos:", bold=True)
add_code_block(
    "git add archivo_modificado.php\n"
    'git commit -m "feat: breve descripcion del cambio realizado"'
)

add_body("5. Subir la rama al repositorio remoto:", bold=True)
add_code_block("git push -u origin feature/nombre-de-la-tarea")

add_body("6. Solicitar la integracion del trabajo (Pull Request) hacia develop, y una vez aprobado y probado, fusionarlo:", bold=True)
add_code_block(
    "git checkout develop\n"
    "git pull origin develop\n"
    "git merge feature/nombre-de-la-tarea\n"
    "git push origin develop"
)

add_body(
    "Recomendaciones generales: mantener los commits pequenos y enfocados en una sola "
    "tarea, actualizar la rama local con git pull antes de comenzar a trabajar cada dia, "
    "y nunca realizar cambios directamente sobre la rama main."
)

add_heading("4.2 Funcionalidad desarrollada en la rama Develop-Erick", level=2)
add_body(
    "Como ejemplo de desarrollo de una nueva funcionalidad aislada en su propia rama, se "
    "implemento un bot de Telegram para el monitoreo y control de emergencia de la flota, "
    "sobre el comando de consola telegram:poll ya existente en el proyecto "
    "(backend/app/Console/Commands/PollTelegramUpdates.php)."
)
add_bullet("/cmds, /start, /help: muestran un menu principal con botones interactivos (flota completa, equipos por estado, alertas abiertas y ayuda), ademas de un resumen rapido de equipos registrados y alertas abiertas.")
add_bullet("/status: muestra el estado de toda la flota agrupado por Operativo, En falla y En mantenimiento, con un resumen de totales por estado.")
add_bullet("/status CODIGO: muestra el detalle de un equipo puntual (cliente, sitio, ultima lectura de sensores y alertas abiertas).")
add_bullet("/parar CODIGO: implementa una parada de emergencia manual, que permite detener un equipo desde Telegram sin necesidad de que el sistema haya detectado una anomalia por sensores. El bot solicita confirmacion mediante botones (Si, detener ahora / Cancelar) antes de ejecutar la accion, para evitar detenciones accidentales.")
add_body(
    "Al confirmarse una parada de emergencia, el sistema registra una nueva alerta de "
    "mantenimiento (riesgo critico, con la descripcion 'Parada de emergencia manual'), "
    "actualiza el estado del equipo a 'en_falla' en la base de datos, y emite el evento "
    "EquipmentStoppedViaTelegram por WebSocket (Laravel Reverb) para reflejar el cambio "
    "en tiempo real en el dashboard web, sin necesidad de recargar la pagina."
)

add_heading("4.3 Nuevos indicadores en el dashboard", level=2)
add_body(
    "Se incorporaron cuatro indicadores adicionales al panel principal (frontend/src/pages/"
    "Dashboard.jsx), calculados a partir de los datos de la flota que ya expone el endpoint "
    "/dashboard/fleet-overview: equipos totales, equipos en falla, equipos en mantenimiento "
    "y equipos operativos. Estos indicadores se actualizan automaticamente junto con el resto "
    "del dashboard cuando se recibe el evento dashboard.updated, incluyendo los cambios de "
    "estado originados desde el bot de Telegram."
)

doc.add_page_break()

# =====================================================================
# 5. CONCLUSIONES
# =====================================================================
add_heading("5. Conclusiones", level=1)

add_heading("5.1 Lecciones aprendidas", level=2)
add_body(
    "El uso de un sistema de control de versiones como Git permitio ordenar el desarrollo "
    "del proyecto de una manera que hubiera sido dificil de lograr trabajando solo con "
    "copias de archivos. Entre los principales aprendizajes se destacan:"
)
add_bullet("La importancia de separar el trabajo en ramas segun su proposito (funcionalidad nueva, correccion de errores, integracion) para no comprometer la estabilidad de la version principal del sistema.")
add_bullet("El valor de escribir mensajes de commit claros y descriptivos, ya que facilitan entender la evolucion del proyecto sin tener que revisar el codigo completo.")
add_bullet("La necesidad de revisar cuidadosamente los conflictos de fusion en lugar de resolverlos de forma apresurada, dado que una resolucion incorrecta puede introducir errores dificiles de detectar.")
add_bullet(
    "El principal desafio encontrado fue mantener la disciplina de no trabajar directamente "
    "sobre la rama principal cuando se estaban probando cambios grandes (por ejemplo, el "
    "reemplazo completo del dominio de negocio del sistema), lo cual hubiera sido mas seguro "
    "de realizar en una rama de funcionalidad separada."
)

add_heading("5.2 Mejoras futuras", level=2)
add_bullet("Adoptar de forma sistematica el flujo main / develop / feature-* para todo cambio, sin excepciones, incluso para ajustes que parezcan pequenos.")
add_bullet("Incorporar revisiones de codigo (Pull Requests) antes de fusionar cualquier rama a develop o main, para detectar errores antes de que lleguen a la version estable.")
add_bullet("Definir una convencion formal de nombres de commits (por ejemplo, Conventional Commits: feat, fix, docs, refactor) para facilitar la generacion automatica de notas de version.")
add_bullet("Automatizar pruebas basicas del sistema que se ejecuten antes de aceptar una fusion, reduciendo el riesgo de integrar cambios que rompan funcionalidades existentes.")
add_bullet("Establecer un esquema de etiquetado de versiones (tags) en Git para marcar releases especificos del sistema entregados a Hydromaq.")

doc.save("Entrega_Control_de_Versiones_Aleri.docx")
print("Documento generado correctamente: Entrega_Control_de_Versiones_Aleri.docx")
