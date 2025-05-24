// Script para manter o serviço do Render ativo
// Este script faz um ping ao próprio servidor a cada 5 minutos
// para evitar que o Render coloque o serviço em modo de suspensão

const https = require('https');
const http = require('http');

// URL do seu aplicativo no Render
const URL_APP = process.env.RENDER_EXTERNAL_URL || 'https://bot-2epv.onrender.com';

// Intervalo de ping em milissegundos (5 minutos = 300000 ms)
const INTERVALO_PING = 300000;

// Função para fazer ping na aplicação
function pingApp() {
    console.log(`[${new Date().toISOString()}] Fazendo ping para manter o serviço ativo: ${URL_APP}`);
    
    // Escolhe o protocolo adequado (http ou https)
    const requester = URL_APP.startsWith('https') ? https : http;
    
    const req = requester.get(URL_APP, (res) => {
        const { statusCode } = res;
        let dados = '';
        
        res.on('data', (chunk) => {
            dados += chunk;
        });
        
        res.on('end', () => {
            console.log(`[${new Date().toISOString()}] Ping concluído. Status: ${statusCode}`);
        });
    });
    
    req.on('error', (erro) => {
        console.error(`[${new Date().toISOString()}] Erro ao fazer ping: ${erro.message}`);
    });
    
    req.end();
}

// Inicia o ciclo de pings
console.log(`[${new Date().toISOString()}] Iniciando script de manutenção de atividade.`);
console.log(`Será feito um ping a cada ${INTERVALO_PING / 60000} minutos para ${URL_APP}`);

// Faz o primeiro ping imediatamente
pingApp();

// Agenda os próximos pings no intervalo definido
setInterval(pingApp, INTERVALO_PING);

// Mantém o processo ativo
process.stdin.resume();

// Tratamento de encerramento limpo
process.on('SIGINT', () => {
    console.log('Encerrando script de manutenção de atividade...');
    process.exit(0);
});

// Se este script for executado diretamente
if (require.main === module) {
    console.log('Executando como processo independente');
    console.log('Pressione Ctrl+C para encerrar');
} else {
    console.log('Carregado como módulo por outro script');
}

// Exporta a função de ping para uso em outros scripts
module.exports = {
    pingApp
}; 
