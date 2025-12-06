# Cake Up - Backend API

API REST completa para o sistema de encomendas de cupcakes Cake Up, desenvolvida com Django e Django REST Framework.

## 🚀 Tecnologias

- **Django 5.2.8** - Framework web Python
- **Django REST Framework** - API REST toolkit
- **PostgreSQL** - Banco de dados (produção)
- **SQLite** - Banco de dados (desenvolvimento)
- **Simple JWT** - Autenticação JWT
- **drf-spectacular** - Documentação automática da API
- **Pillow** - Processamento de imagens
- **django-filter** - Filtros avançados
- **django-cors-headers** - CORS para comunicação com frontend

## 📁 Estrutura do Projeto

```
backend/
├── accounts/          # Usuários, autenticação e endereços
├── products/          # Produtos e componentes de cupcake
├── orders/            # Pedidos e códigos de entrega
├── chat/              # Sistema de mensagens
├── reports/           # Relatórios e dashboard
├── config/            # Configurações principais
└── manage.py          # CLI do Django
```

## 🗄️ Modelos Principais

### Accounts
- **CustomUser**: Usuário com roles (CLIENT, OPERATOR, ADMIN)
- **Address**: Endereços de entrega

### Products
- **CupcakeComponent**: Componentes customizáveis (MASSA, RECHEIO, COBERTURA)
- **Product**: Produtos prontos

### Orders
- **Order**: Pedido com 5 status diferentes
- **OrderItem**: Itens do pedido
- **DeliveryCode**: Código de confirmação de entrega (6 dígitos)

### Chat
- **Conversation**: Conversas entre usuários
- **Message**: Mensagens

## 🔐 Autenticação

A API utiliza **JWT (JSON Web Tokens)** para autenticação:

```bash
# Login
POST /api/auth/login/
{
  "username": "cliente1",
  "password": "cliente123"
}

# Response
{
  "access": "eyJ0eXAiOiJKV1QiLCJh...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJh..."
}
```

Inclua o token nas requisições:
```
Authorization: Bearer <access_token>
```

## 📍 Principais Endpoints

### Autenticação
- `POST /api/auth/register/` - Registrar novo usuário
- `POST /api/auth/login/` - Login (obter tokens JWT)
- `POST /api/auth/token/refresh/` - Renovar token
- `GET /api/auth/profile/` - Ver/editar perfil
- `POST /api/auth/change-password/` - Alterar senha
- `GET /api/auth/addresses/` - Listar endereços
- `POST /api/auth/addresses/` - Criar endereço

### Produtos
- `GET /api/products/cupcake-components/` - Listar componentes
  - Filtros: `?type=MASSA`, `?is_available=true`
- `GET /api/products/products/` - Listar produtos
  - Filtros: `?category=CUPCAKE`, `?is_available=true`

### Pedidos
- `GET /api/orders/orders/` - Listar pedidos
- `POST /api/orders/orders/` - Criar pedido
- `GET /api/orders/orders/{id}/` - Detalhes do pedido
- `PUT /api/orders/orders/{id}/` - Alterar pedido (se dentro de 2 min)
- `POST /api/orders/orders/{id}/update_status/` - Atualizar status (operador/admin)
- `POST /api/orders/orders/{id}/validate_delivery_code/` - Validar código de entrega

### Chat
- `GET /api/chat/conversations/` - Listar conversas
- `POST /api/chat/conversations/` - Criar conversa
- `GET /api/chat/conversations/{id}/messages/` - Mensagens da conversa
- `POST /api/chat/conversations/{id}/send_message/` - Enviar mensagem
- `POST /api/chat/conversations/{id}/mark_all_read/` - Marcar como lidas

### Relatórios (Operador/Admin)
- `GET /api/reports/dashboard/` - Estatísticas do dashboard
- `GET /api/reports/sales/` - Relatório de vendas
  - Parâmetro: `?period=7` (dias)
- `GET /api/reports/products/` - Performance de produtos
- `GET /api/reports/operators/` - Performance de operadores (admin)
- `GET /api/reports/customers/` - Estatísticas de clientes

## 🛠️ Configuração e Instalação

### Requisitos
- Python 3.13+
- pip

### Instalação Local

1. **Criar ambiente virtual:**
```bash
cd backend
python -m venv venv
```

2. **Ativar ambiente virtual:**
```bash
# Windows
.\venv\Scripts\Activate.ps1

# Linux/Mac
source venv/bin/activate
```

3. **Instalar dependências:**
```bash
pip install -r requirements.txt
```

4. **Configurar variáveis de ambiente** (opcional):
Crie um arquivo `.env` na raiz do backend:
```env
DB_ENGINE=postgresql
DB_NAME=cakeup
DB_USER=cakeup
DB_PASSWORD=cakeup123
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=sua-chave-secreta
DEBUG=True
```

5. **Aplicar migrações:**
```bash
python manage.py migrate
```

6. **Popular banco de dados:**
```bash
python manage.py populate_db
```

7. **Criar superusuário:**
```bash
python manage.py createsuperuser
```

8. **Iniciar servidor:**

**Opção 1: Script automático (recomendado)**
```bash
# Windows - Iniciar localmente (sem ngrok)
start-service.bat

# Windows - Iniciar com ngrok
start-ngrok.bat
```

**Opção 2: Manual**
```bash
# Para desenvolvimento local
python manage.py runserver

# Para usar com ngrok (aceita conexões externas)
python manage.py runserver 0.0.0.0:8000
```

API disponível em: `http://localhost:8000`

**Nota**: Se você estiver usando ngrok para expor o backend, use `0.0.0.0:8000` para permitir conexões externas.

### 🌐 Expondo com ngrok

Para expor o backend via ngrok (útil para desenvolvimento e testes):

1. **Inicie o servidor Django em modo externo:**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```
   Ou use o Makefile:
   ```bash
   make run
   ```

2. **Em outro terminal, inicie o ngrok:**
   ```bash
   ngrok http 8000
   ```

3. **Copie a URL gerada** (ex: `https://xxxx-xxxx-xxxx.ngrok-free.dev`)

4. **Teste a API via ngrok:**
   ```bash
   curl https://xxxx-xxxx-xxxx.ngrok-free.dev/api/health/
   ```

5. **Configure o frontend** para usar a URL do ngrok:
   ```env
   VITE_API_URL=https://xxxx-xxxx-xxxx.ngrok-free.dev/api
   VITE_WS_URL=https://xxxx-xxxx-xxxx.ngrok-free.dev
   ```

**Importante**: 
- Use `0.0.0.0:8000` (não `127.0.0.1:8000`) para permitir conexões externas
- URLs do ngrok mudam a cada reinicialização (plano gratuito)
- Consulte `NGROK_TROUBLESHOOTING.md` para resolver problemas comuns

## 🐳 Docker

### Docker Compose (Frontend + Backend + PostgreSQL)

```bash
# Na raiz do projeto
docker-compose up --build
```

- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:3000
- **PostgreSQL:** localhost:5432

### Apenas Backend

```bash
cd backend
docker build -t cakeup-backend .
docker run -p 8000:8000 cakeup-backend
```

## 📚 Documentação da API

Acesse a documentação interativa:

- **Swagger UI:** http://localhost:8000/api/docs/
- **ReDoc:** http://localhost:8000/api/redoc/
- **Schema JSON:** http://localhost:8000/api/schema/

## 👥 Usuários de Teste

Após executar `python manage.py populate_db`:

| Username | Password | Role | Email |
|----------|----------|------|-------|
| admin | admin123 | ADMIN | admin@cakeup.com |
| operador | operador123 | OPERATOR | operador@cakeup.com |
| cliente1 | cliente123 | CLIENT | cliente1@email.com |
| cliente2 | cliente123 | CLIENT | cliente2@email.com |
| cliente3 | cliente123 | CLIENT | cliente3@email.com |

## 🔄 Status do Pedido

Os pedidos seguem um fluxo com 5 status:

1. **AGUARDANDO_CONFIRMACAO** - Pedido recém-criado (alterável por 2 minutos)
2. **ACEITO** - Pedido aceito pelo estabelecimento
3. **EM_PRODUCAO** - Pedido está sendo produzido
4. **LIBERADO** - Pedido pronto para entrega (gera código de entrega)
5. **PAGO** - Pagamento confirmado com código de entrega

## 🎯 Funcionalidades Especiais

### Timer de Alteração (2 minutos)
- Pedidos podem ser alterados nos primeiros 2 minutos após criação
- Campo `alterable_until` define o prazo
- Método `can_alter()` verifica se ainda é possível alterar

### Código de Entrega
- Gerado automaticamente quando pedido muda para status LIBERADO
- Código de 6 dígitos único
- Válido por 24 horas
- Máximo de 3 tentativas de validação
- Confirma pagamento quando validado

### Cupcake Personalizado
- Cliente escolhe massa, recheio e cobertura
- Preço calculado automaticamente somando componentes
- Dados armazenados em JSON no OrderItem

## 🔒 Permissões

A API implementa 3 níveis de acesso:

- **CLIENT**: Visualizar produtos, fazer pedidos, chat com estabelecimento
- **OPERATOR**: Gerenciar pedidos, produtos, chat com clientes e admin
- **ADMIN**: Acesso total + relatórios + gerenciar operadores

## 🧪 Testes

```bash
python manage.py test
```

## 📦 Comandos Úteis

```bash
# Criar nova migração
python manage.py makemigrations

# Aplicar migrações
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser

# Popular banco
python manage.py populate_db

# Coletar arquivos estáticos
python manage.py collectstatic

# Abrir shell do Django
python manage.py shell
```

## 🌐 Admin Django

Acesse o painel administrativo em:
http://localhost:8000/admin/

Use as credenciais do superusuário.

## 📝 Notas de Desenvolvimento

- O projeto está configurado para usar SQLite em desenvolvimento
- Para produção, configure PostgreSQL através das variáveis de ambiente
- CORS está configurado para aceitar requisições do frontend
- Arquivos de mídia são servidos automaticamente em modo DEBUG

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário e confidencial.

## 👨‍💻 Desenvolvido por

Equipe Cake Up - 2025


