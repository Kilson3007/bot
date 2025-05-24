#!/bin/bash

# Script para facilitar o deploy do Agente 077 no GitHub

echo "🤖 Preparando deploy do Agente 077..."

# Verifica se o git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git não encontrado. Por favor, instale o Git antes de continuar."
    exit 1
fi

# Verifica se estamos em um repositório git
if [ ! -d .git ]; then
    echo "📂 Inicializando repositório Git..."
    git init
    
    # Verifica se a inicialização foi bem-sucedida
    if [ $? -ne 0 ]; then
        echo "❌ Falha ao inicializar o repositório Git."
        exit 1
    fi
fi

# Adiciona todos os arquivos (exceto os listados no .gitignore)
echo "📁 Adicionando arquivos ao repositório..."
git add .

# Commit com mensagem padrão ou personalizada
if [ -z "$1" ]; then
    commit_message="Deploy do Agente 077 - $(date '+%Y-%m-%d %H:%M:%S')"
else
    commit_message="$1"
fi

echo "✅ Criando commit: $commit_message"
git commit -m "$commit_message"

# Verifica se existe um remote configurado
if ! git remote -v | grep -q "origin"; then
    echo "🔗 Nenhum repositório remoto configurado."
    echo "Por favor, execute o comando abaixo substituindo YOUR_REPO_URL pela URL do seu repositório GitHub:"
    echo ""
    echo "    git remote add origin YOUR_REPO_URL"
    echo "    git push -u origin master"
    echo ""
else
    # Push para o repositório remoto
    echo "🚀 Enviando para o GitHub..."
    git push -u origin master || git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Deploy concluído com sucesso!"
        echo "📱 Acesse o Render para continuar a configuração do seu serviço."
    else
        echo "❌ Falha ao enviar para o GitHub. Verifique suas credenciais e tente novamente."
    fi
fi

echo "🤖 Processo de deploy finalizado." 