@echo off
chcp 65001 >nul
cls

:: ==================================================================
:: Dashboard de Tarefas - Cassel Ruzzarin
:: Integração com API Projuris
:: ==================================================================

color 0A
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║     Dashboard de Tarefas - Cassel Ruzzarin                   ║
echo ║     Integrado com API Projuris                               ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

:: Verifica se o Node.js está instalado
echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ❌ ERRO: Node.js não está instalado!
    echo.
    echo Por favor, instale o Node.js em: https://nodejs.org/
    echo Baixe a versão LTS (recomendada) e instale.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% encontrado
echo.

:: Verifica se as dependências estão instaladas
echo [2/4] Verificando dependências...
if not exist "node_modules\" (
    echo ⚠ Dependências não encontradas. Instalando...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo ❌ ERRO ao instalar dependências!
        echo.
        pause
        exit /b 1
    )
    echo.
    echo ✓ Dependências instaladas com sucesso
) else (
    echo ✓ Dependências já instaladas
)
echo.

:: Verifica se o arquivo .env existe
echo [3/4] Verificando configuração...
if not exist ".env" (
    color 0E
    echo.
    echo ⚠ AVISO: Arquivo .env não encontrado!
    echo.
    echo Criando arquivo .env com configurações padrão...
    (
        echo # Configurações da API Projuris
        echo PROJURIS_DOMAIN=servidor
        echo PROJURIS_USER=sistemacassel@servidor.adv.br
        echo PROJURIS_PASSWORD=CRrKrw9D63TvHi
        echo PROJURIS_API_URL=https://api.projurisadv.com.br/adv-service
        echo PROJURIS_TOKEN_URL=https://apigw.projurisadv.com.br/auth/token
        echo PROJURIS_CLIENT_ID=api_cliente_codigo_12964
        echo PROJURIS_CLIENT_SECRET=@2022@8da6df1ca4914b04a5df3566278e5393
        echo.
        echo # Configurações do servidor
        echo PORT=3000
        echo NODE_ENV=development
    ) > .env
    echo ✓ Arquivo .env criado
    color 0A
) else (
    echo ✓ Arquivo .env encontrado
)
echo.

:: Inicia o servidor
echo [4/4] Iniciando servidor...
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo 🚀 Servidor iniciando...
echo 📡 URL: http://localhost:3000
echo.
echo ⏳ Aguarde alguns segundos para o servidor iniciar...
echo 🌐 O navegador abrirá automaticamente em 5 segundos
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

:: Aguarda 5 segundos e abre o navegador
start /B cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000"

:: Inicia o servidor (este comando bloqueia o terminal)
echo 📊 Dashboard rodando! Mantenha esta janela aberta.
echo.
echo ⚠ Para PARAR o servidor, pressione Ctrl+C
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

node server.js

:: Se o servidor parar (Ctrl+C ou erro)
echo.
echo ═══════════════════════════════════════════════════════════════
echo Servidor encerrado.
echo ═══════════════════════════════════════════════════════════════
echo.
pause
