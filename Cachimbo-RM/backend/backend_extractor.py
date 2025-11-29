"""
╔════════════════════════════════════════════════════════════════════╗
║  🎯 EXTRACTOR MEJORADO - V2.0                                     ║
║  ✅ Edición de ejercicios                                         ║
║  ✅ Múltiples figuras por ejercicio                               ║
║  ✅ Organización por páginas                                      ║
╚════════════════════════════════════════════════════════════════════╝

INSTALACIÓN:
pip install anthropic pymupdf pillow opencv-python numpy flask flask-cors python-dotenv

USO:
python backend_extractor_mejorado.py
"""

import os
import sys
import json
import base64
import re
from pathlib import Path
from typing import List, Dict, Tuple
import io

# ⭐ Cargar variables de entorno
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️ python-dotenv no instalado. Instala: pip install python-dotenv")

try:
    import anthropic
    import fitz
    from PIL import Image
    import cv2
    import numpy as np
    from flask import Flask, jsonify, request, send_from_directory
    from flask_cors import CORS
except ImportError:
    print("❌ Instala: pip install anthropic pymupdf pillow opencv-python numpy flask flask-cors python-dotenv")
    sys.exit(1)


# ╔══════════════════════════════════════════════════════════════╗
# ║  ⭐ CONFIGURACIÓN DE API KEY                                ║
# ╚══════════════════════════════════════════════════════════════╝

class Config:
    """Configuración centralizada del proyecto"""
    
    # ⭐ OPCIÓN 1: Hardcodear API Key aquí (NO RECOMENDADO PARA PRODUCCIÓN)
    ANTHROPIC_API_KEY_HARDCODED = "COLOCA_TU_API_KEY_AQUI"
    
    # ⭐ OPCIÓN 2: Variable de entorno (RECOMENDADO)
    ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', ANTHROPIC_API_KEY_HARDCODED)
    
    @classmethod
    def validate_api_key(cls):
        if not cls.ANTHROPIC_API_KEY or cls.ANTHROPIC_API_KEY == "COLOCA_TU_API_KEY_AQUI":
            print("\n" + "="*70)
            print("❌ API KEY NO CONFIGURADA")
            print("="*70)
            print("Por favor configura tu API Key")
            print("="*70 + "\n")
            return False
        return True
    
    @classmethod
    def get_api_key_or_prompt(cls):
        """Obtiene API Key o la solicita al usuario"""
        if cls.validate_api_key():
            print(f"✅ API Key cargada: {cls.ANTHROPIC_API_KEY[:20]}...{cls.ANTHROPIC_API_KEY[-4:]}")
            return cls.ANTHROPIC_API_KEY
        
        api_key = input("🔑 Ingresa tu API Key de Anthropic: ").strip()
        if not api_key:
            print("❌ API Key requerida")
            sys.exit(1)
        return api_key


class VisualExtractor:
    """
    Extractor mejorado con soporte para múltiples figuras y organización por página
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = anthropic.Anthropic(api_key=api_key)
        self.output_dir = Path("extracted_data")
        self.figures_dir = self.output_dir / "figures"
        
        # Crear directorios
        self.output_dir.mkdir(exist_ok=True)
        self.figures_dir.mkdir(exist_ok=True)
        
        print("✅ Extractor inicializado")
        print(f"📁 Directorio de salida: {self.output_dir}\n")
    
    def detect_red_boxes(self, img: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detecta recuadros rojos"""
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        lower_red1 = np.array([0, 70, 50])
        upper_red1 = np.array([10, 255, 255])
        lower_red2 = np.array([170, 70, 50])
        upper_red2 = np.array([180, 255, 255])
        
        mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
        mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
        red_mask = cv2.bitwise_or(mask1, mask2)
        
        kernel = np.ones((3, 3), np.uint8)
        dilated = cv2.dilate(red_mask, kernel, iterations=2)
        
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        height, width = img.shape[:2]
        min_area = (width * height) * 0.005
        max_area = (width * height) * 0.40
        
        red_boxes = []
        
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            area = w * h
            aspect_ratio = w / h if h > 0 else 0
            
            if (min_area < area < max_area and
                0.2 < aspect_ratio < 5.0 and
                w > 50 and h > 50):
                
                padding = 15
                x = max(0, x - padding)
                y = max(0, y - padding)
                w = min(width - x, w + 2 * padding)
                h = min(height - y, h + 2 * padding)
                
                red_boxes.append((x, y, w, h))
        
        red_boxes.sort(key=lambda box: box[1])
        return red_boxes
    
    def extract_figures_with_nomenclature(self, pdf_path: str) -> List[Dict]:
        """
        Extrae figuras con nomenclatura clara: IMG_PAG1_1, IMG_PAG1_2, etc.
        """
        print("📸 Extrayendo figuras con recuadros rojos...\n")
        
        doc = fitz.open(pdf_path)
        all_figures = []
        
        # Contador por página
        figures_per_page = {}
        
        for page_num in range(len(doc)):
            page_number = page_num + 1
            print(f"📄 Página {page_number}/{len(doc)}")
            
            page = doc[page_num]
            
            # Convertir a imagen
            mat = fitz.Matrix(3, 3)
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Detectar recuadros rojos
            red_boxes = self.detect_red_boxes(img)
            
            if not red_boxes:
                print(f"  ⚠️ Sin recuadros rojos\n")
                continue
            
            # Inicializar contador de esta página
            if page_number not in figures_per_page:
                figures_per_page[page_number] = 0
            
            # Extraer cada figura
            for x, y, w, h in red_boxes:
                figures_per_page[page_number] += 1
                fig_num_in_page = figures_per_page[page_number]
                
                # NOMENCLATURA CLARA
                filename = f"IMG_PAG{page_number}_{fig_num_in_page}.png"
                
                # Recortar
                cropped = img[y:y+h, x:x+w]
                cropped_rgb = cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(cropped_rgb)
                
                # Guardar
                filepath = self.figures_dir / filename
                pil_image.save(filepath, quality=95)
                
                # Base64
                buffered = io.BytesIO()
                pil_image.save(buffered, format="PNG", quality=95)
                img_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                
                all_figures.append({
                    'id': filename.replace('.png', ''),
                    'filename': filename,
                    'page': page_number,
                    'position_in_page': fig_num_in_page,
                    'path': str(filepath),
                    'base64': f"data:image/png;base64,{img_b64}",
                    'width': w,
                    'height': h
                })
                
                print(f"  ✅ {filename} extraída")
            
            print()
        
        doc.close()
        
        print(f"{'='*70}")
        print(f"✅ Total: {len(all_figures)} figuras extraídas")
        print(f"📁 Guardadas en: {self.figures_dir}/")
        print(f"{'='*70}\n")
        
        return all_figures
    
    def extract_exercises(self, pdf_path: str) -> List[Dict]:
        """Extrae ejercicios con Claude"""
        print("🤖 Extrayendo ejercicios con Claude...\n")
        
        with open(pdf_path, 'rb') as f:
            pdf_base64 = base64.b64encode(f.read()).decode('utf-8')
        
        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "document",
                            "source": {
                                "type": "base64",
                                "media_type": "application/pdf",
                                "data": pdf_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": """Extrae TODOS los ejercicios matemáticos del PDF.

Formato JSON (campos requeridos):
{
  "text": "Enunciado completo del ejercicio",
  "question": "Pregunta específica que se hace",
  "alternatives": "A) opción 1\\nB) opción 2\\nC) opción 3\\nD) opción 4",
  "answer": "Letra correcta (A, B, C, D o E)",
  "resolution": "Explicación paso a paso (sin describir figuras, solo matemática)",
  "page": número de página
}

IMPORTANTE: 
- El campo "page" es interno para organización, se usará pero NO se exportará al JSON final
- NO incluyas campos adicionales como "numero" o "id"
- Responde SOLO con array JSON: []"""
                        }
                    ]
                }]
            )
            
            response_text = ""
            for block in message.content:
                if block.type == "text":
                    response_text += block.text
            
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                json_str = json_str.replace('```json', '').replace('```', '').strip()
                exercises = json.loads(json_str)
                
                valid = [ex for ex in exercises if ex.get('question')]
                
                # Agregar ID único y campos para múltiples figuras
                for idx, ex in enumerate(valid, 1):
                    ex['id'] = f"EX_{idx}"
                    ex['text_figures'] = []  # Array de IDs de figuras para text
                    ex['resolution_figures'] = []  # Array de IDs de figuras para resolution
                
                print(f"✅ {len(valid)} ejercicios extraídos\n")
                return valid
            
            return []
            
        except Exception as e:
            print(f"❌ Error: {e}\n")
            return []
    
    def process_pdf(self, pdf_path: str):
        """Proceso completo: extrae figuras y ejercicios"""
        pdf_name = Path(pdf_path).stem
        
        print(f"\n{'='*70}")
        print(f"🚀 PROCESANDO: {pdf_name}")
        print(f"{'='*70}\n")
        
        # 1. Extraer figuras
        figures = self.extract_figures_with_nomenclature(pdf_path)
        
        # 2. Extraer ejercicios
        exercises = self.extract_exercises(pdf_path)
        
        if not exercises:
            print("⚠️ No se extrajeron ejercicios")
            return
        
        # 3. Guardar datos
        figures_json = self.output_dir / "figures.json"
        exercises_json = self.output_dir / "exercises.json"
        
        with open(figures_json, 'w', encoding='utf-8') as f:
            json.dump(figures, f, ensure_ascii=False, indent=2)
        
        with open(exercises_json, 'w', encoding='utf-8') as f:
            json.dump(exercises, f, ensure_ascii=False, indent=2)
        
        print(f"{'='*70}")
        print(f"🎉 DATOS PREPARADOS")
        print(f"{'='*70}")
        print(f"📊 Ejercicios: {len(exercises)}")
        print(f"🖼️  Figuras: {len(figures)}")
        print(f"💾 Figuras JSON: {figures_json}")
        print(f"💾 Ejercicios JSON: {exercises_json}")
        print(f"📁 Imágenes: {self.figures_dir}/")
        print(f"{'='*70}\n")
        
        return figures, exercises


# ============================================================================
# SERVIDOR FLASK MEJORADO
# ============================================================================

app = Flask(__name__)
CORS(app)

@app.route('/api/exercises', methods=['GET'])
def get_exercises():
    """Devuelve ejercicios"""
    try:
        with open('extracted_data/exercises.json', 'r', encoding='utf-8') as f:
            exercises = json.load(f)
        return jsonify(exercises)
    except FileNotFoundError:
        return jsonify([]), 404

@app.route('/api/figures', methods=['GET'])
def get_figures():
    """Devuelve figuras"""
    try:
        with open('extracted_data/figures.json', 'r', encoding='utf-8') as f:
            figures = json.load(f)
        return jsonify(figures)
    except FileNotFoundError:
        return jsonify([]), 404

@app.route('/api/update-exercise', methods=['POST'])
def update_exercise():
    """Actualiza un ejercicio específico"""
    try:
        data = request.json
        exercise_id = data.get('id')
        updated_data = data.get('data')
        
        # Leer ejercicios actuales
        exercises_json = 'extracted_data/exercises.json'
        
        # Si no existe el archivo, crear uno vacío
        if not os.path.exists(exercises_json):
            os.makedirs('extracted_data', exist_ok=True)
            with open(exercises_json, 'w', encoding='utf-8') as f:
                json.dump([], f)
        
        with open(exercises_json, 'r', encoding='utf-8') as f:
            exercises = json.load(f)
        
        # Encontrar y actualizar el ejercicio
        found = False
        for i, ex in enumerate(exercises):
            if ex.get('id') == exercise_id:
                exercises[i].update(updated_data)
                found = True
                break
        
        # Si no se encontró, retornar error específico
        if not found:
            return jsonify({'error': f'Ejercicio {exercise_id} no encontrado'}), 404
        
        # Guardar
        with open(exercises_json, 'w', encoding='utf-8') as f:
            json.dump(exercises, f, ensure_ascii=False, indent=2)
        
        return jsonify({'status': 'success', 'exercise': exercises[i] if found else None})
    except Exception as e:
        print(f"Error en update-exercise: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-exercise', methods=['POST'])
def delete_exercise():
    """Elimina un ejercicio específico"""
    try:
        data = request.json
        exercise_id = data.get('id')
        
        # Leer ejercicios actuales
        exercises_json = 'extracted_data/exercises.json'
        
        # Si no existe el archivo, retornar error
        if not os.path.exists(exercises_json):
            return jsonify({'error': 'No hay ejercicios para eliminar'}), 404
        
        with open(exercises_json, 'r', encoding='utf-8') as f:
            exercises = json.load(f)
        
        # Filtrar ejercicio eliminado
        original_count = len(exercises)
        exercises = [ex for ex in exercises if ex.get('id') != exercise_id]
        
        # Verificar si se eliminó algo
        if len(exercises) == original_count:
            return jsonify({'error': f'Ejercicio {exercise_id} no encontrado'}), 404
        
        # Guardar
        with open(exercises_json, 'w', encoding='utf-8') as f:
            json.dump(exercises, f, ensure_ascii=False, indent=2)
        
        return jsonify({'status': 'success', 'remaining': len(exercises)})
    except Exception as e:
        print(f"Error en delete-exercise: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/save-associations', methods=['POST'])
def save_associations():
    """Guarda asociaciones y genera JSON final"""
    data = request.json
    exercises_with_images = data.get('exercises', [])
    
    # Guardar JSON final
    output_path = 'extracted_data/ejercicios_final.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(exercises_with_images, f, ensure_ascii=False, indent=2)
    
    return jsonify({'status': 'success', 'file': output_path})

@app.route('/figures/<path:filename>')
def serve_figure(filename):
    """Sirve imágenes"""
    return send_from_directory('extracted_data/figures', filename)

@app.route('/api/extract-exercises', methods=['POST', 'OPTIONS'])
def extract_exercises_endpoint():
    """Endpoint para extraer ejercicios desde React"""
    
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    try:
        data = request.json
        pdf_base64 = data.get('pdfBase64')
        
        if not pdf_base64:
            return jsonify({'error': 'No PDF data'}), 400
        
        print("\n" + "="*70)
        print("📥 Recibiendo PDF desde frontend...")
        print("="*70)
        
        # Decodificar PDF
        pdf_bytes = base64.b64decode(pdf_base64)
        
        # Guardar temporalmente
        temp_pdf = Path('temp_upload.pdf')
        with open(temp_pdf, 'wb') as f:
            f.write(pdf_bytes)
        
        print(f"✅ PDF guardado temporalmente: {temp_pdf}")
        
        # Obtener API Key
        api_key = Config.ANTHROPIC_API_KEY
        if not api_key or api_key == "COLOCA_TU_API_KEY_AQUI":
            return jsonify({'error': 'API Key no configurada en el backend'}), 500
        
        # Procesar con el extractor
        extractor = VisualExtractor(api_key=api_key)
        
        # Extraer figuras y ejercicios
        figures = extractor.extract_figures_with_nomenclature(str(temp_pdf))
        exercises = extractor.extract_exercises(str(temp_pdf))
        
        # 🔥 GUARDAR DATOS EN DISCO para persistencia
        os.makedirs('extracted_data', exist_ok=True)
        
        with open('extracted_data/figures.json', 'w', encoding='utf-8') as f:
            json.dump(figures, f, ensure_ascii=False, indent=2)
        
        with open('extracted_data/exercises.json', 'w', encoding='utf-8') as f:
            json.dump(exercises, f, ensure_ascii=False, indent=2)
        
        print("💾 Datos guardados en extracted_data/")
        
        # Limpiar archivo temporal
        if temp_pdf.exists():
            temp_pdf.unlink()
            print("🗑️  Archivo temporal eliminado")
        
        print("\n" + "="*70)
        print(f"✅ Procesamiento completo:")
        print(f"   📊 Ejercicios: {len(exercises)}")
        print(f"   🖼️  Figuras: {len(figures)}")
        print("="*70 + "\n")
        
        return jsonify({
            'exercises': exercises,
            'figures': figures
        }), 200
        
    except Exception as e:
        print(f"\n❌ Error en endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Limpiar archivo temporal si existe
        temp_pdf = Path('temp_upload.pdf')
        if temp_pdf.exists():
            temp_pdf.unlink()
        
        return jsonify({'error': str(e)}), 500


def start_server():
    """Inicia servidor Flask"""
    print("\n" + "="*70)
    print("🌐 INICIANDO SERVIDOR WEB MEJORADO")
    print("="*70)
    print("📍 URL: http://localhost:5000")
    print("🔗 Abre el frontend React en otra terminal")
    print("⌨️  Ctrl+C para detener")
    print("="*70 + "\n")
    
    app.run(debug=True, port=5000)


# ============================================================================
# MAIN
# ============================================================================

def main():
    print("""
╔════════════════════════════════════════════════════════════════════╗
║  🎯 EXTRACTOR MEJORADO V2.0                                       ║
║  ✅ Edición de ejercicios                                         ║
║  ✅ Múltiples figuras                                             ║
║  ✅ Organización por páginas                                      ║
╚════════════════════════════════════════════════════════════════════╝
    """)
    
    # ⭐ Obtener API Key desde configuración
    api_key = Config.get_api_key_or_prompt()
    
    pdf_path = input("📄 PDF (con recuadros rojos): ").strip().strip('"')
    
    if not Path(pdf_path).exists():
        print("❌ Archivo no encontrado")
        sys.exit(1)
    
    # Extraer datos
    extractor = VisualExtractor(api_key=api_key)
    extractor.process_pdf(pdf_path)
    
    # Opción de iniciar servidor
    print("\n¿Iniciar servidor web para React? (s/n): ", end="")
    if input().strip().lower() == 's':
        start_server()
    else:
        print("\n✅ Datos listos en: extracted_data/")
        print("💡 Para iniciar servidor después: python backend_extractor_mejorado.py --server")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == '--server':
        if Config.validate_api_key():
            start_server()
        else:
            print("❌ Configura API Key antes de iniciar el servidor")
            sys.exit(1)
    else:
        main()