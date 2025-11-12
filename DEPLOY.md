# 🚀 Deploy no Render.com

Este guia mostra como fazer deploy do bot IPTV WhatsApp no Render.com gratuitamente.

## 📋 Pré-requisitos

1. ✅ Conta no GitHub (já tem - repositório: jax91/bot-iptv-whatsapp)
2. ✅ Conta no MongoDB Atlas (cloud)
3. ⬜ Conta no Render.com (vamos criar)

---

## 🌐 Passo 1: Configurar MongoDB Atlas (Cloud)

O Render não inclui MongoDB, então você precisa usar o MongoDB Atlas (gratuito):

### 1.1 Criar conta no MongoDB Atlas
1. Acesse: https://www.mongodb.com/cloud/atlas/register
2. Crie uma conta gratuita
3. Escolha a opção **FREE** (M0 Sandbox)

### 1.2 Configurar acesso
1. Em **Database Access**, crie um usuário e senha
2. Em **Network Access**, clique em **Add IP Address**
3. Selecione **Allow Access from Anywhere** (0.0.0.0/0)

### 1.3 Obter string de conexão
1. Clique em **Connect** no seu cluster
2. Escolha **Connect your application**
3. Copie a string (algo como):
   ```
   mongodb+srv://usuario:senha@cluster.mongodb.net/bot-iptv?retryWrites=true&w=majority
   ```
4. **Guarde essa string**, você vai usar no Render!

---

## 🎨 Passo 2: Deploy no Render

### 2.1 Criar conta no Render
1. Acesse: https://render.com
2. Clique em **Get Started for Free**
3. Faça login com sua conta do GitHub

### 2.2 Criar novo Web Service
1. No dashboard, clique em **New +**
2. Selecione **Web Service**
3. Conecte seu repositório do GitHub
4. Procure por: **bot-iptv-whatsapp**
5. Clique em **Connect**

### 2.3 Configurar o serviço

Preencha os campos:

- **Name**: `bot-iptv-whatsapp` (ou qualquer nome)
- **Region**: `Oregon (US West)` (mais próximo)
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: **FREE**

### 2.4 Adicionar variáveis de ambiente

Clique em **Advanced** e adicione as seguintes variáveis:

| Key | Value | Exemplo |
|-----|-------|---------|
| `NODE_ENV` | `production` | production |
| `COMPANY_NAME` | Seu nome da empresa | IPTV Premium |
| `BOT_NAME` | Nome do bot | Ana |
| `MONGODB_URI` | String do MongoDB Atlas | mongodb+srv://user:pass@... |
| `IPTV_SERVER_URL` | URL do seu servidor IPTV | http://seu-servidor.com |
| `IPTV_SERVER_PORT` | Porta do servidor | 8080 |
| `PIX_KEY` | Sua chave PIX | seu@email.com |
| `MERCHANT_NAME` | Nome para PIX | Sua Empresa LTDA |
| `ADMIN_PHONE` | Seu WhatsApp | 5511999999999@c.us |
| `SESSION_TIMEOUT` | Timeout em minutos | 15 |
| `TEST_DURATION` | Duração do teste (horas) | 4 |
| `LOG_LEVEL` | Nível de logs | info |
| `PORT` | Porta do servidor | 3000 |

### 2.5 Fazer deploy
1. Clique em **Create Web Service**
2. Aguarde o deploy (5-10 minutos)
3. O Render vai instalar as dependências e iniciar o bot

---

## 📱 Passo 3: Conectar WhatsApp

### 3.1 Acessar logs
1. No dashboard do Render, clique no seu serviço
2. Vá na aba **Logs**
3. Aguarde aparecer o QR Code (pode demorar alguns minutos)

### 3.2 Escanear QR Code
**IMPORTANTE**: O QR Code no terminal não funcionará no Render!

Você precisará usar uma das seguintes opções:

**Opção A - Via API (Recomendado)**:
- Criar um endpoint HTTP que retorna o QR Code
- Acessar via navegador
- (Posso implementar isso se quiser!)

**Opção B - Usar sessão salva**:
- Conectar primeiro localmente no seu PC
- A pasta `.wwebjs_auth` será criada
- Fazer upload dessa pasta para o Render
- O bot reconectará automaticamente

**Opção C - Logs com imagem**:
- Alguns serviços convertem o QR Code ASCII em imagem
- Verificar se o Render suporta

---

## 🔄 Passo 4: Manter o bot rodando 24/7

### 4.1 Problema do Render Free
O plano gratuito do Render **desliga após 15 minutos de inatividade**.

### 4.2 Solução: Keep-Alive
Adicione um serviço de "ping" para manter o bot ativo:

**UptimeRobot** (Gratuito):
1. Acesse: https://uptimerobot.com
2. Crie uma conta gratuita
3. Adicione um monitor HTTP
4. URL: `https://seu-app.onrender.com`
5. Intervalo: 5 minutos

Isso mantém o bot sempre ativo!

---

## ✅ Verificação

Seu bot está funcionando quando você vê nos logs:

```
╔════════════════════════════════════════╗
║     ✅ BOT INICIADO COM SUCESSO!      ║
╚════════════════════════════════════════╝

📞 Aguardando mensagens...
```

---

## 🆘 Problemas Comuns

### Erro de conexão MongoDB
- ✅ Verifique se a string de conexão está correta
- ✅ Confirme que o IP 0.0.0.0/0 está liberado no MongoDB Atlas
- ✅ Verifique usuário e senha

### Bot desconecta do WhatsApp
- ✅ Salve a pasta `.wwebjs_auth` localmente
- ✅ Configure persistent storage no Render (pago)
- ✅ Ou reconecte quando necessário

### QR Code não aparece
- ✅ Verifique os logs
- ✅ Aguarde alguns minutos
- ✅ Considere implementar endpoint HTTP para QR Code

---

## 💡 Próximos Passos

1. ✅ Configurar webhook para receber notificações
2. ✅ Adicionar painel de controle web
3. ✅ Implementar métricas e analytics
4. ✅ Backup automático do banco de dados

---

## 🔗 Links Úteis

- **Render Dashboard**: https://dashboard.render.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **UptimeRobot**: https://uptimerobot.com
- **Repositório**: https://github.com/jax91/bot-iptv-whatsapp

---

## 📞 Suporte

Se tiver dúvidas, consulte:
- Documentação do Render: https://render.com/docs
- Documentação WhatsApp Web.js: https://wwebjs.dev

---

**Pronto! Seu bot estará rodando 24/7 gratuitamente! 🎉**
