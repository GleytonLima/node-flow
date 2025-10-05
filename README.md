# NodeFlow

Sistema de gerenciamento de recursos com interface visual para criação e edição de fluxos de trabalho hierárquicos.

## Características

- **Interface Visual**: Canvas interativo com visualização hierárquica de nós e conexões
- **Gestão de Fluxos**: Criação de nós com etapas internas (processo, decisão, paralelo, condicional)
- **Sistema de Busca**: Busca textual global por nós, etapas e propriedades
- **Propriedades Flexíveis**: Sistema de propriedades padrão e customizadas
- **Exportação**: Suporte a múltiplos formatos (Mermaid, Draw.io)
- **Tema Escuro/Claro**: Interface adaptável com suporte a temas
- **Versionamento**: Dados armazenados em arquivos JSON versionáveis
- **Docker Ready**: Deploy simplificado com docker-compose

## Pré-requisitos

- Node.js 16+ 
- npm ou yarn
- Docker e Docker Compose (para deploy)

## Instalação e Desenvolvimento

### Backend

```bash
cd backend
npm install
npm run dev  # Desenvolvimento com hot reload
npm start    # Produção
npm test     # Executar testes
```

### Frontend

```bash
cd frontend
npm install
ng serve     # Servidor de desenvolvimento (http://localhost:4200)
ng build     # Build para produção
ng test      # Executar testes
```

### Docker (Deploy completo)

```bash
# Iniciar aplicação completa
docker-compose up --build

# Acessar aplicação
# Frontend: http://localhost:4200
# Backend: http://localhost:5200/api
```

**Configuração Docker:**
- **Frontend**: Multi-stage build com nginx (porta 4200)
- **Backend**: Node.js com volumes para dados (porta 5200)
- **Inicialização**: Container de dados garante estrutura de arquivos

## Funcionalidades da Interface

### Visualização de Nós
- **Canvas Interativo**: Visualização hierárquica com zoom, pan e seleção
- **Layout Automático**: Distribuição automática de nós em níveis hierárquicos
- **Conexões Visuais**: Arestas com labels das etapas
- **Decisões Condicionais**: Losangos para pontos de decisão com múltiplas saídas

### Gerenciamento de Nós
- **Criação**: Interface para criar novos nós com propriedades
- **Edição**: Editor completo com abas para informações, propriedades e etapas
- **Visualização**: Modal detalhado com informações do nó e suas etapas
- **Exclusão**: Confirmação de exclusão com opções de cascata

### Gerenciamento de Etapas
- **Tipos de Etapa**: Processo, Decisão, Paralelo, Condicional
- **Conexões**: Sistema de conexões entre nós com validação
- **Etapas Condicionais**: Associação de etapas condicionais a decisões
- **Editor Visual**: Interface intuitiva para criar e editar etapas

### Sistema de Busca
- **Busca Simples**: Campo de busca global
- **Busca Avançada**: Filtros por workflow, tipo e propriedades
- **Filtros Horizontais**: Filtros rápidos por categoria
- **Histórico**: Manutenção do histórico de buscas

### Exportação
- **Mermaid**: Exportação para formato texto compatível com GitHub/GitLab
- **Draw.io**: Exportação para XML editável no app.diagrams.net
- **Seleção de Formato**: Dialog para escolher o formato de exportação

### Temas
- **Tema Claro**: Interface padrão com cores claras
- **Tema Escuro**: Interface adaptada para ambientes com pouca luz
- **Detecção Automática**: Segue as preferências do sistema operacional

## APIs Disponíveis

### Nós
- `GET /api/nodes` - Lista todos os nós
- `GET /api/nodes/:id` - Detalhes do nó
- `POST /api/nodes` - Criar nó
- `PUT /api/nodes/:id` - Atualizar nó
- `DELETE /api/nodes/:id` - Deletar nó
- `GET /api/nodes/:id/connections` - Conexões do nó

### Etapas
- `POST /api/nodes/:id/steps` - Adicionar etapa ao nó
- `PUT /api/nodes/:nodeId/steps/:stepId` - Atualizar etapa
- `DELETE /api/nodes/:nodeId/steps/:stepId` - Remover etapa

### Busca
- `GET /api/search?q={query}&workflow={workflow}` - Busca textual

### Propriedades
- `GET /api/properties/standard` - Propriedades padrão
- `POST /api/properties/standard` - Atualizar propriedades padrão

### Workflows
- `GET /api/workflows` - Lista workflows

### Health Check
- `GET /api/health` - Status da aplicação

## Testes

### Backend
```bash
cd backend
npm test              # Executar todos os testes
npm run test:watch    # Modo watch
npm run test:coverage # Com cobertura
```

**Status dos Testes**: 16/16 testes passando

### Frontend
```bash
cd frontend
ng test              # Executar testes unitários
ng test --watch      # Modo watch
ng test --coverage   # Com cobertura
```

**Cobertura**: Testes para componentes principais e serviços

## Estrutura do Projeto

```
node-flow/
├── backend/                 # API Node.js
│   ├── src/
│   │   ├── controllers/     # Controladores
│   │   ├── models/         # Modelos de dados
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Lógica de negócio
│   │   ├── middleware/     # Middlewares
│   │   ├── utils/          # Utilitários
│   │   └── __tests__/      # Testes
│   └── data/               # Dados de teste
├── frontend/               # Interface Angular
│   ├── src/app/
│   │   ├── components/     # Componentes Angular
│   │   ├── services/       # Serviços (API, Estado, Temas)
│   │   ├── models/         # Modelos TypeScript
│   │   └── shared/         # Componentes compartilhados
│   └── dist/               # Build de produção
├── data/                   # Dados da aplicação
│   ├── nodes/             # Arquivos de nós
│   ├── properties/        # Propriedades padrão
│   ├── workflows/         # Workflows
│   └── config/            # Configurações
├── docker-compose.yml     # Deploy Docker
├── REQUISITOS.md          # Especificações detalhadas
└── TODO.md               # Progresso do desenvolvimento
```

## Configuração

### Variáveis de Ambiente

```bash
NODE_ENV=development  # development | production
PORT=5200            # Porta do backend
```

### CORS

O backend está configurado para aceitar requisições de:
- `http://localhost:4200` (Angular dev server)
- `http://localhost:5200` (Backend)
- `http://127.0.0.1:5200` (Backend alternativo)

### Desenvolvimento Local vs Docker

**Desenvolvimento Local:**
- Backend: `npm start` na pasta `backend/`
- Frontend: `ng serve` na pasta `frontend/`
- Dados: Acessados via `data/` na raiz do projeto

**Docker:**
- Detecção automática de ambiente
- Volumes mapeados para persistência de dados
- Multi-stage build otimizado para produção

## Modelos de Dados

### Nó
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "workflows": ["workflow1", "workflow2"],
  "properties": {
    "standardProps": {},
    "customProps": {}
  },
  "steps": [],
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

### Etapa
```json
{
  "id": "uuid",
  "type": "process|decision|parallel|conditional",
  "name": "string",
  "description": "string",
  "workflows": ["workflow1"],
  "connections": [
    {
      "targetNodeId": "uuid"
    }
  ],
  "decisionStepId": "uuid", // Para etapas condicionais
  "properties": {},
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

### Conexão
```json
{
  "targetNodeId": "uuid"
}
```

## Tecnologias Utilizadas

### Backend
- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **Jest**: Framework de testes
- **File System**: Persistência em arquivos JSON

### Frontend
- **Angular 17**: Framework web
- **Angular Material**: Componentes UI
- **Vis.js**: Visualização de redes
- **RxJS**: Programação reativa
- **TypeScript**: Linguagem tipada

### DevOps
- **Docker**: Containerização com multi-stage builds
- **Docker Compose**: Orquestração com dependências
- **Nginx**: Servidor web para frontend em produção
- **Git**: Controle de versão

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Suporte

Para dúvidas ou suporte, abra uma issue no repositório.