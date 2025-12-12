import { useState } from 'react';
import { type Order, type OrderStatus } from '../../types';
import { StatusBadge } from '../Order/StatusBadge';
import { OrderChatButton } from '../Chat/OrderChatButton';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { HiChat } from 'react-icons/hi';

interface OrderManagementCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  onValidateCode: (orderId: string, code: string) => void;
  onCancel: (orderId: string) => void;
  compact?: boolean;
}

export const OrderManagementCard = ({ order, onStatusChange, onValidateCode, onCancel, compact = false }: OrderManagementCardProps) => {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');

  const { isAdmin } = useAuthStore();
  const { conversations } = useChatStore();

  // Encontrar conversa relacionada a este pedido
  const orderConversation = conversations.find(
    conv => conv.relatedOrderId === order.id.toString() || conv.orderDetails?.id === order.id.toString()
  );

  // Contar mensagens não lidas para este pedido
  const unreadCount = orderConversation?.unreadCount || 0;

  // Lógica para determinar próximo status possível
  const getNextStatus = (): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      'aguardando': 'aceito',
      'aceito': 'producao',
      'producao': 'liberado',
      'liberado': 'pago',
      'pago': null,
      'cancelado': null,
    };
    return statusFlow[order.status];
  };

  const nextStatus = getNextStatus();

  const handleValidateCode = () => {
    if (code.length === 6) {
      onValidateCode(order.id, code);
      setCode('');
      setShowCodeInput(false);
    }
  };

  // Se for modo compacto (lista), renderizar layout horizontal
  if (compact) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-cake-pink hover:shadow-md transition-shadow">
        <div className="flex flex-col desktop:flex-row desktop:items-center gap-4">
          {/* Coluna 1: Informações principais */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-lg text-cake-text">#{order.number}</h3>
              <StatusBadge status={order.status} />
              {unreadCount > 0 && (
                <span className="relative">
                  <HiChat className="text-purple-600" size={20} />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">{order.clientName}</p>
            <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('pt-BR')}</p>
          </div>

          {/* Coluna 2: Itens resumidos */}
          <div className="flex-1 min-w-0 desktop:max-w-xs">
            <div className="text-sm">
              <p className="font-medium text-gray-700">
                {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {order.items[0]?.massa?.name} • {order.items[0]?.recheio?.name} • {order.items[0]?.cobertura?.name}
                {order.items.length > 1 && ` +${order.items.length - 1}`}
              </p>
            </div>
          </div>

          {/* Coluna 3: Total e endereço */}
          <div className="flex-1 min-w-0 desktop:max-w-xs">
            <p className="text-sm font-semibold text-gray-800 mb-1">R$ {order.total.toFixed(2)}</p>
            <p className="text-xs text-gray-600 truncate">{order.destination}</p>
          </div>

          {/* Coluna 4: Ações */}
          <div className="flex flex-col desktop:flex-row gap-2 desktop:min-w-[200px]">
            <OrderChatButton
              orderId={order.id}
              existingConversation={orderConversation}
              variant="icon"
              className="px-3 py-2"
            />
            {nextStatus && order.status !== 'pago' && (
              <button
                onClick={() => onStatusChange(order.id, nextStatus)}
                className="px-3 py-2 bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-semibold text-sm rounded-lg transition-colors whitespace-nowrap"
              >
                → {getStatusLabel(nextStatus)}
              </button>
            )}
            {order.status === 'liberado' && (
              <button
                onClick={() => setShowCodeInput(!showCodeInput)}
                className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold text-sm rounded-lg transition-colors whitespace-nowrap"
              >
                Validar
              </button>
            )}
            {(
              order.status === 'aguardando' || 
              (order.status === 'aceito' && isAdmin())
            ) && (
              <button
                onClick={() => onCancel(order.id)}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm rounded-lg border border-red-300 transition-colors whitespace-nowrap"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Input de código (expandido) */}
        {showCodeInput && order.deliveryCode && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-mono"
                maxLength={6}
              />
              <button
                onClick={handleValidateCode}
                disabled={code.length !== 6}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
              >
                Validar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Layout padrão (grid) - simplificado conforme HTML fornecido
  return (
    <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-cake-pink">
      {/* Header com número e status */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg text-cake-text">#{order.number}</h3>
            {unreadCount > 0 && (
              <span className="relative">
                <HiChat className="text-purple-600" size={18} />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{order.clientName}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Total e endereço */}
      <div className="border-t pt-3 mb-3">
        <p className="text-sm"><strong>Total:</strong> R$ {order.total.toFixed(2)}</p>
        <p className="text-sm text-gray-600"><strong>Entrega:</strong> {order.destination}</p>
        <p className="text-xs text-gray-500 mt-1">Pedido em {new Date(order.createdAt).toLocaleString('pt-BR')}</p>
      </div>

      {/* Ações do operador */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <OrderChatButton
            orderId={order.id}
            existingConversation={orderConversation}
            variant="button"
            className="flex-shrink-0"
          />
          {nextStatus && order.status !== 'pago' && (
            <button
              onClick={() => onStatusChange(order.id, nextStatus)}
              className="flex-1 bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Avançar para: {getStatusLabel(nextStatus)}
            </button>
          )}
          
          {order.status === 'liberado' && (
            <button
              onClick={() => setShowCodeInput(!showCodeInput)}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Validar Código
            </button>
          )}
        </div>

        {/* Card/botão de recusa de pedido */}
        {(
          order.status === 'aguardando' || 
          (order.status === 'aceito' && isAdmin())
        ) && (
          <button
            onClick={() => onCancel(order.id)}
            className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-lg border border-red-300 transition-colors text-sm text-left"
          >
            <span className="block text-xs uppercase tracking-wide mb-1">Recusar Pedido</span>
            <span className="block">
              {order.status === 'aguardando' 
                ? 'Cancelar este pedido e liberar a fila. O cliente será informado que o pedido foi recusado.'
                : 'Apenas administradores podem cancelar pedidos que já foram aceitos. O cliente será informado que o pedido foi recusado.'}
            </span>
          </button>
        )}
      </div>

      {/* Input de código de entrega */}
      {showCodeInput && order.deliveryCode && (
        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
          <p className="text-sm font-medium mb-2">Digite o código fornecido pelo cliente:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center text-xl font-mono"
              maxLength={6}
            />
            <button
              onClick={handleValidateCode}
              disabled={code.length !== 6}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
            >
              Validar
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Código esperado: {order.deliveryCode.code} (apenas para referência)
          </p>
        </div>
      )}
    </div>
  );
};

// Helper para labels de status
const getStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    'aguardando': 'Aguardando',
    'aceito': 'Aceito',
    'producao': 'Em Produção',
    'liberado': 'Liberado',
    'pago': 'Pago',
    'cancelado': 'Cancelado',
  };
  return labels[status];
};

