// Sistema de notificação por email para o Agente 077
const nodemailer = require('nodemailer');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Usa variáveis de ambiente do arquivo .env
const EMAIL_NOTIFICACAO = process.env.EMAIL_NOTIFICACAO;
const EMAIL_REMETENTE = process.env.EMAIL_REMETENTE;
const EMAIL_SENHA = process.env.EMAIL_SENHA;

// Verifica se as credenciais de email estão configuradas
const emailConfigurado = EMAIL_REMETENTE && EMAIL_SENHA && EMAIL_NOTIFICACAO;

// Configuração do transportador SMTP
let transporter = null;

// Só configura o transportador se as credenciais estiverem disponíveis
if (emailConfigurado) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_REMETENTE,
            pass: EMAIL_SENHA
        }
    });
}

// Função para enviar email com QR code
async function enviarEmailComQRCode(qrCodeBase64, qrCodeText) {
    // Se o email não estiver configurado, apenas loga e retorna
    if (!emailConfigurado) {
        console.log('Envio de email desativado: credenciais não configuradas nas variáveis de ambiente');
        return false;
    }

    try {
        // Dados do servidor para o email
        const hostName = os.hostname();
        const ipAddresses = Object.values(os.networkInterfaces())
            .flat()
            .filter(details => details.family === 'IPv4' && !details.internal)
            .map(details => details.address)
            .join(', ');
        
        const dataHora = new Date().toLocaleString();
        
        // Prepara HTML para QR code em imagem ou texto
        let qrCodeHtml = '';
        
        if (qrCodeBase64) {
            // Se temos a imagem do QR code, usamos ela
            qrCodeHtml = `
            <div style="background-color: white; padding: 20px; display: inline-block; margin: 10px auto; border: 1px solid #ddd;">
                <img src="${qrCodeBase64}" alt="QR Code" style="max-width: 300px; height: auto;" />
            </div>`;
        } else {
            // Se não temos a imagem, damos instruções para usar o texto
            qrCodeHtml = `
            <div style="background-color: #f9f9f9; padding: 20px; margin: 10px auto; border: 1px solid #ddd; text-align: left;">
                <p style="font-weight: bold;">O QR code não pôde ser gerado como imagem. Use o texto abaixo:</p>
                <p style="margin-bottom: 10px;">1. Copie o texto do QR code abaixo</p>
                <textarea style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; height: 100px;">${qrCodeText}</textarea>
                <p style="margin-top: 15px;">2. Acesse um gerador de QR code online como 
                <a href="https://www.the-qrcode-generator.com/" target="_blank">https://www.the-qrcode-generator.com/</a> ou
                <a href="https://www.qr-code-generator.com/" target="_blank">https://www.qr-code-generator.com/</a></p>
                <p>3. Cole o texto, gere o QR code e escaneie com seu WhatsApp</p>
            </div>`;
        }
        
        // Prepara o email com o QR code
        const mailOptions = {
            from: `\"Agente 077 Bot\" <${EMAIL_REMETENTE}>`,
            to: EMAIL_NOTIFICACAO,
            subject: `🔴 Agente 077 - Novo QR Code para Escaneamento (${dataHora})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #333; text-align: center;">Agente 077 - QR Code para Conexão</h2>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                        <p style="font-weight: bold; color: #d32f2f;">⚠️ Um novo QR code foi gerado e precisa ser escaneado!</p>
                        <p>Escaneie este QR code para conectar o bot ao WhatsApp:</p>
                        
                        ${qrCodeHtml}
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <h3>📱 Como conectar:</h3>
                        <ol style="padding-left: 20px; line-height: 1.5;">
                            <li>Abra o WhatsApp no seu celular</li>
                            <li>Toque em Menu ou Configurações</li>
                            <li>Selecione "Dispositivos Conectados"</li>
                            <li>Toque em "Conectar um Dispositivo"</li>
                            <li>Aponte a câmera para o QR Code acima</li>
                        </ol>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 10px; background-color: #e8f5e9; border-radius: 5px;">
                        <p style="margin: 0; font-size: 14px;">
                            ℹ️ Se preferir, você também pode acessar o QR code através do navegador visitando:<br>
                            <a href="https://bot-2epv.onrender.com/scan" style="color: #2196f3;">https://bot-2epv.onrender.com/scan</a>
                        </p>
                    </div>
                    
                    <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 12px; color: #666;">
                        <p>Este email foi enviado automaticamente pelo sistema Agente 077.</p>
                        <p>Servidor: ${hostName} | IP: ${ipAddresses}</p>
                        <p>Data e hora: ${dataHora}</p>
                    </div>
                </div>
            `
        };
        
        // Envia o email
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email de notificação enviado: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Erro ao enviar email de notificação:', error);
        return false;
    }
}

// Função para enviar email de notificação de conexão bem-sucedida
async function enviarEmailConexaoBemSucedida() {
    // Se o email não estiver configurado, apenas loga e retorna
    if (!emailConfigurado) {
        console.log('Envio de email desativado: credenciais não configuradas nas variáveis de ambiente');
        return false;
    }

    try {
        const dataHora = new Date().toLocaleString();
        const hostName = os.hostname();
        
        const mailOptions = {
            from: `"Agente 077 Bot" <${EMAIL_REMETENTE}>`,
            to: EMAIL_NOTIFICACAO,
            subject: `✅ Agente 077 - Conexão Bem-Sucedida (${dataHora})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #00b300; text-align: center;">✅ Agente 077 - Conectado com Sucesso</h2>
                    <p>O bot Agente 077 foi conectado com sucesso ao WhatsApp e está operacional.</p>
                    <p><strong>Data/Hora:</strong> ${dataHora}</p>
                    <p><strong>Servidor:</strong> ${hostName}</p>
                    <p style="font-size: 13px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                        Esta é uma mensagem automática do sistema Agente 077. Não responda este email.
                    </p>
                </div>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email de conexão bem-sucedida enviado: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Erro ao enviar email de conexão bem-sucedida:', error);
        return false;
    }
}

// Exporta as funções para uso no bot.js
module.exports = {
    enviarEmailComQRCode,
    enviarEmailConexaoBemSucedida
}; 
