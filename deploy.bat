@echo off
echo 🤖 Preparando deploy do Agente 077...

REM Verifica se o git está instalado
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git não encontrado. Por favor, instale o Git antes de continuar.
    exit /b 1
)

REM Verifica se estamos em um repositório git
if not exist .git (
    echo 📂 Inicializando repositório Git...
    git init
    
    REM Verifica se a inicialização foi bem-sucedida
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Falha ao inicializar o repositório Git.
        exit /b 1
    )
)

REM Adiciona todos os arquivos (exceto os listados no .gitignore)
echo 📁 Adicionando arquivos ao repositório...
git add .

REM Commit com mensagem padrão ou personalizada
set commit_message=Deploy do Agente 077 - %date% %time%
if not "%~1"=="" (
    set commit_message=%~1
)

echo ✅ Criando commit: %commit_message%
git commit -m "%commit_message%"

REM Verifica se existe um remote configurado
git remote -v | findstr "origin" >nul
if %ERRORLEVEL% NEQ 0 (
    echo 🔗 Nenhum repositório remoto configurado.
    echo Por favor, execute o comando abaixo substituindo YOUR_REPO_URL pela URL do seu repositório GitHub:
    echo.
    echo     git remote add origin YOUR_REPO_URL
    echo     git push -u origin master
    echo.
) else (
    REM Push para o repositório remoto
    echo 🚀 Enviando para o GitHub...
    git push -u origin master || git push -u origin main
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Deploy concluído com sucesso!
        echo 📱 Acesse o Render para continuar a configuração do seu serviço.
    ) else (
        echo ❌ Falha ao enviar para o GitHub. Verifique suas credenciais e tente novamente.
    )
)

echo 🤖 Processo de deploy finalizado.
pause 