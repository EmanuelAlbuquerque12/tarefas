@echo off
chcp 65001 >nul
cls

color 0C
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║     Parando Servidor do Dashboard                            ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo Procurando processos Node.js na porta 3000...
echo.

:: Mata todos os processos node.js (cuidado se tiver outros apps Node rodando)
taskkill /F /IM node.exe >nul 2>&1

if %errorlevel% equ 0 (
    color 0A
    echo ✓ Servidor encerrado com sucesso!
) else (
    color 0E
    echo ⚠ Nenhum servidor Node.js em execução foi encontrado.
)

echo.
echo Você pode fechar esta janela.
echo.
timeout /t 3 /nobreak >nul
