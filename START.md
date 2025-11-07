# 🚀 Guia de Inicialização Rápida

## Para iniciar o Dashboard de Tarefas Projuris:

### 1️⃣ Certifique-se de que está na pasta do projeto:
```bash
cd /home/user/tarefas
```

### 2️⃣ Inicie o servidor:
```bash
npm start
```

### 3️⃣ Abra seu navegador e acesse:
```
http://localhost:3000
```

---

## ✅ O que acontecerá:

1. O servidor será iniciado na porta 3000
2. O dashboard carregará automaticamente ao abrir a página
3. Os dados serão buscados da API Projuris automaticamente
4. Você verá:
   - Resumo de prazos (total, em atraso, concluídas, em aberto)
   - Gráficos interativos
   - Tabelas de tarefas em atraso e adiantadas
   - Filtros avançados
   - Botão para exportar Excel

---

## 🔄 Para recarregar dados:

Clique no botão **"Carregar/Atualizar Dados"** no topo da página.

---

## 🛑 Para parar o servidor:

Pressione `Ctrl+C` no terminal onde o servidor está rodando.

---

## 🔧 Troubleshooting:

### Erro "Port 3000 is already in use":
```bash
# Altere a porta no arquivo .env para outra porta (ex: 8080)
# Depois reinicie o servidor
```

### Erro de autenticação:
```bash
# Verifique se as credenciais no arquivo .env estão corretas
# Certifique-se de que tem conexão com a internet
```

### Nenhuma tarefa aparece:
- Verifique se sua conta tem permissão para acessar tarefas no Projuris
- Olhe o console do navegador (F12) para ver erros detalhados
- Verifique os logs do terminal onde o servidor está rodando

---

## 📞 Suporte:

Para mais informações, consulte o arquivo README.md
