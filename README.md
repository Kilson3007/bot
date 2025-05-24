# Agente 077 - Bot Avançado para WhatsApp

Bot para WhatsApp com análise de imagens, assistência em casos e geração de relatórios detalhados.

## Requisitos

- Node.js 16.x (importante: versão 16 é necessária para compatibilidade)
- Conta no WhatsApp para o bot
- Conexão à internet

## Instalação

1. Clone este repositório
2. Execute `npm install` para instalar as dependências

## Configuração

Todas as configurações são feitas através de variáveis de ambiente, que podem ser definidas de duas formas:

1. Arquivo `.env` (para desenvolvimento local)
2. Variáveis de ambiente na plataforma Render (para produção)

Para gerar um arquivo `.env` com os valores padrão, execute:

```
node gerar_env.js
```

### Variáveis de Ambiente

- `GEMINI_API_KEY`: Chave API do Google Gemini para análise de imagens e texto
- `GEMINI_MODEL`: Modelo do Gemini a ser usado (padrão: gemini-1.5-flash)
- `GRUPO_ID`: ID do grupo do WhatsApp onde o bot será ativado
- `ANALISE_IMAGENS`: Define se o bot analisará imagens automaticamente (true/false)
- `MONITORAMENTO_ATIVO`: Define se o bot enviará mensagens de status (true/false)
- `ENVIO_AUTOMATICO`: Define se o bot enviará relatórios automaticamente (true/false)
- `LIMITE_IMAGENS_DIA`: Número máximo de imagens a serem analisadas por dia
- `HORARIO_RELATORIO_PARCIAL`: Horário para envio do relatório parcial (formato: HH:MM)
- `HORARIO_RELATORIO_COMPLETO`: Horário para envio do relatório completo (formato: HH:MM)
- `EMAIL_NOTIFICACAO`: Email para receber o QR code de conexão
- `EMAIL_REMETENTE`: Email remetente para envio de notificações
- `EMAIL_SENHA`: Senha do email remetente (recomendável: senha de app específica para Gmail)

## Execução Local

Para iniciar o bot localmente:

```
npm start
```

ou

```
node bot.js
```

## Deploy no Render

O projeto está configurado para ser facilmente implantado no Render. Siga estes passos:

1. Crie uma conta no [Render](https://render.com)
2. Conecte com seu repositório GitHub
3. Crie um novo Web Service
4. Selecione o repositório e o branch
5. Configure conforme abaixo:
   - **Nome**: agente077-bot (ou outro nome)
   - **Ambiente**: Node
   - **Build Command**: npm install
   - **Start Command**: node bot.js
   - **Node Version**: 16

As variáveis de ambiente já estão configuradas no arquivo `render.yaml`, mas você pode ajustá-las no painel do Render.

## Primeira Conexão

Quando o bot for iniciado pela primeira vez, ele vai gerar um QR code que você deve escanear com seu WhatsApp para autenticar. Este QR code será:

1. Exibido no terminal
2. Enviado para o email configurado em `EMAIL_NOTIFICACAO`
3. Disponibilizado temporariamente na página web do bot

## Comandos Disponíveis

- `!id` - Mostra o ID do chat/grupo
- `!ajuda` - Lista de todos os comandos disponíveis
- `!caso [descrição]` - Registra um novo caso
- `!buscar [descrição]` - Busca por pessoa desaparecida
- `!analisar` - Responda a uma imagem com este comando para analisá-la
- `!assistente on/off` - Ativa/desativa o modo assistente
- `!relatorio` - Gera relatório completo
- `!relatorio-parcial` - Gera relatório parcial

## Suporte

Se encontrar problemas, verifique os logs do servidor ou a página de status que fica disponível em `http://seu-servico-render.onrender.com/`.

---

© 2023 Agente 077 - Todos os direitos reservados.
