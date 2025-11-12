/**
 * Model de Conta de Teste
 * Gerencia contas de teste IPTV com expiração automática
 */

const mongoose = require('mongoose');

const testAccountSchema = new mongoose.Schema({
  // Referência ao cliente
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },

  clientPhone: {
    type: String,
    required: true
  },

  // Credenciais de teste
  username: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  // Informações de acesso
  serverUrl: {
    type: String,
    default: process.env.IPTV_SERVER_URL || 'http://seu-servidor-iptv.com'
  },

  port: {
    type: String,
    default: '8080'
  },

  // Status da conta
  status: {
    type: String,
    enum: ['ativa', 'expirada', 'cancelada'],
    default: 'ativa'
  },

  // Datas
  createdAt: {
    type: Date,
    default: Date.now
  },

  expiresAt: {
    type: Date,
    required: true
  },

  activatedAt: Date,

  // Estatísticas de uso
  accessCount: {
    type: Number,
    default: 0
  },

  lastAccess: Date,

  // Follow-up
  followUpSent: {
    type: Boolean,
    default: false
  },

  followUpDate: Date,

  // Resultado
  converted: {
    type: Boolean,
    default: false
  },

  conversionDate: Date
});

// Índices
testAccountSchema.index({ clientId: 1 });
testAccountSchema.index({ status: 1 });
testAccountSchema.index({ expiresAt: 1 });
testAccountSchema.index({ username: 1 }, { unique: true });

// Métodos
testAccountSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

testAccountSchema.methods.getTimeRemaining = function() {
  const now = new Date();
  const diffMs = this.expiresAt - now;
  
  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, expired: true };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes, expired: false };
};

testAccountSchema.methods.markAsConverted = function() {
  this.converted = true;
  this.conversionDate = new Date();
};

// Método estático para limpar contas expiradas
testAccountSchema.statics.cleanExpiredAccounts = async function() {
  const now = new Date();
  const result = await this.updateMany(
    { 
      expiresAt: { $lt: now },
      status: 'ativa'
    },
    { 
      status: 'expirada'
    }
  );
  
  return result.modifiedCount;
};

const TestAccount = mongoose.model('TestAccount', testAccountSchema);

module.exports = TestAccount;
