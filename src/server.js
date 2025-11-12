/**
 * Servidor HTTP para exibir QR Code e status do bot
 */

const express = require('express');
const QRCodeLib = require('qrcode');
const app = express();
const PORT = process.env.PORT || 3000;

let qrCodeText = null; // conteúdo bruto do QR para gerar PNG
let botStatus = 'Inicializando...';
let isAuthenticated = false;

app.use(express.json());

// Página principal com QR Code
app.get('/', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bot IPTV WhatsApp - QR</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; background: #0b1220; color: #e5e7eb; margin: 0; padding: 0; }
      .container { max-width: 720px; margin: 40px auto; padding: 24px; background: #101827; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 1px solid #1f2937; }
      h1 { margin: 0 0 8px 0; font-size: 24px; }
      .subtitle { color: #9ca3af; margin-bottom: 20px; }
      .status { padding: 12px 14px; border-radius: 8px; margin-bottom: 16px; display: inline-block; }
      .status.connected { background: #065f46; color: #ecfdf5; }
      .status.ready { background: #1f2937; color: #93c5fd; }
      .status.loading { background: #1f2937; color: #9ca3af; }
      .qr-container { display: flex; justify-content: center; align-items: center; padding: 16px; background: #0b1220; border: 1px dashed #334155; border-radius: 8px; min-height: 320px; }
      .qr-placeholder { color: #9ca3af; text-align: center; }
      .refresh-btn { margin-top: 14px; background: #374151; color: #e5e7eb; padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; }
      .refresh-btn:hover { background: #4b5563; }
      .instructions { margin-top: 18px; color: #9ca3af; }
      .instructions h3 { margin: 0 0 8px 0; color: #e5e7eb; }
      .instructions ol { margin: 0; padding-left: 18px; }
      .instructions li { margin: 6px 0; }
      .footer { margin-top: 22px; font-size: 12px; color: #6b7280; text-align: center; }
      @keyframes pulse { 0% { opacity: .5 } 50% { opacity: 1 } 100% { opacity: .5 } }
      .loading-animation { animation: pulse 1.6s ease-in-out infinite; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🤖 Bot IPTV WhatsApp</h1>
      <p class="subtitle">Sistema de Atendimento Automatizado</p>
      <div id="statusContainer"></div>
      <div class="qr-container">
        <div id="qrcode">
          <img id="qrimg" alt="QR Code" style="display:none;width:280px;height:280px;" />
        </div>
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
      <div class="footer">Bot versão 1.0.0 | Atualizado automaticamente</div>
    </div>
    <script>
      function updateStatus(data) {
        const container = document.getElementById('statusContainer');
        let statusClass = 'loading';
        let statusText = data.status;
        let statusIcon = '⏳';
        if (data.authenticated) { statusClass = 'connected'; statusText = '✅ WhatsApp Conectado!'; statusIcon = '✅'; }
        else if (data.qrCode) { statusClass = 'ready'; statusText = '📱 Aguardando leitura do QR Code'; statusIcon = '📱'; }
        container.innerHTML = '<div class="status ' + statusClass + '">' + statusIcon + ' ' + statusText + '</div>';
      }
      function updateQRCode(data) {
        const qrImg = document.getElementById('qrimg');
        const qrContainer = document.getElementById('qrcode');
        if (data.authenticated) {
          qrImg.style.display = 'none';
          qrContainer.innerHTML = '<div style="color:#10b981;font-size:48px;margin:20px 0;">✅</div>' +
            '<div style="color:#059669;font-weight:bold;font-size:18px;">WhatsApp Conectado com Sucesso!</div>' +
            '<div style="color:#6b7280;margin-top:10px;">O bot está online e pronto para receber mensagens</div>';
          return;
        }
        if (data.qrCode) {
          qrContainer.innerHTML = '';
          qrImg.style.display = 'block';
          qrImg.src = '/api/qr.png?ts=' + Date.now();
          return;
        }
        qrImg.style.display = 'none';
        qrContainer.innerHTML = '<div class="qr-placeholder loading-animation">' +
          '<div style="font-size:48px;margin-bottom:10px;">⌛</div>' +
          '<div>Gerando QR Code...</div>' +
          '<div style="font-size:12px;margin-top:10px;">Aguarde alguns instantes</div>' +
          '</div>';
      }
      async function checkStatus() {
        try {
          const response = await fetch('/api/status');
          const data = await response.json();
          updateStatus(data);
          updateQRCode(data);
        } catch (e) { console.error('Erro ao verificar status', e); }
      }
      setInterval(checkStatus, 3000);
      checkStatus();
    </script>
  </body>
  </html>`);
});

// API endpoint para status
app.get('/api/status', (req, res) => {
  res.json({
    status: botStatus,
    qrCode: Boolean(qrCodeText),
    authenticated: isAuthenticated,
    timestamp: new Date().toISOString()
  });
});

// Endpoint para PNG do QR Code
app.get('/api/qr.png', async (req, res) => {
  try {
    if (!qrCodeText) {
      return res.status(404).send('QR indisponível');
    }
    const buffer = await QRCodeLib.toBuffer(qrCodeText, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 280,
      margin: 1
    });
    res.set('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    console.error('Erro ao gerar PNG do QR:', err);
    res.status(500).send('Erro ao gerar QR');
  }
});

// Health check para Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), authenticated: isAuthenticated });
});

// Funções para atualizar dados
function setQRCode(qr) {
  qrCodeText = qr;
  botStatus = 'Aguardando leitura do QR Code';
  console.log('📱 QR Code disponível em: http://localhost:' + PORT);
}

function setAuthenticated() {
  isAuthenticated = true;
  qrCodeText = null;
  botStatus = 'WhatsApp Conectado!';
  console.log('✅ Bot autenticado com sucesso!');
}

function setStatus(status) { botStatus = status; }

// Inicia servidor
function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════╗');
      console.log('║     🌐 SERVIDOR HTTP INICIADO         ║');
      console.log('╚════════════════════════════════════════╝');
      console.log('');
      console.log('🔗 Acesse: http://localhost:' + PORT);
      console.log('🔗 Health: http://localhost:' + PORT + '/health');
      console.log('');
      resolve(server);
    });
  });
}

module.exports = { startServer, setQRCode, setAuthenticated, setStatus, app };
