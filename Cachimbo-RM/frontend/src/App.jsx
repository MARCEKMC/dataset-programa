// App.jsx - Sistema Extractor V2.0 COMPLETO
// ✅ 1. Edición de campos (text, question, alternatives, answer, resolution)
// ✅ 2. Múltiples figuras por ejercicio
// ✅ 3. Navegación por páginas con figuras globales

import React, { useState, useEffect } from 'react';
import { 
  Upload, Download, CheckCircle, XCircle, Loader, 
  Edit2, Save, Trash2, Plus, X 
} from 'lucide-react';
import config from './config';

function App() {
  const [apiKey, setApiKey] = useState(config.ANTHROPIC_API_KEY || '');
  const [pdfFile, setPdfFile] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [figures, setFigures] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [step, setStep] = useState('upload');
  const [currentPage, setCurrentPage] = useState(null);
  
  // Estados para edición
  const [editingExercise, setEditingExercise] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Verificar API Key al cargar
  useEffect(() => {
    if (config.ANTHROPIC_API_KEY && config.ANTHROPIC_API_KEY !== 'COLOCA_TU_API_KEY_AQUI' && config.ANTHROPIC_API_KEY.trim() !== '') {
      addLog('✅ API Key cargada desde config.js', 'success');
    }
  }, []);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      addLog(`PDF seleccionado: ${file.name}`, 'success');
    } else {
      alert('Por favor selecciona un archivo PDF válido');
    }
  };

  const processPDF = async () => {
    if (!pdfFile) {
      alert('Por favor selecciona un PDF');
      return;
    }

    if (!apiKey || apiKey.trim() === '') {
      alert('Por favor ingresa tu API Key de Anthropic');
      return;
    }

    setIsProcessing(true);
    setStep('processing');
    setLogs([]);
    addLog('🚀 Iniciando procesamiento...', 'info');

    try {
      addLog('📄 Leyendo PDF...', 'info');
      const arrayBuffer = await pdfFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      addLog('📸 Detectando recuadros rojos...', 'info');
      addLog('🤖 Extrayendo ejercicios con Claude AI...', 'info');
      addLog('⏳ Esto puede tomar 30-90 segundos...', 'info');

      const response = await fetch('http://localhost:5000/api/extract-exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfBase64: base64 })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !data.exercises || !data.figures) {
        throw new Error('Respuesta inválida del servidor');
      }

      const { exercises: extractedExercises, figures: extractedFigures } = data;
      
      addLog(`✅ ${extractedFigures.length} figuras detectadas`, 'success');
      setFigures(extractedFigures);

      // Agregar campos para múltiples figuras
      const exercisesWithFigures = extractedExercises.map(ex => ({
        ...ex,
        text_figures: ex.text_figures || [],
        resolution_figures: ex.resolution_figures || []
      }));

      addLog(`✅ ${exercisesWithFigures.length} ejercicios extraídos`, 'success');
      setExercises(exercisesWithFigures);
      
      // Establecer la primera página disponible
      const pages = [...new Set(exercisesWithFigures.map(ex => ex.page))].sort((a, b) => a - b);
      if (pages.length > 0) {
        setCurrentPage(pages[0]);
      }
      
      setStep('associate');
      addLog('🎨 Listo para trabajar', 'success');

    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
      console.error('Error completo:', error);
      alert(`Error: ${error.message}\n\n¿El backend está corriendo en http://localhost:5000?`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ============ FUNCIONES DE EDICIÓN ============
  
  const startEditing = (exercise) => {
    setEditingExercise(exercise.id);
    setEditForm({
      text: exercise.text,
      question: exercise.question,
      alternatives: exercise.alternatives,
      answer: exercise.answer,
      resolution: exercise.resolution
    });
  };

  const cancelEditing = () => {
    setEditingExercise(null);
    setEditForm({});
  };

  const saveEdit = async (exerciseId) => {
    try {
      const response = await fetch('http://localhost:5000/api/update-exercise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: exerciseId,
          data: editForm
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar ejercicio');
      }

      // Actualizar estado local
      setExercises(prev => prev.map(ex => 
        ex.id === exerciseId ? { ...ex, ...editForm } : ex
      ));

      setEditingExercise(null);
      setEditForm({});
      addLog(`✅ Ejercicio ${exerciseId} actualizado`, 'success');
    } catch (error) {
      addLog(`❌ Error al guardar: ${error.message}`, 'error');
      alert('Error al guardar los cambios');
    }
  };

  const deleteExercise = async (exerciseId) => {
    if (!confirm('¿Estás seguro de eliminar este ejercicio? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/delete-exercise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: exerciseId })
      });

      if (!response.ok) {
        throw new Error('Error al eliminar ejercicio');
      }

      // Actualizar estado local
      setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
      
      if (selectedExercise === exerciseId) {
        setSelectedExercise(null);
      }

      addLog(`🗑️ Ejercicio ${exerciseId} eliminado`, 'success');
    } catch (error) {
      addLog(`❌ Error al eliminar: ${error.message}`, 'error');
      alert('Error al eliminar el ejercicio');
    }
  };

  // ============ GESTIÓN DE MÚLTIPLES FIGURAS ============

  const addFigureToExercise = (exerciseId, figureId, location) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        const field = location === 'text' ? 'text_figures' : 'resolution_figures';
        const currentFigures = ex[field] || [];
        
        // Evitar duplicados
        if (!currentFigures.includes(figureId)) {
          return {
            ...ex,
            [field]: [...currentFigures, figureId]
          };
        }
      }
      return ex;
    }));
    
    addLog(`✅ ${figureId} agregada a ${location}`, 'success');
  };

  const removeFigureFromExercise = (exerciseId, figureId, location) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        const field = location === 'text' ? 'text_figures' : 'resolution_figures';
        const currentFigures = ex[field] || [];
        
        return {
          ...ex,
          [field]: currentFigures.filter(id => id !== figureId)
        };
      }
      return ex;
    }));
    
    addLog(`🗑️ ${figureId} removida de ${location}`, 'info');
  };

  // ============ EXPORTACIÓN LIMPIA ============

  const exportJSON = () => {
    const finalExercises = exercises.map(ex => {
      const textFigures = (ex.text_figures || [])
        .map(id => figures.find(f => f.id === id))
        .filter(Boolean);
      
      const resFigures = (ex.resolution_figures || [])
        .map(id => figures.find(f => f.id === id))
        .filter(Boolean);

      // Construir text con imágenes incrustadas
      let textWithImages = ex.text;
      textFigures.forEach(fig => {
        textWithImages += `\n\n[IMAGEN: ${fig.base64}]`;
      });

      // Construir resolution con imágenes incrustadas
      let resolutionWithImages = ex.resolution;
      resFigures.forEach(fig => {
        resolutionWithImages = `[IMAGEN: ${fig.base64}]\n\n` + resolutionWithImages;
      });

      // Retornar SOLO el formato exacto requerido
      // Sin campos adicionales como id, page, etc.
      return {
        text: textWithImages,
        question: ex.question,
        alternatives: ex.alternatives,
        answer: ex.answer,
        resolution: resolutionWithImages
      };
    });

    const dataStr = JSON.stringify(finalExercises, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ejercicios_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addLog('✅ JSON exportado correctamente', 'success');
    alert('✅ JSON exportado con formato limpio!');
  };

  const reset = () => {
    setPdfFile(null);
    setExercises([]);
    setFigures([]);
    setSelectedExercise(null);
    setLogs([]);
    setStep('upload');
    setCurrentPage(null);
    setEditingExercise(null);
    setEditForm({});
  };

  // ============ UTILIDADES ============

  const getAssignedFigures = () => {
    const assigned = new Set();
    exercises.forEach(ex => {
      (ex.text_figures || []).forEach(id => assigned.add(id));
      (ex.resolution_figures || []).forEach(id => assigned.add(id));
    });
    return assigned;
  };

  const getAvailablePages = () => {
    return [...new Set(exercises.map(ex => ex.page))].sort((a, b) => a - b);
  };

  const getCurrentPageExercises = () => {
    if (!currentPage) return exercises;
    return exercises.filter(ex => ex.page === currentPage);
  };

  const assignedFigures = getAssignedFigures();
  const availablePages = getAvailablePages();
  const currentPageExercises = getCurrentPageExercises();

  const exerciseCount = exercises.length;
  const figureCount = figures.length;
  const assignedCount = assignedFigures.size;
  const pendingCount = figureCount - assignedCount;
  const pageCount = availablePages.length;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            📚 Extractor de Ejercicios Matemáticos V2.0
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '12px' }}>
            ✅ Edición completa • ✅ Múltiples figuras • ✅ Organización por páginas
          </p>
          
          {/* Indicador de API Key */}
          {apiKey && apiKey !== 'COLOCA_TU_API_KEY_AQUI' && apiKey.trim() !== '' && (
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '12px', fontWeight: '600' }}>
                ✅ API Key configurada
              </span>
            </div>
          )}
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>🔑 Configuración</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                API Key de Anthropic {apiKey && apiKey !== 'COLOCA_TU_API_KEY_AQUI' && '(Pre-configurada ✓)'}
              </label>
              {apiKey && apiKey !== 'COLOCA_TU_API_KEY_AQUI' && apiKey.trim() !== '' ? (
                <div style={{ padding: '12px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', marginBottom: '8px' }}>
                  <p style={{ fontSize: '14px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={16} />
                    API Key configurada en config.js
                  </p>
                  <button
                    onClick={() => setApiKey('')}
                    style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      padding: '4px 8px',
                      background: 'white',
                      color: '#166534',
                      border: '1px solid #86efac',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Usar otra API Key
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                  />
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                      Obtener API Key
                    </a>
                    {' | '}
                    También puedes configurarla en <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '2px' }}>src/config.js</code>
                  </p>
                </>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                📄 Subir PDF (con recuadros rojos)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '24px', border: '2px dashed #d1d5db', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                     onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <Upload size={32} style={{ color: '#9ca3af' }} />
                <div>
                  <p style={{ fontWeight: '600', color: '#374151' }}>
                    {pdfFile ? pdfFile.name : 'Click para seleccionar PDF'}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    {pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` : 'Máximo 15 MB'}
                  </p>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <button
              onClick={processPDF}
              disabled={!apiKey || !pdfFile || isProcessing}
              style={{
                width: '100%',
                padding: '16px',
                background: (!apiKey || !pdfFile || isProcessing) ? '#9ca3af' : '#2563eb',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontSize: '18px',
                fontWeight: '600',
                cursor: (!apiKey || !pdfFile || isProcessing) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => { if (apiKey && pdfFile && !isProcessing) e.currentTarget.style.background = '#1d4ed8'; }}
              onMouseLeave={(e) => { if (apiKey && pdfFile && !isProcessing) e.currentTarget.style.background = '#2563eb'; }}
            >
              {isProcessing ? (
                <>
                  <Loader style={{ animation: 'spin 1s linear infinite' }} size={24} />
                  Procesando...
                </>
              ) : (
                '🚀 Procesar PDF'
              )}
            </button>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>⚙️ Procesando...</h2>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {logs.map((log, idx) => (
                <div key={idx} style={{
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  fontSize: '14px',
                  background: log.type === 'error' ? '#fef2f2' : log.type === 'success' ? '#f0fdf4' : '#eff6ff',
                  color: log.type === 'error' ? '#991b1b' : log.type === 'success' ? '#166534' : '#1e40af'
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6b7280' }}>[{log.time}]</span> {log.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Association Step */}
        {step === 'associate' && (
          <>
            {/* Estadísticas */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', flex: 1 }}>
                  <div style={{ background: '#dbeafe', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>Ejercicios</p>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a' }}>{exerciseCount}</p>
                  </div>
                  <div style={{ background: '#f3e8ff', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#6b21a8', fontWeight: '600' }}>Figuras</p>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#581c87' }}>{figureCount}</p>
                  </div>
                  <div style={{ background: '#dcfce7', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#166534', fontWeight: '600' }}>Asignadas</p>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#14532d' }}>{assignedCount}</p>
                  </div>
                  <div style={{ background: '#fed7aa', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#9a3412', fontWeight: '600' }}>Pendientes</p>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c2d12' }}>{pendingCount}</p>
                  </div>
                  <div style={{ background: '#fef3c7', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#854d0e', fontWeight: '600' }}>Páginas</p>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#713f12' }}>{pageCount}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                  <button
                    onClick={exportJSON}
                    style={{
                      padding: '12px 24px',
                      background: '#16a34a',
                      color: 'white',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#15803d'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#16a34a'}
                  >
                    <Download size={20} />
                    Exportar
                  </button>
                  <button
                    onClick={reset}
                    style={{
                      padding: '12px 16px',
                      background: '#4b5563',
                      color: 'white',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#4b5563'}
                  >
                    Nuevo
                  </button>
                </div>
              </div>
            </div>

            {/* Navegación por páginas */}
            {availablePages.length > 1 && (
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '16px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>📄 Navegación por Páginas</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {availablePages.map(page => {
                    const pageExCount = exercises.filter(ex => ex.page === page).length;
                    const pageFigCount = figures.filter(fig => fig.page === page).length;
                    const isActive = currentPage === page;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: isActive ? '#2563eb' : '#e5e7eb',
                          color: isActive ? 'white' : '#374151'
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#d1d5db'; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = '#e5e7eb'; }}
                      >
                        Página {page}
                        <span style={{ fontSize: '12px', marginLeft: '8px' }}>
                          ({pageExCount}📝 / {pageFigCount}🖼️)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grid de Ejercicios y Figuras */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
              
              {/* Columna de Ejercicios */}
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                  📋 Ejercicios - Página {currentPage}
                  <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6b7280', marginLeft: '8px' }}>
                    ({currentPageExercises.length} en esta página)
                  </span>
                </h2>

                {currentPageExercises.length === 0 ? (
                  <div style={{ background: '#fef3c7', border: '1px solid #fde047', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
                    <p style={{ color: '#854d0e' }}>No hay ejercicios en esta página</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {currentPageExercises.map(ex => {
                      const isEditing = editingExercise === ex.id;
                      const textFigs = (ex.text_figures || [])
                        .map(id => figures.find(f => f.id === id))
                        .filter(Boolean);
                      const resFigs = (ex.resolution_figures || [])
                        .map(id => figures.find(f => f.id === id))
                        .filter(Boolean);

                      return (
                        <div
                          key={ex.id}
                          onClick={() => !isEditing && setSelectedExercise(ex.id)}
                          style={{
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            padding: '24px',
                            transition: 'all 0.2s',
                            border: selectedExercise === ex.id && !isEditing ? '2px solid #3b82f6' : isEditing ? '2px solid #9333ea' : '2px solid transparent',
                            cursor: isEditing ? 'default' : 'pointer'
                          }}
                        >
                          {/* Header con controles */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{ex.id}</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {!isEditing ? (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); startEditing(ex); }}
                                    style={{
                                      padding: '8px',
                                      background: '#dbeafe',
                                      color: '#2563eb',
                                      borderRadius: '6px',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    title="Editar"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); deleteExercise(ex.id); }}
                                    style={{
                                      padding: '8px',
                                      background: '#fee2e2',
                                      color: '#dc2626',
                                      borderRadius: '6px',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    title="Eliminar"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); saveEdit(ex.id); }}
                                    style={{
                                      padding: '8px',
                                      background: '#dcfce7',
                                      color: '#16a34a',
                                      borderRadius: '6px',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    title="Guardar"
                                  >
                                    <Save size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                                    style={{
                                      padding: '8px',
                                      background: '#f3f4f6',
                                      color: '#6b7280',
                                      borderRadius: '6px',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    title="Cancelar"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Text Section */}
                          <div style={{ marginBottom: '12px', padding: '12px', background: '#dbeafe', borderRadius: '6px' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>📝 Text</p>
                            {isEditing ? (
                              <textarea
                                value={editForm.text}
                                onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', minHeight: '80px' }}
                              />
                            ) : (
                              <p style={{ fontSize: '14px' }}>{ex.text}</p>
                            )}
                            
                            {/* Figuras del texto */}
                            {textFigs.length > 0 && (
                              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {textFigs.map(fig => (
                                  <div key={fig.id} style={{ padding: '8px', background: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <img src={fig.base64} alt="" style={{ height: '60px', borderRadius: '4px' }} />
                                    <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <CheckCircle size={12} />
                                      {fig.filename}
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeFigureFromExercise(ex.id, fig.id, 'text');
                                      }}
                                      style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Question */}
                          <div style={{ marginBottom: '8px' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>❓ Pregunta</p>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.question}
                                onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px' }}
                              />
                            ) : (
                              <p style={{ fontSize: '14px' }}>{ex.question}</p>
                            )}
                          </div>

                          {/* Alternatives */}
                          <div style={{ marginBottom: '8px' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>📋 Alternativas</p>
                            {isEditing ? (
                              <textarea
                                value={editForm.alternatives}
                                onChange={(e) => setEditForm({ ...editForm, alternatives: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', minHeight: '60px' }}
                              />
                            ) : (
                              <p style={{ fontSize: '14px', whiteSpace: 'pre-line' }}>{ex.alternatives}</p>
                            )}
                          </div>

                          {/* Answer */}
                          <div style={{ marginBottom: '12px' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>✅ Respuesta</p>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.answer}
                                onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px' }}
                              />
                            ) : (
                              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#16a34a' }}>{ex.answer}</p>
                            )}
                          </div>

                          {/* Resolution Section */}
                          <div style={{ padding: '12px', background: '#f3e8ff', borderRadius: '6px' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#6b21a8', marginBottom: '8px' }}>💡 Resolution</p>
                            {isEditing ? (
                              <textarea
                                value={editForm.resolution}
                                onChange={(e) => setEditForm({ ...editForm, resolution: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', minHeight: '80px' }}
                              />
                            ) : (
                              <p style={{ fontSize: '14px' }}>{ex.resolution}</p>
                            )}
                            
                            {/* Figuras de la resolución */}
                            {resFigs.length > 0 && (
                              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {resFigs.map(fig => (
                                  <div key={fig.id} style={{ padding: '8px', background: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <img src={fig.base64} alt="" style={{ height: '60px', borderRadius: '4px' }} />
                                    <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <CheckCircle size={12} />
                                      {fig.filename}
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeFigureFromExercise(ex.id, fig.id, 'resolution');
                                      }}
                                      style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Columna de Figuras - SIEMPRE VISIBLE CON TODAS LAS FIGURAS */}
              <div>
                <div style={{ position: 'sticky', top: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                    🖼️ Figuras - Todas disponibles
                    <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6b7280', marginLeft: '8px' }}>
                      ({figures.length} figuras totales)
                    </span>
                  </h2>
                  
                  {!selectedExercise && (
                    <div style={{ background: '#fef3c7', border: '1px solid #fde047', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                      <p style={{ fontSize: '14px', color: '#854d0e' }}>👈 Selecciona un ejercicio para asociar figuras</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                    {figures.map(fig => {
                      const isAssigned = assignedFigures.has(fig.id);
                      
                      return (
                        <div key={fig.id} style={{
                          borderRadius: '8px',
                          padding: '16px',
                          border: '2px solid',
                          borderColor: isAssigned ? '#86efac' : '#e5e7eb',
                          background: isAssigned ? '#f0fdf4' : 'white'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div>
                              <p style={{ fontWeight: 'bold', fontSize: '14px' }}>{fig.filename}</p>
                              <p style={{ fontSize: '12px', color: '#6b7280' }}>Pág {fig.page}</p>
                            </div>
                            {isAssigned && <CheckCircle size={20} style={{ color: '#16a34a' }} />}
                          </div>
                          
                          <img src={fig.base64} alt={fig.filename} style={{ width: '100%', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '12px' }} />
                          
                          {selectedExercise && !editingExercise && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => addFigureToExercise(selectedExercise, fig.id, 'text')}
                                style={{
                                  flex: 1,
                                  fontSize: '12px',
                                  padding: '8px 12px',
                                  background: '#2563eb',
                                  color: 'white',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                              >
                                <Plus size={14} />
                                Text
                              </button>
                              <button
                                onClick={() => addFigureToExercise(selectedExercise, fig.id, 'resolution')}
                                style={{
                                  flex: 1,
                                  fontSize: '12px',
                                  padding: '8px 12px',
                                  background: '#9333ea',
                                  color: 'white',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#7e22ce'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#9333ea'}
                              >
                                <Plus size={14} />
                                Resolution
                              </button>
                            </div>
                          )}
                          
                          {isAssigned && !selectedExercise && (
                            <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', textAlign: 'center' }}>
                              ✓ Asignada
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Logs permanentes */}
        {logs.length > 0 && step !== 'processing' && (
          <div style={{ marginTop: '24px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '16px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>📋 Log de proceso</h3>
            <div style={{ maxHeight: '160px', overflowY: 'auto', fontSize: '12px' }}>
              {logs.slice(-10).map((log, idx) => (
                <div key={idx} style={{ color: '#6b7280' }}>
                  [{log.time}] {log.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;