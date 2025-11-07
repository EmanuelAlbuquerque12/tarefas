@echo off
chcp 65001 >nul 2>&1
cls
color 0A
echo.
echo ============================================================
echo.
echo     Dashboard de Tarefas - Cassel Ruzzarin
echo     Integrado com API Projuris
echo.
echo ============================================================
echo.
echo [1/4] Verificando Node.js...

node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo ERRO: Node.js nao esta instalado!
    echo.
    echo Por favor, instale o Node.js em: https://nodejs.org/
    echo Baixe a versao LTS e instale.
    echo.
    pause
    exit /b 1
)

echo OK - Node.js encontrado
echo.

echo [2/4] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    echo.
    call npm install
    if errorlevel 1 (
        color 0C
        echo.
        echo ERRO ao instalar dependencias!
        echo.
        pause
        exit /b 1
    )
    echo OK - Dependencias instaladas
) else (
    echo OK - Dependencias ja instaladas
)
echo.

echo [3/4] Verificando configuracao...
if not exist ".env" (
    echo Criando arquivo .env...
    (
        echo # Configuracoes da API Projuris
        echo PROJURIS_DOMAIN=servidor
        echo PROJURIS_USER=sistemacassel@servidor.adv.br
        echo PROJURIS_PASSWORD=CRrKrw9D63TvHi
        echo PROJURIS_API_URL=https://api.projurisadv.com.br/adv-service
        echo PROJURIS_TOKEN_URL=https://apigw.projurisadv.com.br/auth/token
        echo PROJURIS_CLIENT_ID=api_cliente_codigo_12964
        echo PROJURIS_CLIENT_SECRET=@2022@8da6df1ca4914b04a5df3566278e5393
        echo.
        echo # Configuracoes do servidor
        echo PORT=3000
        echo NODE_ENV=development
    ) > .env
    echo OK - Arquivo .env criado
) else (
    echo OK - Arquivo .env encontrado
)
echo.

echo [4/4] Iniciando servidor...
echo.
echo ============================================================
echo.
echo    Servidor iniciando...
echo    URL: http://localhost:3000
echo.
echo    Aguarde 5 segundos, o navegador abrira automaticamente
echo.
echo    Para PARAR o servidor, pressione Ctrl+C
echo.
echo ============================================================
echo.

timeout /t 5 /nobreak >nul
start http://localhost:3000

node server.js

echo.
echo ============================================================
echo Servidor encerrado.
echo ============================================================
echo.
pause
