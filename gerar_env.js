const fs = require('fs');
const path = require('path');

// Conteúdo do arquivo .env
const envContent = `# Configurações do Gemini AI
GEMINI_API_KEY=AIzaSyBNi9lwXlEG7DLZdCAywwMsv2kIrPjcUSU
GEMINI_MODEL=gemini-1.5-flash

# Configurações do Grupo
GRUPO_ID=120363236671730157@g.us

# Controle de funcionalidades
ANALISE_IMAGENS=true
MONITORAMENTO_ATIVO=true
ENVIO_AUTOMATICO=true
LIMITE_IMAGENS_DIA=20

# Controle de horários para relatórios
HORARIO_RELATORIO_PARCIAL=13:00
HORARIO_RELATORIO_COMPLETO=00:00

# Configuração do servidor
PORT=3000

# Configurações de email
EMAIL_NOTIFICACAO=joaquimpascoal1999@gmail.com
EMAIL_REMETENTE=jpascoal167@gmail.com
EMAIL_SENHA=wfluiscajcfziknd

# Ambiente
NODE_ENV=development`;

// Caminho para o arquivo .env
const envPath = path.join(__dirname, '.env');

// Escreve o arquivo
fs.writeFileSync(envPath, envContent);

console.log('Arquivo .env criado com sucesso!');
console.log(`Caminho: ${envPath}`); 