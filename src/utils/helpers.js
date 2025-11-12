/**
 * Helpers - Funções Utilitárias
 * Funções auxiliares usadas em todo o projeto
 */

/**
 * Retorna saudação apropriada baseada no horário
 * @returns {string} Saudação
 */
function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return '☀️ Bom dia!';
  } else if (hour >= 12 && hour < 18) {
    return '🌤️ Boa tarde!';
  } else {
    return '🌙 Boa noite!';
  }
}

/**
 * Gera string aleatória
 * @param {number} length - Tamanho da string
 * @param {boolean} alphanumeric - Se deve incluir apenas alfanuméricos
 * @returns {string} String aleatória
 */
function generateRandomString(length = 8, alphanumeric = false) {
  const chars = alphanumeric 
    ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Valida número de telefone
 * @param {string} phone - Número de telefone
 * @returns {boolean} Se é válido
 */
function isValidPhone(phone) {
  if (!phone) return false;
  
  // Remove caracteres especiais
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Verifica tamanho (deve ter entre 10 e 13 dígitos)
  return cleanPhone.length >= 10 && cleanPhone.length <= 13;
}

/**
 * Formata número de telefone
 * @param {string} phone - Número de telefone
 * @returns {string} Número formatado
 */
function formatPhone(phone) {
  if (!phone) return '';
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 11) {
    return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 7)}-${cleanPhone.substring(7)}`;
  } else if (cleanPhone.length === 10) {
    return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 6)}-${cleanPhone.substring(6)}`;
  }
  
  return phone;
}

/**
 * Valida email
 * @param {string} email - Email
 * @returns {boolean} Se é válido
 */
function isValidEmail(email) {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formata valor monetário
 * @param {number} value - Valor
 * @returns {string} Valor formatado
 */
function formatCurrency(value) {
  if (typeof value !== 'number') return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata data
 * @param {Date} date - Data
 * @param {boolean} includeTime - Se deve incluir hora
 * @returns {string} Data formatada
 */
function formatDate(date, includeTime = false) {
  if (!date) return '';
  
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Date(date).toLocaleString('pt-BR', options);
}

/**
 * Calcula diferença em dias entre duas datas
 * @param {Date} date1 - Data 1
 * @param {Date} date2 - Data 2
 * @returns {number} Diferença em dias
 */
function daysDifference(date1, date2) {
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Sanitiza entrada de texto
 * @param {string} text - Texto
 * @returns {string} Texto sanitizado
 */
function sanitizeText(text) {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .substring(0, 500); // Limita tamanho
}

/**
 * Verifica se string contém palavras-chave
 * @param {string} text - Texto
 * @param {Array} keywords - Palavras-chave
 * @returns {boolean} Se contém alguma palavra-chave
 */
function containsKeywords(text, keywords) {
  if (!text || !keywords || !Array.isArray(keywords)) return false;
  
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Remove acentos de string
 * @param {string} text - Texto
 * @returns {string} Texto sem acentos
 */
function removeAccents(text) {
  if (!text) return '';
  
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Capitaliza primeira letra
 * @param {string} text - Texto
 * @returns {string} Texto capitalizado
 */
function capitalize(text) {
  if (!text) return '';
  
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Capitaliza cada palavra
 * @param {string} text - Texto
 * @returns {string} Texto com cada palavra capitalizada
 */
function capitalizeWords(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Trunca texto
 * @param {string} text - Texto
 * @param {number} maxLength - Tamanho máximo
 * @param {string} suffix - Sufixo (padrão: ...)
 * @returns {string} Texto truncado
 */
function truncate(text, maxLength = 100, suffix = '...') {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + suffix;
}

/**
 * Delay assíncrono
 * @param {number} ms - Milissegundos
 * @returns {Promise} Promise que resolve após o delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gera ID único
 * @returns {string} ID único
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Valida CPF (básico)
 * @param {string} cpf - CPF
 * @returns {boolean} Se é válido
 */
function isValidCPF(cpf) {
  if (!cpf) return false;
  
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  return true;
}

/**
 * Formata CPF
 * @param {string} cpf - CPF
 * @returns {string} CPF formatado
 */
function formatCPF(cpf) {
  if (!cpf) return '';
  
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return cpf;
  
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Extrai números de string
 * @param {string} text - Texto
 * @returns {string} Apenas números
 */
function extractNumbers(text) {
  if (!text) return '';
  
  return text.replace(/\D/g, '');
}

/**
 * Verifica se é número
 * @param {*} value - Valor
 * @returns {boolean} Se é número
 */
function isNumber(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Calcula porcentagem
 * @param {number} value - Valor
 * @param {number} percentage - Porcentagem
 * @returns {number} Resultado
 */
function calculatePercentage(value, percentage) {
  if (!isNumber(value) || !isNumber(percentage)) return 0;
  
  return (value * percentage) / 100;
}

/**
 * Aplica desconto
 * @param {number} value - Valor original
 * @param {number} discountPercentage - Porcentagem de desconto
 * @returns {number} Valor com desconto
 */
function applyDiscount(value, discountPercentage) {
  if (!isNumber(value) || !isNumber(discountPercentage)) return value;
  
  const discount = calculatePercentage(value, discountPercentage);
  return value - discount;
}

/**
 * Formata duração em texto
 * @param {number} hours - Horas
 * @returns {string} Duração formatada
 */
function formatDuration(hours) {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }
  
  if (hours < 24) {
    return `${Math.round(hours)} hora${Math.round(hours) !== 1 ? 's' : ''}`;
  }
  
  const days = Math.round(hours / 24);
  return `${days} dia${days !== 1 ? 's' : ''}`;
}

/**
 * Logger personalizado
 * @param {string} level - Nível (info, warn, error)
 * @param {string} message - Mensagem
 * @param {*} data - Dados adicionais
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const emoji = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    success: '✅'
  }[level] || 'ℹ️';
  
  console.log(`${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`);
  
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

module.exports = {
  getGreeting,
  generateRandomString,
  isValidPhone,
  formatPhone,
  isValidEmail,
  formatCurrency,
  formatDate,
  daysDifference,
  sanitizeText,
  containsKeywords,
  removeAccents,
  capitalize,
  capitalizeWords,
  truncate,
  delay,
  generateUniqueId,
  isValidCPF,
  formatCPF,
  extractNumbers,
  isNumber,
  calculatePercentage,
  applyDiscount,
  formatDuration,
  log
};
