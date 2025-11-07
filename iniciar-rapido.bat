@echo off
cls
echo Iniciando Dashboard de Tarefas...
echo.
echo Abrindo navegador em 3 segundos...
timeout /t 3 /nobreak >nul
start http://localhost:3000
node server.js
