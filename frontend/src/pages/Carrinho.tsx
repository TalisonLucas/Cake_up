import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { useCupcakeStore } from '../store/cupcakeStore';
import { useOrderStore } from '../store/orderStore';
import { useAuthStore } from '../store/authStore';
import { ordersApi, addressApi, viaCepApi } from '../services/api';
import { HiTrash, HiMinus, HiPlus, HiLocationMarker, HiInformationCircle, HiCreditCard } from 'react-icons/hi';
import type { Address } from '../types';

export const Carrinho = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateCartItem, getTotal, clearCart } = useCupcakeStore();
  const { addOrder } = useOrderStore();
  const { isAuthenticated, user } = useAuthStore();
  
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [submitting, setSubmitting] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const [endereco, setEndereco] = useState<Partial<Address>>({
    cep: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
  });
  const [observacoes, setObservacoes] = useState('');

  const total = getTotal();
  const totalUnits = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Carregar endereços salvos se o usuário estiver logado
  useEffect(() => {
    if (isAuthenticated) {
      loadSavedAddresses();
    }
  }, [isAuthenticated]);

  const loadSavedAddresses = async () => {
    try {
      const list = await addressApi.getAll();
      setSavedAddresses(list);
      if (list.length > 0) {
        // Seleciona o primeiro ou o padrão
        const defaultAddr = list.find((a) => a.is_default) || list[0];
        setSelectedAddressId(defaultAddr.id);
        setEndereco({
          cep: defaultAddr.cep,
          street: defaultAddr.street,
          number: defaultAddr.number,
          complement: defaultAddr.complement || '',
          district: defaultAddr.district,
          city: defaultAddr.city,
          state: defaultAddr.state,
        });
      }
    } catch (err) {
      console.error('Erro ao carregar endereços salvos:', err);
    }
  };

  const handleSelectSavedAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    if (addrId === 'new') {
      setEndereco({
        cep: '',
        street: '',
        number: '',
        complement: '',
        district: '',
        city: '',
        state: '',
      });
    } else {
      const found = savedAddresses.find((a) => a.id === addrId);
      if (found) {
        setEndereco({
          cep: found.cep,
          street: found.street,
          number: found.number,
          complement: found.complement || '',
          district: found.district,
          city: found.city,
          state: found.state,
        });
      }
    }
  };

  const handleCepBlur = async () => {
    const cleanCep = (endereco.cep || '').replace(/\D/g, '');
    if (cleanCep.length >= 8) {
      setLoadingCep(true);
      try {
        const data = await viaCepApi.getByCep(cleanCep);
        if (!data.erro) {
          setEndereco((prev) => ({
            ...prev,
            street: data.logradouro || prev.street,
            district: data.bairro || prev.district,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleQuantityChange = (index: number, delta: number) => {
    const cupcake = cart[index];
    const newQuantity = Math.max(1, cupcake.quantity + delta);
    updateCartItem(index, { ...cupcake, quantity: newQuantity });
  };

  const handleConfirmarPedido = async () => {
    if (!isAuthenticated) {
      alert('Você precisa estar logado para fazer um pedido!');
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      alert('Seu carrinho está vazio!');
      return;
    }

    if (!endereco.cep || !endereco.street || !endereco.number || !endereco.city || !endereco.state) {
      alert('Por favor, preencha todos os campos obrigatórios do endereço de entrega!');
      return;
    }

    setSubmitting(true);
    try {
      // Criar pedido no backend
      const createdOrder = await ordersApi.create(cart, endereco as Address, observacoes);

      // Atualizar store local com o pedido retornado pela API
      addOrder(createdOrder);
      clearCart();

      alert(`Pedido ${createdOrder.number} criado com sucesso! Você tem até 5 minutos para alterar ou cancelar.`);
      navigate('/meus-pedidos');
    } catch (error: any) {
      console.error('Erro ao criar pedido:', error);
      const message = error.response?.data?.detail || 'Erro ao criar pedido. Tente novamente.';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <Layout title="Carrinho">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-cake-text mb-2">
            Seu carrinho está vazio
          </h2>
          <p className="text-gray-600 mb-6">
            Que tal montar um cupcake delicioso agora mesmo?
          </p>
          <button
            onClick={() => navigate('/montar')}
            className="px-6 py-3 bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-semibold rounded-lg transition-colors shadow-md"
          >
            Monte seu Cupcake
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Carrinho de Compras">
      <div className="py-4 space-y-6">
        {/* Banner do Cliente Logado */}
        {isAuthenticated && user && (
          <div className="bg-pink-50 border border-cake-pink/50 rounded-xl p-4 flex items-center justify-between text-sm">
            <div>
              <p className="font-semibold text-cake-text">
                Cliente logado: <span className="text-pink-700">{user.name}</span>
              </p>
              <p className="text-gray-600 text-xs">E-mail: {user.email}</p>
            </div>
            <span className="bg-cake-pink text-cake-text px-3 py-1 rounded-full text-xs font-bold">
              {totalUnits} {totalUnits === 1 ? 'item' : 'itens'} no pedido
            </span>
          </div>
        )}

        {/* Cart Items */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <h2 className="text-xl font-bold text-cake-text">
              🛒 Itens do Carrinho ({cart.length} tipos, {totalUnits} unidades)
            </h2>
            <button
              onClick={() => clearCart()}
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              Esvaziar carrinho
            </button>
          </div>

          <div className="space-y-4">
            {cart.map((cupcake, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 hover:bg-pink-50/40 rounded-xl relative border border-gray-100 transition-colors"
              >
                <div className="text-4xl flex items-center justify-center bg-white p-2 rounded-xl shadow-sm h-16 w-16">
                  🧁
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-cake-text text-base">
                      Cupcake Personalizado #{index + 1}
                    </h3>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover item"
                    >
                      <HiTrash size={18} />
                    </button>
                  </div>

                  {/* Descrição detalhada dos ingredientes */}
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-white p-2.5 rounded-lg border border-gray-100">
                    <div>
                      <span className="font-semibold text-gray-500 block">Massa:</span>
                      <span className="text-cake-text font-medium">{cupcake.massa.name}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 block">Recheio:</span>
                      <span className="text-cake-text font-medium">{cupcake.recheio.name}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 block">Cobertura:</span>
                      <span className="text-cake-text font-medium">{cupcake.cobertura.name}</span>
                    </div>
                  </div>

                  {cupcake.observacoes && (
                    <p className="mt-2 text-xs text-gray-600 italic bg-amber-50 p-2 rounded border border-amber-200">
                      <strong>Obs do item:</strong> {cupcake.observacoes}
                    </p>
                  )}

                  {/* Quantity and Prices */}
                  <div className="flex flex-wrap items-center justify-between mt-3 pt-2 border-t border-gray-200/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Qtd:</span>
                      <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm">
                        <button
                          onClick={() => handleQuantityChange(index, -1)}
                          className="p-1.5 hover:bg-gray-100 rounded-l-lg transition-colors text-gray-600"
                          title="Diminuir"
                        >
                          <HiMinus size={14} />
                        </button>
                        <span className="px-3 font-bold text-sm text-cake-text">{cupcake.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(index, 1)}
                          className="p-1.5 hover:bg-gray-100 rounded-r-lg transition-colors text-gray-600"
                          title="Aumentar"
                        >
                          <HiPlus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">
                        R$ {cupcake.preco.toFixed(2)} cada
                      </span>
                      <span className="text-base font-bold text-cake-pink">
                        Subtotal: R$ {(cupcake.preco * cupcake.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 flex justify-end">
            <button
              onClick={() => navigate('/montar')}
              className="text-sm font-semibold text-cake-pink hover:text-cake-dark-pink flex items-center gap-1"
            >
              <HiPlus size={16} />
              Adicionar mais cupcakes
            </button>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <HiLocationMarker className="text-cake-pink text-2xl" />
            <h2 className="text-xl font-bold text-cake-text">
              Endereço de Entrega
            </h2>
          </div>

          {/* Seletor de endereços salvos do cliente */}
          {isAuthenticated && savedAddresses.length > 0 && (
            <div className="mb-4 p-3 bg-pink-50/50 rounded-xl border border-pink-100">
              <label className="block text-xs font-bold text-cake-text uppercase mb-2">
                Selecione um dos seus endereços cadastrados:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectSavedAddress(addr.id)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-cake-pink bg-white shadow-sm ring-2 ring-cake-pink/30 font-medium'
                        : 'border-gray-200 bg-white/70 hover:bg-white text-gray-600'
                    }`}
                  >
                    <p className="font-bold text-cake-text">
                      {addr.street}, {addr.number} {addr.complement && `(${addr.complement})`}
                    </p>
                    <p className="text-gray-500">{addr.district} - {addr.city}/{addr.state}</p>
                    <p className="text-gray-400">CEP: {addr.cep}</p>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handleSelectSavedAddress('new')}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-center font-medium ${
                    selectedAddressId === 'new'
                      ? 'border-cake-pink bg-white shadow-sm ring-2 ring-cake-pink/30 text-cake-text'
                      : 'border-dashed border-gray-300 bg-white/50 hover:bg-white text-gray-500'
                  }`}
                >
                  + Digitar outro endereço
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">CEP *</label>
              <div className="relative">
                <input
                  type="text"
                  value={endereco.cep || ''}
                  onChange={(e) => setEndereco({ ...endereco, cep: e.target.value })}
                  onBlur={handleCepBlur}
                  className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                  placeholder="00000-000"
                  required
                />
                {loadingCep && (
                  <span className="absolute right-3 top-2.5 text-xs text-gray-500">Buscando...</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Número *</label>
              <input
                type="text"
                value={endereco.number || ''}
                onChange={(e) => setEndereco({ ...endereco, number: e.target.value })}
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                placeholder="Ex: 123"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Endereço (Rua/Avenida) *</label>
              <input
                type="text"
                value={endereco.street || ''}
                onChange={(e) => setEndereco({ ...endereco, street: e.target.value })}
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                placeholder="Rua, Avenida..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Complemento (opcional)</label>
              <input
                type="text"
                value={endereco.complement || ''}
                onChange={(e) => setEndereco({ ...endereco, complement: e.target.value })}
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                placeholder="Apto, Bloco, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bairro *</label>
              <input
                type="text"
                value={endereco.district || ''}
                onChange={(e) => setEndereco({ ...endereco, district: e.target.value })}
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                placeholder="Bairro"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cidade *</label>
              <input
                type="text"
                value={endereco.city || ''}
                onChange={(e) => setEndereco({ ...endereco, city: e.target.value })}
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                placeholder="Cidade"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estado (UF) *</label>
              <input
                type="text"
                value={endereco.state || ''}
                onChange={(e) => setEndereco({ ...endereco, state: e.target.value.toUpperCase() })}
                maxLength={2}
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                placeholder="UF"
                required
              />
            </div>
          </div>
        </div>

        {/* Observations */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-cake-text mb-2">
            📝 Observações do Pedido (opcional)
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Alguma instrução especial para entrega, ponto de referência ou detalhes sobre os itens?
          </p>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full px-4 py-3 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none resize-none text-sm"
            rows={3}
            placeholder="Ex: Tocar a campainha, deixar na portaria, caprichar no granulado..."
          />
        </div>

        {/* Informações de Pagamento e Regras de Alteração */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-sm text-blue-950 mb-1">
              <HiCreditCard size={18} />
              <span>Status do Pagamento</span>
            </div>
            <p>
              • <strong>Status inicial:</strong> <span className="bg-blue-100 px-2 py-0.5 rounded text-blue-800 font-semibold">Pendente</span>
            </p>
            <p>
              • O pagamento pode ser realizado no ato da entrega (Cartão, Dinheiro ou PIX) ou com o operador.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-sm text-amber-950 mb-1">
              <HiInformationCircle size={18} />
              <span>Regras de Alteração do Pedido</span>
            </div>
            <p>
              • ⏱️ Você tem até <strong>5 minutos</strong> após a confirmação para alterar observações ou cancelar o pedido enquanto estiver "Aguardando Confirmação".
            </p>
            <p>
              • Após aceito pelo operador, o pedido entra em produção e não poderá mais ser alterado.
            </p>
          </div>
        </div>

        {/* Total and Confirm */}
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 shadow-lg border-2 border-cake-pink">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xl font-bold text-cake-text block">Total do Pedido:</span>
              <span className="text-xs text-gray-600">
                {totalUnits} cupcake(s) montado(s)
              </span>
            </div>
            <span className="text-3xl font-extrabold text-cake-pink">
              R$ {total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleConfirmarPedido}
            disabled={submitting}
            className="w-full py-4 bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-bold text-lg rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {submitting ? 'Enviando Pedido...' : '✅ Confirmar Pedido'}
          </button>
        </div>
      </div>
    </Layout>
  );
};
