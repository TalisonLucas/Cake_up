import { useState } from 'react';
import { HiClipboardCopy, HiCheckCircle } from 'react-icons/hi';
import type { DeliveryCode } from '../../types';

interface DeliveryCodeDisplayProps {
  deliveryCode: DeliveryCode;
  orderNumber: string;
}

export const DeliveryCodeDisplay = ({ deliveryCode, orderNumber }: DeliveryCodeDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(deliveryCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expiresAt = new Date(deliveryCode.expiresAt);
  const now = new Date();
  const hoursRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-lg">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">
          🎉 Pedido Liberado!
        </h3>
        <p className="text-sm text-purple-700 mb-4">
          Seu pedido {orderNumber} está pronto para entrega
        </p>

        {/* Código de entrega */}
        <div className="bg-white rounded-xl p-6 mb-4 border-2 border-dashed border-purple-300">
          <p className="text-xs text-gray-600 mb-2 uppercase font-medium">
            Código de Confirmação
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-bold font-mono text-purple-900 tracking-wider">
              {deliveryCode.code}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
              aria-label="Copiar código"
            >
              {copied ? (
                <HiCheckCircle size={24} className="text-green-500" />
              ) : (
                <HiClipboardCopy size={24} className="text-purple-600" />
              )}
            </button>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-purple-100 rounded-lg p-4 text-left space-y-2">
          <p className="text-sm font-medium text-purple-900">
            📋 Instruções:
          </p>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>✓ Informe este código ao entregador</li>
            <li>✓ Realize o pagamento na entrega</li>
            <li>✓ Código válido por {hoursRemaining}h</li>
          </ul>
        </div>

        {deliveryCode.validated && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-sm font-medium text-green-800">
              ✅ Código validado com sucesso!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


