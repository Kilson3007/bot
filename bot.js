// Agente 077 - Bot Avançado para Grupo de Agentes (Versão corrigida)
// Versão robusta com análise de imagens, assistência em casos e geração de relatórios detalhados

// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

// Importa os módulos necessários
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { enviarEmailComQRCode, enviarEmailConexaoBemSucedida } = require('./notificacao');

// Importa o servidor HTTP para manter o bot ativo no Render
const server = require('./servidor');

// Configurações do Gemini
const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyBNi9lwXlEG7DLZdCAywwMsv2kIrPjcUSU';
const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: geminiModel });

// Configurações de grupos
const GRUPO_ID = process.env.GRUPO_ID || '120363236671730157@g.us';

// Controle de funcionalidades
const ANALISE_IMAGENS = process.env.ANALISE_IMAGENS === 'true';
const MONITORAMENTO_ATIVO = process.env.MONITORAMENTO_ATIVO === 'true';
const ENVIO_AUTOMATICO = process.env.ENVIO_AUTOMATICO === 'true';
const LIMITE_IMAGENS_DIA = parseInt(process.env.LIMITE_IMAGENS_DIA || '20');

// Controle de horários para relatórios
const HORARIO_RELATORIO_PARCIAL = process.env.HORARIO_RELATORIO_PARCIAL || '13:00';
const HORARIO_RELATORIO_COMPLETO = process.env.HORARIO_RELATORIO_COMPLETO || '00:00';

// Inicializa a contagem de imagens e o Set para evitar duplicidades
let contagemImagens = 0;
const mensagensProcessadas = new Set();

console.log('Iniciando Agente 077 - Versão Avançada Corrigida...');

// Armazenamento de casos e discussões
let discussoesDiarias = {};
let casosPendentes = {};
let imagensAnalisadas = {};
let modoAssistente = false;

// Configura o cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({ clientId: "agente077" }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--disable-gpu'],
        headless: true
    }
});

// Tratamento do QR code
client.on('qr', async (qr) => {
    console.log('\n\n');
    console.log('===========================================');
    console.log('          ESCANEIE O QR CODE ABAIXO       ');
    console.log('===========================================');
    console.log('\n');
    
    // Gera QR code pequeno no terminal (ajustado para ser mais claro)
    qrcode.generate(qr, { small: true });
    console.log('\n');
    
    // Imprime o texto do QR code completo para ser copiado do terminal
    console.log('TEXTO DO QR CODE (use para gerar em um gerador online):');
    console.log(qr);
    console.log('\n');
    
    try {
        // Determina diretório temporário apropriado com base no ambiente
        const tempDir = process.env.NODE_ENV === 'production' ? '/tmp' : __dirname;
        
        // Salva o QR code como arquivo de texto
        const qrCodeTextPath = path.join(tempDir, 'qrcode_atual.txt');
        fs.writeFileSync(qrCodeTextPath, qr);
        console.log(`QR Code salvo como texto em: ${qrCodeTextPath}`);
        
        // Armazena o texto do QR code em uma variável global para acesso pelo servidor
        global.qrCodeText = qr;
        
        // Imprime o QR code nos logs de forma clara para facilitar a cópia
        console.log('\n\n========== TEXTO DO QR CODE FORMATADO ==========');
        console.log(qr);
        console.log('================================================\n\n');
        
        // Envia o email apenas com o texto do QR code
        try {
            await enviarEmailComQRCode(null, qr);
        } catch (error) {
            console.log(`Erro ao enviar email de notificação: ${error.message}`);
        }
    } catch (error) {
        console.log(`Erro ao processar QR code: ${error.message}`);
    }
});

// Quando o cliente está pronto
client.on('ready', async () => {
    console.log('\n===========================================');
    console.log('AGENTE 077 CONECTADO COM SUCESSO!');
    console.log('===========================================\n');
    
    console.log('Comandos disponíveis:');
    console.log('  !id - Mostra o ID do chat/grupo');
    console.log('  !ajuda - Lista de todos os comandos disponíveis');
    console.log('  !caso [descrição] - Registra um novo caso');
    console.log('  !buscar [descrição] - Busca por pessoa desaparecida');
    console.log('  !analisar - Responda a uma imagem com este comando para analisá-la');
    console.log('  !assistente on/off - Ativa/desativa o modo assistente');
    console.log('  !relatorio - Gera relatório completo');
    console.log('  !relatorio-parcial - Gera relatório parcial');
    
    // Cria pastas necessárias
    const pastas = ['logs', 'imagens_temp', 'casos'];
    pastas.forEach(pasta => {
        if (!fs.existsSync(pasta)) {
            fs.mkdirSync(pasta);
        }
    });
    
    // Registra conexão bem-sucedida
    fs.writeFileSync(
        path.join('logs', `conexao_${new Date().toISOString().replace(/:/g, '-')}.txt`),
        `Agente 077 conectado com sucesso em: ${new Date().toLocaleString()}\n`
    );
    
    // Carrega dados salvos se existirem
    carregarDados();

    // Remove o arquivo de QR code, se existir
    try {
        // Determina diretório temporário apropriado com base no ambiente
        const tempDir = process.env.NODE_ENV === 'production' ? '/tmp' : __dirname;
        const qrCodePath = path.join(tempDir, 'qrcode_atual.png');
        
        if (fs.existsSync(qrCodePath)) {
            fs.unlinkSync(qrCodePath);
            console.log('Arquivo de QR code removido com sucesso');
        }
        
        // Limpa a variável global
        if (global.qrCodePath) {
            delete global.qrCodePath;
        }
    } catch (error) {
        console.log(`Erro ao remover arquivo de QR code: ${error.message}`);
    }
    
    // Envia email de conexão bem-sucedida
    await enviarEmailConexaoBemSucedida();
    
    // Envia mensagem de status para o grupo
    if (process.env.MONITORAMENTO_ATIVO === 'true') {
        try {
            const grupos = await client.getChats();
            const grupo = grupos.find(chat => chat.id._serialized === process.env.GRUPO_ID || '120363236671730157@g.us');
            
            if (grupo) {
                await client.sendMessage(process.env.GRUPO_ID || '120363236671730157@g.us', 
                    '🤖 *Agente 077 - Status*\n\n' +
                    '✅ Bot reiniciado e conectado com sucesso!\n' +
                    `📊 Limite diário: ${process.env.LIMITE_IMAGENS_DIA} imagens\n` +
                    `📸 Análise de imagens: ${process.env.ANALISE_IMAGENS === 'true' ? 'Ativada' : 'Desativada'}\n` +
                    `📤 Envio automático: ${process.env.ENVIO_AUTOMATICO === 'true' ? 'Ativado' : 'Desativado'}\n` +
                    `⏰ Relatório parcial: ${process.env.HORARIO_RELATORIO_PARCIAL || '13:00'}\n` +
                    `⏰ Relatório completo: ${process.env.HORARIO_RELATORIO_COMPLETO || '00:00'}\n\n` +
                    '📝 _Envie imagens para análise ou digite "/ajuda" para ver os comandos disponíveis._'
                );
            } else {
                console.log(`Erro: Grupo ${process.env.GRUPO_ID || '120363236671730157@g.us'} não encontrado`);
            }
        } catch (error) {
            console.log(`Erro ao enviar mensagem de status: ${error.message}`);
        }
    }
});

// Função para analisar imagens com IA
async function analisarImagemComIA(caminhoImagem) {
    try {
        console.log(`Analisando imagem: ${caminhoImagem}`);
        
        // Lê a imagem como buffer
        const imagemBuffer = fs.readFileSync(caminhoImagem);
        
        // Converte para formato base64
        const imagemBase64 = imagemBuffer.toString('base64');
        
        // Envia para análise no modelo Gemini com instruções para ser conciso
        const result = await model.generateContent([
            "Analise esta imagem brevemente no contexto de uma investigação. Seja MUITO CONCISO (máximo 250 palavras total). Forneça: " +
            "1. Breve descrição do que se vê (2-3 frases)" +
            "2. Elementos relevantes para investigação (lista curta)" +
            "3. Possíveis conclusões (1-2 frases)" +
            "4. Recomendações essenciais (1-2 itens)",
            {
                inlineData: {
                    data: imagemBase64,
                    mimeType: "image/jpeg"
                }
            }
        ]);
        
        let resposta = result.response.text();
        
        // Limita o tamanho da resposta
        if (resposta.length > 1000) {
            resposta = resposta.substring(0, 997) + "...";
            console.log("Resposta de análise de imagem truncada por ser muito longa");
        }
        
        return resposta;
    } catch (error) {
        console.error("Erro ao analisar imagem:", error);
        return "Não foi possível analisar a imagem. Erro: " + error.message;
    }
}

// Função para analisar texto com IA
async function analisarTextoComIA(texto, contexto) {
    try {
        let prompt = '';
        
        // Utiliza prompts específicos para diferentes contextos
        if (contexto === "Resposta ao comentário do grupo") {
            prompt = `
Analise esta mensagem enviada em um grupo de agentes investigativos: "${texto}"

Atue como um assistente virtual chamado "Agente 077". Forneça uma resposta útil, relevante e concisa (máximo 3 frases) que demonstre compreensão do contexto e ofereça insights valiosos ou sugestões práticas.

A resposta deve ser:
1. Natural e conversacional
2. Focada no tema central da mensagem
3. Informativa mas sem revelar detalhes sensíveis
4. Preferencialmente sugerindo uma ação ou perspectiva útil
5. Relacionada ao contexto de investigação quando apropriado

Importante: Responda diretamente sem incluir frases como "Como Agente 077, eu..." ou "Analisando sua mensagem...".
`;
        } else if (contexto === "Análise inicial de caso registrado") {
            prompt = `
Analise esta descrição de caso registrado: "${texto}"

Forneça uma análise concisa (máximo 200 palavras) que inclua:
1. Avaliação inicial dos elementos-chave do caso
2. Possíveis linhas de investigação a serem seguidas
3. Recomendações imediatas para os agentes

A análise deve ser profissional, objetiva e útil para orientar os próximos passos da investigação.
`;
        } else if (contexto === "Recomendações para busca de pessoa/objeto") {
            prompt = `
Analise esta descrição de busca: "${texto}"

Forneça recomendações práticas e concisas (máximo 200 palavras) que incluam:
1. Estratégias eficientes para localizar a pessoa/objeto
2. Pontos de atenção prioritários
3. Recursos ou técnicas específicas que podem ser úteis neste caso

As recomendações devem ser claras, diretas e imediatamente aplicáveis pelos agentes em campo.
`;
        } else {
            // Prompt padrão para outros contextos
            prompt = `${contexto}: "${texto}"\n\nFaça uma análise detalhada considerando o contexto de investigação de agentes de segurança. Forneça insights relevantes, possíveis conexões com casos conhecidos e recomendações para os agentes. Seu papel é auxiliar na investigação.`;
        }
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Erro ao analisar texto:", error);
        return "Não foi possível analisar o texto. Erro: " + error.message;
    }
}

// Função para criar relatórios detalhados
async function gerarRelatorioDetalhado(completo = true) {
    try {
        const dataAtual = new Date().toLocaleDateString();
        const horaAtual = new Date().toLocaleTimeString();
        const tipoRelatorio = completo ? "Completo" : "Diário";
        
        // Extrai dados dos participantes mais ativos
        let participantesAtivos = {};
        Object.keys(discussoesDiarias).forEach(topico => {
            discussoesDiarias[topico].forEach(msg => {
                if (!participantesAtivos[msg.autor]) {
                    participantesAtivos[msg.autor] = 0;
                }
                participantesAtivos[msg.autor]++;
            });
        });
        
        // Ordena participantes por número de mensagens
        const topParticipantes = Object.entries(participantesAtivos)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        let topParticipantesTexto = "";
        if (topParticipantes.length > 0) {
            topParticipantesTexto = "*Top Participantes Ativos*\n";
            topParticipantes.forEach((p, i) => {
                topParticipantesTexto += `${i+1}. ${p[0]} - ${p[1]} mensagem${p[1] > 1 ? 'ns' : ''}\n`;
            });
            topParticipantesTexto += "\n";
        }
        
        // Organiza tópicos de discussão
        let topicosPrincipais = Object.keys(discussoesDiarias)
            .map(topico => ({ 
                nome: topico, 
                count: discussoesDiarias[topico].length,
                mensagens: discussoesDiarias[topico]
            }))
            .sort((a, b) => b.count - a.count);
        
        // Processa casos ativos
        const casosAtivos = Object.entries(casosPendentes)
            .filter(([_, caso]) => caso.status === "Aberto" || caso.status === "Ativo")
            .map(([id, caso]) => ({
                id: id.slice(-4),
                descricao: caso.descricao,
                status: caso.status,
                autor: caso.autor
            }));
        
        // Extrai insights das imagens analisadas
        const insightsImagens = Object.values(imagensAnalisadas).map(img => ({
            resumo: img.resumo.replace(/^.*?:/, "").trim(),
            dataAnalise: new Date(img.dataAnalise),
            autor: img.autor
        }));
        
        // Ordena insights por data (mais recentes primeiro)
        insightsImagens.sort((a, b) => b.dataAnalise - a.dataAnalise);
        
        // Prepara dados para o resumo
        const dadosParaAnalise = {
            participantes: topParticipantes,
            topicos: topicosPrincipais,
            casos: casosAtivos,
            insights: insightsImagens
        };
        
        // Gera o resumo com IA
        let resumoGerado = "";
        
        try {
            const promptResumo = `
Crie um relatório natural no estilo de resumo de grupo para agentes investigativos, similar ao exemplo abaixo:

===EXEMPLO DE FORMATO===
Resumo Dia - Grupo Comunidade XYZ

*Top 5 Participantes Ativos*  
1. Usuário A - 8 mensagens  
2. Usuário B - 4 mensagens  
3. Usuário C - 1 mensagem

*Assunto principal: 🌟 Título do assunto principal*  
Breve resumo do assunto principal discutido no grupo, destacando pontos relevantes e contribuições importantes. Incluir nomes dos participantes e mencionar ideias compartilhadas.

*Assuntos relevantes: 📖 Título de outro assunto relevante*  
Resumo de outro tópico importante discutido, com menções a participantes e contexto.

*Casos em andamento: 🔍 Título sobre investigações ativas*
Resumo sobre os casos ativos, sem revelar detalhes sensíveis mas indicando progressos.

*Análises relevantes: 🖼️ Insights das imagens analisadas*
Resumo dos principais insights obtidos das análises de imagens, sem mencionar IDs ou detalhes técnicos.
===FIM DO EXEMPLO===

Use os seguintes dados reais para criar o relatório:
${JSON.stringify(dadosParaAnalise, null, 2)}

DIRETRIZES IMPORTANTES:
1. Use emojis relevantes para cada seção
2. Mantenha o tom natural e fluido (não robotizado)
3. Organize por seções como no exemplo
4. Foque nas informações mais relevantes de cada tópico
5. Mencione nomes de participantes quando relevante
6. Inclua 2-3 recomendações práticas para os agentes ao final
7. Não mencione IDs específicos de imagens ou casos
8. Limite cada seção a 3-5 frases concisas
9. Adicione um título que inclua "Agente 077" e a data atual
10. Use linguagem clara, direta e profissional
11. Não use formatação de tópicos com asteriscos dentro dos parágrafos
`;

            const resultado = await model.generateContent(promptResumo);
            resumoGerado = resultado.response.text();
        } catch (error) {
            console.error("Erro ao gerar resumo:", error);
            resumoGerado = `*Resumo ${tipoRelatorio} - Agente 077*\n\n`;
            
            // Adiciona seção de participantes ativos
            if (topParticipantes.length > 0) {
                resumoGerado += topParticipantesTexto;
            }
            
            // Adiciona seção de tópicos principais
            if (topicosPrincipais.length > 0) {
                resumoGerado += "*Assuntos Discutidos*\n";
                topicosPrincipais.forEach(topico => {
                    resumoGerado += `• ${topico.nome}: ${topico.count} mensagens\n`;
                });
                resumoGerado += "\n";
            }
            
            // Adiciona seção de casos ativos
            if (casosAtivos.length > 0) {
                resumoGerado += "*Casos em Andamento*\n";
                casosAtivos.forEach(caso => {
                    resumoGerado += `• Caso #${caso.id}: ${caso.descricao.substring(0, 100)}${caso.descricao.length > 100 ? "..." : ""}\n`;
                });
                resumoGerado += "\n";
            }
            
            // Adiciona seção de insights de imagens
            if (insightsImagens.length > 0) {
                resumoGerado += "*Análises Relevantes*\n";
                insightsImagens.slice(0, 3).forEach(insight => {
                    resumoGerado += `• ${insight.resumo}\n`;
                });
                resumoGerado += "\n";
            }
        }
        
        return resumoGerado;
    } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        return `*Relatório ${completo ? "Completo" : "Diário"} - Agente 077*\n\nOcorreu um erro ao gerar o relatório. Por favor, tente novamente mais tarde.`;
    }
}

// Funções para gerenciar casos e dados
function registrarCaso(descricao, autor) {
    const id = Date.now().toString().slice(-6);
    
    casosPendentes[id] = {
        id: id,
        descricao: descricao,
        autor: autor,
        dataRegistro: new Date().toISOString(),
        status: "Aberto",
        atualizacoes: []
    };
    
    salvarDados();
    return id;
}

function registrarBusca(descricao, autor) {
    const id = "B" + Date.now().toString().slice(-6);
    
    casosPendentes[id] = {
        id: id,
        tipo: "Busca",
        descricao: descricao,
        autor: autor,
        dataRegistro: new Date().toISOString(),
        status: "Ativo",
        atualizacoes: []
    };
    
    salvarDados();
    return id;
}

function registrarDiscussao(topico, mensagem, autor) {
    if (!discussoesDiarias[topico]) {
        discussoesDiarias[topico] = [];
    }
    
    discussoesDiarias[topico].push({
        autor: autor,
        mensagem: mensagem,
        timestamp: new Date().toISOString()
    });
    
    salvarDados();
}

function registrarAnaliseImagem(resumo, analiseCompleta, autor) {
    const id = "IMG" + Date.now().toString().slice(-6);
    
    imagensAnalisadas[id] = {
        id: id,
        resumo: resumo,
        analiseCompleta: analiseCompleta,
        autor: autor,
        dataAnalise: new Date().toISOString()
    };
    
    salvarDados();
    return id;
}

// Funções de persistência de dados
function salvarDados() {
    const dados = {
        discussoesDiarias: discussoesDiarias,
        casosPendentes: casosPendentes,
        imagensAnalisadas: imagensAnalisadas,
        ultimaAtualizacao: new Date().toISOString()
    };
    
    fs.writeFileSync(
        path.join('casos', `dados_${new Date().toISOString().split('T')[0]}.json`),
        JSON.stringify(dados, null, 2)
    );
}

function carregarDados() {
    try {
        const dataAtual = new Date().toISOString().split('T')[0];
        const caminhoArquivo = path.join('casos', `dados_${dataAtual}.json`);
        
        if (fs.existsSync(caminhoArquivo)) {
            const dadosJson = fs.readFileSync(caminhoArquivo, 'utf8');
            const dados = JSON.parse(dadosJson);
            
            discussoesDiarias = dados.discussoesDiarias || {};
            casosPendentes = dados.casosPendentes || {};
            imagensAnalisadas = dados.imagensAnalisadas || {};
            
            console.log("Dados carregados com sucesso.");
        } else {
            console.log("Nenhum dado anterior encontrado para hoje. Iniciando com dados vazios.");
        }
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

function agendarLimpezaDados() {
    const agora = new Date();
    const meia_noite = new Date();
    meia_noite.setHours(24, 0, 0, 0);
    
    const tempoAteProximaMeiaNoite = meia_noite - agora;
    
    setTimeout(() => {
        console.log("Salvando relatório do dia antes de limpar dados...");
        
        // Gera e salva relatório final do dia
        gerarRelatorioDetalhado(true).then(relatorio => {
            const dataAtual = new Date().toISOString().split('T')[0];
            fs.writeFileSync(
                path.join('logs', `relatorio_final_${dataAtual}.txt`),
                relatorio
            );
            
            // Limpa os dados diários mas mantém casos pendentes
            discussoesDiarias = {};
            imagensAnalisadas = {};
            
            console.log("Dados diários limpos. Casos pendentes mantidos.");
            salvarDados();
            
            // Agenda próxima limpeza
            agendarLimpezaDados();
        });
    }, tempoAteProximaMeiaNoite);
    
    console.log(`Próxima limpeza de dados agendada para meia-noite (em ${(tempoAteProximaMeiaNoite / 3600000).toFixed(2)} horas).`);
}

// Processamento de comandos
async function processarComando(msg) {
    try {
        const comando = msg.body.toLowerCase().trim();
        const autor = msg.author || msg.from.split('@')[0];
        
        // Extrai o prefixo e os argumentos
        const partes = comando.split(' ');
        const prefixo = partes[0];
        const args = partes.slice(1).join(' ');
        
        // Comando !id
        if (prefixo === '!id') {
            await client.sendMessage(msg.from, `ID deste chat: ${msg.from}`);
            console.log(`ID enviado para: ${msg.from}`);
            
            fs.writeFileSync('ultimo_id.txt', `ID: ${msg.from}\nData: ${new Date().toLocaleString()}`);
            return true;
        }
        
        // Comando !teste
        if (prefixo === '!teste') {
            await client.sendMessage(msg.from, '✅ Agente 077 online e operacional.');
            console.log(`Teste de funcionamento enviado para: ${msg.from}`);
            return true;
        }
        
        // Comando !ajuda ou !help
        if (prefixo === '!ajuda' || prefixo === '!help') {
            const mensagemAjuda = `*Comandos do Agente 077 - Assistente Investigativo*\n\n` +
                `!id - Mostra o ID deste chat\n` +
                `!caso [descrição] - Registra um novo caso\n` +
                `!buscar [descrição] - Registra busca de pessoa/objeto\n` +
                `!analisar - Responda a uma imagem com este comando\n` +
                `!assistente on/off - Ativa/desativa modo assistente\n` +
                `!relatorio - Gera relatório completo\n` +
                `!relatorio-parcial - Gera relatório parcial\n` +
                `!teste - Verifica se o bot está respondendo\n` +
                `!ajuda - Mostra esta mensagem\n\n` +
                `O Agente 077 também:\n` +
                `- Analisa automaticamente imagens compartilhadas\n` +
                `- Gera relatórios diários às 13:00 e 00:00\n` +
                `- Oferece sugestões no modo assistente`;
            
            await client.sendMessage(msg.from, mensagemAjuda);
            console.log(`Mensagem de ajuda enviada para: ${msg.from}`);
            return true;
        }
        
        // Comando !caso
        if (prefixo === '!caso') {
            if (!args) {
                await client.sendMessage(msg.from, 'Por favor, forneça uma descrição do caso. Exemplo: !caso Investigação de furto na rua Principal.');
                return true;
            }
            
            const idCaso = registrarCaso(args, autor);
            
            await client.sendMessage(msg.from, `✅ Caso registrado com sucesso.\n\nID: #${idCaso}\nDescrição: ${args}\nStatus: Aberto\n\nEste caso foi adicionado ao sistema e aparecerá nos relatórios.`);
            console.log(`Novo caso registrado: ${idCaso} - ${args}`);
            
            // Adiciona uma análise básica do caso
            setTimeout(async () => {
                const analise = await analisarTextoComIA(args, "Análise inicial de caso registrado");
                await client.sendMessage(msg.from, `*Análise Preliminar - Caso #${idCaso}*\n\n${analise}`);
            }, 2000);
            
            return true;
        }
        
        // Comando !buscar
        if (prefixo === '!buscar') {
            if (!args) {
                await client.sendMessage(msg.from, 'Por favor, forneça detalhes sobre a pessoa/objeto a ser buscado. Exemplo: !buscar João Silva, 35 anos, desaparecido desde 15/06.');
                return true;
            }
            
            const idBusca = registrarBusca(args, autor);
            
            await client.sendMessage(msg.from, `✅ Busca registrada com sucesso.\n\nID: #${idBusca}\nDescrição: ${args}\nStatus: Ativo\n\nEsta busca foi adicionada ao sistema e aparecerá nos relatórios.`);
            console.log(`Nova busca registrada: ${idBusca} - ${args}`);
            
            // Adiciona recomendações para a busca
            setTimeout(async () => {
                const recomendacoes = await analisarTextoComIA(args, "Recomendações para busca de pessoa/objeto");
                await client.sendMessage(msg.from, `*Recomendações - Busca #${idBusca}*\n\n${recomendacoes}`);
            }, 2000);
            
            return true;
        }
        
        // Comando !analisar (para análise de imagens)
        if (prefixo === '!analisar') {
            // Verifica se é uma resposta a uma mensagem com mídia
            if (msg.hasQuotedMsg) {
                const mensagemQuotada = await msg.getQuotedMessage();
                
                if (mensagemQuotada.hasMedia) {
                    await client.sendMessage(msg.from, '🔍 Analisando imagem, aguarde um momento...');
                    
                    // Baixa a mídia
                    const media = await mensagemQuotada.downloadMedia();
                    if (!media) {
                        await client.sendMessage(msg.from, 'Não foi possível baixar a imagem.');
                        return true;
                    }
                    
                    // Salva a imagem temporariamente
                    const buffer = Buffer.from(media.data, 'base64');
                    const tempPath = path.join(__dirname, 'imagens_temp', `temp_${Date.now()}.jpg`);
                    fs.writeFileSync(tempPath, buffer);
                    
                    // Analisa a imagem
                    const analise = await analisarImagemComIA(tempPath);
                    
                    // Salva resultado da análise
                    const resumoBreve = analise.split('\n')[0].substring(0, 100) + "...";
                    registrarAnaliseImagem(resumoBreve, analise, autor);
                    
                    // Responde com a análise
                    await client.sendMessage(msg.from, `*Análise Concisa da Imagem:*\n\n${analise}`);
                    return true;
                } else {
                    await client.sendMessage(msg.from, 'A mensagem respondida não contém uma imagem para análise.');
                    return true;
                }
            } else {
                await client.sendMessage(msg.from, 'Para analisar uma imagem, responda a uma mensagem com imagem usando o comando !analisar');
                return true;
            }
        }
        
        // Comando !assistente
        if (prefixo === '!assistente') {
            if (args === 'on') {
                modoAssistente = true;
                await client.sendMessage(msg.from, '✅ Modo assistente ativado. O Agente 077 agora participará ativamente nas conversas oferecendo análises e sugestões.');
                console.log(`Modo assistente ATIVADO para: ${msg.from}`);
                
                // Confirma ativação com uma resposta imediata
                setTimeout(async () => {
                    await client.sendMessage(msg.from, '*Assistente Agente 077:*\n\nEstou ativo e monitorando a conversa. Posso ajudar com análises, sugestões e insights sobre as discussões do grupo.');
                }, 2000);
                
                return true;
            } else if (args === 'off') {
                modoAssistente = false;
                await client.sendMessage(msg.from, '❌ Modo assistente desativado. O Agente 077 agora responderá apenas a comandos específicos.');
                console.log(`Modo assistente DESATIVADO para: ${msg.from}`);
                return true;
            } else {
                await client.sendMessage(msg.from, 'Uso correto: !assistente on ou !assistente off');
                return true;
            }
        }
        
        // Comando !relatorio
        if (prefixo === '!relatorio') {
            await client.sendMessage(msg.from, '📊 Gerando relatório completo, aguarde um momento...');
            
            const relatorio = await gerarRelatorioDetalhado(true);
            
            await client.sendMessage(msg.from, relatorio);
            console.log(`Relatório completo enviado para: ${msg.from}`);
            return true;
        }
        
        // Comando !relatorio-parcial
        if (prefixo === '!relatorio-parcial' || prefixo === '!relatório-parcial' || prefixo === '!relatorioparcial') {
            await client.sendMessage(msg.from, '📊 Gerando relatório parcial, aguarde um momento...');
            
            const relatorio = await gerarRelatorioDetalhado(false);
            
            await client.sendMessage(msg.from, relatorio);
            console.log(`Relatório parcial enviado para: ${msg.from}`);
            return true;
        }
        
        // Se chegou aqui, não é um comando conhecido
        return false;
    } catch (error) {
        console.error('Erro ao processar comando:', error);
        return false;
    }
}

// CORREÇÃO: Função unificada para processar mensagens e evitar duplicação
async function processarMensagem(msg) {
    try {
        // Verifica se a mensagem já foi processada (evita duplicação)
        const msgId = msg.id ? msg.id._serialized || msg.id : `${Date.now()}_${msg.from}`;
        if (mensagensProcessadas.has(msgId)) {
            return;
        }
        
        // Marca a mensagem como processada
        mensagensProcessadas.add(msgId);
        
        // Limita o tamanho do conjunto para evitar uso excessivo de memória
        if (mensagensProcessadas.size > 1000) {
            const idsArray = [...mensagensProcessadas];
            mensagensProcessadas.clear();
            idsArray.slice(-500).forEach(id => mensagensProcessadas.add(id));
        }
        
        // Verifica se a mensagem é do grupo configurado
        if (process.env.GRUPO_ID && msg.from !== process.env.GRUPO_ID) {
            console.log(`Mensagem ignorada: não é do grupo configurado (${process.env.GRUPO_ID})`);
            return;
        }
        
        // Ignora mensagens do próprio bot
        if (msg.fromMe) {
            return;
        }
        
        console.log(`[MENSAGEM] De ${msg.from}: ${msg.body}`);
        
        // Tenta processar como comando
        const foiComando = await processarComando(msg);
        
        // Se não foi um comando, verifica outras condições
        if (!foiComando) {
            // Se tem mídia e é imagem, analisa automaticamente
            if (msg.hasMedia && msg.type === 'image' && process.env.ANALISE_IMAGENS === 'true') {
                try {
                    const media = await msg.downloadMedia();
                    if (media) {
                        const buffer = Buffer.from(media.data, 'base64');
                        const tempPath = path.join(__dirname, 'imagens_temp', `temp_${Date.now()}.jpg`);
                        fs.writeFileSync(tempPath, buffer);
                        
                        console.log('Imagem recebida. Analisando automaticamente...');
                        
                        // Análise mais concisa para imagens automáticas
                        const analise = await analisarImagemComIA(tempPath);
                        const resumoBreve = analise.split('\n')[0].substring(0, 100) + "...";
                        
                        // Registra a análise sem enviar mensagem
                        registrarAnaliseImagem(resumoBreve, analise, msg.author || msg.from.split('@')[0]);
                        
                        console.log('Imagem analisada e armazenada para o relatório: ' + resumoBreve);
                    }
                } catch (error) {
                    console.error('Erro ao processar imagem automaticamente:', error);
                }
            }
            
            // Se modo assistente estiver ativado, analisa mensagens normais
            if (modoAssistente && msg.body.length > 10) {
                // Registra a mensagem para discussões
                // Detecta o tópico baseado no conteúdo
                let topico = "Geral";
                
                if (msg.body.toLowerCase().includes("desaparecido") || msg.body.toLowerCase().includes("busca")) {
                    topico = "Buscas";
                } else if (msg.body.toLowerCase().includes("roubo") || msg.body.toLowerCase().includes("furto")) {
                    topico = "Crimes contra patrimônio";
                } else if (msg.body.toLowerCase().includes("político") || msg.body.toLowerCase().includes("governo")) {
                    topico = "Assuntos políticos";
                }
                
                console.log(`Modo assistente: Registrando mensagem no tópico "${topico}"`);
                registrarDiscussao(topico, msg.body, msg.author || msg.from.split('@')[0]);
                
                // Aumenta chance de resposta para ser mais participativo (de 30% para 50%)
                if (Math.random() < 0.5) {
                    console.log(`Modo assistente: Preparando resposta para mensagem`);
                    
                    // Responde em até 10 segundos
                    const tempoResposta = 2000 + Math.random() * 8000;
                    
                    setTimeout(async () => {
                        try {
                            const analise = await analisarTextoComIA(msg.body, "Resposta ao comentário do grupo");
                            
                            // Limita o tamanho da resposta
                            let resposta = analise;
                            if (resposta.length > 500) {
                                resposta = resposta.substring(0, 497) + "...";
                            }
                            
                            // Envia a resposta
                            await client.sendMessage(msg.from, `*Assistente Agente 077:*\n\n${resposta}`);
                            console.log(`Modo assistente: Resposta enviada`);
                        } catch (error) {
                            console.error('Erro ao gerar resposta do assistente:', error);
                        }
                    }, tempoResposta);
                } else {
                    console.log(`Modo assistente: Mensagem registrada, mas sem resposta desta vez`);
                }
            }
        }
    } catch (error) {
        console.error('Erro no processamento de mensagem:', error);
    }
}

// CORREÇÃO: Usar a mesma função de processamento para ambos os eventos
client.on('message', processarMensagem);
client.on('message_create', processarMensagem);

// Tratamento de desconexão
client.on('disconnected', (reason) => {
    console.log('Bot desconectado:', reason);
    console.log('Tentando reconectar...');
    
    setTimeout(() => {
        client.initialize();
    }, 5000);
});

// Agenda limpeza de dados
agendarLimpezaDados();

// Inicializa o cliente
console.log('Inicializando Agente 077...');
console.log('Um navegador será aberto. NÃO feche o navegador!');
console.log('Aguarde o QR code aparecer...');

client.initialize()
    .catch(error => {
        console.log(`Erro ao inicializar o cliente: ${error.message}`);
    });

// Mantém o processo rodando
process.stdin.resume();

// Tratamento de encerramento limpo
process.on('SIGINT', () => {
    console.log('Encerrando Agente 077...');
    salvarDados();
    client.destroy();
    setTimeout(() => process.exit(0), 1000);
});

// Controle para manter o servidor ativo
process.on('SIGTERM', async () => {
    console.log('Recebido sinal SIGTERM, encerrando...');
    await client.destroy();
    process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.log(`Erro não capturado: ${error.message}`);
    console.log(error.stack);
});
