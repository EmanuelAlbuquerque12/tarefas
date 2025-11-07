# Dashboard de Tarefas - Cassel Ruzzarin

Dashboard integrado com a API do Projuris para visualização e análise de tarefas jurídicas.

## 🚀 Funcionalidades

- ✅ **Integração Automática com API Projuris** - Carregamento automático de dados sem necessidade de upload de planilhas
- 📊 **Dashboards Interativos** - Visualização em tempo real com gráficos e métricas
- 🔍 **Filtros Avançados** - Filtragem por responsáveis, situação, tipo, grupos e datas
- 📈 **Análise de Desempenho** - Tarefas em atraso, adiantadas e taxa de conclusão
- 📑 **Exportação Excel** - Exportação de dados filtrados em múltiplas abas
- 🎨 **Interface Moderna** - Design responsivo com Tailwind CSS

## 📋 Pré-requisitos

- Node.js 14+ instalado
- Credenciais de acesso à API Projuris
- Conexão com a internet

## 🔧 Instalação

### 1. Clone o repositório ou faça download dos arquivos

```bash
git clone <url-do-repositorio>
cd tarefas
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as credenciais

As credenciais já estão configuradas no arquivo `.env`. Caso precise alterá-las, edite o arquivo `.env`:

```env
PROJURIS_DOMAIN=servidor
PROJURIS_USER=sistemacassel@servidor.adv.br
PROJURIS_PASSWORD=CRrKrw9D63TvHi
PROJURIS_API_URL=https://api.projurisadv.com.br/adv-service
PROJURIS_TOKEN_URL=https://apigw.projurisadv.com.br/auth/token
PROJURIS_CLIENT_ID=api_cliente_codigo_12964
PROJURIS_CLIENT_SECRET=@2022@8da6df1ca4914b04a5df3566278e5393
PORT=3000
```

## 🚀 Como Usar

### Iniciar o servidor

```bash
npm start
```

Ou para desenvolvimento com hot-reload:

```bash
npm run dev
```

### Acessar o dashboard

Abra seu navegador e acesse:

```
http://localhost:3000
```

O dashboard carregará automaticamente os dados da API Projuris ao abrir a página.

## 📡 Endpoints da API

O servidor expõe os seguintes endpoints:

### Frontend
- `GET /` - Página principal do dashboard

### API Backend
- `GET /api/health` - Status do servidor e conexão
- `GET /api/tarefas` - Buscar todas as tarefas
- `POST /api/tarefas/filtradas` - Buscar tarefas com filtros complexos
- `GET /api/tipos-tarefa` - Listar tipos de tarefa disponíveis
- `GET /api/situacoes` - Listar situações disponíveis
- `POST /api/auth/refresh` - Forçar renovação do token de autenticação

### Exemplos de uso

#### Buscar tarefas com filtros via query params:

```bash
curl "http://localhost:3000/api/tarefas?dataCriacaoInicio=2024-01-01&dataCriacaoFim=2024-12-31"
```

#### Buscar tarefas com filtros via POST:

```bash
curl -X POST http://localhost:3000/api/tarefas/filtradas \
  -H "Content-Type: application/json" \
  -d '{
    "dataCriacaoInicio": "2024-01-01",
    "dataCriacaoFim": "2024-12-31",
    "situacao": "Em andamento"
  }'
```

## 🗂️ Estrutura do Projeto

```
tarefas/
├── services/
│   ├── projurisAuth.js    # Autenticação OAuth2 com Projuris
│   └── projurisApi.js      # Integração com API Projuris
├── public/
│   ├── index.html          # Interface do dashboard
│   └── app.js              # Lógica JavaScript do frontend
├── server.js               # Servidor Express
├── package.json            # Dependências do projeto
├── .env                    # Variáveis de ambiente (credenciais)
└── README.md               # Este arquivo
```

## 🔐 Segurança

- **Credenciais**: As credenciais são armazenadas no arquivo `.env` e não devem ser commitadas no git
- **Token Cache**: Os tokens de autenticação são armazenados em cache por 55 minutos
- **CORS**: O servidor possui CORS habilitado para acesso do frontend
- **HTTPS**: A API Projuris utiliza HTTPS para comunicação segura

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Axios** - Cliente HTTP para requisições à API
- **dotenv** - Gerenciamento de variáveis de ambiente
- **node-cache** - Cache de tokens de autenticação

### Frontend
- **HTML5 + CSS3** - Estrutura e estilização
- **Tailwind CSS** - Framework CSS utilitário
- **Chart.js** - Gráficos interativos
- **SheetJS (xlsx)** - Exportação de Excel
- **Font Awesome** - Ícones

## 📊 Funcionalidades do Dashboard

### 1. Resumo de Prazos
- Total de tarefas
- Tarefas em atraso
- Tarefas concluídas
- Tarefas em aberto

### 2. Gráficos
- Distribuição por status (pizza)
- Tarefas por tipo (barras)
- Taxa de conclusão (donut)

### 3. Filtros
- Por responsáveis (múltipla seleção)
- Por situação (múltipla seleção)
- Por tipo de tarefa
- Por tarefas relacionadas
- Por grupos de trabalho
- Por data de criação (intervalo)
- Por data fatal (intervalo)

### 4. Tabelas
- **Tarefas em Atraso**: Lista detalhada com dias de atraso
- **Tarefas Adiantadas**: Tarefas concluídas antes do prazo
- **Lista Completa**: Todas as tarefas com detalhes completos

### 5. Exportação
- Exporta dados filtrados em formato Excel (.xlsx)
- Múltiplas abas: Lista Completa, Tarefas em Atraso, Tarefas Adiantadas

## 🐛 Solução de Problemas

### Erro de autenticação
Se você receber erros de autenticação:
1. Verifique se as credenciais no `.env` estão corretas
2. Tente renovar o token manualmente: `POST /api/auth/refresh`

### Nenhuma tarefa retornada
Se a API não retornar tarefas:
1. Verifique se sua conta tem permissão para acessar tarefas
2. Verifique os logs do console para detalhes do erro
3. Teste a conectividade com a API: `GET /api/health`

### Porta já em uso
Se a porta 3000 já estiver em uso, altere no arquivo `.env`:
```env
PORT=8080
```

## 📝 Notas de Desenvolvimento

### Estrutura da API Projuris

A API Projuris pode retornar dados em diferentes formatos. O código normaliza automaticamente os seguintes campos:

- **Identificador do módulo**: `identificadorModulo`, `modulo.identificador`, `pasta`, `pastaId`
- **Identificador da tarefa**: `identificador`, `id`, `codigoTarefa`
- **Responsáveis**: `responsaveis[]`, `responsavel`, `usuario`
- **Tipo de tarefa**: `tipo`, `tipoTarefa`, `descricaoTipo`
- **Datas**: Múltiplos formatos são suportados (ISO, DD/MM/YYYY, etc.)
- **Grupos**: `gruposTrabalho[]`, `grupo`

### Cache de Token

O token OAuth2 é armazenado em cache por 55 minutos (3300 segundos). Após esse período, um novo token é solicitado automaticamente.

### Retry Logic

Em caso de erro 401 (não autorizado), o sistema limpa o cache e tenta novamente com um novo token.

## 📄 Licença

Este projeto é de uso interno da Cassel Ruzzarin Advogados.

## 👤 Autor

Desenvolvido para Cassel Ruzzarin Advogados

## 📞 Suporte

Para questões ou problemas, entre em contato com a equipe de desenvolvimento.
