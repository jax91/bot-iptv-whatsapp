/**
 * Configuração da conexão com MongoDB
 * Gerencia a conexão e logs do banco de dados
 */

const mongoose = require('mongoose');
require('dotenv').config();

class Database {
  constructor() {
    this.connection = null;
  }

  /**
   * Conecta ao banco de dados MongoDB
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      const MONGODB_URI = process.env.MONGODB_URI;

      // Se não tiver MongoDB configurado, roda sem banco de dados
      if (!MONGODB_URI || MONGODB_URI === 'mongodb://localhost:27017/bot-iptv') {
        console.log('⚠️  MongoDB não configurado - rodando sem banco de dados');
        console.log('💡 Dados serão armazenados apenas em memória');
        console.log('✅ Bot funcionará normalmente (sem persistência de dados)');
        return;
      }

      console.log('🔌 Conectando ao MongoDB...');

      this.connection = await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log('✅ MongoDB conectado com sucesso!');
      console.log('📊 Database:', mongoose.connection.name);

      // Eventos do MongoDB
      mongoose.connection.on('error', (err) => {
        console.error('❌ Erro no MongoDB:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB desconectado');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconectado');
      });

    } catch (error) {
      console.error('⚠️  Erro ao conectar no MongoDB:', error.message);
      console.log('💡 Continuando sem banco de dados (modo memória)');
      this.connection = null;
    }
  }

  /**
   * Desconecta do banco de dados
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log('🔴 MongoDB desconectado');
    }
  }
}

module.exports = new Database();
