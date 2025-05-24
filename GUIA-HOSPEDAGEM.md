# Guia de Hospedagem do Agente 077

Este guia oferece instruções para hospedar o Agente 077 em diferentes tipos de servidores.

## Requisitos

- Node.js versão 16 ou superior
- NPM (gerenciador de pacotes do Node.js)
- Acesso a terminal (SSH para servidores Linux)
- Acesso visual ao servidor na primeira execução (para escanear o QR code)

## Opções de Hospedagem

### 1. VPS (Virtual Private Server)

A melhor opção para hospedar o bot é usando um VPS com Ubuntu, Debian ou CentOS.

#### Passos:
1. Conecte-se ao seu VPS via SSH
2. Atualize os pacotes:
   ```
   sudo apt update && sudo apt upgrade -y
   ```
3. Instale o Node.js e NPM:
   ```
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
4. Instale dependências de sistema:
   ```
   sudo apt-get install -y gconf-service libgbm-dev libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libgbm1
   ```
5. Crie uma pasta para o bot:
   ```
   mkdir -p /opt/agente077
   ```
6. Faça upload da pasta `agente077-servidor` para o seu servidor usando SCP ou SFTP
7. Navegue até a pasta e instale as dependências:
   ```
   cd /opt/agente077
   npm install
   ```
8. Edite o arquivo config.js com suas configurações:
   ```
   nano config.js
   ```
9. Instale o PM2 para manter o bot rodando:
   ```
   npm install -g pm2
   ```
10. Inicie o bot com PM2:
   ```
   pm2 start ecosystem.config.js
   ```
11. Configure o PM2 para iniciar automaticamente após reinicialização:
   ```
   pm2 startup
   pm2 save
   ```

### 2. Hospedagem em painéis de controle (cPanel, Plesk)

Você pode hospedar o bot em servidores com painéis de controle usando Node.js Application.

#### Passos no cPanel:
1. Faça login no cPanel
2. Procure por "Setup Node.js App"
3. Crie um novo aplicativo Node.js
4. Selecione Node.js versão 16 ou superior
5. Faça upload dos arquivos para o diretório do aplicativo
6. Configure o aplicativo para usar o arquivo `bot.js` como ponto de entrada
7. Inicie o aplicativo

### 3. Hospedagem na nuvem (AWS, Azure, Google Cloud)

#### Amazon EC2:
1. Crie uma instância EC2 (recomendado: Ubuntu Server)
2. Conecte-se à instância via SSH
3. Siga os passos de instalação para VPS (acima)

#### Google Cloud Platform:
1. Crie uma instância Compute Engine
2. Conecte-se à instância via SSH
3. Siga os passos de instalação para VPS (acima)

## Manipulação do QR Code

Na primeira execução, o bot gerará um QR code que você precisará escanear com o WhatsApp. Há algumas opções:

### Opção 1: Acesso visual direto
Se você tem acesso a interface gráfica do servidor, basta visualizar o QR code diretamente.

### Opção 2: SSH com encaminhamento X11
1. Conecte-se ao servidor com encaminhamento X11:
   ```
   ssh -X usuario@servidor
   ```
2. Execute o bot normalmente e o QR code será exibido em uma janela X11.

### Opção 3: QR code no terminal
O bot exibe o QR code no terminal usando caracteres ASCII, o que permite visualizá-lo diretamente na sessão SSH.

## Solução de Problemas

### O bot desconecta frequentemente
- Verifique se o servidor tem memória suficiente (recomendado: mínimo 1GB RAM)
- Certifique-se de que todas as dependências estão instaladas
- Verifique os logs com `pm2 logs agente077`

### Erro ao gerar QR code
- Verifique se as dependências do Puppeteer estão instaladas
- Tente usar a opção `headless: true` no código do bot

### Problemas com a API do Gemini
- Verifique se a chave API está correta
- Verifique os limites de uso da sua chave API

## Monitoramento

Use o PM2 para monitorar o status do bot:
```
pm2 status
pm2 logs agente077
pm2 monit
```

## Backup

Faça backup regular das pastas:
- `/logs` - Contém registros de conexão
- `/casos` - Contém dados de casos e análises

## Suporte

Para mais informações, consulte a documentação das bibliotecas utilizadas:
- [whatsapp-web.js](https://wwebjs.dev/)
- [Google Generative AI](https://ai.google.dev/) 