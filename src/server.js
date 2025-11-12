/**
 * Servidor HTTP para exibir QR Code e status do bot
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let qrCodeData = null;
let botStatus = 'Inicializando...';
let isAuthenticated = false;

// Middleware para servir arquivos estáticos
app.use(express.json());

// Página principal com QR Code
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bot IPTV WhatsApp - QR Code</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        
        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          padding: 40px;
          max-width: 600px;
          width: 100%;
          text-align: center;
        }
        
        h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 28px;
        }
        
        .subtitle {
          color: #666;
          margin-bottom: 30px;
          font-size: 16px;
        }
        
        .status {
          padding: 15px 25px;
          border-radius: 10px;
          margin-bottom: 30px;
          font-weight: bold;
          font-size: 16px;
        }
        
        .status.loading {
          background: #fef3c7;
          color: #92400e;
        }
        
        .status.ready {
          background: #dcfce7;
          color: #166534;
        }
        
        .status.connected {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .qr-container {
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 15px;
          padding: 30px;
          margin: 20px 0;
        }
        
        #qrcode {
          margin: 0 auto;
          max-width: 300px;
        }
        
        .qr-placeholder {
          color: #9ca3af;
          font-size: 14px;
          padding: 60px 20px;
        }
        
        .instructions {
          background: #f3f4f6;
          border-radius: 10px;
          padding: 20px;
          margin-top: 20px;
          text-align: left;
        }
        
        .instructions h3 {
          color: #374151;
          margin-bottom: 15px;
          font-size: 18px;
        }
        
        .instructions ol {
          color: #6b7280;
          padding-left: 20px;
        }
        
        .instructions li {
          margin-bottom: 8px;
          line-height: 1.6;
        }
        
        .refresh-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 20px;
          transition: background 0.3s;
        }
        
        .refresh-btn:hover {
          background: #5568d3;
        }
        
        .footer {
          margin-top: 30px;
          color: #9ca3af;
          font-size: 14px;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .loading-animation {
          animation: pulse 2s infinite;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 Bot IPTV WhatsApp</h1>
        <p class="subtitle">Sistema de Atendimento Automatizado</p>
        
        <div id="statusContainer"></div>
        
        <div class="qr-container">
          <div id="qrcode"></div>
        </div>
        
        <button class="refresh-btn" onclick="checkStatus()">🔄 Atualizar Status</button>
        
        <div class="instructions">
          <h3>📱 Como Conectar:</h3>
          <ol>
            <li>Abra o <strong>WhatsApp</strong> no seu celular</li>
            <li>Toque em <strong>Menu</strong> ou <strong>Configurações</strong></li>
            <li>Selecione <strong>Aparelhos conectados</strong></li>
            <li>Toque em <strong>Conectar um aparelho</strong></li>
            <li><strong>Escaneie o QR Code</strong> acima</li>
          </ol>
        </div>
        
        <div class="footer">
          Bot versão 1.0.0 | Atualizado automaticamente
        </div>
      </div>
      
      <!-- QRCode generator library (browser) -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" integrity="sha512-MG3P8HqDGSGIN1qg61NBf0zspSLVqLZx1r7+EwC+7zR7V4gk4Rw0CqFq7Pp4LwTgqM0u5PmCrcsS+3Z2C+9zIA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>

      <script>
        async function checkStatus() {
          try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            updateStatus(data);
            updateQRCode(data);
          } catch (error) {
            console.error('Erro ao verificar status:', error);
          }
        }
        
        function updateStatus(data) {
          const container = document.getElementById('statusContainer');
          
          let statusClass = 'loading';
          let statusText = data.status;
          let statusIcon = '⏳';
          
          if (data.authenticated) {
            statusClass = 'connected';
            statusText = '✅ WhatsApp Conectado!';
            statusIcon = '✅';
          } else if (data.qrCode) {
            statusClass = 'ready';
            statusText = '📱 Aguardando leitura do QR Code';
            statusIcon = '📱';
          }
          
          container.innerHTML = \`
            <div class="status \${statusClass}">
              \${statusIcon} \${statusText}
            </div>
          \`;
        }
        
        function updateQRCode(data) {
          const qrContainer = document.getElementById('qrcode');

          // Limpa conteúdo anterior
          qrContainer.innerHTML = '';

          if (data.authenticated) {
            qrContainer.innerHTML = \`
              <div style=\"color: #10b981; font-size: 48px; margin: 20px 0;\">
                ✅
              </div>
              <div style=\"color: #059669; font-weight: bold; font-size: 18px;\">
                WhatsApp Conectado com Sucesso!
              </div>
              <div style=\"color: #6b7280; margin-top: 10px;\">
                O bot está online e pronto para receber mensagens
              </div>
            \`;
            return;
          }

          if (data.qrCode) {
            // Gera QR Code visual no navegador
            try {
              new QRCode(qrContainer, {
                text: data.qrCode,
                width: 280,
                height: 280,
                correctLevel: QRCode.CorrectLevel.M
              });
            } catch (e) {
              // Fallback simples
              qrContainer.innerHTML = \`<pre style=\"font-size: 3px; line-height: 3px; font-family: monospace;\">\${data.qrCode}</pre>\`;
            }
            return;
          }

          // Estado de carregamento
          qrContainer.innerHTML = \`
            <div class=\"qr-placeholder loading-animation\">
              <div style=\"font-size: 48px; margin-bottom: 10px;\">⌛</div>
              <div>Gerando QR Code...</div>
              <div style=\"font-size: 12px; margin-top: 10px;\">Aguarde alguns instantes</div>
            </div>
          \`;
        }
        
        // Atualiza a cada 3 segundos
        setInterval(checkStatus, 3000);
        
        // Primeira verificação
        checkStatus();
      </script>
    </body>
    </html>
  `);
});

// API endpoint para status
app.get('/api/status', (req, res) => {
  res.json({
    status: botStatus,
    qrCode: qrCodeData,
    authenticated: isAuthenticated,
    timestamp: new Date().toISOString()
  });
});

// Health check para Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(),
    authenticated: isAuthenticated
  });
});

// Funções para atualizar dados
function setQRCode(qr) {
  qrCodeData = qr;
  botStatus = 'Aguardando leitura do QR Code';
  console.log('📱 QR Code disponível em: http://localhost:' + PORT);
}

function setAuthenticated() {
  isAuthenticated = true;
  qrCodeData = null;
  botStatus = 'WhatsApp Conectado!';
  console.log('✅ Bot autenticado com sucesso!');
}

function setStatus(status) {
  botStatus = status;
}

// Inicia servidor
function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════╗');
      console.log('║     🌐 SERVIDOR HTTP INICIADO         ║');
      console.log('╚════════════════════════════════════════╝');
      console.log('');
      console.log(`🔗 Acesse: http://localhost:${PORT}`);
      console.log(`🔗 Health: http://localhost:${PORT}/health`);
      console.log('');
      resolve(server);
    });
  });
}

module.exports = {
  startServer,
  setQRCode,
  setAuthenticated,
  setStatus,
  app
};
