/**
 * Notification Service - Serviço de Notificações
 * Gerencia notificações automáticas e follow-ups
 */

const cron = require('node-cron');
const Client = require('../models/Client');
const TestAccount = require('../models/TestAccount');
const moment = require('moment');

class NotificationService {
  constructor() {
    this.whatsappClient = null;
    this.messageHandler = null;
  }

  /**
   * Inicializa o serviço de notificações
   * @param {Object} whatsappClient - Cliente do WhatsApp
   * @param {Object} messageHandler - Handler de mensagens
   */
  initialize(whatsappClient, messageHandler) {
    this.whatsappClient = whatsappClient;
    this.messageHandler = messageHandler;

    console.log('🔔 Serviço de notificações inicializado');

    // Agenda tarefas periódicas
    this.scheduleNotifications();
  }

  /**
   * Agenda notificações periódicas
   */
  scheduleNotifications() {
    // Verifica testes expirados a cada hora
    cron.schedule('0 * * * *', () => {
      this.checkExpiredTests();
    });

    // Follow-up de testes às 10h e 18h
    cron.schedule('0 10,18 * * *', () => {
      this.sendTestFollowUps();
    });

    // Lembrete de renovação - diariamente às 9h
    cron.schedule('0 9 * * *', () => {
      this.sendRenewalReminders();
    });

    // Limpeza de dados antigos - todo domingo às 3h
    cron.schedule('0 3 * * 0', () => {
      this.cleanOldData();
    });

    console.log('📅 Notificações agendadas com sucesso');
  }

  /**
   * Verifica e notifica sobre testes expirados
   */
  async checkExpiredTests() {
    try {
      const expiredCount = await TestAccount.cleanExpiredAccounts();
      
      if (expiredCount > 0) {
        console.log(`⏰ ${expiredCount} testes marcados como expirados`);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar testes expirados:', error);
    }
  }

  /**
   * Envia follow-ups de testes
   */
  async sendTestFollowUps() {
    try {
      const now = new Date();
      
      // Busca testes que expiraram nas últimas 24h e ainda não receberam follow-up
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const tests = await TestAccount.find({
        status: 'expirada',
        followUpSent: false,
        expiresAt: { $gte: yesterday, $lte: now }
      });

      console.log(`📞 Enviando ${tests.length} follow-ups de teste`);

      for (const test of tests) {
        await this.sendTestFollowUp(test);
        
        // Delay entre mensagens para evitar bloqueio
        await this.delay(3000);
      }

    } catch (error) {
      console.error('❌ Erro ao enviar follow-ups:', error);
    }
  }

  /**
   * Envia follow-up individual de teste
   * @param {Object} test - Conta de teste
   */
  async sendTestFollowUp(test) {
    try {
      const client = await Client.findById(test.clientId);
      
      if (!client) return;

      const message = `Olá ${client.name}! 😊\n\n` +
        `Vi que seu teste expirou! Espero que tenha aproveitado! 🎬\n\n` +
        `O que achou da nossa IPTV? Conseguiu testar tudo? 📺\n\n` +
        `Tenho uma *super oferta* para você continuar assistindo! 🎉\n\n` +
        `*Planos a partir de R$ 19,90/mês*\n\n` +
        `Quer conhecer? É só responder! 🤗`;

      await this.messageHandler.sendMessage(test.clientPhone, message, this.whatsappClient);

      test.followUpSent = true;
      test.followUpDate = new Date();
      await test.save();

      console.log(`✅ Follow-up enviado para ${client.name}`);

    } catch (error) {
      console.error('❌ Erro ao enviar follow-up individual:', error);
    }
  }

  /**
   * Envia lembretes de renovação
   */
  async sendRenewalReminders() {
    try {
      const now = new Date();
      const threeDaysLater = new Date(now);
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);

      // Busca clientes com assinatura expirando em 3 dias
      const clients = await Client.find({
        status: 'ativo',
        'subscription.endDate': {
          $gte: now,
          $lte: threeDaysLater
        }
      });

      console.log(`📢 Enviando ${clients.length} lembretes de renovação`);

      for (const client of clients) {
        await this.sendRenewalReminder(client);
        await this.delay(3000);
      }

    } catch (error) {
      console.error('❌ Erro ao enviar lembretes de renovação:', error);
    }
  }

  /**
   * Envia lembrete individual de renovação
   * @param {Object} client - Cliente
   */
  async sendRenewalReminder(client) {
    try {
      const daysUntilExpiration = client.getDaysUntilExpiration();
      const expirationDate = moment(client.subscription.endDate).format('DD/MM/YYYY');

      const message = `🔔 *Lembrete de Renovação* 🔔\n\n` +
        `Olá ${client.name}! 😊\n\n` +
        `Sua assinatura está próxima do vencimento!\n\n` +
        `📅 Vence em: *${expirationDate}*\n` +
        `⏰ Faltam apenas *${daysUntilExpiration} dias*\n\n` +
        `Para não perder acesso aos seus canais favoritos, renove agora! 📺\n\n` +
        `💳 *Renovar pelo mesmo valor:*\n` +
        `R$ ${client.plan?.price?.toFixed(2) || '29,90'}/mês\n\n` +
        `Quer renovar? Digite *"renovar"*! 😊\n\n` +
        `_Pagamento via PIX com 5% OFF!_ ⚡`;

      await this.messageHandler.sendMessage(client.phone, message, this.whatsappClient);

      console.log(`✅ Lembrete enviado para ${client.name}`);

    } catch (error) {
      console.error('❌ Erro ao enviar lembrete individual:', error);
    }
  }

  /**
   * Notifica sobre assinatura expirada
   * @param {Object} client - Cliente
   */
  async notifyExpiredSubscription(client) {
    try {
      const message = `⚠️ *Assinatura Expirada* ⚠️\n\n` +
        `Olá ${client.name}!\n\n` +
        `Sua assinatura expirou e seu acesso foi suspenso. 😔\n\n` +
        `Mas não se preocupe! É super fácil reativar! 🔄\n\n` +
        `*Reative agora e ganhe:*\n` +
        `✨ 3 dias de bônus\n` +
        `💰 Desconto de 10% no PIX\n\n` +
        `Quer voltar a assistir? Digite *"reativar"*! 📺`;

      await this.messageHandler.sendMessage(client.phone, message, this.whatsappClient);

      console.log(`✅ Notificação de expiração enviada para ${client.name}`);

    } catch (error) {
      console.error('❌ Erro ao notificar expiração:', error);
    }
  }

  /**
   * Envia boas-vindas para novos clientes
   * @param {Object} client - Cliente
   */
  async sendWelcomeMessage(client) {
    try {
      const message = `🎉 *Seja Bem-vindo!* 🎉\n\n` +
        `Olá ${client.name}!\n\n` +
        `É um prazer ter você conosco! 😊\n\n` +
        `Já está tudo configurado e pronto para usar! 📺\n\n` +
        `*Dicas importantes:*\n\n` +
        `✅ Use WiFi para melhor qualidade\n` +
        `✅ Recomendamos 10MB ou mais\n` +
        `✅ Suporte 24h disponível\n` +
        `✅ Atualizações automáticas\n\n` +
        `Qualquer dúvida, é só chamar! 🤗\n\n` +
        `*Aproveite seu IPTV!* 🎬`;

      await this.messageHandler.sendMessage(client.phone, message, this.whatsappClient);

    } catch (error) {
      console.error('❌ Erro ao enviar boas-vindas:', error);
    }
  }

  /**
   * Limpa dados antigos
   */
  async cleanOldData() {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Remove testes antigos
      const deletedTests = await TestAccount.deleteMany({
        status: 'expirada',
        expiresAt: { $lt: sixMonthsAgo }
      });

      // Limpa histórico antigo de conversas
      await Client.updateMany(
        {},
        {
          $pull: {
            conversationHistory: {
              timestamp: { $lt: sixMonthsAgo }
            }
          }
        }
      );

      console.log(`🧹 Limpeza concluída: ${deletedTests.deletedCount} testes removidos`);

    } catch (error) {
      console.error('❌ Erro na limpeza de dados:', error);
    }
  }

  /**
   * Delay helper
   * @param {number} ms - Milissegundos
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Envia notificação de suporte
   * @param {string} adminPhone - Telefone do administrador
   * @param {string} message - Mensagem
   */
  async notifyAdmin(adminPhone, message) {
    try {
      if (!adminPhone || !this.whatsappClient) return;

      await this.whatsappClient.sendMessage(adminPhone, `🔔 *ALERTA ADMIN*\n\n${message}`);
      console.log('📧 Administrador notificado');

    } catch (error) {
      console.error('❌ Erro ao notificar admin:', error);
    }
  }
}

module.exports = new NotificationService();
