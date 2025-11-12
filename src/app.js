/**
 * App.js - Aplicação Principal
 * Bot de WhatsApp para vendas de IPTV
 * 
 * @description Bot humanizado com atendimento completo
 * @version 1.0.0
 */

require('dotenv').config();

const whatsappConfig = require('./config/whatsapp');
const database = require('../database/connection');
const messageHandler = require('./handlers/messageHandler');
const notificationService = require('./services/notificationService');
const TestAccount = require('./models/TestAccount');
const server = require('./server');

class IPTVBot {
  constructor() {
    this.client = null;
    this.isRunning = false;
  }

  /**
   * Inicializa o bot
   */
  async start() {
    try {
      console.log('');
      console.log('╔════════════════════════════════════════╗');
      console.log('║   🤖 BOT IPTV WHATSAPP - INICIANDO   ║');
      console.log('╚════════════════════════════════════════╝');
      console.log('');

      // Inicia servidor HTTP
      await server.startServer();

      // Conecta ao banco de dados
      await database.connect();

      // Inicializa WhatsApp
      this.client = await whatsappConfig.initialize();

      // Registra handlers de mensagem
      this.registerMessageHandlers();

      // Inicializa serviço de notificações
      notificationService.initialize(this.client, messageHandler);

      // Limpa contas expiradas na inicialização
      await this.cleanupExpiredAccounts();

      this.isRunning = true;

      console.log('');
      console.log('╔════════════════════════════════════════╗');
      console.log('║     ✅ BOT INICIADO COM SUCESSO!      ║');
      console.log('╚════════════════════════════════════════╝');
      console.log('');
      console.log('📞 Aguardando mensagens...');
      console.log('💡 Pressione Ctrl+C para encerrar');
      console.log('');

    } catch (error) {
      console.error('❌ Erro ao inicializar bot:', error);
      process.exit(1);
    }
  }

  /**
   * Registra handlers de mensagens
   */
  registerMessageHandlers() {
    // Handler principal de mensagens
    this.client.on('message', async (message) => {
      try {
        await messageHandler.handleMessage(message, this.client);
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
      }
    });

    // Handler de mensagens apagadas
    this.client.on('message_revoke_everyone', async (message) => {
      console.log('🗑️  Mensagem apagada por todos:', message.id);
    });

    // Handler de status de mensagem
    this.client.on('message_ack', (message, ack) => {
      /*
        ACK Status:
        1 = Enviada
        2 = Recebida
        3 = Lida
      */
      if (ack === 3) {
        console.log('📖 Mensagem lida:', message.id._serialized);
      }
    });
  }

  /**
   * Limpa contas de teste expiradas
   */
  async cleanupExpiredAccounts() {
    try {
      // Tenta limpar do MongoDB, se não funcionar usa memória
      let cleaned = 0;
      try {
        cleaned = await TestAccount.cleanExpiredAccounts();
      } catch (error) {
        // Se MongoDB não estiver disponível, usa método de memória
        cleaned = TestAccount.cleanExpiredInMemory();
      }
      
      if (cleaned > 0) {
        console.log(`🧹 ${cleaned} contas de teste expiradas foram limpas`);
      }
    } catch (error) {
      console.error('❌ Erro ao limpar contas expiradas:', error);
    }
  }

  /**
   * Encerra o bot graciosamente
   */
  async shutdown() {
    if (!this.isRunning) return;

    console.log('');
    console.log('🔴 Encerrando bot...');

    try {
      // Destrói cliente WhatsApp
      await whatsappConfig.destroy();

      // Desconecta do banco de dados
      await database.disconnect();

      this.isRunning = false;

      console.log('✅ Bot encerrado com sucesso!');
      console.log('👋 Até logo!');
      
      process.exit(0);

    } catch (error) {
      console.error('❌ Erro ao encerrar bot:', error);
      process.exit(1);
    }
  }
}

// Instancia o bot
const bot = new IPTVBot();

// Inicia o bot
bot.start();

// Handlers de encerramento
process.on('SIGINT', async () => {
  console.log('');
  console.log('⚠️  Recebido sinal de interrupção (Ctrl+C)');
  await bot.shutdown();
});

process.on('SIGTERM', async () => {
  console.log('');
  console.log('⚠️  Recebido sinal de término');
  await bot.shutdown();
});

// Handler de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  bot.shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
});

module.exports = bot;
