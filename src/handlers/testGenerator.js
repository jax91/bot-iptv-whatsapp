/**
 * Test Generator - Gerador de Contas de Teste IPTV
 * Cria e gerencia contas de teste com expiração automática
 */

const TestAccount = require('../models/TestAccount');
const Client = require('../models/Client');
const { generateRandomString } = require('../utils/helpers');

class TestGenerator {
  constructor() {
    // Duração padrão do teste (4 horas)
    this.TEST_DURATION_HOURS = 4;
    
    // Prefixo para usuários de teste
    this.USERNAME_PREFIX = 'test';
  }

  /**
   * Gera uma nova conta de teste para um cliente
   * @param {string} clientPhone - Telefone do cliente
   * @param {string} clientName - Nome do cliente
   * @returns {Promise<Object>} Dados da conta de teste criada
   */
  async generateTestAccount(clientPhone, clientName) {
    try {
      // Busca ou cria o cliente
      let client = await Client.findOne({ phone: clientPhone });
      
      if (!client) {
        client = new Client({
          name: clientName,
          phone: clientPhone,
          status: 'teste'
        });
        await client.save();
        console.log(`✅ Novo cliente criado: ${clientName}`);
      }

      // Verifica se o cliente já usou teste
      if (client.hasUsedTest) {
        throw new Error('CLIENT_ALREADY_TESTED');
      }

      // Verifica se já existe teste ativo
      const existingTest = await TestAccount.findOne({
        clientPhone: clientPhone,
        status: 'ativa'
      });

      if (existingTest) {
        throw new Error('ACTIVE_TEST_EXISTS');
      }

      // Gera credenciais únicas
      const username = await this.generateUniqueUsername();
      const password = this.generatePassword();

      // Calcula data de expiração
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TEST_DURATION_HOURS);

      // Cria a conta de teste
      const testAccount = new TestAccount({
        clientId: client._id,
        clientPhone: clientPhone,
        username,
        password,
        expiresAt,
        activatedAt: new Date()
      });

      await testAccount.save();

      // Atualiza o cliente
      client.hasUsedTest = true;
      client.testRequestDate = new Date();
      client.status = 'teste';
      await client.save();

      console.log(`🎁 Conta de teste gerada: ${username} para ${clientName}`);

      return {
        success: true,
        account: {
          username,
          password,
          serverUrl: testAccount.serverUrl,
          port: testAccount.port,
          expiresAt,
          duration: this.TEST_DURATION_HOURS
        },
        client: {
          name: client.name,
          phone: client.phone
        }
      };

    } catch (error) {
      console.error('❌ Erro ao gerar conta de teste:', error);
      throw error;
    }
  }

  /**
   * Gera um username único
   * @returns {Promise<string>} Username gerado
   */
  async generateUniqueUsername() {
    let username;
    let exists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (exists && attempts < maxAttempts) {
      // Gera username no formato: test_XXXXXX (6 caracteres aleatórios)
      const randomPart = generateRandomString(6, true);
      username = `${this.USERNAME_PREFIX}_${randomPart}`;

      // Verifica se já existe
      const existing = await TestAccount.findOne({ username });
      exists = !!existing;
      attempts++;
    }

    if (exists) {
      throw new Error('FAILED_TO_GENERATE_UNIQUE_USERNAME');
    }

    return username;
  }

  /**
   * Gera uma senha aleatória
   * @returns {string} Senha gerada
   */
  generatePassword() {
    return generateRandomString(8, true);
  }

  /**
   * Formata as instruções de acesso para envio ao cliente
   * @param {Object} accountData - Dados da conta
   * @returns {string} Mensagem formatada
   */
  formatAccessInstructions(accountData) {
    const { username, password, serverUrl, port, duration, expiresAt } = accountData.account;
    const clientName = accountData.client.name;

    const expirationDate = new Date(expiresAt).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `🎉 *Parabéns ${clientName}!*

Seu teste GRATUITO foi gerado com sucesso! ✅

📺 *DADOS DE ACESSO:*
━━━━━━━━━━━━━━━━━━━
👤 *Usuário:* \`${username}\`
🔑 *Senha:* \`${password}\`
🌐 *Servidor:* ${serverUrl}
🔌 *Porta:* ${port}
━━━━━━━━━━━━━━━━━━━

⏱️ *Validade:* ${duration}h
📅 *Expira em:* ${expirationDate}

📱 *COMO USAR:*

1️⃣ Baixe um aplicativo de IPTV:
   • IPTV Smarters Pro
   • GSE Smart IPTV
   • Smart IPTV

2️⃣ Abra o app e selecione "Login com Xtream Codes"

3️⃣ Preencha os dados:
   • Servidor/URL: ${serverUrl}
   • Porta: ${port}
   • Usuário: ${username}
   • Senha: ${password}

4️⃣ Clique em "Adicionar Usuário" e aproveite! 🎬

━━━━━━━━━━━━━━━━━━━

💡 *Dica:* Use uma boa conexão de internet (WiFi recomendado) para melhor qualidade!

❓ *Dúvidas?* É só me chamar! 😊

Aproveite seu teste e depois me conte o que achou! 🤗`;
  }

  /**
   * Busca conta de teste ativa de um cliente
   * @param {string} clientPhone - Telefone do cliente
   * @returns {Promise<Object|null>} Conta de teste ou null
   */
  async getActiveTest(clientPhone) {
    try {
      const test = await TestAccount.findOne({
        clientPhone,
        status: 'ativa'
      });

      if (!test) return null;

      // Verifica se expirou
      if (test.isExpired()) {
        test.status = 'expirada';
        await test.save();
        return null;
      }

      return test;
    } catch (error) {
      console.error('❌ Erro ao buscar teste ativo:', error);
      return null;
    }
  }

  /**
   * Formata mensagem de status do teste
   * @param {Object} test - Dados do teste
   * @returns {string} Mensagem formatada
   */
  formatTestStatus(test) {
    const timeRemaining = test.getTimeRemaining();

    if (timeRemaining.expired) {
      return `⏰ Seu teste expirou!

Mas não se preocupe! Temos ótimos planos para você continuar assistindo! 📺

Quer conhecer nossas opções? 😊`;
    }

    return `✅ *Seu teste está ATIVO!*

⏱️ Tempo restante: *${timeRemaining.hours}h ${timeRemaining.minutes}min*

👤 Usuário: \`${test.username}\`
🔑 Senha: \`${test.password}\`

Está gostando? Me conte sua experiência! 🤗`;
  }

  /**
   * Agenda follow-up após expiração do teste
   * @param {string} testId - ID da conta de teste
   */
  async scheduleFollowUp(testId) {
    try {
      const test = await TestAccount.findById(testId);
      if (!test) return;

      // Calcula horário do follow-up (2h após expiração)
      const followUpDate = new Date(test.expiresAt);
      followUpDate.setHours(followUpDate.getHours() + 2);

      test.followUpDate = followUpDate;
      await test.save();

      console.log(`📅 Follow-up agendado para ${test.clientPhone} em ${followUpDate}`);
    } catch (error) {
      console.error('❌ Erro ao agendar follow-up:', error);
    }
  }

  /**
   * Retorna mensagem de follow-up após teste
   * @param {string} clientName - Nome do cliente
   * @returns {string} Mensagem de follow-up
   */
  getFollowUpMessage(clientName) {
    return `Olá ${clientName}! 😊

Vi que seu teste expirou! Espero que tenha gostado da experiência! 🎬

Conseguiu assistir? O que achou da qualidade dos canais? 📺

Tenho ótimas novidades! Nossos planos começam a partir de *R$ 19,90/mês* com:

✅ Mais de 10.000 canais
✅ Qualidade HD/4K
✅ Filmes e séries on demand
✅ Suporte 24h
✅ Sem travamentos

Quer conhecer melhor? Posso te mostrar as opções! 🤗`;
  }
}

module.exports = new TestGenerator();
