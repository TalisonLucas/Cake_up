# Instruções de Configuração - Cake Up

## ⚠️ Importante

Durante a configuração inicial, identificamos que seu sistema possui versões antigas de algumas ferramentas:

- **Node.js**: Versão atual 16.14.2 (Vite requer 20.19+ ou 22.12+)
- **Python**: Não instalado

## 🐳 Recomendação: Use Docker (Mais Fácil)

A forma **mais simples e recomendada** de rodar o projeto é usando Docker, pois ele já inclui todas as versões corretas das ferramentas necessárias.

### Passos para usar com Docker:

1. **Instale o Docker Desktop**:
   - Baixe em: https://www.docker.com/products/docker-desktop
   - Instale e reinicie o computador se necessário

2. **Inicie o projeto**:
   ```bash
   docker-compose up --build
   ```

3. **Acesse as aplicações**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Health Check: http://localhost:8000/api/health/

## 💻 Alternativa: Desenvolvimento Local

Se preferir rodar localmente sem Docker, você precisará atualizar as ferramentas:

### 1. Atualizar Node.js

**Opção A - Node Version Manager (Recomendado)**:
```bash
# Instale o nvm-windows
# Baixe em: https://github.com/coreybutler/nvm-windows/releases

# Instale Node.js 20 LTS
nvm install 20
nvm use 20
```

**Opção B - Instalação Direta**:
- Baixe Node.js 20 LTS em: https://nodejs.org/
- Instale e reinicie o terminal

### 2. Instalar Python

- Baixe Python 3.11+ em: https://www.python.org/downloads/
- **IMPORTANTE**: Marque "Add Python to PATH" durante a instalação
- Reinicie o terminal após a instalação

### 3. Rodar o Projeto Localmente

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

**Backend**:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## 📦 O Que Foi Criado

A estrutura completa do projeto foi configurada:

### ✅ Frontend
- [x] React + Vite + TypeScript configurado
- [x] Dependências instaladas
- [x] Dockerfile criado
- [x] .dockerignore configurado

### ✅ Backend
- [x] Django 5.0 estruturado
- [x] REST Framework configurado
- [x] CORS habilitado para desenvolvimento
- [x] Dockerfile criado
- [x] .dockerignore configurado
- [x] Endpoint de health check: `/api/health/`

### ✅ Docker
- [x] docker-compose.yml na raiz
- [x] Rede entre containers configurada
- [x] Volumes para hot reload
- [x] Portas mapeadas:
  - Frontend: 3000:80
  - Backend: 8000:8000

## 🎯 Próximos Passos

1. Instale o Docker (mais fácil) ou atualize Node.js e Python
2. Inicie o projeto com `docker-compose up --build`
3. Teste os endpoints:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000/api/health/
4. Comece a desenvolver as funcionalidades específicas do Cake Up!

## 🆘 Precisa de Ajuda?

Se encontrar algum problema:
1. Certifique-se de que o Docker Desktop está rodando
2. Verifique se as portas 3000 e 8000 não estão em uso
3. Execute `docker-compose down` e tente novamente com `docker-compose up --build`

---

**Estrutura está pronta! 🎉**
Agora você pode começar a desenvolver as funcionalidades específicas do Cake Up.





