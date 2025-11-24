import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { useCupcakeStore } from '../store/cupcakeStore';
import { useOrderStore } from '../store/orderStore';
import { useAuthStore } from '../store/authStore';
import { HiTrash, HiMinus, HiPlus } from 'react-icons/hi';
import type { Address, Order } from '../types';

export const Carrinho = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateCartItem, getTotal, clearCart } = useCupcakeStore();
  const { addOrder } = useOrderStore();
  const { user, isAuthenticated } = useAuthStore();
  
  const [endereco, setEndereco] = useState<Partial<Address>>({
    cep: '',
    street: '',
    number: '',
    district: '',
    city: '',
    state: '',
  });
  const [observacoes, setObservacoes] = useState('');

  const total = getTotal();

  const handleQuantityChange = (index: number, delta: number) => {
    const cupcake = cart[index];
    const newQuantity = Math.max(1, cupcake.quantity + delta);
    updateCartItem(index, { ...cupcake, quantity: newQuantity });
  };

  const handleConfirmarPedido = () => {
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
      alert('Por favor, preencha o endereço de entrega!');
      return;
    }

    // Create order
    const now = new Date();
    const canEditUntil = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      number: `#CKP${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      status: 'aguardando',
      total,
      destination: `${endereco.city}, ${endereco.state}`,
      items: cart,
      canEditUntil: canEditUntil.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      clientId: user!.id,
      clientName: user!.name,
      enderecoEntrega: endereco as Address,
      observacoes,
      statusHistory: [
        {
          status: 'aguardando',
          timestamp: now.toISOString(),
          note: 'Pedido criado',
        },
      ],
    };

    addOrder(newOrder);
    clearCart();

    alert(`Pedido ${newOrder.number} criado com sucesso! Você tem 2 minutos para alterá-lo.`);
    navigate('/meus-pedidos');
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
            Que tal montar um cupcake delicioso?
          </p>
          <button
            onClick={() => navigate('/montar')}
            className="px-6 py-3 bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-semibold rounded-lg transition-colors"
          >
            Monte seu Cupcake
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Carrinho">
      <div className="py-4 space-y-6">
        {/* Cart Items */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-cake-text mb-4">
            🛒 Seus Cupcakes ({cart.length})
          </h2>

          <div className="space-y-4">
            {cart.map((cupcake, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 bg-gray-50 rounded-xl relative"
              >
                <div className="text-4xl">🧁</div>
                
                <div className="flex-1">
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Massa:</span> {cupcake.massa.name}
                    </p>
                    <p>
                      <span className="font-medium">Recheio:</span> {cupcake.recheio.name}
                    </p>
                    <p>
                      <span className="font-medium">Cobertura:</span> {cupcake.cobertura.name}
                    </p>
                    {cupcake.observacoes && (
                      <p className="text-gray-600 italic">
                        Obs: {cupcake.observacoes}
                      </p>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleQuantityChange(index, -1)}
                      className="p-2 bg-white hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <HiMinus size={16} />
                    </button>
                    <span className="px-3 font-semibold">{cupcake.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(index, 1)}
                      className="p-2 bg-white hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <HiPlus size={16} />
                    </button>
                    <span className="ml-2 font-bold text-cake-pink">
                      R$ {(cupcake.preco * cupcake.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(index)}
                  className="absolute top-2 right-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <HiTrash size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-cake-text mb-4">
            📍 Endereço de Entrega
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">CEP:</label>
              <input
                type="text"
                value={endereco.cep}
                onChange={(e) => setEndereco({ ...endereco, cep: e.target.value })}
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                placeholder="00000-000"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Endereço:</label>
              <input
                type="text"
                value={endereco.street}
                onChange={(e) => setEndereco({ ...endereco, street: e.target.value })}
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                placeholder="Rua, Avenida..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Número:</label>
              <input
                type="text"
                value={endereco.number}
                onChange={(e) => setEndereco({ ...endereco, number: e.target.value })}
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                placeholder="123"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bairro:</label>
              <input
                type="text"
                value={endereco.district}
                onChange={(e) => setEndereco({ ...endereco, district: e.target.value })}
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                placeholder="Bairro"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cidade:</label>
              <input
                type="text"
                value={endereco.city}
                onChange={(e) => setEndereco({ ...endereco, city: e.target.value })}
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                placeholder="Cidade"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estado:</label>
              <input
                type="text"
                value={endereco.state}
                onChange={(e) => setEndereco({ ...endereco, state: e.target.value })}
                maxLength={2}
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                placeholder="SP"
                required
              />
            </div>
          </div>
        </div>

        {/* Observations */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-cake-text mb-4">
            📝 Observações (opcional)
          </h2>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full px-4 py-3 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none resize-none"
            rows={3}
            placeholder="Alguma informação adicional sobre seu pedido?"
          />
        </div>

        {/* Total and Confirm */}
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 shadow-lg border-2 border-cake-pink">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-cake-text">Total:</span>
            <span className="text-3xl font-bold text-cake-pink">
              R$ {total.toFixed(2)}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            ⏱️ Após confirmar, você terá 2 minutos para alterar seu pedido.
          </p>

          <button
            onClick={handleConfirmarPedido}
            className="w-full py-4 bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-bold text-lg rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            ✅ Confirmar Pedido
          </button>
        </div>
      </div>
    </Layout>
  );
};

