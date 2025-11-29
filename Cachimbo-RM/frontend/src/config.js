// config.js
// Configuración centralizada de API Keys

// ⭐ OPCIÓN 1: Usar variable de entorno (RECOMENDADO)
// Crea un archivo .env en la raíz de frontend/ con:
// REACT_APP_ANTHROPIC_API_KEY=sk-ant-tu-api-key-aqui

export const config = {
  // Intenta primero la variable de entorno, si no usa la hardcodeada
  ANTHROPIC_API_KEY: import.meta.env.VITE_ANTHROPIC_API_KEY || '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',
  
  // Otras configuraciones
  API_BASE_URL: 'http://localhost:5000',
  MAX_FILE_SIZE: 15 * 1024 * 1024, // 15 MB
  SUPPORTED_FILE_TYPES: ['application/pdf'],
  CLAUDE_MODEL: 'claude-sonnet-4-20250514',
  MAX_TOKENS: 8000
};

// Validar que la API Key esté configurada
if (!config.ANTHROPIC_API_KEY || config.ANTHROPIC_API_KEY === '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') {
  console.warn('⚠️ API Key no configurada. Edita src/config.js o crea un archivo .env');
}

export default config;  