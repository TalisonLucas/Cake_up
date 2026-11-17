import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { StatusBadge } from '../components/Order/StatusBadge';
import { OrderTimer } from '../components/Order/OrderTimer';
import { OrderChatButton } from '../components/Chat/OrderChatButton';
import { useOrderStore } from '../store/orderStore';
import { useAuthStore } from '../store/authStore';
import { ordersApi } from '../services/api';
import type { Order, OrderStatus } from '../types';
import {
  HiArrowLeft,
  HiLocationMarker,
  HiCreditCard,
  HiPencil,
  HiCheck,
  HiX,
  HiInformationCircle,
  HiShoppingBag,
  HiExclamationCircle,
} from 'react-icons/hi';

const statusFlow: Record<OrderStatus, OrderStatus | null> = {
  aguardando: 'aceito',
  aceito: 'producao',
  producao: 'liberado',
  liberado: 'pago',
  pago: null,
  cancelado: null,
};

const getStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    aguardando: 'Aguardando',
    aceito: 'Aceito',
    producao: 'Em Produção',
    liberado: 'Liberado',
    pago: 'Pago',
    cancelado: 'Cancelado',
  };
  return labels[status];
};

export const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { orders, canEditOrder, getRemainingEditTime, updateOrder, loadOrders } = useOrderStore();

  const isStaff = user?.role === 'operator' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const backPath = isAdmin
    ? '/admin/dashboard'
    : user?.role === 'operator'
      ? '/operador/dashboard'
      : '/meus-pedidos';
  const backLabel = isStaff ? 'Voltar ao Dashboard' : 'Voltar para Meus Pedidos';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para edição de observações
  const [editingObservations, setEditingObservations] = useState(false);
  const [newObservations, setNewObservations] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [code, setCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);

  // Buscar pedido
  useEffect(() => {
    let isMounted = true;

    const fetchOrder = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      // Primeiro tentar encontrar no store
      const existing = orders.find((o) => o.id === id || o.number === id);
      if (existing) {
        if (isMounted) {
          setOrder(existing);
          setNewObservations(existing.observacoes || '');
          setLoading(false);
        }
        return;
      }

      // Senão, buscar da API
      try {
        const data = await ordersApi.getById(id);
        if (isMounted) {
          setOrder(data);
          setNewObservations(data.observacoes || '');
        }
      } catch (err: any) {
        console.error('Erro ao buscar detalhes do pedido:', err);
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              err.response?.data?.error ||
              'Não foi possível encontrar este pedido.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [id, orders]);

  // Se o pedido no store atualizar (via WebSocket, etc.), sincronizar o estado local
  useEffect(() => {
    if (order && id) {
      const updated = orders.find((o) => o.id === order.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(order)) {
        setOrder(updated);
        if (!editingObservations) {
          setNewObservations(updated.observacoes || '');
        }
      }
    }
  }, [orders, order, id, editingObservations]);

  if (loading) {
    return (
      <Layout title="Detalhes do Pedido">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cake-pink"></div>
          <p className="text-gray-600 font-medium text-sm">Carregando detalhes do pedido...</p>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout title="Detalhes do Pedido">
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 space-y-4">
            <HiExclamationCircle size={48} className="mx-auto text-red-500" />
            <h2 className="text-xl font-bold text-cake-text">Pedido não encontrado</h2>
            <p className="text-sm text-gray-600">
              {error || 'O pedido solicitado não existe ou você não tem permissão para visualizá-lo.'}
            </p>
            <div className="pt-4">
              <Link
                to={backPath}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-semibold rounded-xl transition-colors shadow-sm text-sm"
              >
                <HiArrowLeft size={16} />
                {backLabel}
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const canEdit = canEditOrder(order);
  const remainingTime = getRemainingEditTime(order);
  const isPaid = order.status === 'pago' || !!order.paidAt;
  const isCanceled = order.status === 'cancelado';
  const totalUnits = (order.items || []).reduce((acc, item) => acc + (item.quantity || 1), 0);

  const handleSaveObservations = async () => {
    setLoadingEdit(true);
    try {
      const updated = await ordersApi.update(order.id, { observations: newObservations });
      updateOrder(order.id, { observacoes: updated.observacoes });
      setOrder((prev) => (prev ? { ...prev, observacoes: updated.observacoes } : null));
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
      navigate(backPath);
    } catch (err: any) {
      console.error('Erro ao cancelar pedido:', err);
      alert(err.response?.data?.error || err.response?.data?.detail || 'Erro ao cancelar pedido.');
    } finally {
      setCancelling(false);
    }
  };

  const nextStatus = order ? statusFlow[order.status] : null;

  const handleAdvanceStatus = async () => {
    if (!order || !nextStatus) return;
    setStatusUpdating(true);
    try {
      const updated = await ordersApi.updateStatus(order.id, nextStatus);
      setOrder(updated);
      updateOrder(order.id, updated);
    } catch (err: any) {
      console.error('Erro ao avançar status:', err);
      alert(err.response?.data?.error || err.response?.data?.detail || 'Erro ao atualizar status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleValidateCode = async () => {
    if (!order || code.length !== 6) return;
    setStatusUpdating(true);
    try {
      const updated = await ordersApi.validateDeliveryCode(order.id, code);
      setOrder(updated);
      updateOrder(order.id, updated);
      setCode('');
      setShowCodeInput(false);
      alert('Código validado. Entrega confirmada.');
    } catch (err: any) {
      console.error('Erro ao validar código:', err);
      alert(err.response?.data?.error || err.response?.data?.detail || 'Código inválido.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const canStaffCancel =
    isStaff &&
    (order.status === 'aguardando' || (order.status === 'aceito' && isAdmin));

  return (
    <Layout title={`Pedido ${order.number}`}>
      <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to={backPath}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-cake-text transition-colors"
          >
            <HiArrowLeft size={18} />
            {backLabel}
          </Link>

          <OrderChatButton
            orderId={order.id}
            variant="button"
            className="text-xs px-3 py-1.5"
          />
        </div>

        {isStaff && (
          <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-200 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Ações do {isAdmin ? 'administrador' : 'operador'}
            </p>
            {order.clientName && (
              <p className="text-sm text-gray-700">
                <strong>Cliente:</strong> {order.clientName}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {nextStatus && order.status !== 'pago' && order.status !== 'cancelado' && (
                <button
                  type="button"
                  onClick={handleAdvanceStatus}
                  disabled={statusUpdating}
                  className="px-4 py-2 bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {statusUpdating ? 'Atualizando...' : `Avançar para: ${getStatusLabel(nextStatus)}`}
                </button>
              )}
              {order.status === 'liberado' && (
                <button
                  type="button"
                  onClick={() => setShowCodeInput((v) => !v)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold text-sm rounded-lg transition-colors"
                >
                  Validar código
                </button>
              )}
              {canStaffCancel && (
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm rounded-lg border border-red-300 transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelando...' : 'Cancelar pedido'}
                </button>
              )}
            </div>
            {showCodeInput && order.status === 'liberado' && (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-mono"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={handleValidateCode}
                  disabled={code.length !== 6 || statusUpdating}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
                >
                  Validar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Order Main Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 space-y-5">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-cake-text">{order.number}</h2>
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
              <p className="text-xs text-gray-500 mt-1">
                Realizado em: {new Date(order.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Timer de tolerância de alteração (cliente) */}
          {!isStaff && canEdit && remainingTime > 0 && !isCanceled && (
            <div className="space-y-2">
              <OrderTimer order={order} />
              <div className="flex items-center justify-between text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <span>⏱️ Você ainda pode alterar observações ou cancelar este pedido dentro do prazo de tolerância.</span>
              </div>
            </div>
          )}

          {/* Aviso se cancelado */}
          {isCanceled && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <p className="font-bold text-sm">Pedido cancelado</p>
              <p>
                Este pedido foi cancelado pelo cliente ou pelo estabelecimento (expirado após 5 minutos sem confirmação).
              </p>
            </div>
          )}

          {/* Código de Entrega (se liberado ou pago) */}
          {order.deliveryCode && (order.status === 'liberado' || order.status === 'pago') && (
            <div className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-xs text-purple-700 font-bold uppercase tracking-wider">
                  Código de Retirada / Entrega
                </p>
                <p className="text-xs text-purple-600 mt-0.5">
                  Apresente este código ao entregador ou atendente no balcão:
                </p>
              </div>
              <span className="text-3xl font-black font-mono text-purple-900 tracking-widest bg-white px-4 py-2 rounded-xl border border-purple-300 shadow-sm">
                {order.deliveryCode.code}
              </span>
            </div>
          )}

          {/* ======================================================== */}
          {/* SEÇÃO 1: DESCRIÇÃO DOS ITENS QUE FORMAM O PEDIDO         */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-cake-text uppercase tracking-wider flex items-center gap-1.5">
                <HiShoppingBag size={18} className="text-cake-pink" />
                Descrição dos Itens do Pedido ({totalUnits} {totalUnits === 1 ? 'unidade' : 'unidades'})
              </h3>
            </div>

            <div className="space-y-3">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 bg-pink-50/40 rounded-2xl border border-pink-100 space-y-2.5 transition-all hover:border-pink-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-sm text-cake-text">
                          {item.quantity}x Cupcake Personalizado #{idx + 1}
                        </span>
                      </div>
                      <span className="font-extrabold text-sm text-cake-pink">
                        R$ {(item.preco || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* Componentes que formam o cupcake */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-pink-100 text-xs">
                      <div>
                        <span className="text-gray-400 block font-medium">Massa:</span>
                        <span className="font-bold text-gray-800">
                          {item.massa?.name || 'Massa Tradicional'}
                        </span>
                        {item.massa?.description && (
                          <p className="text-2xs text-gray-500 mt-0.5">{item.massa.description}</p>
                        )}
                      </div>

                      <div>
                        <span className="text-gray-400 block font-medium">Recheio:</span>
                        <span className="font-bold text-gray-800">
                          {item.recheio?.name || 'Recheio Padrão'}
                        </span>
                        {item.recheio?.description && (
                          <p className="text-2xs text-gray-500 mt-0.5">{item.recheio.description}</p>
                        )}
                      </div>

                      <div>
                        <span className="text-gray-400 block font-medium">Cobertura:</span>
                        <span className="font-bold text-gray-800">
                          {item.cobertura?.name || 'Cobertura Padrão'}
                        </span>
                        {item.cobertura?.description && (
                          <p className="text-2xs text-gray-500 mt-0.5">{item.cobertura.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Observações específicas deste item */}
                    {item.observacoes && (
                      <div className="text-xs bg-amber-50/80 p-2 rounded-lg border border-amber-200 text-amber-900">
                        <span className="font-bold">Observação deste item: </span>
                        <span className="italic">{item.observacoes}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-xl">
                  Nenhum item listado neste pedido.
                </p>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* SEÇÃO 2: OBSERVAÇÕES GERAIS DO PEDIDO                    */}
          {/* ======================================================== */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-cake-text uppercase tracking-wider flex items-center gap-1.5">
                <HiInformationCircle size={18} className="text-cake-pink" />
                Observações do Pedido
              </h3>
              {!isStaff && canEdit && remainingTime > 0 && !editingObservations && !isCanceled && (
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
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                <label className="block text-xs font-bold text-amber-900">
                  Alterar observações do pedido (dentro do prazo de tolerância):
                </label>
                <textarea
                  value={newObservations}
                  onChange={(e) => setNewObservations(e.target.value)}
                  className="w-full p-3 bg-white rounded-xl border border-amber-300 text-xs outline-none focus:ring-2 focus:ring-cake-pink text-gray-800"
                  rows={3}
                  placeholder="Escreva aqui instruções para entrega, recados especiais ou detalhes do pedido..."
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveObservations}
                    disabled={loadingEdit}
                    className="flex items-center gap-1 px-4 py-2 bg-cake-pink text-cake-text font-bold rounded-xl text-xs shadow hover:bg-cake-dark-pink transition-colors disabled:opacity-50"
                  >
                    <HiCheck size={16} />
                    {loadingEdit ? 'Salvando...' : 'Salvar Observações'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingObservations(false);
                      setNewObservations(order.observacoes || '');
                    }}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-300 transition-colors"
                  >
                    <HiX size={16} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-700 space-y-2">
                <p className="text-sm">
                  {order.observacoes ? (
                    <span className="italic text-gray-800 font-medium">"{order.observacoes}"</span>
                  ) : (
                    <span className="italic text-gray-400">Nenhuma observação geral informada para este pedido.</span>
                  )}
                </p>

                <div className="pt-2 border-t border-gray-200 text-2xs text-gray-500">
                  {canEdit && remainingTime > 0 && !isCanceled ? (
                    <span className="text-amber-800 font-medium">
                      ⏱️ Este pedido ainda aceita alterações nas observações e cancelamento pois está dentro dos 5 minutos de tolerância.
                    </span>
                  ) : isCanceled ? (
                    <span className="text-red-700">Pedido cancelado.</span>
                  ) : (
                    <span className="text-gray-500">
                      🔒 Prazo de alteração direta encerrado. Se precisar de ajustes, utilize o botão de Chat para falar diretamente com a confeitaria.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SEÇÃO 3: ENDEREÇO DE ENTREGA                             */}
          {/* ======================================================== */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-bold text-cake-text uppercase tracking-wider flex items-center gap-1.5">
              <HiLocationMarker size={18} className="text-cake-pink" />
              Endereço de Entrega
            </h3>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-700 space-y-1">
              <p className="font-semibold text-sm text-cake-text">
                {order.enderecoEntrega?.street || order.destination},{' '}
                {order.enderecoEntrega?.number || 'S/N'}
                {order.enderecoEntrega?.complement && ` (${order.enderecoEntrega.complement})`}
              </p>
              <p>
                <strong>Bairro:</strong> {order.enderecoEntrega?.district || '-'} •{' '}
                <strong>Cidade/UF:</strong> {order.enderecoEntrega?.city || '-'}/{order.enderecoEntrega?.state || '-'}
              </p>
              {order.enderecoEntrega?.cep && (
                <p>
                  <strong>CEP:</strong> {order.enderecoEntrega.cep}
                </p>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* SEÇÃO 4: RESUMO FINANCEIRO E PAGAMENTO                   */}
          {/* ======================================================== */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-bold text-cake-text uppercase tracking-wider flex items-center gap-1.5">
              <HiCreditCard size={18} className="text-cake-pink" />
              Resumo e Pagamento
            </h3>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between items-center text-gray-600">
                <span>Subtotal dos Itens:</span>
                <span className="font-semibold">R$ {order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Status do Pagamento:</span>
                {isPaid ? (
                  <span className="text-green-700 font-bold bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                    ✅ Pago
                  </span>
                ) : isCanceled ? (
                  <span className="text-gray-600 font-bold bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-300">
                    ❌ Cancelado
                  </span>
                ) : (
                  <span className="text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    ⏳ Pendente (na entrega ou balcão)
                  </span>
                )}
              </div>
              {order.paidAt && (
                <p className="text-2xs text-gray-500 text-right">
                  Confirmado em: {new Date(order.paidAt).toLocaleString('pt-BR')}
                </p>
              )}
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                <span className="font-bold text-sm text-cake-text">Total do Pedido:</span>
                <span className="font-black text-lg text-cake-pink">
                  R$ {order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* AÇÕES (CANCELAMENTO — cliente na janela de tolerância)   */}
          {/* ======================================================== */}
          {!isStaff && canEdit && remainingTime > 0 && !isCanceled && (
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-5 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {cancelling ? 'Cancelando Pedido...' : 'Cancelar este Pedido'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
export default OrderDetail;
