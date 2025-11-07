@echo off
cls
color 0C
echo.
echo ============================================================
echo.
echo     Encerrando Servidor do Dashboard
echo.
echo ============================================================
echo.
echo Procurando processos Node.js...
echo.

taskkill /F /IM node.exe 2>nul

if errorlevel 1 (
    color 0E
    echo Nenhum servidor Node.js em execucao foi encontrado.
) else (
    color 0A
    echo Servidor encerrado com sucesso!
)

echo.
timeout /t 3 /nobreak >nul
