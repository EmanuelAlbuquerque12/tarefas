@echo off
cls
echo.
echo ============================================================
echo   Dashboard de Tarefas - Cassel Ruzzarin
echo ============================================================
echo.
echo Iniciando servidor...
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo Instalando dependencias pela primeira vez...
    echo Isso pode levar alguns minutos...
    echo.
    npm install
)

echo Abrindo navegador...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo Servidor rodando! Nao feche esta janela.
echo Pressione Ctrl+C para parar o servidor.
echo.

npm start
