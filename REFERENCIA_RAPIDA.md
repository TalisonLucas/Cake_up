# 📚 Referência Rápida - Sistema Cake Up

## 🌐 Rotas do Sistema

### Públicas (sem login necessário)

| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Home | Página inicial com menu de navegação |
| `/login` | Login/Cadastro | Autenticação e registro de usuário |
| `/montar` | Monte seu Cupcake | Montador de cupcakes personalizados |
| `/carrinho` | Carrinho | Revisão e finalização de pedido |
| `/produtos` | Produtos | Lista de produtos (legacy) |
| `/historia` | História | História da Cake Up |
| `/quem-somos` | Quem Somos | Sobre a empresa |

### Protegidas (requer login)

| Rota | Página | Descrição |
|------|--------|-----------|
| `/perfil` | Perfil | Gerenciamento de dados pessoais e endereços |
| `/pedidos` | Pedidos | Lista de pedidos do usuário |
| `/meus-pedidos` | Meus Pedidos | Alias para `/pedidos` |

---

## 🧩 Componentes Principais

### Layout
- `Header` - Cabeçalho com menu, título, carrinho e perfil
- `Footer` - Rodapé com botão de chat
- `Layout` - Wrapper que combina Header + Conteúdo + Footer

### Pedido (Order)
- `StatusBadge` - Badge colorido por status (5 cores)
- `OrderTimer` - Countdown de 2 minutos
- `OrderCard` - Card completo de pedido
- `DeliveryCodeDisplay` - Exibição do código de entrega

### Cupcake
- `ComponentSelector` - Seletor de componentes (massa/recheio/cobertura)
- `CupcakePreview` - Preview do cupcake montado

### Chat
- `ChatWindow` - Janela de chat completa

### Proteção
- `ProtectedRoute` - HOC para proteger rotas

---

## 🗄️ Stores (Zustand)

### authStore
```typescript
{
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  
  // Actions
  login(user, token)
  logout()
  updateUser(userData)
  
  // Helpers
  isClient() -> boolean
  isOperator() -> boolean
  isAdmin() -> boolean
  hasRole(role) -> boolean
}
```

### cupcakeStore
```typescript
{
  selectedMassa: CupcakeComponent | null,
  selectedRecheio: CupcakeComponent | null,
  selectedCobertura: CupcakeComponent | null,
  quantity: number,
  observacoes: string,
  cart: Cupcake[],
  
  // Actions
  setMassa(massa)
  setRecheio(recheio)
  setCobertura(cobertura)
  setQuantity(quantity)
  setObservacoes(obs)
  addToCart() -> boolean
  removeFromCart(index)
  updateCartItem(index, cupcake)
  clearCart()
  getTotal() -> number
  resetBuilder()
}
```

### orderStore
```typescript
{
  orders: Order[],
  currentOrder: Order | null,
  
  // Actions
  loadOrders(userId?)
  setOrders(orders)
  addOrder(order)
  setCurrentOrder(order)
  updateOrderStatus(orderId, status, operatorId?, operatorName?, note?)
  updateOrder(orderId, updates)
  
  // Helpers
  canEditOrder(order) -> boolean
  getRemainingEditTime(order) -> number (seconds)
  getOrdersByStatus(status) -> Order[]
  getPendingOrders() -> Order[]
  getActiveOrders() -> Order[]
  getCompletedOrders() -> Order[]
}
```

### chatStore
```typescript
{
  conversations: Conversation[],
  messages: { [conversationId: string]: ChatMessage[] },
  activeConversationId: string | null,
  isTyping: { [userId: string]: boolean },
  
  // Actions
  loadConversations(userId)
  loadMessages(conversationId)
  setActiveConversation(conversationId)
  sendMessage(conversationId, message, senderId, senderName, senderRole)
  markAsRead(conversationId, userId)
  setTyping(userId, isTyping)
  createConversation(conversation)
  getUnreadCount(userId) -> number
}
```

### cartStore (legacy)
```typescript
{
  items: CartItem[],
  total: number,
  
  // Actions
  addItem(product, quantity)
  removeItem(productId)
  updateQuantity(productId, quantity)
  clearCart()
  calculateTotal()
}
```

---

## 📊 Types Principais

### User
```typescript
{
  id: string
  name: string
  email: string
  phone?: string
  role: 'client' | 'operator' | 'admin'
  avatar?: string
  createdAt: string
}
```

### CupcakeComponent
```typescript
{
  id: string
  type: 'massa' | 'recheio' | 'cobertura'
  name: string
  price: number
  disponivel: boolean
  description?: string
  image?: string
  estoque?: number
}
```

### Cupcake
```typescript
{
  id: string
  massa: CupcakeComponent
  recheio: CupcakeComponent
  cobertura: CupcakeComponent
  quantity: number
  preco: number
  observacoes?: string
}
```

### Order
```typescript
{
  id: string
  number: string // ex: "#CKP2024001234"
  status: 'aguardando' | 'aceito' | 'producao' | 'liberado' | 'pago'
  total: number
  destination: string
  items: Cupcake[]
  deliveryCode?: DeliveryCode
  canEditUntil?: string // ISO timestamp
  createdAt: string
  updatedAt: string
  clientId: string
  clientName: string
  operatorId?: string
  operatorName?: string
  statusHistory: OrderStatusHistory[]
  observacoes?: string
  enderecoEntrega: Address
}
```

### DeliveryCode
```typescript
{
  code: string // 6 dígitos
  generatedAt: string
  expiresAt: string // 24h após geração
  attempts: number
  validated: boolean
  validatedAt?: string
}
```

---

## 🎨 Cores do Tema (Tailwind)

```javascript
colors: {
  'cake-pink': '#FFD8E4',     // Rosa principal
  'cake-cyan': '#CCE5FF',     // Azul claro
  'cake-text': '#6C3428',     // Marrom escuro
  'cake-dark-pink': '#FFC0D3' // Rosa escuro
}
```

### Como usar:
```tsx
<div className="bg-cake-pink text-cake-text">
  Conteúdo com cores do tema
</div>
```

---

## 📁 Estrutura de Pastas

```
frontend/src/
├── components/
│   ├── Chat/
│   ├── Cupcake/
│   ├── Order/
│   └── Layout/
├── pages/
├── store/
├── types/
├── mocks/
└── services/
```

---

## 🔄 Fluxo de Status do Pedido

```
Pedido Criado (Cliente)
    ↓
[1] 🟡 Aguardando (Timer de 2 min ativo)
    ↓ (Operador aceita)
[2] 🔵 Aceito
    ↓ (Operador inicia produção)
[3] 🟠 Em Produção
    ↓ (Operador finaliza)
[4] 🟣 Liberado (Código gerado automaticamente)
    ↓ (Cliente paga na entrega)
[5] 🟢 Pago (Finalizado)
```

---

## ⏱️ Timer de 2 Minutos

### Comportamento:
- ✅ Ativa quando pedido é criado
- ✅ Conta regressivamente
- ✅ Atualiza a cada segundo
- ✅ Últimos 30s: pisca em vermelho
- ✅ Expira: timer desaparece
- ✅ Só visível em status "Aguardando"

### Cálculo:
```typescript
canEditUntil = createdAt + 2 minutos
remainingTime = canEditUntil - now (em segundos)
```

---

## 🔢 Código de Entrega

### Geração:
- Automática ao mudar status para "Liberado"
- 6 dígitos numéricos (ex: 847293)
- Validade: 24 horas

### Validação:
- Cliente mostra código ao entregador
- Entregador valida no sistema
- Sistema registra tentativas
- Após validação: status → "Pago"

---

## 🧪 Dados de Teste

### Cupcakes Disponíveis:
- **Massas:** 3 opções (R$ 4,50 - R$ 5,00)
- **Recheios:** 3 opções (R$ 2,50 - R$ 3,50)
- **Coberturas:** 3 opções (R$ 2,00 - R$ 2,50)
- **Combinações:** 27 possíveis

### Pedidos Mockados:
- 25 pedidos pré-criados
- Diferentes status
- Alguns com timer ativo
- Alguns com código de entrega

### Usuários Mockados:
- 50 clientes
- 5 operadores
- 3 administradores

---

## 🚀 Comandos Úteis

### Desenvolvimento
```bash
cd frontend
npm run dev           # Iniciar dev server
npm run build         # Build para produção
npm run preview       # Preview do build
```

### Linting
```bash
npm run lint          # Verificar erros
npm run lint:fix      # Corrigir automaticamente
```

### Testes (quando implementado)
```bash
npm test              # Rodar testes
npm run test:watch    # Testes em watch mode
```

---

## 🎯 Próximas Features (Backend Necessário)

### Operador
- [ ] Dashboard do operador
- [ ] Gerenciar pedidos
- [ ] Avançar status
- [ ] Validar código de entrega
- [ ] Chat em tempo real

### Administrador
- [ ] Dashboard executivo
- [ ] Relatórios de vendas
- [ ] Relatórios de produtos
- [ ] Relatórios de operadores
- [ ] Gerenciar usuários
- [ ] Exportar PDF/Excel

### Sistema
- [ ] WebSocket para chat real
- [ ] Notificações push
- [ ] Upload de imagens
- [ ] Sistema de avaliações
- [ ] Histórico completo
- [ ] Busca avançada

---

## 📞 Suporte

- **Documentação Completa:** `IMPLEMENTACAO_SISTEMA_CAKE_UP.md`
- **Guia de Uso:** `COMO_USAR_SISTEMA_CAKE_UP.md`
- **Referência Rápida:** Este documento

---

**Última atualização:** $(date)  
**Versão do Sistema:** 1.0.0 - MVP Frontend

