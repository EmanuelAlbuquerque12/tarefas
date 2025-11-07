@echo off
:: Inicialização rápida (sem verificações)
cls
echo Iniciando Dashboard...
start http://localhost:3000
node server.js
