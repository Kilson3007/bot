# Guia de Hospedagem do Agente 077 no Render

Este guia contém instruções específicas para hospedar o Agente 077 no Render usando a conta gratuita.

## 1. Configuração da Conta no Render

1. Acesse [render.com](https://render.com) e crie uma conta gratuita
2. Após criar a conta, clique em "New +" e selecione "Web Service"

## 2. Opção 1: Conectar ao GitHub (recomendado)

1. Selecione "Build and deploy from a Git repository"
2. Conecte sua conta GitHub e selecione o repositório com o código do Agente 077
3. Caso não tenha o código no GitHub, crie um repositório e faça upload dos arquivos da pasta `agente077-servidor`

## 2. Opção 2: Upload Direto

1. Selecione "Deploy an existing image from a registry"
2. Baixe e instale o Render CLI em seu computador
3. Use o comando: `render blueprint new agente077`

## 3. Configuração do Serviço

Preencha os seguintes campos:

- **Name**: agente077
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `node bot.js`
- **Instance Type**: Free

## 4. Configuração de Variáveis de Ambiente

Você pode pular esta etapa, pois as configurações já estão no arquivo `ecosystem.config.js`, mas caso queira personalizar:

1. Na seção "Environment Variables", adicione:
   - `PORT`: 3000
   - `EMAIL_NOTIFICACAO`: joaquimpascoal1999@gmail.com
   - (As outras variáveis já estão definidas no código)

## 5. Configuração Adicional do Servidor de Email

Para enviar notificações por email, você precisará configurar um servidor SMTP:

1. Crie uma conta de email específica para o bot (ex: gmail)
2. Acesse o arquivo `notificacao.js` e atualize:
   ```javascript
   const transporter = nodemailer.createTransport({
       service: 'gmail',
       auth: {
           user: 'seu-email@gmail.com',
           pass: 'sua-senha-de-app'
       }
   });
   ```
3. No Gmail, você precisará gerar uma "senha de aplicativo":
   - Acesse sua conta Google > Segurança > Senhas de app
   - Crie uma nova senha para "Outro" (dê o nome "Agente077")
   - Use essa senha no campo `pass`

## 6. Mantendo o Serviço Ativo

Para evitar que o Render "adormeça" seu serviço após 15 minutos de inatividade:

1. Após o deploy, obtenha a URL do seu serviço (ex: https://agente077.onrender.com)
2. Acesse [UptimeRobot](https://uptimerobot.com) e crie uma conta gratuita
3. Adicione um novo monitor:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Agente077
   - **URL**: https://agente077.onrender.com
   - **Monitoring Interval**: 5 minutos

Isso fará com que o UptimeRobot envie pings ao seu serviço a cada 5 minutos, mantendo-o ativo.

## 7. Primeiro Acesso e QR Code

1. Após o deploy, aguarde o serviço iniciar
2. Você receberá um email com o QR code para escanear
3. Use o WhatsApp do seu celular para escanear o código
4. Após escanear, você receberá um email confirmando a conexão

## 8. Solução de Problemas

### Se o serviço reiniciar:

O Render pode reiniciar seu serviço por vários motivos:
- Manutenção programada
- Limite de memória (512MB no plano gratuito)
- Problema na infraestrutura do Render

Quando isso ocorrer:
1. Você receberá um email com o novo QR code
2. Escaneie o código novamente com o WhatsApp do seu celular
3. A conexão será restabelecida

### Outros problemas comuns:

- **Falha na autenticação do email**: Verifique a senha de aplicativo do Gmail
- **Erro no puppeteer/whatsapp-web.js**: O Render pode ter limitações para algumas funcionalidades do navegador headless. Se encontrar problemas, tente ajustar as opções do puppeteer no arquivo `bot.js`.

## 9. Monitoramento

Acesse a URL do seu serviço para ver a página de status do bot:
- https://agente077.onrender.com

Esta página mostra:
- Status do servidor
- Tempo online
- Uso de memória
- Logs de conexão
- Se há QR code disponível

## 10. Dicas Finais

- Verifique regularmente o painel do Render para garantir que o serviço está ativo
- Configure notificações no Render para ser avisado sobre reinicializações
- Considere migrar para um plano pago ou VPS se precisar de mais estabilidade

---

Seguindo este guia, seu Agente 077 estará funcionando no Render com notificações por email para que você saiba quando precisar escanear novamente o QR code. 