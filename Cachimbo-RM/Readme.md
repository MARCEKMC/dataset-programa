# 📚 Sistema Extractor de Ejercicios Matemáticos V2.0

## 📖 Índice

1. [¿Qué es este sistema?](#-qué-es-este-sistema)
2. [¿Para qué sirve?](#-para-qué-sirve)
3. [Características principales](#-características-principales)
4. [Requisitos previos](#-requisitos-previos)
5. [Instalación desde cero](#-instalación-desde-cero)
6. [Configuración](#-configuración)
7. [Uso del sistema](#-uso-del-sistema)
8. [Formato del JSON final](#-formato-del-json-final)
9. [Solución de problemas](#-solución-de-problemas)
10. [Preguntas frecuentes](#-preguntas-frecuentes)

---

## 🎯 ¿Qué es este sistema?

Este es un **sistema automatizado de extracción de ejercicios matemáticos** desde archivos PDF que combina:

- 🤖 **Inteligencia Artificial** (Claude de Anthropic) para extraer texto y ejercicios
- 👁️ **Visión por computadora** (OpenCV) para detectar figuras marcadas con recuadros rojos
- 🖥️ **Interfaz web interactiva** (React) para revisar, editar y organizar ejercicios
- 📦 **Exportación estructurada** a formato JSON listo para usar

---

## 💡 ¿Para qué sirve?

### Problema que resuelve:

Imagina que tienes un PDF con 50 ejercicios matemáticos que incluyen:
- Enunciados de texto
- Preguntas con alternativas múltiples
- Figuras, gráficos y diagramas
- Resoluciones paso a paso

**Antes:**
❌ Copiar manualmente cada ejercicio → 5-10 horas
❌ Extraer y guardar cada figura → 2-3 horas
❌ Formatear todo correctamente → 1-2 horas
❌ **Total: 8-15 horas de trabajo manual**

**Con este sistema:**
✅ Extracción automática de ejercicios → 2 minutos
✅ Detección automática de figuras → Incluido
✅ Revisión y edición visual → 20-30 minutos
✅ **Total: ~30 minutos de trabajo asistido**

### Casos de uso reales:

1. **Profesores:** Digitalizar bancos de ejercicios antiguos
2. **Editoriales:** Convertir libros físicos a formato digital
3. **Plataformas educativas:** Crear bases de datos de ejercicios
4. **Estudiantes:** Organizar apuntes y ejercicios en formato digital
5. **Instituciones:** Migrar contenido educativo a sistemas LMS

---

## ✨ Características principales

### 🎯 Extracción Inteligente
- Claude AI extrae automáticamente:
  - Enunciados completos
  - Preguntas específicas
  - Alternativas múltiples (A, B, C, D, E)
  - Respuestas correctas
  - Resoluciones paso a paso

### 📸 Detección Visual de Figuras
- Detecta automáticamente figuras marcadas con **recuadros rojos**
- Extrae y guarda cada figura con nombre claro: `IMG_PAG1_1.png`, `IMG_PAG2_1.png`
- Organiza figuras por página

### ✏️ Edición Completa
- Edita cualquier campo del ejercicio:
  - Enunciado (text)
  - Pregunta (question)
  - Alternativas (alternatives)
  - Respuesta (answer)
  - Resolución (resolution)
- Cambios se guardan automáticamente

### 🖼️ Múltiples Figuras
- Asocia **ilimitadas figuras** a cada ejercicio
- Figuras en el enunciado (text)
- Figuras en la resolución (resolution)
- Agregar/eliminar figuras fácilmente

### 📄 Organización por Páginas
- Navega página por página
- Evita confusión con muchos elementos
- Trabajo más organizado y eficiente

### 🗑️ Control de Calidad
- Elimina ejercicios mal extraídos
- Elimina duplicados
- JSON final solo con ejercicios válidos

### 📥 Exportación Limpia
Formato JSON final **exacto**:
```json
[
  {
    "text": "Enunciado completo [con imágenes si las tiene]",
    "question": "¿Pregunta específica?",
    "alternatives": "A) Opción 1\nB) Opción 2\nC) Opción 3\nD) Opción 4",
    "answer": "B",
    "resolution": "Explicación paso a paso [con imágenes si las tiene]"
  }
]
```

---

## 🔧 Requisitos previos

### Software necesario:

1. **Python 3.8 o superior**
   - Descargar: https://www.python.org/downloads/
   - Verificar instalación: `python --version` o `python3 --version`

2. **Node.js 16 o superior**
   - Descargar: https://nodejs.org/
   - Verificar instalación: `node --version`

3. **npm (viene con Node.js)**
   - Verificar instalación: `npm --version`

4. **API Key de Anthropic**
   - Obtener gratis: https://console.anthropic.com/
   - Crear cuenta y generar API Key
   - Formato: `sk-ant-api03-...`

### Sistema operativo:
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu, Debian, etc.)

---

## 🎮 Uso del sistema

### Paso 1: Iniciar el Backend

#### Terminal 1 - Backend:

**En Windows:**
```cmd
cd backend
venv\Scripts\activate
python backend_extractor.py --server
```

**En Linux/Mac:**
```bash
cd backend
source venv/bin/activate
python3 backend_extractor_mejorado.py --server
```

Deberías ver:
```
╔════════════════════════════════════════════════════════════════════╗
║  🌐 INICIANDO SERVIDOR WEB MEJORADO                               ║
╚════════════════════════════════════════════════════════════════════╝
📍 URL: http://localhost:5000
 * Running on http://127.0.0.1:5000
```

✅ **Backend funcionando** - Mantén esta terminal abierta.

---

### Paso 2: Iniciar el Frontend

#### Terminal 2 - Frontend:

Abre una **nueva terminal**:

```bash
cd frontend
npm run dev
```

Deberías ver:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

✅ **Frontend funcionando** - Mantén esta terminal abierta.

---

### Paso 3: Preparar el PDF

**MUY IMPORTANTE:** El sistema detecta figuras mediante **recuadros rojos**.

1. Abre tu PDF con Adobe Acrobat Reader, Foxit, o cualquier editor de PDF
2. Usa la herramienta de **dibujo/forma** para crear **rectángulos rojos**
3. Dibuja un rectángulo rojo alrededor de cada figura que desees extraer
4. **Guarda el PDF** con los recuadros
5. Verifica que los recuadros sean visibles

**Ejemplo visual:**
```
┌─────────────────────────────────────┐
│  Ejercicio 1                        │
│                                     │
│  ┌───────────────┐                 │
│  │ ░░ FIGURA ░░  │ ← Recuadro rojo │
│  │ ░░░░░░░░░░░░  │                 │
│  └───────────────┘                 │
│                                     │
│  ¿Cuál es el área del triángulo?   │
└─────────────────────────────────────┘
```

---

### Paso 4: Usar la Interfaz Web

#### 4.1. Abrir la aplicación

Abre tu navegador en: **http://localhost:5173**

#### 4.2. Configurar API Key

En la pantalla inicial:
1. Ingresa tu API Key de Anthropic: `sk-ant-api03-...`
2. O déjalo vacío si ya lo configuraste en el `.env`

#### 4.3. Subir PDF

1. Click en **"Click para seleccionar PDF"**
2. Selecciona tu PDF **con recuadros rojos**
3. Verifica que el archivo aparece (nombre y tamaño)

#### 4.4. Procesar

1. Click en **🚀 Procesar PDF**
2. Espera 30-90 segundos (depende del tamaño del PDF)
3. Observa los logs en tiempo real:
   - 📄 Leyendo PDF...
   - 📸 Detectando recuadros rojos...
   - 🤖 Extrayendo ejercicios con Claude AI...
   - ✅ X figuras detectadas
   - ✅ Y ejercicios extraídos

---

### Paso 5: Organizar por Páginas

Una vez procesado, verás botones de navegación:

```
[Página 1 (3📝/5🖼️)] [Página 2 (2📝/3🖼️)] [Página 3 (4📝/7🖼️)]
```

- **3📝** = 3 ejercicios en esa página
- **5🖼️** = 5 figuras detectadas en esa página

**Click en cada botón** para ver solo el contenido de esa página.

---

### Paso 6: Editar Ejercicios

Para cada ejercicio puedes:

1. **✏️ Editar:** Click en el botón de lápiz
   - Modifica cualquier campo (text, question, alternatives, answer, resolution)
   - Click en **💾 Guardar** para confirmar
   - O **❌ Cancelar** para descartar cambios

2. **🗑️ Eliminar:** Click en el botón de basura
   - Confirma la eliminación
   - El ejercicio NO aparecerá en el JSON final

**Casos comunes de edición:**
- Corregir errores de OCR: "ecuasión" → "ecuación"
- Mejorar formato de alternativas
- Completar información faltante
- Aclarar enunciados ambiguos

---

### Paso 7: Asociar Figuras

#### 7.1. Seleccionar ejercicio

Click en cualquier tarjeta de ejercicio. Verás un **borde azul** indicando selección.

#### 7.2. Agregar figuras

En el panel derecho verás las figuras de la página actual:

Para cada figura:
- **+ Text:** Agregar al enunciado
- **+ Resolution:** Agregar a la resolución

Puedes agregar **múltiples figuras** en cada sección.

#### 7.3. Eliminar figuras

Si asignaste una figura por error:
- Click en **❌** junto a la miniatura de la figura
- La figura se elimina de ese ejercicio

---

### Paso 8: Exportar JSON

Una vez que hayas:
- ✅ Revisado todos los ejercicios
- ✅ Editado los que necesitaban corrección
- ✅ Eliminado ejercicios no deseados
- ✅ Asociado todas las figuras correctamente

**Click en 📥 Exportar** (botón verde arriba a la derecha)

Se descargará un archivo: `ejercicios_TIMESTAMP.json`

---

## 📋 Formato del JSON final

El archivo JSON exportado contiene **SOLO** este formato exacto:

```json
[
  {
    "text": "Enunciado del ejercicio...\n\n[IMAGEN: data:image/png;base64,iVBORw0KG...]",
    "question": "¿Cuál es la respuesta correcta?",
    "alternatives": "A) Opción 1\nB) Opción 2\nC) Opción 3\nD) Opción 4",
    "answer": "B",
    "resolution": "[IMAGEN: data:image/png;base64,iVBORw0KG...]\n\nPaso 1: ...\nPaso 2: ..."
  },
  {
    "text": "Otro ejercicio sin imágenes...",
    "question": "¿Pregunta?",
    "alternatives": "A) ...\nB) ...\nC) ...\nD) ...",
    "answer": "C",
    "resolution": "Explicación sin imágenes..."
  }
]
```

### Notas importantes sobre el formato:

1. **No incluye campos adicionales** como:
   - ❌ `id`, `page`, `numero` → Se usan internamente pero NO se exportan
   
2. **Imágenes en base64:**
   - Las figuras se incrustan como: `[IMAGEN: data:image/png;base64,...]`
   - Formato estándar que cualquier sistema puede procesar
   
3. **Saltos de línea:**
   - `\n` para saltos de línea en alternatives
   - `\n\n` para separar texto de imágenes

4. **Solo ejercicios válidos:**
   - Los ejercicios eliminados NO aparecen
   - Solo los revisados y aprobados

---

## 🔧 Solución de problemas

### Problema 1: El backend no inicia

**Error:** `ModuleNotFoundError: No module named 'anthropic'`

**Solución:**
```bash
# Verifica que el entorno virtual esté activado
# Deberías ver (venv) al inicio de la línea

# Reinstala las dependencias
pip install anthropic pymupdf pillow opencv-python numpy flask flask-cors python-dotenv
```

---

### Problema 2: Error de API Key

**Error:** `API Key no configurada` o `Invalid API Key`

**Solución:**
1. Verifica que tu API Key sea válida en: https://console.anthropic.com/
2. Revisa que esté correctamente en el `.env`:
   ```bash
   cat backend/.env
   # Debe mostrar: ANTHROPIC_API_KEY=sk-ant-...
   ```
3. O ingrésala manualmente en la interfaz web

---

### Problema 3: No detecta figuras

**Síntomas:** Procesamiento exitoso pero `0 figuras detectadas`

**Causas comunes:**
1. ❌ No dibujaste recuadros rojos en el PDF
2. ❌ El color no es rojo puro (RGB: 255, 0, 0)
3. ❌ Los recuadros son muy pequeños (<50px)
4. ❌ No guardaste el PDF con los recuadros

**Solución:**
1. Abre el PDF en un editor
2. Dibuja rectángulos **rojos** (color más rojo disponible)
3. Asegúrate de que sean **visibles y de buen tamaño**
4. **Guarda el PDF**
5. Vuelve a subir el PDF guardado

---

### Problema 4: Frontend no carga

**Error:** `Cannot GET /` o página en blanco

**Solución:**
```bash
cd frontend

# Limpia caché
rm -rf node_modules
rm package-lock.json

# Reinstala
npm install
npm run dev
```

---

### Problema 5: Puertos ocupados

**Error:** `Port 5000 is already in use`

**Solución:**

**Windows:**
```cmd
# Ver qué usa el puerto
netstat -ano | findstr :5000

# Matar el proceso (reemplaza PID con el número que aparece)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Ver qué usa el puerto
lsof -ti:5000

# Matar el proceso
kill -9 $(lsof -ti:5000)
```

O cambia el puerto en el código del backend.

---

### Problema 6: CORS errors

**Error:** `Access to fetch blocked by CORS policy`

**Solución:**
1. Verifica que el backend esté corriendo
2. Revisa que la URL en `config.js` sea correcta: `http://localhost:5000`
3. Reinicia ambos servidores (backend y frontend)

---

## ❓ Preguntas frecuentes

### 1. ¿Cuánto cuesta usar este sistema?

- El código es **gratuito**
- Necesitas una **API Key de Anthropic** que tiene:
  - Costo por uso (muy económico): ~$0.003 por ejercicio
  - Créditos gratis al registrarte
  - Aproximadamente $0.15-0.50 por PDF completo

### 2. ¿Cuántos ejercicios puedo procesar?

- Sin límite técnico
- Limitado solo por tu saldo de API Key
- Recomendado: PDFs de hasta 20 páginas a la vez

### 3. ¿Qué tipos de figuras detecta?

- Cualquier figura **rodeada por un recuadro rojo**
- Gráficos, diagramas, imágenes, fotos
- Tamaño mínimo recomendado: 100x100 píxeles

### 4. ¿Puedo usar sin recuadros rojos?

- No, el sistema **requiere** recuadros rojos para detectar figuras
- Es la forma de indicar qué figuras extraer
- Solo toma 2-3 minutos marcar las figuras

### 5. ¿Los datos son privados?

- **Backend:** Todo se procesa localmente en tu máquina
- **Claude AI:** Los PDFs se envían a Anthropic para procesamiento
- Lee la política de privacidad de Anthropic: https://www.anthropic.com/legal/privacy

### 6. ¿Funciona con cualquier idioma?

- Sí, Claude soporta múltiples idiomas
- Optimizado para español (basado en los prompts)
- Puedes modificar los prompts para otros idiomas

### 7. ¿Puedo modificar el sistema?

- ✅ Código completamente personalizable
- ✅ Puedes agregar funcionalidades
- ✅ Puedes cambiar el formato de salida
- ✅ Open source (tu código local)

### 8. ¿Qué tan preciso es Claude?

- Precisión promedio: **85-95%** en extracción
- **Por eso existe la función de edición**
- Siempre revisa y corrige los ejercicios extraídos

### 9. ¿Puedo procesar PDFs escaneados?

- Sí, pero con limitaciones
- Claude puede leer texto en imágenes (OCR incluido)
- Calidad depende de la resolución del escaneo
- Recomendado: PDFs con texto seleccionable

### 10. ¿Necesito estar conectado a internet?

- **Sí**, para comunicación con la API de Anthropic
- **No** para el resto del procesamiento (local)

---

## 🎓 Consejos y mejores prácticas

### 📝 Para mejores resultados:

1. **PDFs de calidad:**
   - Texto seleccionable > OCR
   - Buena resolución de figuras
   - Máximo 20 páginas por procesamiento

2. **Recuadros rojos precisos:**
   - Color rojo puro
   - Ajustados a la figura (sin mucho espacio)
   - Sin superposición entre recuadros

3. **Workflow eficiente:**
   - Procesa página por página en la interfaz
   - Edita mientras asocias figuras
   - Elimina ejercicios problemáticos inmediatamente
   - Exporta cuando termines cada PDF (backup)

4. **Control de calidad:**
   - **SIEMPRE** revisa los ejercicios extraídos
   - Corrige errores de OCR
   - Verifica que las alternativas estén completas
   - Confirma que la respuesta sea correcta

---

## 📞 Soporte

Si encuentras problemas:

1. **Verifica la sección de solución de problemas** arriba
2. **Revisa los logs** en la consola del navegador (F12)
3. **Verifica los logs** en la terminal del backend
4. **Asegúrate** de que ambos servidores estén corriendo

---

## 🎉 ¡Listo para usar!

Ahora tienes todo lo necesario para:

- ✅ Instalar el sistema desde cero
- ✅ Configurar backend y frontend
- ✅ Procesar PDFs con ejercicios
- ✅ Editar y organizar ejercicios
- ✅ Exportar JSON en formato limpio

**¡Comienza a digitalizar tus ejercicios! 🚀**

---

## 📚 Estructura final del proyecto

```
mi-proyecto-extractor/
│
├── backend/
│   ├── venv/                          # Entorno virtual Python
│   ├── backend_extractor_mejorado.py  # Código del servidor
│   ├── .env                           # API Key (no compartir)
│   └── extracted_data/                # Datos procesados
│       ├── figures/                   # Figuras extraídas
│       ├── exercises.json             # Ejercicios extraídos
│       └── figures.json               # Metadata de figuras
│
└── frontend/
    ├── node_modules/                  # Dependencias Node
    ├── src/
    │   ├── App.jsx                    # Aplicación principal
    │   ├── App.css                    # Estilos
    │   ├── index.css                  # Estilos globales
    │   ├── config.js                  # Configuración
    │   └── main.jsx                   # Punto de entrada
    ├── package.json                   # Dependencias
    └── vite.config.js                 # Configuración Vite
```

---

**Versión:** 2.0  
**Última actualización:** Noviembre 2024  
**Licencia:** Uso libre para proyectos educativos
