# 🎂 Como Usar o Sistema Cake Up

## 🚀 Iniciando o Sistema

### 1. Instalar Dependências (primeira vez)

```bash
cd frontend
npm install
```

### 2. Iniciar o Servidor de Desenvolvimento

```bash
cd frontend
npm run dev
```

O sistema estará disponível em: **http://localhost:5173**

---

## 👥 Usuários de Teste (Mockados)

### Clientes
- **Email:** `cliente1@email.com` até `cliente50@email.com`
- **Senha:** Qualquer (sistema mock aceita qualquer senha)
- **Role:** `client`

### Operadores
- **Email:** `maria@cakeup.com`, `joao@cakeup.com`, etc.
- **Senha:** Qualquer
- **Role:** `operator`

### Administradores
- **Email:** `carlos@cakeup.com`, `ana@cakeup.com`, `roberto@cakeup.com`
- **Senha:** Qualquer
- **Role:** `admin`

---

## 📱 Fluxo Completo do Cliente

### Passo 1: Criar Conta (ou Login)

1. Acesse http://localhost:5173/login
2. Clique em "Cadastrar"
3. Preencha:
   - Nome: Seu nome
   - Email: seu@email.com
   - Telefone: (opcional)
   - Senha: sua senha
4. Clique em "Cadastrar"
5. ✅ Você será redirecionado para a Home

### Passo 2: Montar seu Cupcake

1. Na Home, clique em "Monte seu Cupcake"
2. **Etapa 1 - Escolha a Massa:**
   - Chocolate (R$ 5,00)
   - Baunilha (R$ 4,50)
   - Misto (R$ 4,75)

3. **Etapa 2 - Escolha o Recheio:**
   - Creme de Avelã (R$ 3,00)
   - Leite em Pó (R$ 2,50)
   - Frutas Vermelhas (R$ 3,50)

4. **Etapa 3 - Escolha a Cobertura:**
   - Chantili Chocolate (R$ 2,00)
   - Chantili Baunilha (R$ 2,00)
   - Chantili Groselha (R$ 2,50)

5. **Configuração Final:**
   - Defina a quantidade (botões +/-)
   - Adicione observações (opcional)
   - Clique em "Adicionar ao Pedido"

6. ✅ Cupcake adicionado ao carrinho!

### Passo 3: Revisar Carrinho

1. Após adicionar, escolha:
   - "Ir para o carrinho" OU
   - Adicionar mais cupcakes

2. No carrinho você pode:
   - Editar quantidade de cada item
   - Remover itens (ícone lixeira)
   - Ver o preço de cada cupcake

### Passo 4: Finalizar Pedido

1. No carrinho, preencha o **Endereço de Entrega:**
   - CEP: 01310-100
   - Endereço: Av. Paulista
   - Número: 1000
   - Bairro: Bela Vista
   - Cidade: São Paulo
   - Estado: SP

2. Observações do Pedido (opcional):
   - Ex: "Entregar após as 18h"

3. Veja o **Total** do pedido

4. Clique em **"Confirmar Pedido"**

5. ✅ Pedido criado com número único (ex: #CKP2024001234)

### Passo 5: Timer de 2 Minutos ⏱️

**IMPORTANTE:** Após confirmar o pedido, você tem **2 minutos** para alterá-lo!

1. Acesse "Meus Pedidos"
2. Veja o timer contando regressivamente
3. Você pode:
   - Alterar itens (dentro do prazo)
   - Ver detalhes
   - Abrir chat com estabelecimento

**Após 2 minutos:**
- Timer expira
- Alterações só via solicitação ao operador
- Pedido aguarda confirmação do operador

### Passo 6: Acompanhar Status do Pedido

O pedido passa por 5 status:

1. **🟡 Aguardando** (amarelo)
   - Pedido criado, aguardando operador aceitar
   - Você ainda pode alterar (se < 2 min)

2. **🔵 Aceito** (azul)
   - Operador aceitou o pedido
   - Não pode mais alterar sozinho

3. **🟠 Em Produção** (laranja)
   - Seu cupcake está sendo feito
   - Fique tranquilo, está quase pronto!

4. **🟣 Liberado** (roxo)
   - Pedido saiu para entrega
   - **Você recebe o CÓDIGO DE ENTREGA** (6 dígitos)
   - Ex: 847293

5. **🟢 Pago** (verde)
   - Entrega confirmada
   - Pagamento realizado
   - Pedido concluído!

### Passo 7: Código de Entrega

Quando seu pedido atingir o status **"Liberado"**:

1. Você verá um card especial com:
   ```
   🎉 Pedido Liberado!
   
   Código de Confirmação:
   ┌──────────┐
   │  847293  │  [📋 Copiar]
   └──────────┘
   
   📋 Instruções:
   ✓ Informe este código ao entregador
   ✓ Realize o pagamento na entrega
   ✓ Código válido por 24h
   ```

2. Copie o código (botão 📋)
3. Quando o entregador chegar:
   - Informe o código
   - Entregador valida no sistema
   - Realize o pagamento
   - Status muda para "Pago"

---

## 🎨 Componentes do Sistema

### Monte seu Cupcake
- **Rota:** `/montar`
- **Função:** Criar cupcakes personalizados
- **Preview:** Visualização em tempo real
- **Preço:** Calculado automaticamente

### Carrinho
- **Rota:** `/carrinho`
- **Função:** Revisar e finalizar pedido
- **Features:**
  - Editar quantidades
  - Remover itens
  - Endereço de entrega
  - Observações

### Meus Pedidos
- **Rota:** `/meus-pedidos`
- **Função:** Acompanhar pedidos
- **Filtros:**
  - Todos
  - Em Andamento
  - Concluídos
- **Info:**
  - Timer de 2 minutos (quando aplicável)
  - Status colorido
  - Código de entrega (quando disponível)

### Perfil
- **Rota:** `/perfil`
- **Função:** Gerenciar dados pessoais
- **Features:**
  - Dados do usuário
  - Gerenciar endereços
  - Adicionar/remover endereços

---

## 🔧 Dados Mockados Disponíveis

### Pedidos de Exemplo

O sistema já possui **25 pedidos mockados** em diferentes status:

- **Pedido #CKP2024001001** - Aguardando (com timer ativo)
- **Pedido #CKP2024001002** - Aceito
- **Pedido #CKP2024001003** - Em Produção
- **Pedido #CKP2024001004** - Liberado (com código: gerado automaticamente)
- **Pedido #CKP2024001005** - Pago (finalizado)
- +20 pedidos adicionais variados

### Componentes Disponíveis

**Massas:**
- Chocolate - R$ 5,00
- Baunilha - R$ 4,50
- Misto - R$ 4,75

**Recheios:**
- Creme de Avelã - R$ 3,00
- Leite em Pó - R$ 2,50
- Frutas Vermelhas - R$ 3,50

**Coberturas:**
- Chantili Chocolate - R$ 2,00
- Chantili Baunilha - R$ 2,00
- Chantili Groselha - R$ 2,50

### Combinações Possíveis
- **Total:** 27 combinações (3x3x3)
- **Preço mínimo:** R$ 9,00 (Baunilha + Leite Pó + Chantili Baunilha/Chocolate)
- **Preço máximo:** R$ 11,25 (Chocolate + Frutas Vermelhas + Chantili Groselha)

---

## 💡 Dicas de Uso

### 1. Testando o Timer
- Crie um pedido novo
- Vá rapidamente para "Meus Pedidos"
- Observe o countdown de 2 minutos
- Nos últimos 30 segundos, o timer pisca em vermelho

### 2. Vendo Código de Entrega
- Crie um pedido
- Nos mocks, pedidos em "Liberado" ou "Pago" têm código
- O código é exibido em destaque
- Botão copiar funciona

### 3. Filtrando Pedidos
- Use os filtros: Todos, Em Andamento, Concluídos
- "Em Andamento" = todos exceto "Pago"
- "Concluídos" = apenas "Pago"

### 4. Navegação Rápida
- Home: Acesso rápido a tudo
- Menu hamburguer: Navegação completa
- Ícone carrinho (header): Mostra quantidade de itens
- Ícone perfil (header): Login ou perfil

---

## 🐛 Troubleshooting

### O Timer não aparece
- ✅ Timer só aparece nos primeiros 2 minutos após criar pedido
- ✅ Apenas para pedidos em status "Aguardando"
- ✅ Se passou de 2 minutos, é normal não aparecer

### Código de entrega não aparece
- ✅ Código só aparece quando status é "Liberado" ou "Pago"
- ✅ É gerado automaticamente ao mudar para "Liberado"
- ✅ Nos mocks, alguns pedidos já têm código

### Não consigo fazer login
- ✅ Sistema mockado aceita qualquer senha
- ✅ Basta ter um email válido
- ✅ Cadastre-se se preferir criar novo usuário

### Carrinho vazio
- ✅ Vá em "Monte seu Cupcake"
- ✅ Selecione massa, recheio e cobertura
- ✅ Clique em "Adicionar ao Pedido"

---

## 📊 Features Implementadas

✅ Montagem de cupcakes personalizados  
✅ Carrinho de compras  
✅ Sistema de pedidos  
✅ Timer de 2 minutos  
✅ 5 status de pedido  
✅ Código de confirmação de entrega  
✅ Histórico de status  
✅ Filtros de pedidos  
✅ Gerenciamento de perfil  
✅ Múltiplos endereços  
✅ Observações personalizadas  
✅ Preços calculados automaticamente  
✅ Interface responsiva  
✅ Dados mockados completos  

---

## 🎯 Próximos Passos

Quando o backend estiver pronto:

1. **API Django:**
   - Substituir mocks por API real
   - Autenticação JWT
   - Persistência PostgreSQL

2. **Funcionalidades Adicionais:**
   - Chat em tempo real (WebSocket)
   - Notificações push
   - Upload de fotos de cupcakes
   - Sistema de avaliações

3. **Páginas do Operador/Admin:**
   - Dashboard
   - Gerenciar pedidos
   - Relatórios
   - Validar códigos de entrega

---

**Sistema pronto para uso e testes! 🎉**

Qualquer dúvida, consulte `IMPLEMENTACAO_SISTEMA_CAKE_UP.md` para detalhes técnicos.


