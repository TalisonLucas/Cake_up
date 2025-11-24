import type { OrderStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'aguardando':
        return {
          text: 'Aguardando',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300',
          icon: '🟡',
        };
      case 'aceito':
        return {
          text: 'Aceito',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300',
          icon: '🔵',
        };
      case 'producao':
        return {
          text: 'Em Produção',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-300',
          icon: '🟠',
        };
      case 'liberado':
        return {
          text: 'Liberado',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-300',
          icon: '🟣',
        };
      case 'pago':
        return {
          text: 'Pago',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300',
          icon: '🟢',
        };
      default:
        return {
          text: 'Desconhecido',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
          icon: '⚪',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      <span className="text-xs">{config.icon}</span>
      {config.text}
    </span>
  );
};


