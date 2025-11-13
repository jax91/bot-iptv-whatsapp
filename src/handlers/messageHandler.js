/**
 * Message Handler - Gerenciador Principal de Mensagens
 * Processa mensagens recebidas e coordena respostas humanizadas
 */

const stateManager = require('./stateManager');
const testGenerator = require('./testGenerator');
const Client = require('../models/Client');
const { getGreeting, isValidPhone } = require('../utils/helpers');
const paymentService = require('../services/paymentService');

class MessageHandler {
  constructor() {
    this.COMPANY_NAME = process.env.COMPANY_NAME || 'FlexTV';
    this.BOT_NAME = process.env.BOT_NAME || 'Mavie';
    
    // Planos disponíveis
    this.plans = [
      {
        id: 1,
        name: 'Plano Slim',
        price: 19.90,
        duration: 30,
        channels: 1000,
        quality: 'SD e HD',
        description: 'Apenas canais, sem filmes ou séries'
      },
      {
        id: 2,
        name: 'Plano Gold',
        price: 22.90,
        duration: 30,
        channels: +4000,
        quality: 'Full HD',
        description: 'Voce escolhe, Canais e series, ou Canais e filmes',
        recommended: true
      },
      {
        id: 3,
        name: 'Plano Platinum',
        price: 28.90,
        duration: 30,
        channels: +5000,
        quality: 'FullHD + 4K',
        description: 'Canais, Filmes e Series e Novelas'
      },
      {
        id: 4,
        name: 'Plano Diamond',
        price: 29.90,
        duration: 30,
        channels: +6000,
        quality: 'HD/FullHD + 4K',
        description: 'Canais, Filmes e Series e Novelas + Canais Adultos',
        devices: 4
      }
    ];
  }

  /**
   * Processa mensagem recebida
   * @param {Object} message - Objeto da mensagem do WhatsApp
   * @param {Object} client - Cliente do WhatsApp
   */
  async handleMessage(message, client) {
    try {
      const userId = message.from;
      const messageText = message.body.trim();
      const lower = messageText.toLowerCase();
      
      console.log(`📩 Mensagem de ${userId}: ${messageText}`);

      // Ignora mensagens de grupos
      if (message.from.includes('@g.us')) {
        return;
      }

      // Atualiza timestamp da interação
      stateManager.touchState(userId);

      // Salva mensagem no histórico
      await this.saveMessage(userId, messageText, 'received');

      // Comandos globais de encerramento / reset
      if (['encerrar','finalizar','sair','resetar','recomeçar','recomecar','fim'].some(k => lower === k || lower.startsWith(k))) {
        await this.endSession(userId, client);
        return;
      }

      // Verifica se está em transferência humana
      if (stateManager.isInHumanTransfer(userId)) {
        await this.handleHumanTransfer(message, client);
        return;
      }

      // Obtém estado atual
      const state = stateManager.getState(userId);

      // Processa mensagem de acordo com o estado
      await this.processMessageByState(state, message, client);

    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      await this.sendErrorMessage(message.from, client);
    }
  }

  /**
   * Processa mensagem baseado no estado atual
   */
  async processMessageByState(state, message, client) {
    const userId = message.from;
    const messageText = message.body.trim().toLowerCase();

    switch (state.current) {
      case stateManager.constructor.STATES.INITIAL:
        await this.handleInitialContact(message, client);
        break;

      case stateManager.constructor.STATES.MENU:
        await this.handleMenuSelection(messageText, message, client);
        break;

      case stateManager.constructor.STATES.VIEWING_PLANS:
        await this.handlePlanSelection(messageText, message, client);
        break;

      case stateManager.constructor.STATES.REQUESTING_TEST:
        await this.handleTestRequest(message, client);
        break;

      case stateManager.constructor.STATES.COLLECTING_NAME:
        await this.handleNameCollection(messageText, message, client);
        break;

      case stateManager.constructor.STATES.SELECTING_PLAN:
        await this.handlePlanConfirmation(messageText, message, client);
        break;

      case stateManager.constructor.STATES.PAYMENT_INFO:
        await this.handlePaymentInfo(messageText, message, client);
        break;

      case stateManager.constructor.STATES.SUPPORT:
        await this.handleSupport(messageText, message, client);
        break;

      case stateManager.constructor.STATES.FEEDBACK:
        await this.handleFeedback(messageText, message, client);
        break;

      default:
        await this.handleInitialContact(message, client);
    }
  }

  /**
   * Lida com contato inicial
   */
  async handleInitialContact(message, client) {
    const userId = message.from;
    const greeting = getGreeting();

    // Menu textual otimizado
    const welcomeText = `${greeting} Seja muito bem-vindo(a) à *${this.COMPANY_NAME}*! 😊\n\n` +
      `Eu sou a *${this.BOT_NAME}* e vou te ajudar por aqui. 📺✨\n` +
      `Temos milhares de canais, filmes e séries em alta qualidade.\n\n` +
      `Escolha uma opção digitando o número:\n\n` +
      `1) 📋 Conhecer nossos planos\n` +
      `2) 🎁 Teste grátis (4h)\n` +
      `3) 💰 Preços e formas de pagamento\n` +
      `4) 👤 Falar com atendente humano\n` +
      `5) ❓ Suporte e dúvidas\n` +
      `6) 🔚 Encerrar atendimento\n\n` +
      `_Dica: você também pode digitar palavras como "planos", "teste", "preços", "atendente", "suporte" ou "encerrar"._`;

    await this.sendMessage(userId, welcomeText, client);

    stateManager.setState(userId, stateManager.constructor.STATES.MENU);
  }

  /**
   * Lida com seleção do menu
   */
  async handleMenuSelection(messageText, message, client) {
    const userId = message.from;

    // Palavras-chave para detecção de intenção
    const intentions = {
      test: ['teste', 'test', 'gratis', 'grátis', 'gratuito', 'trial', 'demo', '2'],
      plans: ['plano', 'plan', 'pacote', 'assinar', '1', '3'],
      support: ['ajuda', 'suporte', 'duvida', 'dúvida', 'problema', '5'],
      human: ['humano', 'atendente', 'pessoa', 'operador', '4']
    };

    // Suporte a comando direto de encerrar
    if (['encerrar','finalizar','sair','fim'].some(k => messageText.startsWith(k))) {
      return await this.endSession(userId, client);
    }

    if (messageText.match(/^[1-6]$/)) {
      switch (messageText) {
        case '1':
        case '3':
          await this.showPlans(message, client);
          break;
        case '2':
          await this.startTestRequest(message, client);
          break;
        case '4':
          await this.transferToHuman(message, client);
          break;
        case '5':
          await this.showSupport(message, client);
          break;
        case '6':
          await this.endSession(userId, client);
          break;
      }
    } else if (intentions.test.some(word => messageText.includes(word))) {
      await this.startTestRequest(message, client);
    } else if (intentions.plans.some(word => messageText.includes(word))) {
      await this.showPlans(message, client);
    } else if (intentions.human.some(word => messageText.includes(word))) {
      await this.transferToHuman(message, client);
    } else if (intentions.support.some(word => messageText.includes(word))) {
      await this.showSupport(message, client);
    } else if (['encerrar','finalizar','sair','fim'].some(k => messageText.includes(k))) {
      await this.endSession(userId, client);
    } else {
      await this.handleUnknownInput(message, client);
    }
  }

  /**
   * Mostra os planos disponíveis
   */
  async showPlans(message, client) {
    const userId = message.from;

    let plansMessage = `📺 *Nossos Planos IPTV* 📺\n\n`;
    plansMessage += `Escolha o plano perfeito para você:\n`;
    plansMessage += `━━━━━━━━━━━━━━━━━━━\n\n`;

    this.plans.forEach((plan, index) => {
      plansMessage += `*${index + 1}. ${plan.name}* ${plan.recommended ? '⭐ _POPULAR_' : ''}\n`;
      plansMessage += `💰 R$ ${plan.price.toFixed(2)}/mês\n`;
      plansMessage += `📺 ${plan.channels.toLocaleString()} canais\n`;
      plansMessage += `🎬 Qualidade ${plan.quality}\n`;
      if (plan.devices) {
        plansMessage += `📱 ${plan.devices} dispositivos simultâneos\n`;
      }
      plansMessage += `📝 ${plan.description}\n\n`;
    });

    plansMessage += `━━━━━━━━━━━━━━━━━━━\n\n`;
    plansMessage += `✨ *TODOS OS PLANOS INCLUEM:*\n`;
    plansMessage += `✅ Filmes e Séries On Demand\n`;
    plansMessage += `✅ Canais HD/Full HD/4K\n`;
    plansMessage += `✅ Estabilidade garantida\n`;
    plansMessage += `✅ Suporte 24h\n`;
    plansMessage += `✅ Atualização automática\n\n`;
    plansMessage += `_Digite o número do plano que te interessou ou "teste" para experimentar grátis!_ 😊`;

    await this.sendMessage(userId, plansMessage, client);
    stateManager.setState(userId, stateManager.constructor.STATES.VIEWING_PLANS);
  }

  /**
   * Lida com seleção de plano
   */
  async handlePlanSelection(messageText, message, client) {
    const userId = message.from;
    const planNumber = parseInt(messageText);

    if (messageText.includes('teste') || messageText.includes('test')) {
      await this.startTestRequest(message, client);
      return;
    }

    if (planNumber >= 1 && planNumber <= this.plans.length) {
      const selectedPlan = this.plans[planNumber - 1];
      
      stateManager.updateStateData(userId, { selectedPlan });

      const confirmMessage = `Ótima escolha! 🎉\n\n` +
        `Você selecionou o *${selectedPlan.name}*\n` +
        `💰 R$ ${selectedPlan.price.toFixed(2)}/mês\n\n` +
        `Quer prosseguir com a compra? 😊\n\n` +
        `Digite:\n` +
        `✅ *SIM* - Para continuar\n` +
        `🎁 *TESTE* - Para fazer teste grátis antes\n` +
        `🔙 *VOLTAR* - Ver outros planos`;

      await this.sendMessage(userId, confirmMessage, client);
      stateManager.setState(userId, stateManager.constructor.STATES.SELECTING_PLAN);
    } else {
      await this.sendMessage(userId, 
        `Hmm, não entendi... 🤔\n\nPor favor, digite o *número* do plano (1 a ${this.plans.length}) ou digite *"teste"* para experimentar grátis!`, 
        client
      );
    }
  }

  /**
   * Inicia processo de requisição de teste
   */
  async startTestRequest(message, client) {
    const userId = message.from;

    const testMessage = `🎁 *Teste Gratuito - 4 Horas!* 🎁\n\n` +
      `Que ótimo que você quer experimentar! 😊\n\n` +
      `Nosso teste inclui:\n` +
      `✅ Acesso completo por 4h\n` +
      `✅ Todos os canais liberados\n` +
      `✅ Filmes e séries à vontade\n` +
      `✅ Qualidade Full HD\n\n` +
      `Para gerar seu teste, preciso saber:\n\n` +
      `*Qual é o seu nome?* 😊`;

    await this.sendMessage(userId, testMessage, client);
    stateManager.setState(userId, stateManager.constructor.STATES.COLLECTING_NAME);
  }

  /**
   * Coleta nome do cliente
   */
  async handleNameCollection(messageText, message, client) {
    const userId = message.from;
    const name = messageText;

    if (name.length < 2 || name.length > 50) {
      await this.sendMessage(userId, 
        `Por favor, me informe seu nome completo 😊`, 
        client
      );
      return;
    }

    stateManager.updateStateData(userId, { clientName: name });

    await this.sendMessage(userId,
      `Prazer em te conhecer, ${name}! 🤗\n\n` +
      `Aguarde um momento que vou gerar seu teste...`,
      client
    );

    // Removido delay artificial para tornar a resposta mais rápida

    await this.generateAndSendTest(userId, name, client);
  }

  /**
   * Gera e envia conta de teste
   */
  async generateAndSendTest(userId, name, client) {
    try {
      const testData = await testGenerator.generateTestAccount(userId, name);
      const instructions = testGenerator.formatAccessInstructions(testData);

      await this.sendMessage(userId, instructions, client);

      // Agenda follow-up
      const test = await testGenerator.getActiveTest(userId);
      if (test) {
        await testGenerator.scheduleFollowUp(test._id);
      }

      // Envia mensagem adicional
      // Próximos passos (texto)
      await this.sendMessage(userId,
        `Tudo certo com seu acesso?\n\n` +
        `- Digite *planos* para ver opções de assinatura\n` +
        `- Digite *suporte* para ajuda\n` +
        `- Digite *menu* para voltar ao início\n` +
        `- Digite *encerrar* para finalizar o atendimento`,
        client
      );

      stateManager.setState(userId, stateManager.constructor.STATES.FEEDBACK, { expectingSuggestion: false });

    } catch (error) {
      if (error.message === 'CLIENT_ALREADY_TESTED') {
        await this.sendMessage(userId,
          `Ops! Você já utilizou seu teste gratuito! 😅\n\n` +
          `Mas tenho uma ótima notícia! Nossos planos começam em apenas *R$ 19,90/mês*! 🎉\n\n` +
          `Quer conhecer? Digite *"planos"*! 😊`,
          client
        );
      } else if (error.message === 'ACTIVE_TEST_EXISTS') {
        const activeTest = await testGenerator.getActiveTest(userId);
        const statusMessage = testGenerator.formatTestStatus(activeTest);
        await this.sendMessage(userId, statusMessage, client);
      } else {
        throw error;
      }
      
      stateManager.setState(userId, stateManager.constructor.STATES.MENU);
    }
  }

  /**
   * Lida com confirmação de plano
   */
  async handlePlanConfirmation(messageText, message, client) {
    const userId = message.from;

    if (messageText.includes('sim') || messageText.includes('s')) {
      await this.startPaymentProcess(message, client);
    } else if (messageText.includes('teste') || messageText.includes('test')) {
      await this.startTestRequest(message, client);
    } else if (messageText.includes('voltar') || messageText.includes('nao') || messageText.includes('não')) {
      await this.showPlans(message, client);
    } else {
      await this.sendMessage(userId,
        `Por favor, responda:\n✅ *SIM* para continuar\n🎁 *TESTE* para testar antes\n🔙 *VOLTAR* para ver outros planos`,
        client
      );
    }
  }

  /**
   * Inicia processo de pagamento
   */
  async startPaymentProcess(message, client) {
    const userId = message.from;
    const selectedPlan = stateManager.getStateData(userId, 'selectedPlan');

    if (!selectedPlan) {
      await this.showPlans(message, client);
      return;
    }

    const paymentMessage = await paymentService.generatePaymentMessage(selectedPlan, userId);
    await this.sendMessage(userId, paymentMessage, client);
    
    stateManager.setState(userId, stateManager.constructor.STATES.PAYMENT_INFO);
  }

  /**
   * Lida com informações de pagamento
   */
  async handlePaymentInfo(messageText, message, client) {
    const userId = message.from;

    if (messageText.includes('pix')) {
      await paymentService.sendPixInstructions(userId, client, this);
    } else if (messageText.includes('boleto')) {
      await paymentService.sendBoletoInstructions(userId, client, this);
    } else if (messageText.includes('cartao') || messageText.includes('cartão')) {
      await paymentService.sendCardInstructions(userId, client, this);
    } else {
      await this.sendMessage(userId,
        `Por favor, escolha uma forma de pagamento:\n\n💳 PIX\n📄 Boleto\n💳 Cartão de Crédito`,
        client
      );
    }
  }

  /**
   * Mostra opções de suporte
   */
  async showSupport(message, client) {
    const userId = message.from;

    const supportMessage = `🆘 *Central de Ajuda* 🆘\n\n` +
      `Como posso te ajudar? 😊\n\n` +
      `*Escolha uma opção:*\n\n` +
      `1️⃣ Como instalar/configurar\n` +
      `2️⃣ Problemas de conexão\n` +
      `3️⃣ Qualidade de imagem\n` +
      `4️⃣ Alterar/cancelar plano\n` +
      `5️⃣ Falar com atendente\n\n` +
      `_Digite o número ou descreva seu problema_ 💬`;

    await this.sendMessage(userId, supportMessage, client);
    stateManager.setState(userId, stateManager.constructor.STATES.SUPPORT);
  }

  /**
   * Lida com suporte
   */
  async handleSupport(messageText, message, client) {
    const userId = message.from;

    const responses = {
      '1': `📱 *Como Instalar:*\n\n1. Baixe um app de IPTV (IPTV Smarters, GSE Smart IPTV)\n2. Abra e selecione "Xtream Codes"\n3. Insira seus dados de acesso\n4. Pronto! 🎉\n\nPrecisa de mais ajuda?`,
      '2': `🌐 *Problemas de Conexão:*\n\n✅ Verifique sua internet\n✅ Use WiFi (recomendado)\n✅ Reinicie o aplicativo\n✅ Teste em outro dispositivo\n\nAinda com problema? Fale com nosso suporte técnico! Digite "atendente"`,
      '3': `🎬 *Qualidade de Imagem:*\n\n✅ Use internet mínima de 10MB\n✅ Conecte em WiFi\n✅ Feche outros apps\n✅ Limpe o cache do app\n\nNossos canais são HD/4K! Qualquer dúvida, digite "atendente"`,
      '4': `⚙️ *Alterar/Cancelar:*\n\nPara alterações no plano, preciso te conectar com nossa equipe!\n\nDigite "atendente" para falar com um humano! 😊`,
      '5': await this.transferToHuman(message, client)
    };

    const response = responses[messageText] || 
      `Entendi! Para melhor te atender, vou te transferir para um atendente humano! 😊\n\nDigite "atendente" para continuar.`;

    await this.sendMessage(userId, response, client);
  }

  /**
   * Transfer to human attendant
   */
  async transferToHuman(message, client) {
    const userId = message.from;

    await this.sendMessage(userId,
      `Claro! Vou te conectar com um atendente humano! 👤\n\n` +
      `Aguarde um momento, em breve alguém da nossa equipe irá te atender! ⏳\n\n` +
      `_Horário de atendimento: 8h às 18h_ 🕐`,
      client
    );

    stateManager.setState(userId, stateManager.constructor.STATES.HUMAN_TRANSFER);

    // Aqui você pode implementar notificação para atendentes
    console.log(`🔔 Cliente ${userId} solicitou atendimento humano`);
  }

  /**
   * Lida com atendimento humano
   */
  async handleHumanTransfer(message, client) {
    // Apenas registra, aguarda atendente assumir
    await this.saveMessage(message.from, message.body, 'received');
  }

  /**
   * Lida com feedback
   */
  async handleFeedback(messageText, message, client) {
    const userId = message.from;
    const expectingSuggestion = stateManager.getStateData(userId, 'expectingSuggestion');

    // Palavras-chave úteis nesta fase
    if (messageText.includes('plan')) {
      return await this.showPlans(message, client);
    }
    if (messageText.includes('suporte') || messageText.includes('ajuda')) {
      return await this.showSupport(message, client);
    }
    if (['encerrar','finalizar','sair','fim'].some(k => messageText.includes(k))) {
      return await this.endSession(userId, client);
    }

    // Fluxo de coleta de sugestão (sim/não futuramente)
    if (!expectingSuggestion && (messageText.includes('sugest') || messageText.includes('ideia') )) {
      stateManager.updateStateData(userId, { expectingSuggestion: true });
      await this.sendMessage(userId, 'Claro! Pode me enviar sua sugestão. 😊', client);
      return;
    }

    if (expectingSuggestion) {
      await this.saveMessage(userId, `SUGESTAO: ${messageText}`, 'received');
      await this.sendMessage(userId, 'Obrigado pela sugestão! Isso nos ajuda a melhorar. 🙏 Digite *menu* para voltar.', client);
      stateManager.setState(userId, stateManager.constructor.STATES.MENU);
      return;
    }

    // Caso texto livre pós teste
    if (messageText === 'menu') {
      return await this.handleInitialContact(message, client);
    }

    await this.sendMessage(userId, 'Dica: digite *planos*, *suporte*, *menu* ou *encerrar* a qualquer momento. 😉', client);
  }

  /**
   * Lida com input desconhecido
   */
  async handleUnknownInput(message, client) {
    const userId = message.from;

    await this.sendMessage(userId,
      `Desculpe, não entendi muito bem... 🤔\n\n` +
      `Tente usar o menu de opções ou me conte o que você precisa de forma diferente! 😊\n\n` +
      `Digite *"menu"* para ver as opções novamente! 📋`,
      client
    );
  }

  /**
   * Envia mensagem de erro
   */
  async sendErrorMessage(userId, client) {
    await this.sendMessage(userId,
      `Ops! Tivemos um probleminha técnico aqui... 😅\n\n` +
      `Mas não se preocupe! Já estou funcionando novamente!\n\n` +
      `Por favor, tente novamente ou digite *"atendente"* para falar com um humano! 😊`,
      client
    );
  }

  /**
   * Envia mensagem
   */
  async sendMessage(userId, text, client) {
    try {
      await client.sendMessage(userId, text);
      await this.saveMessage(userId, text, 'sent');
      console.log(`📤 Enviado para ${userId}`);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
    }
  }

  // (botões removidos para compatibilidade do WhatsApp Web)

  /**
   * Encerra atendimento e reseta estado
   */
  async endSession(userId, client) {
    await this.sendMessage(userId,
      '✅ Atendimento encerrado!\n\nObrigado por conversar com a *' + this.COMPANY_NAME + '*! 😊\n' +
      'Para começar de novo, envie: *oi* ou *menu*. 👋',
      client
    );
    stateManager.resetState(userId);
  }

  /**
   * Salva mensagem no histórico do cliente
   */
  async saveMessage(userId, messageText, type) {
    try {
      // Tenta salvar no MongoDB
      try {
        let client = await Client.findOne({ phone: userId });
        
        if (!client) {
          return;
        }

        client.addConversation(messageText, type);
        await client.save();
      } catch (error) {
        // Se MongoDB não estiver disponível, ignora (modo memória)
        // Os dados de estado já estão sendo gerenciados pelo stateManager
      }
    } catch (error) {
      // Ignora erros de salvamento (modo sem banco)
    }
  }
}

module.exports = new MessageHandler();
