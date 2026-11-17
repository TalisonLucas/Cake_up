import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiEye, HiEyeOff, HiCreditCard, HiLocationMarker, HiPencil, HiCheck, HiX, HiInformationCircle } from 'react-icons/hi';
import { StatusBadge } from './StatusBadge';
import { OrderTimer } from './OrderTimer';
import { OrderChatButton } from '../Chat/OrderChatButton';
import type { Order } from '../../types';
import { useOrderStore } from '../../store/orderStore';
import { ordersApi } from '../../services/api';

interface OrderCardProps {
  order: Order;
  showTimer?: boolean;
  showActions?: boolean;
}

export const OrderCard = ({ order, showTimer = true, showActions = true }: OrderCardProps) => {
  const { canEditOrder, getRemainingEditTime, updateOrder, loadOrders } = useOrderStore();
  const canEdit = canEditOrder(order);
  const remainingTime = getRemainingEditTime(order);

  const [expanded, setExpanded] = useState(false);
  const [editingObservations, setEditingObservations] = useState(false);
  const [newObservations, setNewObservations] = useState(order.observacoes || '');
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Quantidade total de unidades no pedido
  const totalUnits = (order.items || []).reduce((acc, item) => acc + (item.quantity || 1), 0);

  // Status de Pagamento
  const isPaid = order.status === 'pago' || !!order.paidAt;
  const isCanceled = order.status === 'cancelado';

  const handleSaveObservations = async () => {
    setLoadingEdit(true);
    try {
      const updated = await ordersApi.update(order.id, { observations: newObservations });
      updateOrder(order.id, { observacoes: updated.observacoes });
      setEditingObservations(false);
      alert('Observações do pedido atualizadas com sucesso!');
    } catch (err: any) {
      console.error('Erro ao atualizar observações:', err);
      alert(err.response?.data?.detail || 'Erro ao atualizar observações do pedido.');
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Deseja realmente cancelar este pedido? Esta ação não pode ser desfeita.')) {
      return;
    }

    setCancelling(true);
    try {
      await ordersApi.cancel(order.id);
      await loadOrders();
      alert('Pedido cancelado com sucesso.');
    } catch (err: any) {
      console.error('Erro ao cancelar pedido:', err);
      alert(err.response?.data?.error || err.response?.data?.detail || 'Erro ao cancelar pedido.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-5 border border-gray-200">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-cake-text">{order.number}</h3>
            {/* Status de Pagamento Badge */}
            {isPaid ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                <HiCreditCard size={14} />
                Pago
              </span>
            ) : isCanceled ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                Cancelado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                <HiCreditCard size={14} />
                Pagamento Pendente
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Realizado em: {new Date(order.createdAt).toLocaleString('pt-BR')}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Timer de tolerância de alteração */}
      {showTimer && canEdit && remainingTime > 0 && order.status !== 'cancelado' && (
        <div className="mb-3">
          <OrderTimer order={order} />
          <div className="mt-1 flex items-center justify-between text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
            <span>⏱️ Você ainda pode alterar observações ou cancelar este pedido.</span>
            {!editingObservations && (
              <button
                onClick={() => setEditingObservations(true)}
                className="text-xs font-bold text-amber-900 underline ml-2 hover:text-black"
              >
                Alterar observações
              </button>
            )}
          </div>
        </div>
      )}

      {/* Aviso de cancelamento */}
      {order.status === 'cancelado' && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
          <p className="font-semibold">Pedido cancelado</p>
          <p>
            Este pedido foi cancelado pelo cliente ou pelo estabelecimento (expirado após 5 minutos sem confirmação).
          </p>
        </div>
      )}

      {/* Resumo Rápido */}
      <div className="bg-gray-50 rounded-xl p-3 space-y-2 mb-3 text-sm border border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Quantidade de Itens:</span>
          <span className="font-semibold text-cake-text">
            {totalUnits} {totalUnits === 1 ? 'cupcake' : 'cupcakes'} ({order.items.length} tipo{order.items.length > 1 ? 's' : ''})
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total do Pedido:</span>
          <span className="font-extrabold text-base text-cake-pink">
            R$ {order.total.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-start text-xs text-gray-600 pt-1 border-t border-gray-200/60">
          <span className="flex items-center gap-1 font-medium text-gray-700">
            <HiLocationMarker size={14} className="text-cake-pink" /> Destino:
          </span>
          <span className="text-right text-gray-800 max-w-[70%]">
            {order.destination}
          </span>
        </div>

        {order.observacoes && !expanded && (
          <div className="text-xs pt-1 border-t border-gray-200/60">
            <span className="font-semibold text-gray-600">Obs: </span>
            <span className="italic text-gray-700">{order.observacoes}</span>
          </div>
        )}
      </div>

      {/* Delivery Code (se liberado ou pago) */}
      {order.deliveryCode && (order.status === 'liberado' || order.status === 'pago') && (
        <div className="mb-3 p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-700 font-semibold">Código de Retirada / Entrega:</p>
            <p className="text-xs text-purple-600">Apresente este código ao entregador ou balcão</p>
          </div>
          <p className="text-2xl font-black font-mono text-purple-900 tracking-wider">
            {order.deliveryCode.code}
          </p>
        </div>
      )}

      {/* DETALHES COMPLETOS EXPANDÍVEIS */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* Seção 1: Descrição detalhada dos itens adquiridos */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              📋 Descrição dos Itens Adquiridos
            </h4>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-pink-50/50 rounded-xl border border-pink-100 text-xs text-cake-text space-y-1.5"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-sm text-cake-pink">
                      {item.quantity}x Cupcake Personalizado #{idx + 1}
                    </span>
                    <span className="font-bold text-gray-800">
                      R$ {(item.preco || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 bg-white p-2 rounded-lg border border-pink-100 text-gray-700">
                    <div>
                      <span className="text-gray-400 font-medium">Massa: </span>
                      <span className="font-semibold">{item.massa?.name || 'Padrão'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Recheio: </span>
                      <span className="font-semibold">{item.recheio?.name || 'Padrão'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Cobertura: </span>
                      <span className="font-semibold">{item.cobertura?.name || 'Padrão'}</span>
                    </div>
                  </div>

                  {item.observacoes && (
                    <p className="italic text-gray-600 bg-amber-50 p-1.5 rounded border border-amber-200 text-2xs">
                      <strong>Obs do item:</strong> {item.observacoes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Seção 2: Endereço completo */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <HiLocationMarker size={14} className="text-cake-pink" /> Endereço Completo de Entrega
            </h4>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 space-y-1">
              <p>
                <strong>Logradouro:</strong> {order.enderecoEntrega?.street || order.destination},{' '}
                {order.enderecoEntrega?.number || 'S/N'}
                {order.enderecoEntrega?.complement && ` (${order.enderecoEntrega.complement})`}
              </p>
              <p>
                <strong>Bairro:</strong> {order.enderecoEntrega?.district || '-'} |{' '}
                <strong>Cidade/UF:</strong> {order.enderecoEntrega?.city || '-'}/{order.enderecoEntrega?.state || '-'}
              </p>
              {order.enderecoEntrega?.cep && (
                <p>
                  <strong>CEP:</strong> {order.enderecoEntrega.cep}
                </p>
              )}
            </div>
          </div>

          {/* Seção 3: Status de Pagamento */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <HiCreditCard size={14} className="text-cake-pink" /> Status de Pagamento
            </h4>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Situação:</span>
                {isPaid ? (
                  <span className="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                    ✅ Pagamento Confirmado
                  </span>
                ) : isCanceled ? (
                  <span className="text-gray-600 font-bold bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                    ❌ Pedido Cancelado
                  </span>
                ) : (
                  <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    ⏳ Pagamento no ato da entrega ou balcão (Pendente)
                  </span>
                )}
              </div>
              {order.paidAt && (
                <p className="text-gray-500 text-2xs">
                  Confirmado em: {new Date(order.paidAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>

          {/* Seção 4: Observações e Alterações do Pedido */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <HiInformationCircle size={14} className="text-cake-pink" /> Observações e Alterações
              </h4>
              {canEdit && remainingTime > 0 && !editingObservations && (
                <button
                  type="button"
                  onClick={() => setEditingObservations(true)}
                  className="text-xs font-semibold text-cake-pink hover:text-cake-dark-pink flex items-center gap-1"
                >
                  <HiPencil size={14} /> Editar Observações
                </button>
              )}
            </div>

            {editingObservations ? (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <label className="block text-xs font-medium text-amber-900">
                  Alterar observações do pedido (dentro do prazo de tolerância):
                </label>
                <textarea
                  value={newObservations}
                  onChange={(e) => setNewObservations(e.target.value)}
                  className="w-full p-2 bg-white rounded-lg border border-amber-300 text-xs outline-none focus:ring-2 focus:ring-cake-pink"
                  rows={2}
                  placeholder="Escreva as novas observações..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveObservations}
                    disabled={loadingEdit}
                    className="flex items-center gap-1 px-3 py-1 bg-cake-pink text-cake-text font-semibold rounded-lg text-xs shadow hover:bg-cake-dark-pink disabled:opacity-50"
                  >
                    <HiCheck size={14} />
                    {loadingEdit ? 'Salvando...' : 'Salvar Alteração'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingObservations(false);
                      setNewObservations(order.observacoes || '');
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs hover:bg-gray-300"
                  >
                    <HiX size={14} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700">
                <p>
                  <strong>Observações do Cliente:</strong>{' '}
                  <span className="italic">{order.observacoes || 'Nenhuma observação informada.'}</span>
                </p>
                <div className="mt-2 pt-2 border-t border-gray-200/60 text-2xs text-gray-500">
                  {canEdit && remainingTime > 0 ? (
                    <span className="text-amber-800 font-medium">
                      ⏱️ Este pedido ainda aceita alterações e cancelamento pois está aguardando confirmação.
                    </span>
                  ) : order.status === 'cancelado' ? (
                    <span className="text-red-700">Pedido cancelado.</span>
                  ) : (
                    <span className="text-gray-500">
                      🔒 Pedido aceito ou prazo encerrado. Alterações devem ser combinadas via chat com o operador.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botão de Cancelar Pedido (se ainda editável) */}
          {canEdit && remainingTime > 0 && order.status !== 'cancelado' && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelando...' : 'Cancelar este pedido'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 mt-3 pt-2">
          <Link
            to={`/pedido/${order.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-semibold rounded-xl transition-all shadow-sm text-sm"
          >
            <HiEye size={18} />
            Ver Detalhes
          </Link>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-xs flex items-center gap-1"
            title={expanded ? 'Ocultar prévia' : 'Prévia rápida no card'}
          >
            {expanded ? (
              <>
                <HiEyeOff size={16} />
                <span>Ocultar</span>
              </>
            ) : (
              <>
                <HiEye size={16} />
                <span>Prévia</span>
              </>
            )}
          </button>

          <OrderChatButton
            orderId={order.id}
            variant="icon"
            className="px-4 py-2 border-2 border-cake-pink rounded-xl hover:bg-pink-50 transition-colors"
          />
        </div>
      )}
    </div>
  );
};
