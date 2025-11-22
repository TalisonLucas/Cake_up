# Cake Up 🎂

Sistema de gerenciamento de confeitaria desenvolvido com React + Vite no frontend e Django no backend.

## 📋 Pré-requisitos

### Para desenvolvimento local:
- Node.js 18+ e npm
- Python 3.11+
- pip (gerenciador de pacotes Python)

### Para desenvolvimento com Docker:
- Docker
- Docker Compose

## 🚀 Iniciando o Projeto

### Opção 1: Com Docker (Recomendado)

1. Clone o repositório
2. Na raiz do projeto, execute:

```bash
docker-compose up --build
```

3. Acesse:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Django Admin: http://localhost:8000/admin

### Opção 2: Desenvolvimento Local

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend estará rodando em: http://localhost:5173

#### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

O backend estará rodando em: http://localhost:8000

## 🏗️ Estrutura do Projeto

```
Cake_up/
├── frontend/               # Aplicação React + Vite + TypeScript
│   ├── src/               # Código fonte
│   ├── Dockerfile         # Configuração Docker
│   └── package.json       # Dependências Node
├── backend/               # API Django
│   ├── config/            # Configurações Django
│   ├── Dockerfile         # Configuração Docker
│   ├── manage.py          # CLI Django
│   └── requirements.txt   # Dependências Python
└── docker-compose.yml     # Orquestração dos serviços
```

## 🔧 Tecnologias

### Frontend
- React 18
- TypeScript
- Vite
- ESLint

### Backend
- Django 5.0
- Django REST Framework
- Django CORS Headers
- Gunicorn

## 📝 Endpoints da API

- `GET /api/health/` - Health check da API

## 🐳 Comandos Docker Úteis

```bash
# Iniciar os serviços
docker-compose up

# Iniciar em background
docker-compose up -d

# Parar os serviços
docker-compose down

# Rebuild dos containers
docker-compose up --build

# Ver logs
docker-compose logs -f

# Executar comandos no backend
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
