# Cake Up - Frontend

Interface web do sistema Cake Up, desenvolvida com React, TypeScript, Vite, Tailwind CSS e Zustand.

## 🎨 Design

O design foi baseado nos mockups fornecidos, com um esquema de cores rosa coral e azul ciano, criando uma interface amigável e moderna para dispositivos móveis.

## 🚀 Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utility-first
- **React Router DOM** - Roteamento
- **Zustand** - Gerenciamento de estado
- **Axios** - Cliente HTTP
- **React Icons** - Biblioteca de ícones

## 📁 Estrutura de Pastas

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Layout/         # Header, Footer, Layout
│   └── ProtectedRoute.tsx
├── pages/              # Páginas da aplicação
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Profile.tsx
│   ├── Products.tsx
│   ├── Orders.tsx
│   ├── Historia.tsx
│   └── QuemSomos.tsx
├── store/              # Zustand stores
│   ├── authStore.ts    # Autenticação
│   ├── cartStore.ts    # Carrinho de compras
│   └── orderStore.ts   # Pedidos
├── services/           # Integração com API
│   └── api.ts
├── types/              # Definições TypeScript
│   └── index.ts
├── App.tsx             # Componente raiz e rotas
├── main.tsx            # Entry point
└── index.css           # Estilos globais
```

## 🎯 Funcionalidades Implementadas

### Páginas Públicas
- ✅ **Home** - Menu principal com navegação
- ✅ **Login/Cadastro** - Autenticação de usuários
- ✅ **História** - História da confeitaria
- ✅ **Quem Somos** - Informações sobre a empresa
- ✅ **Produtos** - Catálogo de produtos (visualização pública)

### Páginas Protegidas (Requer Login)
- ✅ **Perfil** - Gerenciamento de dados e endereços
- ✅ **Pedidos** - Histórico e status de pedidos

### Componentes
- ✅ **Header** - Navegação com menu hamburguer, carrinho e perfil
- ✅ **Footer** - Botão de chat fixo
- ✅ **Layout** - Wrapper para todas as páginas
- ✅ **ProtectedRoute** - Proteção de rotas autenticadas

### Gerenciamento de Estado
- ✅ **Auth Store** - Autenticação e dados do usuário
- ✅ **Cart Store** - Carrinho de compras com cálculo de total
- ✅ **Order Store** - Pedidos do usuário

### Integrações
- ✅ **API Backend** - Comunicação com Django REST API
- ✅ **ViaCEP** - Autocompletar endereço por CEP

## 🎨 Cores Customizadas

```css
cake-pink: #FFB5A0      /* Rosa coral - header, botões */
cake-dark-pink: #FF9B85 /* Rosa escuro - hover states */
cake-cyan: #B0E0E6      /* Azul ciano - cards, inputs */
cake-text: #4A4A4A      /* Texto principal */
```

## 🛣️ Rotas

### Públicas
- `/` - Home
- `/login` - Login/Cadastro
- `/produtos` - Produtos
- `/historia` - História
- `/quem-somos` - Quem Somos

### Protegidas
- `/perfil` - Perfil do usuário
- `/pedidos` - Pedidos

## 🔧 Desenvolvimento

### Instalar dependências
```bash
npm install
```

### Iniciar servidor de desenvolvimento
```bash
npm run dev
```

O app estará disponível em `http://localhost:5173`

### Build para produção
```bash
npm run build
```

### Preview do build
```bash
npm run preview
```

## 🔌 Configuração da API

Crie um arquivo `.env` na raiz do frontend:

```env
VITE_API_URL=http://localhost:8000/api
```

## 📱 Design Responsivo

A aplicação foi desenvolvida com abordagem mobile-first, otimizada para dispositivos móveis mas funcionando perfeitamente em tablets e desktops.

## 🔒 Autenticação

- Token JWT armazenado no localStorage via Zustand persist
- Interceptor axios adiciona token automaticamente em requisições
- Redirecionamento automático para login em caso de token inválido
- Rotas protegidas verificam autenticação antes de renderizar

## 🛒 Carrinho de Compras

- Adicionar/remover produtos
- Atualizar quantidades
- Cálculo automático do total
- Persistência entre navegações

## 📦 Features em Desenvolvimento

- [ ] Integração completa com backend Django
- [ ] Cálculo de frete real
- [ ] Upload de imagens de produtos
- [ ] Sistema de chat funcional
- [ ] Notificações em tempo real
- [ ] Pagamento online

## 🎯 Próximos Passos

1. Implementar backend Django com endpoints correspondentes
2. Adicionar testes unitários e de integração
3. Implementar PWA features
4. Adicionar animações e transições
5. Implementar sistema de notificações

## 📄 Licença

Este projeto está sob a licença MIT.
