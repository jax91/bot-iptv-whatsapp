/**
 * Configuração do WhatsApp Web Client
 * Gerencia a inicialização, autenticação e eventos do WhatsApp
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const server = require('../server');

class WhatsAppConfig {
  constructor() {
    this.client = null;
    this.isReady = false;
  }

  /**
   * Inicializa o cliente do WhatsApp
   * @returns {Promise<Client>} Cliente inicializado
   */
  async initialize() {
    try {
      console.log('🚀 Inicializando WhatsApp Bot...');

      // Configuração do cliente com autenticação local
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'bot-iptv',
          dataPath: './whatsapp-session'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      });

      // Evento: Geração do QR Code
      this.client.on('qr', (qr) => {
        console.log('📱 QR Code gerado! Escaneie com seu WhatsApp:');
        qrcode.generate(qr, { small: true });
        console.log('\n⏳ Aguardando leitura do QR Code...');
        
        // Disponibiliza QR Code no servidor HTTP
        server.setQRCode(qr);
      });

      // Evento: Autenticação bem-sucedida
      this.client.on('authenticated', () => {
        console.log('✅ Autenticação realizada com sucesso!');
        server.setAuthenticated();
      });

      // Evento: Cliente pronto para uso
      this.client.on('ready', () => {
        this.isReady = true;
        console.log('✅ Bot IPTV WhatsApp está ONLINE!');
        console.log('📞 Pronto para receber mensagens!');
        console.log('⏰ Iniciado em:', new Date().toLocaleString('pt-BR'));
        server.setStatus('WhatsApp Online e Funcionando!');
      });

      // Evento: Falha na autenticação
      this.client.on('auth_failure', (msg) => {
        console.error('❌ Falha na autenticação:', msg);
        console.log('💡 Dica: Delete a pasta whatsapp-session e tente novamente');
      });

      // Evento: Desconexão
      this.client.on('disconnected', (reason) => {
        console.log('⚠️  Bot desconectado:', reason);
        this.isReady = false;
      });

      // Evento: Erro
      this.client.on('error', (error) => {
        console.error('❌ Erro no cliente WhatsApp:', error);
      });

      // Inicializa o cliente
      await this.client.initialize();

      return this.client;

    } catch (error) {
      console.error('❌ Erro ao inicializar WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Retorna o cliente do WhatsApp
   * @returns {Client} Cliente do WhatsApp
   */
  getClient() {
    if (!this.client) {
      throw new Error('Cliente do WhatsApp não foi inicializado');
    }
    return this.client;
  }

  /**
   * Verifica se o bot está pronto
   * @returns {boolean} Status de prontidão
   */
  isClientReady() {
    return this.isReady;
  }

  /**
   * Destrói a sessão do cliente
   */
  async destroy() {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
      console.log('🔴 Cliente WhatsApp encerrado');
    }
  }
}

module.exports = new WhatsAppConfig();
