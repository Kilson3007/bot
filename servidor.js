// Servidor HTTP para manter o bot ativo no Render
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Inicializa o contador de pings
let contadorPings = 0;
const inicioServidor = new Date();

// Cria o servidor HTTP
const server = http.createServer((req, res) => {
    // Rota para servir o QR code como imagem
    if (req.url === '/qrcode' || req.url === '/qrcode.png') {
        try {
            // Tenta usar o caminho global se estiver disponível
            const qrCodePath = global.qrCodePath || path.join(__dirname, 'qrcode_atual.png');
            
            // Se estamos em produção, tenta o caminho no /tmp como fallback
            const prodFallbackPath = process.env.NODE_ENV === 'production' ? 
                path.join('/tmp', 'qrcode_atual.png') : null;
            
            // Verifica se existe no caminho principal
            if (fs.existsSync(qrCodePath)) {
                const qrData = fs.readFileSync(qrCodePath);
                res.writeHead(200, { 'Content-Type': 'image/png' });
                res.end(qrData);
                return;
            } 
            // Verifica o fallback se estamos em produção
            else if (prodFallbackPath && fs.existsSync(prodFallbackPath)) {
                const qrData = fs.readFileSync(prodFallbackPath);
                res.writeHead(200, { 'Content-Type': 'image/png' });
                res.end(qrData);
                return;
            } 
            else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('QR Code não disponível no momento');
                return;
            }
        } catch (error) {
            console.error('Erro ao acessar QR Code:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Erro ao acessar QR Code: ' + error.message);
            return;
        }
    }
    
    // Rota para a página do QR code
    if (req.url === '/scan' || req.url === '/qr') {
        // Verifica se o QR code existe em qualquer um dos locais possíveis
        const qrCodePath = global.qrCodePath || path.join(__dirname, 'qrcode_atual.png');
        const prodFallbackPath = process.env.NODE_ENV === 'production' ? 
            path.join('/tmp', 'qrcode_atual.png') : null;
            
        const qrCodeExiste = fs.existsSync(qrCodePath) || 
            (prodFallbackPath && fs.existsSync(prodFallbackPath));
        
        // Verifica se temos o texto do QR code
        const qrCodeText = global.qrCodeText || '';
        
        // Tenta ler o texto do arquivo se não estiver na memória
        let qrCodeTextFromFile = '';
        try {
            const tempDir = process.env.NODE_ENV === 'production' ? '/tmp' : __dirname;
            const qrCodeTextPath = path.join(tempDir, 'qrcode_atual.txt');
            
            if (fs.existsSync(qrCodeTextPath)) {
                qrCodeTextFromFile = fs.readFileSync(qrCodeTextPath, 'utf8');
            }
        } catch (error) {
            console.error('Erro ao ler arquivo de texto do QR code:', error);
        }
        
        // Usa o texto da memória ou do arquivo
        const finalQrCodeText = qrCodeText || qrCodeTextFromFile || '';
        
        // Determina qual conteúdo mostrar na página
        let qrContent = '';
        
        if (qrCodeExiste) {
            // Se a imagem existe, mostramos ela
            qrContent = `<img src="/qrcode?t=${Date.now()}" alt="QR Code para escanear" class="qr-image">`;
        } else if (finalQrCodeText) {
            // Se não temos a imagem mas temos o texto, mostramos instruções
            qrContent = `
                <div class="text-instructions">
                    <p>Não foi possível gerar a imagem do QR Code, mas você pode usar o texto abaixo:</p>
                    
                    <ol>
                        <li>Copie o texto do QR code abaixo</li>
                        <li>Acesse um gerador online como <a href="https://www.the-qrcode-generator.com/" target="_blank">este site</a> ou <a href="https://www.qr-code-generator.com/" target="_blank">este outro</a></li>
                        <li>Cole o texto, gere o QR code e escaneie com o WhatsApp</li>
                    </ol>
                    
                    <div class="qr-text-container">
                        <textarea id="qrCodeText" readonly>${finalQrCodeText}</textarea>
                        <button onclick="copyQRText()" class="copy-button">Copiar</button>
                    </div>
                    
                    <div class="direct-links">
                        <p><strong>Links diretos para geradores:</strong></p>
                        <a href="https://www.qrcode-monkey.com/#text" class="generator-link" target="_blank">QRCode Monkey</a>
                        <a href="https://www.qr-code-generator.com/" class="generator-link" target="_blank">QR Code Generator</a>
                        <a href="https://www.the-qrcode-generator.com/" class="generator-link" target="_blank">The QR Code Generator</a>
                    </div>
                    
                    <div class="direct-qr">
                        <p><strong>QR Code gerado diretamente:</strong></p>
                        <p class="note">Se o QR code abaixo aparecer, você pode escaneá-lo diretamente:</p>
                        <div id="qrcode-container"></div>
                    </div>
                </div>
            `;
        } else {
            // Se não temos nem imagem nem texto
            qrContent = '<p>QR Code não disponível no momento. Tente recarregar a página em alguns segundos.</p>';
        }
        
        const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Agente 077 - Escaneie o QR Code</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    margin: 0;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                h1 {
                    color: #333;
                }
                .qr-container {
                    margin: 30px 0;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    background-color: white;
                }
                .qr-image {
                    max-width: 100%;
                    height: auto;
                }
                .status {
                    margin-top: 20px;
                    padding: 10px;
                    border-radius: 5px;
                }
                .status.available {
                    background-color: #e8f5e9;
                    color: #388e3c;
                }
                .status.unavailable {
                    background-color: #ffebee;
                    color: #d32f2f;
                }
                .refresh-button {
                    padding: 10px 20px;
                    background-color: #2196f3;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    margin-top: 20px;
                }
                .refresh-button:hover {
                    background-color: #0b7dda;
                }
                .instructions {
                    margin-top: 30px;
                    text-align: left;
                    padding: 15px;
                    background-color: #f9f9f9;
                    border-radius: 5px;
                }
                .auto-refresh {
                    font-size: 12px;
                    color: #666;
                    margin-top: 10px;
                }
                .text-instructions {
                    text-align: left;
                    margin: 20px 0;
                    padding: 15px;
                    background-color: #fff3e0;
                    border-radius: 5px;
                    border: 1px solid #ffe0b2;
                }
                .qr-text-container {
                    margin-top: 15px;
                    position: relative;
                }
                #qrCodeText {
                    width: 100%;
                    height: 100px;
                    padding: 10px;
                    font-family: monospace;
                    margin-bottom: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .copy-button {
                    padding: 8px 15px;
                    background-color: #4caf50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .copy-button:hover {
                    background-color: #43a047;
                }
                .direct-links {
                    margin-top: 20px;
                    padding: 10px;
                    background-color: #e3f2fd;
                    border-radius: 5px;
                }
                .generator-link {
                    display: inline-block;
                    margin: 5px 10px;
                    padding: 8px 15px;
                    background-color: #2196f3;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                }
                .generator-link:hover {
                    background-color: #0b7dda;
                }
                .direct-qr {
                    margin-top: 20px;
                    padding: 15px;
                    background-color: #f1f8e9;
                    border-radius: 5px;
                }
                .note {
                    font-size: 14px;
                    color: #666;
                }
                #qrcode-container {
                    margin: 20px auto;
                    max-width: 256px;
                }
            </style>
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
        </head>
        <body>
            <div class="container">
                <h1>Agente 077 - Bot WhatsApp</h1>
                
                <div class="qr-container">
                    ${qrContent}
                </div>
                
                <div class="status ${qrCodeExiste || finalQrCodeText ? 'available' : 'unavailable'}">
                    ${qrCodeExiste ? 
                        'QR Code disponível! Escaneie usando o WhatsApp em seu celular.' : 
                        finalQrCodeText ? 
                        'QR Code disponível como texto. Siga as instruções acima.' :
                        'QR Code não está disponível. Aguarde ou reinicie o bot.'}
                </div>
                
                <button class="refresh-button" onclick="window.location.reload()">Atualizar Página</button>
                
                <p class="auto-refresh">Esta página será atualizada automaticamente a cada 10 segundos.</p>
                
                <div class="instructions">
                    <h3>Como conectar:</h3>
                    <ol>
                        <li>Abra o WhatsApp no seu celular</li>
                        <li>Toque em Menu ou Configurações</li>
                        <li>Selecione "Dispositivos Conectados"</li>
                        <li>Toque em "Conectar um Dispositivo"</li>
                        <li>Aponte a câmera para este QR Code</li>
                    </ol>
                </div>
            </div>
            
            <script>
                // Função para copiar o texto do QR code
                function copyQRText() {
                    const textArea = document.getElementById('qrCodeText');
                    textArea.select();
                    document.execCommand('copy');
                    alert('Texto do QR code copiado para a área de transferência!');
                }
                
                // Tenta gerar o QR code diretamente no navegador
                document.addEventListener('DOMContentLoaded', function() {
                    const qrText = document.getElementById('qrCodeText');
                    const qrContainer = document.getElementById('qrcode-container');
                    
                    if (qrText && qrContainer && window.QRCode) {
                        try {
                            // Limpa o container antes de gerar um novo QR code
                            qrContainer.innerHTML = '';
                            
                            // Gera o QR code
                            new QRCode(qrContainer, {
                                text: qrText.value,
                                width: 256,
                                height: 256,
                                colorDark: "#000000",
                                colorLight: "#ffffff",
                                correctLevel: QRCode.CorrectLevel.H
                            });
                        } catch (error) {
                            console.error('Erro ao gerar QR code no navegador:', error);
                            qrContainer.innerHTML = '<p>Não foi possível gerar o QR code no navegador.</p>';
                        }
                    }
                });
                
                // Atualiza a página a cada 10 segundos
                setTimeout(() => {
                    window.location.reload();
                }, 10000);
            </script>
        </body>
        </html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
    }
    
    // Rota para fornecer o texto do QR code
    if (req.url === '/qrtext') {
        try {
            // Tenta usar o texto global se estiver disponível
            if (global.qrCodeText) {
                res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(global.qrCodeText);
                return;
            }
            
            // Se não temos na memória, tenta ler do arquivo
            const tempDir = process.env.NODE_ENV === 'production' ? '/tmp' : __dirname;
            const qrCodeTextPath = path.join(tempDir, 'qrcode_atual.txt');
            
            if (fs.existsSync(qrCodeTextPath)) {
                const qrText = fs.readFileSync(qrCodeTextPath, 'utf8');
                res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(qrText);
                return;
            }
            
            // Se não encontrou em nenhum lugar
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Texto do QR Code não disponível no momento');
            return;
        } catch (error) {
            console.error('Erro ao acessar texto do QR Code:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Erro ao acessar texto do QR Code: ' + error.message);
            return;
        }
    }
    
    // Rota para visualizar QR code simples em HTML
    if (req.url === '/qrsimples') {
        try {
            // Tenta obter o texto do QR code
            let qrCodeText = global.qrCodeText || '';
            
            if (!qrCodeText) {
                // Se não temos na memória, tenta ler do arquivo
                const tempDir = process.env.NODE_ENV === 'production' ? '/tmp' : __dirname;
                const qrCodeTextPath = path.join(tempDir, 'qrcode_atual.txt');
                
                if (fs.existsSync(qrCodeTextPath)) {
                    qrCodeText = fs.readFileSync(qrCodeTextPath, 'utf8');
                }
            }
            
            if (!qrCodeText) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('QR Code não disponível no momento');
                return;
            }
            
            // Cria uma página HTML simples
            const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>QR Code Simples</title>
                <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 20px;
                        background-color: #ffffff;
                    }
                    #qrcode {
                        margin: 20px auto;
                        max-width: 300px;
                        background-color: white;
                        padding: 15px;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    .texto {
                        margin-top: 20px;
                        padding: 10px;
                        background-color: #f5f5f5;
                        border-radius: 5px;
                        font-family: monospace;
                        text-align: left;
                        white-space: pre-wrap;
                        word-break: break-all;
                        font-size: 12px;
                        margin-bottom: 20px;
                    }
                    h1 {
                        font-size: 24px;
                        color: #333;
                    }
                    .instrucoes {
                        background-color: #e8f5e9;
                        padding: 15px;
                        border-radius: 5px;
                        text-align: left;
                        margin: 20px 0;
                    }
                    .instrucoes ol {
                        margin-left: 20px;
                        padding-left: 0;
                    }
                    .nota {
                        font-size: 12px;
                        color: #666;
                        margin-top: 30px;
                    }
                </style>
            </head>
            <body>
                <h1>QR Code para WhatsApp</h1>
                
                <div class="instrucoes">
                    <h3>Como conectar:</h3>
                    <ol>
                        <li>Abra o WhatsApp no seu celular</li>
                        <li>Toque em Menu ou Configurações</li>
                        <li>Selecione "Dispositivos Conectados"</li>
                        <li>Toque em "Conectar um Dispositivo"</li>
                        <li>Aponte a câmera para o QR Code abaixo</li>
                    </ol>
                </div>
                
                <div id="qrcode"></div>
                
                <p>Se o QR code acima não funcionar, use o texto abaixo:</p>
                <div class="texto">${qrCodeText}</div>
                
                <p class="nota">Esta página será atualizada automaticamente a cada 15 segundos</p>
                
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        var qrcode = new QRCode(document.getElementById("qrcode"), {
                            text: "${qrCodeText.replace(/"/g, '\\"')}",
                            width: 256,
                            height: 256,
                            colorDark: "#000000",
                            colorLight: "#ffffff",
                            correctLevel: QRCode.CorrectLevel.H
                        });
                    });
                    
                    // Atualiza a página a cada 15 segundos
                    setTimeout(function() {
                        window.location.reload();
                    }, 15000);
                </script>
            </body>
            </html>
            `;
            
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return;
        } catch (error) {
            console.error('Erro ao gerar página QR simples:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Erro ao gerar página QR simples: ' + error.message);
            return;
        }
    }
    
    // Incrementa o contador de pings
    contadorPings++;
    
    // Prepara informações para a página de status
    const uptime = Math.floor((new Date() - inicioServidor) / 1000);
    const dias = Math.floor(uptime / 86400);
    const horas = Math.floor((uptime % 86400) / 3600);
    const minutos = Math.floor((uptime % 3600) / 60);
    const segundos = uptime % 60;
    
    const uptimeFormatado = `${dias}d ${horas}h ${minutos}m ${segundos}s`;
    const memoriaUsada = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const hostname = os.hostname();
    
    // Verifica se existe o arquivo de log mais recente
    let ultimoLog = "Nenhum log disponível";
    try {
        const logsDir = path.join(__dirname, 'logs');
        if (fs.existsSync(logsDir)) {
            const arquivos = fs.readdirSync(logsDir);
            if (arquivos.length > 0) {
                // Obtém o arquivo de log mais recente
                const ultimoArquivo = arquivos
                    .filter(file => file.startsWith('conexao_'))
                    .sort()
                    .reverse()[0];
                
                if (ultimoArquivo) {
                    ultimoLog = fs.readFileSync(path.join(logsDir, ultimoArquivo), 'utf8');
                }
            }
        }
    } catch (error) {
        console.error('Erro ao ler logs:', error);
    }
    
    // Verifica se o QR code atual existe
    let qrCodeExiste = false;
    try {
        // Verifica se o QR code existe em qualquer um dos locais possíveis
        const qrCodePath = global.qrCodePath || path.join(__dirname, 'qrcode_atual.png');
        const prodFallbackPath = process.env.NODE_ENV === 'production' ? 
            path.join('/tmp', 'qrcode_atual.png') : null;
            
        qrCodeExiste = fs.existsSync(qrCodePath) || 
            (prodFallbackPath && fs.existsSync(prodFallbackPath));
    } catch (error) {
        console.error('Erro ao verificar QR code:', error);
    }
    
    // Verifica se temos o texto do QR code
    let textoQRExiste = false;
    try {
        textoQRExiste = !!global.qrCodeText;
        
        if (!textoQRExiste) {
            const tempDir = process.env.NODE_ENV === 'production' ? '/tmp' : __dirname;
            const qrCodeTextPath = path.join(tempDir, 'qrcode_atual.txt');
            textoQRExiste = fs.existsSync(qrCodeTextPath);
        }
    } catch (error) {
        console.error('Erro ao verificar texto do QR code:', error);
    }
    
    // Cria a página HTML de status
    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Status do Agente 077</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.6;
            }
            h1 {
                color: #333;
                text-align: center;
                border-bottom: 2px solid #eee;
                padding-bottom: 10px;
            }
            .status-card {
                background: #f9f9f9;
                border-radius: 5px;
                padding: 15px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .status-item {
                margin-bottom: 10px;
            }
            .status-item strong {
                display: inline-block;
                width: 150px;
            }
            .log-box {
                background: #f5f5f5;
                border: 1px solid #ddd;
                padding: 10px;
                border-radius: 4px;
                font-family: monospace;
                white-space: pre-wrap;
                max-height: 200px;
                overflow-y: auto;
            }
            .status-online {
                color: green;
                font-weight: bold;
            }
            .status-warning {
                color: orange;
                font-weight: bold;
            }
            .button {
                display: inline-block;
                width: 200px;
                margin: 10px auto;
                padding: 10px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 16px;
                cursor: pointer;
                text-align: center;
                text-decoration: none;
            }
            .button-warning {
                background: #ff9800;
            }
            .button-danger {
                background: #f44336;
            }
            .button:hover {
                opacity: 0.9;
            }
            .buttons-container {
                text-align: center;
                margin: 20px 0;
            }
            .qr-options-card {
                background-color: #fff3e0;
                border-radius: 5px;
                padding: 15px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border-left: 4px solid #ff9800;
            }
            .qr-options-title {
                color: #e65100;
                margin-top: 0;
            }
            .qr-options-list {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 10px;
                margin-top: 15px;
            }
            .small-button {
                padding: 8px 12px;
                background-color: #2196f3;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                font-size: 14px;
                display: inline-block;
            }
            .small-button:hover {
                background-color: #0b7dda;
            }
            .note {
                font-size: 13px;
                color: #666;
                font-style: italic;
                margin-top: 10px;
            }
        </style>
    </head>
    <body>
        <h1>Status do Agente 077</h1>
        
        <div class="status-card">
            <div class="status-item">
                <strong>Status:</strong> <span class="status-online">✅ Servidor Online</span>
            </div>
            <div class="status-item">
                <strong>Servidor:</strong> ${hostname}
            </div>
            <div class="status-item">
                <strong>Tempo online:</strong> ${uptimeFormatado}
            </div>
            <div class="status-item">
                <strong>Memória em uso:</strong> ${memoriaUsada} MB
            </div>
            <div class="status-item">
                <strong>Pings recebidos:</strong> ${contadorPings}
            </div>
            <div class="status-item">
                <strong>Iniciado em:</strong> ${inicioServidor.toLocaleString()}
            </div>
            <div class="status-item">
                <strong>QR Code disponível:</strong> ${qrCodeExiste || textoQRExiste ? '✅ Sim' : '❌ Não'}
            </div>
        </div>
        
        ${(qrCodeExiste || textoQRExiste) ? `
        <div class="qr-options-card">
            <h3 class="qr-options-title">📱 Opções de QR Code para WhatsApp</h3>
            <p>O QR code está disponível para escanear. Escolha uma das opções abaixo:</p>
            
            <div class="qr-options-list">
                <a href="/scan" class="small-button">🔍 QR Code Completo</a>
                <a href="/qrsimples" class="small-button">🔄 QR Code Simples</a>
                <a href="/qrtext" class="small-button" target="_blank">📋 Texto do QR Code</a>
            </div>
            
            <p class="note">Dica: Se uma opção não funcionar, tente outra. A página do QR Code Simples geralmente é a mais confiável.</p>
        </div>
        ` : ''}
        
        <div class="buttons-container">
            <a href="/" class="button">🔄 Atualizar Status</a>
            <a href="/scan" class="button ${qrCodeExiste || textoQRExiste ? 'button-warning' : ''}">
                ${qrCodeExiste || textoQRExiste ? '⚠️ Escanear QR Code' : 'Verificar QR Code'}
            </a>
        </div>
        
        <div class="status-card">
            <h3>Último Log de Conexão</h3>
            <div class="log-box">${ultimoLog}</div>
        </div>
        
        <p style="text-align: center; margin-top: 40px; color: #777; font-size: 14px;">
            Agente 077 - Bot para WhatsApp<br>
            Mantenha esta página aberta para evitar que o serviço adormeça no Render
        </p>
    </body>
    </html>
    `;
    
    // Envia a resposta
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
});

// Inicia o servidor na porta definida pelo Render ou na porta 3000 por padrão
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor HTTP iniciado na porta ${PORT}`);
    console.log(`Acesse http://localhost:${PORT} para ver o status do bot`);
    console.log(`Acesse http://localhost:${PORT}/scan para ver o QR code`);
});

// Exporta o servidor para usar no bot.js
module.exports = server; 
