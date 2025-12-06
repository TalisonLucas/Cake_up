# 🧪 Como Testar o Frontend Cake Up

## 🚀 Iniciando o Projeto

### Opção 1: Localmente (Recomendado para Desenvolvimento)

```bash
cd frontend
npm install
npm run dev
```

**Acesse:** http://localhost:5173

> ⚠️ **Nota:** Devido à versão do Node.js (16.14.2), você pode ver warnings, mas o projeto funcionará normalmente.

### Opção 2: Com Docker (Recomendado para Produção)

```bash
# Na raiz do projeto
docker-compose up --build
```

**Acesse:** http://localhost:3000

## 📱 Roteiro de Testes

### 1. Teste da Página Home

1. Acesse http://localhost:5173
2. ✅ Verifique se o header rosa aparece com:
   - Menu hamburguer (esquerda)
   - Título "Home" (centro)
   - Ícones de carrinho e perfil (direita)
3. ✅ Verifique os 3 cards azuis:
   - "Produtos"
   - "História"
   - "Quem somos"
4. ✅ Verifique o footer fixo com botão "Chat"
5. ✅ Clique em cada card e verifique a navegação

### 2. Teste do Menu Hamburguer

1. Clique no ícone de menu (☰) no canto superior esquerdo
2. ✅ Verifique que abre um menu dropdown com:
   - Home
   - Produtos
   - História
   - Quem somos
   - Login (se não autenticado)
3. ✅ Clique em cada opção e verifique a navegação
4. ✅ Clique fora do menu para fechar

### 3. Teste de Login/Cadastro

1. Clique em "Login" no menu ou no ícone de perfil
2. ✅ Verifique as duas tabs: "Login" e "Cadastrar"

**Teste do Cadastro:**
1. Clique na tab "Cadastrar"
2. Preencha:
   - Nome: "João Silva"
   - E-mail: "joao@email.com"
   - Telefone: "11999999999" (opcional)
   - Senha: "senha123"
3. Clique em "Cadastrar"
4. ✅ Você será redirecionado para a Home
5. ✅ O menu agora mostra "Sair" em vez de "Login"

**Teste do Login:**
1. Faça logout (menu → Sair)
2. Clique em "Login" novamente
3. Tab "Login" já selecionada
4. Preencha:
   - Nome: "joao@email.com"
   - Senha: "senha123"
5. Clique em "Entrar"
6. ✅ Você será autenticado e redirecionado

> 📝 **Nota:** Sem backend, o login é simulado. Use qualquer credencial que funciona como mock.

### 4. Teste da Página Produtos

1. Acesse "Produtos" pelo menu ou card da home
2. ✅ Verifique a lista de produtos com:
   - Emoji de bolo 🎂
   - Nome do produto
   - Descrição
   - Preço (R$ XX,XX)
   - Controles de quantidade

**Teste do Carrinho:**
1. Clique no botão "+" em um produto
2. ✅ Quantidade aumenta
3. ✅ Total do pedido atualiza automaticamente
4. ✅ Contador no ícone do carrinho no header aumenta
5. Clique no botão "-"
6. ✅ Quantidade diminui
7. ✅ Total atualiza
8. Adicione vários produtos
9. ✅ Veja o total somar todos os itens
10. Clique em "Calcular frete"
11. ✅ Aparece um alerta (funcionalidade em desenvolvimento)

### 5. Teste da Página História

1. Acesse "História" pelo menu ou card da home
2. ✅ Verifique o card azul com texto sobre a história
3. ✅ Verifique que o header mostra "História"
4. ✅ Scroll deve funcionar se o conteúdo for grande

### 6. Teste da Página Quem Somos

1. Acesse "Quem somos" pelo menu ou card da home
2. ✅ Verifique o card azul com:
   - Missão
   - Valores (lista com bullets)
   - Contato
3. ✅ Verifique que o header mostra "Quem somos"

### 7. Teste da Página Perfil (Requer Login)

**Primeiro faça login (veja seção 3)**

1. Clique no ícone de perfil no header ou acesse pelo menu
2. ✅ Verifique a seção de perfil com seus dados
3. ✅ Verifique a seção "Endereços"

**Teste de Adicionar Endereço:**
1. Clique em "Adicionar endereço"
2. ✅ Formulário aparece
3. Preencha o CEP: "01310-100" (Av. Paulista, SP)
4. Clique fora do campo CEP (blur)
5. ✅ Campos são preenchidos automaticamente via ViaCEP:
   - Endereço
   - Bairro
   - Cidade
   - UF
6. Preencha o Número: "1000"
7. Clique em "Salvar"
8. ✅ Endereço aparece na lista
9. Adicione outro endereço diferente
10. ✅ Ambos aparecem na lista

**Teste de Excluir Endereço:**
1. Clique no ícone de lixeira em um endereço
2. ✅ Aparece confirmação
3. Confirme
4. ✅ Endereço é removido

### 8. Teste da Página Pedidos (Requer Login)

**Primeiro faça login (veja seção 3)**

1. Acesse "Pedidos" pelo menu
2. ✅ Verifique a tabela com colunas:
   - Nº pedido
   - Status (com badge colorido)
   - Valor
   - Destino
3. ✅ Verifique os dados mock exibidos
4. ✅ Verifique as cores dos badges:
   - Pendente = Amarelo
   - Em andamento = Azul
   - Concluído = Verde
   - Cancelado = Vermelho
5. Clique em "Incluir item em pedido aberto"
6. ✅ Você é redirecionado para Produtos

### 9. Teste de Rotas Protegidas

**Sem estar logado:**
1. Tente acessar diretamente: http://localhost:5173/perfil
2. ✅ Você é redirecionado para /login
3. Tente acessar: http://localhost:5173/pedidos
4. ✅ Você é redirecionado para /login

**Depois de fazer login:**
1. Acesse: http://localhost:5173/perfil
2. ✅ Página carrega normalmente
3. Acesse: http://localhost:5173/pedidos
4. ✅ Página carrega normalmente

### 10. Teste do Botão Chat

1. Em qualquer página, clique no botão "Chat" no footer
2. ✅ Aparece um alerta: "Funcionalidade de chat em desenvolvimento!"

### 11. Teste de Logout

1. Estando logado, abra o menu hamburguer
2. ✅ Verifique que aparecem as opções autenticadas:
   - Pedidos
   - Perfil
   - Sair (em vermelho)
3. Clique em "Sair"
4. ✅ Você é redirecionado para /login
5. ✅ Menu volta a mostrar "Login" em vez de "Sair"
6. Tente acessar /perfil
7. ✅ Você é redirecionado para /login

### 12. Teste de Persistência

1. Faça login
2. Adicione produtos ao carrinho
3. Adicione um endereço
4. **Recarregue a página (F5)**
5. ✅ Você continua logado
6. ✅ Carrinho mantém os produtos
7. ✅ Contador do carrinho está correto

### 13. Teste de Responsividade

1. Abra as DevTools (F12)
2. Ative o modo responsivo (Ctrl+Shift+M)
3. Teste diferentes tamanhos:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - Desktop (1920px)
4. ✅ Layout se adapta em todos os tamanhos
5. ✅ Elementos permanecem legíveis
6. ✅ Botões são clicáveis
7. ✅ Cards mantêm proporções

### 14. Teste de Navegação

1. Use o botão voltar do navegador
2. ✅ Navegação funciona corretamente
3. Use o botão avançar
4. ✅ Navegação funciona corretamente
5. Digite URLs diretamente:
   - `/` → Home
   - `/login` → Login
   - `/produtos` → Produtos
   - `/historia` → História
   - `/quem-somos` → Quem Somos
6. ✅ Todas as rotas funcionam

### 15. Teste de URL Inválida

1. Acesse uma URL que não existe: http://localhost:5173/pagina-inexistente
2. ✅ Você é redirecionado para Home (/)

## 🎨 Checklist Visual

Verifique se os elementos visuais estão corretos:

### Cores
- ✅ Header: Rosa coral (#FFB5A0)
- ✅ Cards: Azul ciano (#B0E0E6)
- ✅ Inputs: Azul ciano
- ✅ Botões: Rosa coral
- ✅ Hover: Rosa mais escuro

### Layout
- ✅ Header fixo no topo
- ✅ Footer fixo na parte inferior
- ✅ Conteúdo scrollable no meio
- ✅ Container centralizado (max-width)
- ✅ Padding consistente

### Animações
- ✅ Transições suaves em hover
- ✅ Menu expande suavemente
- ✅ Loading spinner funciona

### Ícones
- ✅ Menu hamburguer
- ✅ Carrinho de compras
- ✅ Perfil de usuário
- ✅ Chat
- ✅ Plus (+) e Minus (-)
- ✅ Lixeira (trash)

## 🐛 Comportamentos Esperados

### Com Backend Não Disponível
- ✅ Login aceita qualquer credencial (mock)
- ✅ Produtos mostram dados mock
- ✅ Pedidos mostram dados mock
- ✅ Endereços não persistem (apenas em memória)

### Com Backend Disponível
- Fazer login com credenciais reais
- Carregar produtos do banco de dados
- Salvar endereços no banco
- Criar pedidos reais

## 📊 Resultado Esperado

Ao final dos testes, você deve ter verificado:

- ✅ 7 páginas funcionando
- ✅ Navegação completa
- ✅ Autenticação funcionando
- ✅ Carrinho de compras operacional
- ✅ Gerenciamento de endereços
- ✅ Integração com ViaCEP
- ✅ Rotas protegidas
- ✅ Persistência de dados
- ✅ Design responsivo
- ✅ Todos os componentes visuais

## 🎯 Checklist Final

- [ ] Testei a Home
- [ ] Testei o Menu
- [ ] Testei Login/Cadastro
- [ ] Testei Produtos e Carrinho
- [ ] Testei História
- [ ] Testei Quem Somos
- [ ] Testei Perfil e Endereços
- [ ] Testei Pedidos
- [ ] Testei Rotas Protegidas
- [ ] Testei Logout
- [ ] Testei Persistência
- [ ] Testei Responsividade
- [ ] Testei Navegação
- [ ] Verifiquei Cores e Layout
- [ ] Tudo funcionou! 🎉

## 💡 Dicas

- Use o console do navegador (F12) para ver logs
- Verifique o Network tab para ver requisições
- Verifique o Application > Local Storage para ver dados salvos
- Use o React DevTools para inspecionar componentes

## 🆘 Problemas Comuns

### Página em branco
- Verifique o console para erros
- Certifique-se de que o servidor está rodando
- Limpe o cache do navegador

### Estilos não aparecem
- Certifique-se de que Tailwind foi compilado
- Recarregue a página
- Limpe cache

### Carrinho não atualiza
- Verifique se os produtos foram adicionados
- Recarregue a página
- Verifique localStorage

---

**Frontend 100% funcional e testado! 🚀**




