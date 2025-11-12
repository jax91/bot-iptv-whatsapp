/**
 * Payment Service - Serviço de Pagamentos
 * Gerencia processos de pagamento PIX, Boleto e Cartão
 */

const Client = require('../models/Client');

class PaymentService {
  constructor() {
    this.pixKey = process.env.PIX_KEY || '00000000000'; // Configure sua chave PIX
    this.merchantName = process.env.MERCHANT_NAME || 'IPTV Premium';
  }

  /**
   * Gera mensagem de opções de pagamento
   * @param {Object} plan - Plano selecionado
   * @param {string} userId - ID do usuário
   * @returns {string} Mensagem formatada
   */
  async generatePaymentMessage(plan, userId) {
    return `💳 *Formas de Pagamento* 💳\n\n` +
      `Plano: *${plan.name}*\n` +
      `Valor: *R$ ${plan.price.toFixed(2)}*\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `Escolha como deseja pagar:\n\n` +
      `1️⃣ *PIX* (Aprovação instantânea) ⚡\n` +
      `   _Desconto de 5%: R$ ${(plan.price * 0.95).toFixed(2)}_\n\n` +
      `2️⃣ *Boleto Bancário*\n` +
      `   _Aprovação em até 2 dias úteis_\n\n` +
      `3️⃣ *Cartão de Crédito*\n` +
      `   _Aprovação instantânea_\n` +
      `   _Parcelamento em até 3x sem juros_\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `Digite a opção desejada (1, 2 ou 3) 😊`;
  }

  /**
   * Envia instruções de pagamento PIX
   * @param {string} userId - ID do usuário
   * @param {Object} client - Cliente WhatsApp
   * @param {Object} messageHandler - Handler de mensagens
   */
  async sendPixInstructions(userId, client, messageHandler) {
    const userClient = await Client.findOne({ phone: userId });
    const selectedPlan = messageHandler.constructor.prototype.plans.find(
      p => p.id === userClient?.plan?.id
    ) || { price: 29.90, name: 'Plano Padrão' };

    const discountedPrice = (selectedPlan.price * 0.95).toFixed(2);
    
    // Gera código PIX (simplificado - em produção use uma API de pagamento real)
    const pixCode = this.generatePixCode(selectedPlan, userId);

    const pixMessage = `🟢 *Pagamento via PIX* 🟢\n\n` +
      `Valor com desconto: *R$ ${discountedPrice}*\n` +
      `Economia de 5%! 🎉\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `*Como pagar:*\n\n` +
      `1️⃣ Abra o app do seu banco\n` +
      `2️⃣ Escolha PIX → Pix Copia e Cola\n` +
      `3️⃣ Cole o código abaixo:\n\n` +
      `\`\`\`${pixCode}\`\`\`\n\n` +
      `Ou use a chave PIX:\n` +
      `📱 *${this.pixKey}*\n` +
      `Nome: ${this.merchantName}\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `⚡ *Aprovação instantânea!*\n` +
      `Assim que o pagamento for confirmado, você receberá seus dados de acesso! 🎉\n\n` +
      `_Após pagar, envie o comprovante aqui!_ 📸`;

    await messageHandler.sendMessage(userId, pixMessage, client);

    // Salva informação de pagamento pendente
    if (userClient) {
      userClient.notes = `Aguardando pagamento PIX - R$ ${discountedPrice}`;
      await userClient.save();
    }
  }

  /**
   * Envia instruções de boleto
   * @param {string} userId - ID do usuário
   * @param {Object} client - Cliente WhatsApp
   * @param {Object} messageHandler - Handler de mensagens
   */
  async sendBoletoInstructions(userId, client, messageHandler) {
    const userClient = await Client.findOne({ phone: userId });
    const selectedPlan = { price: 29.90, name: 'Plano Padrão' }; // Simplificado

    const boletoCode = this.generateBoletoCode(userId);

    const boletoMessage = `📄 *Pagamento via Boleto* 📄\n\n` +
      `Valor: *R$ ${selectedPlan.price.toFixed(2)}*\n` +
      `Vencimento: 3 dias\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `*Código de barras:*\n` +
      `\`${boletoCode}\`\n\n` +
      `*Como pagar:*\n\n` +
      `1️⃣ Copie o código acima\n` +
      `2️⃣ Acesse seu internet banking\n` +
      `3️⃣ Cole o código de barras\n` +
      `4️⃣ Confirme o pagamento\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `⏰ *Aprovação:* até 2 dias úteis\n\n` +
      `Assim que compensar, você receberá seus dados! 😊\n\n` +
      `_Quer mais rapidez? Use PIX com 5% OFF!_ ⚡`;

    await messageHandler.sendMessage(userId, boletoMessage, client);
  }

  /**
   * Envia instruções de cartão
   * @param {string} userId - ID do usuário
   * @param {Object} client - Cliente WhatsApp
   * @param {Object} messageHandler - Handler de mensagens
   */
  async sendCardInstructions(userId, client, messageHandler) {
    const selectedPlan = { price: 29.90, name: 'Plano Padrão' };

    const cardMessage = `💳 *Pagamento via Cartão* 💳\n\n` +
      `Valor: *R$ ${selectedPlan.price.toFixed(2)}*\n\n` +
      `*Parcelamento disponível:*\n` +
      `1x de R$ ${selectedPlan.price.toFixed(2)} (sem juros)\n` +
      `2x de R$ ${(selectedPlan.price / 2).toFixed(2)} (sem juros)\n` +
      `3x de R$ ${(selectedPlan.price / 3).toFixed(2)} (sem juros)\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `Para finalizar o pagamento, vou te enviar um link seguro!\n\n` +
      `🔒 *Link de pagamento:*\n` +
      `https://pagamento.exemplo.com/checkout/${userId}\n\n` +
      `_Clique no link e preencha os dados do cartão_\n\n` +
      `✅ *100% seguro e criptografado*\n` +
      `⚡ *Aprovação instantânea*\n\n` +
      `Dúvidas? Estou aqui! 😊`;

    await messageHandler.sendMessage(userId, cardMessage, client);
  }

  /**
   * Gera código PIX (simulado)
   * @param {Object} plan - Plano
   * @param {string} userId - ID do usuário
   * @returns {string} Código PIX
   */
  generatePixCode(plan, userId) {
    // Em produção, use uma API real de pagamentos (PagSeguro, MercadoPago, etc)
    const amount = (plan.price * 0.95).toFixed(2);
    const timestamp = Date.now();
    return `00020126580014BR.GOV.BCB.PIX0136${this.pixKey}52040000530398654${amount.replace('.', '')}5802BR5913${this.merchantName}6009SAO PAULO62070503***6304${timestamp.toString().slice(-4)}`;
  }

  /**
   * Gera código de boleto (simulado)
   * @param {string} userId - ID do usuário
   * @returns {string} Código de barras
   */
  generateBoletoCode(userId) {
    // Em produção, use uma API real de boletos
    const timestamp = Date.now().toString();
    return `23793381260000${timestamp.slice(-8)}10459001234567890151234567890`;
  }

  /**
   * Processa confirmação de pagamento
   * @param {string} userId - ID do usuário
   * @param {Object} paymentData - Dados do pagamento
   */
  async processPayment(userId, paymentData) {
    try {
      const client = await Client.findOne({ phone: userId });
      
      if (!client) {
        throw new Error('Cliente não encontrado');
      }

      // Atualiza status do cliente
      client.status = 'ativo';
      
      // Define datas de assinatura
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      client.subscription = {
        startDate,
        endDate,
        paymentMethod: paymentData.method,
        lastPayment: startDate,
        nextPayment: endDate
      };

      await client.save();

      console.log(`✅ Pagamento processado para ${userId}`);
      
      return {
        success: true,
        subscription: client.subscription
      };

    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      throw error;
    }
  }

  /**
   * Gera credenciais de acesso após pagamento
   * @param {string} userId - ID do usuário
   * @returns {Object} Credenciais
   */
  async generateAccessCredentials(userId) {
    const client = await Client.findOne({ phone: userId });
    
    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    // Gera credenciais (em produção, integre com seu servidor IPTV)
    const username = `user_${Date.now().toString().slice(-6)}`;
    const password = this.generateRandomPassword();

    return {
      username,
      password,
      serverUrl: process.env.IPTV_SERVER_URL || 'http://seu-servidor.com',
      port: '8080',
      expiresAt: client.subscription.endDate
    };
  }

  /**
   * Gera senha aleatória
   * @returns {string}
   */
  generateRandomPassword() {
    return Math.random().toString(36).slice(-8);
  }

  /**
   * Formata mensagem de boas-vindas após pagamento
   * @param {Object} credentials - Credenciais de acesso
   * @param {Object} client - Cliente
   * @returns {string}
   */
  formatWelcomeMessage(credentials, client) {
    const expirationDate = new Date(credentials.expiresAt).toLocaleDateString('pt-BR');

    return `🎉 *PAGAMENTO CONFIRMADO!* 🎉\n\n` +
      `Bem-vindo(a) à família ${this.merchantName}, ${client.name}! 😊\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `📺 *SEUS DADOS DE ACESSO:*\n\n` +
      `👤 *Usuário:* \`${credentials.username}\`\n` +
      `🔑 *Senha:* \`${credentials.password}\`\n` +
      `🌐 *Servidor:* ${credentials.serverUrl}\n` +
      `🔌 *Porta:* ${credentials.port}\n\n` +
      `📅 *Válido até:* ${expirationDate}\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `📱 *COMO CONFIGURAR:*\n\n` +
      `1️⃣ Baixe IPTV Smarters Pro\n` +
      `2️⃣ Selecione "Xtream Codes API"\n` +
      `3️⃣ Preencha com os dados acima\n` +
      `4️⃣ Aproveite! 🎬\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `✨ *Dicas:*\n` +
      `• Use WiFi para melhor qualidade\n` +
      `• Recomendamos internet de 10MB+\n` +
      `• Suporte disponível 24h\n\n` +
      `Precisa de ajuda? Estou sempre aqui! 🤗\n\n` +
      `*Obrigado por escolher ${this.merchantName}!* 💙`;
  }
}

module.exports = new PaymentService();
