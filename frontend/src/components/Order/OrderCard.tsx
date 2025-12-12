import { Link } from 'react-router-dom';
import { HiEye } from 'react-icons/hi';
import { StatusBadge } from './StatusBadge';
import { OrderTimer } from './OrderTimer';
import { OrderChatButton } from '../Chat/OrderChatButton';
import type { Order } from '../../types';
import { useOrderStore } from '../../store/orderStore';

interface OrderCardProps {
  order: Order;
  showTimer?: boolean;
  showActions?: boolean;
}

export const OrderCard = ({ order, showTimer = true, showActions = true }: OrderCardProps) => {
  const { canEditOrder, getRemainingEditTime } = useOrderStore();
  const canEdit = canEditOrder(order);
  const remainingTime = getRemainingEditTime(order);

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-cake-text">{order.number}</h3>
          <p className="text-sm text-gray-600">
            {new Date(order.createdAt).toLocaleString('pt-BR')}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Timer (se aplicável) */}
      {showTimer && canEdit && remainingTime > 0 && order.status !== 'cancelado' && (
        <div className="mb-3">
          <OrderTimer order={order} />
        </div>
      )}

      {/* Aviso de cancelamento */}
      {order.status === 'cancelado' && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <p className="font-semibold">Pedido cancelado</p>
          <p>
            Este pedido foi cancelado pelo estabelecimento, pois não foi aceito dentro do prazo ou foi recusado pelo
            operador.
          </p>
        </div>
      )}

      {/* Order Details */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total:</span>
          <span className="font-bold text-cake-text">
            R$ {order.total.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Destino:</span>
          <span className="text-cake-text">{order.destination}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Itens:</span>
          <span className="text-cake-text">{order.items.length} cupcakes</span>
        </div>
      </div>

      {/* Delivery Code (se liberado) */}
      {order.deliveryCode && (order.status === 'liberado' || order.status === 'pago') && (
        <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs text-purple-700 mb-1">Código de Entrega:</p>
          <p className="text-2xl font-bold font-mono text-purple-900">
            {order.deliveryCode.code}
          </p>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2">
          <Link
            to={`/pedido/${order.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-medium rounded-lg transition-colors"
          >
            <HiEye size={18} />
            Ver Detalhes
          </Link>
          <OrderChatButton
            orderId={order.id}
            variant="icon"
            className="px-4 py-2 border-2 border-cake-pink rounded-lg"
          />
        </div>
      )}
    </div>
  );
};



