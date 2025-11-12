/**
 * Model de Cliente
 * Gerencia os dados dos clientes do sistema IPTV
 * Funciona com ou sem MongoDB (armazenamento em memória)
 */

const mongoose = require('mongoose');

// Armazenamento em memória (quando não há MongoDB)
const memoryStorage = new Map();

const clientSchema = new mongoose.Schema({
  // Informações básicas
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  // Status do cliente
  status: {
    type: String,
    enum: ['lead', 'teste', 'ativo', 'inativo', 'cancelado'],
    default: 'lead'
  },

  // Plano contratado
  plan: {
    name: String,
    price: Number,
    duration: Number, // em dias
    channels: Number
  },

  // Informações de teste
  hasUsedTest: {
    type: Boolean,
    default: false
  },

  testRequestDate: Date,

  // Informações de pagamento
  subscription: {
    startDate: Date,
    endDate: Date,
    paymentMethod: String,
    lastPayment: Date,
    nextPayment: Date
  },

  // Histórico de interações
  conversationHistory: [{
    message: String,
    type: {
      type: String,
      enum: ['received', 'sent']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Preferências e interesses
  interests: [String],
  
  // Notas internas
  notes: String,

  // Metadados
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  lastInteraction: {
    type: Date,
    default: Date.now
  }
});

// Middleware para atualizar updatedAt
clientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para melhor performance
clientSchema.index({ phone: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ 'subscription.endDate': 1 });

// Métodos do schema
clientSchema.methods.addConversation = function(message, type) {
  this.conversationHistory.push({
    message,
    type,
    timestamp: new Date()
  });
  this.lastInteraction = new Date();
};

clientSchema.methods.isSubscriptionActive = function() {
  if (!this.subscription || !this.subscription.endDate) {
    return false;
  }
  return new Date() < this.subscription.endDate;
};

clientSchema.methods.getDaysUntilExpiration = function() {
  if (!this.subscription || !this.subscription.endDate) {
    return 0;
  }
  const now = new Date();
  const diffTime = this.subscription.endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Wrapper para funcionar com ou sem MongoDB
const ClientModel = mongoose.models.Client || mongoose.model('Client', clientSchema);

// Exporta interface unificada
module.exports = ClientModel;

// Adiciona métodos estáticos para armazenamento em memória
module.exports.findOrCreateInMemory = function(phone, data = {}) {
  if (!memoryStorage.has(phone)) {
    memoryStorage.set(phone, {
      phone,
      name: data.name || '',
      hasUsedTest: false,
      conversationHistory: [],
      createdAt: new Date(),
      ...data
    });
  }
  return memoryStorage.get(phone);
};

module.exports.updateInMemory = function(phone, data) {
  const existing = memoryStorage.get(phone) || {};
  memoryStorage.set(phone, { ...existing, ...data, updatedAt: new Date() });
  return memoryStorage.get(phone);
};

module.exports.getFromMemory = function(phone) {
  return memoryStorage.get(phone) || null;
};
const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
