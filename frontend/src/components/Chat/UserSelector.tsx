import { useState, useEffect } from 'react';
import { HiX, HiSearch, HiUser } from 'react-icons/hi';
import { usersApi, chatApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface UserSelectorProps {
  onSelect: (conversationId: string) => void;
  onClose: () => void;
}

export const UserSelector = ({ onSelect, onClose }: UserSelectorProps) => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAvailableUsers();
  }, []);

  const loadAvailableUsers = async () => {
    try {
      setLoading(true);
      // Buscar usuários (apenas admins podem ver todos, clientes veem operadores)
      const response = await usersApi.getAll({ isActive: true });
      // Filtrar o próprio usuário
      const filteredUsers = response.users.filter((u: any) => u.id !== user?.id);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários disponíveis:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (selectedUserId: string) => {
    try {
      // Criar conversa com o usuário selecionado
      // Determinar tipo de conversa baseado nos roles
      const selectedUser = users.find(u => u.id === selectedUserId);
      let conversationType = 'CLIENT_ESTABLISHMENT';
      
      if (user?.role === 'operator' && selectedUser?.role === 'admin') {
        conversationType = 'OPERATOR_ADMIN';
      } else if (user?.role === 'admin' && selectedUser?.role === 'operator') {
        conversationType = 'OPERATOR_ADMIN';
      }
      
      const conversation = await chatApi.createConversation(conversationType, [selectedUserId]);
      onSelect(conversation.id.toString());
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar conversa:', error);
      alert(error.response?.data?.error || 'Erro ao iniciar conversa');
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleLabel = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN': return 'Administrador';
      case 'OPERATOR': return 'Operador';
      case 'CLIENT': return 'Cliente';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'OPERATOR': return 'bg-green-100 text-green-800';
      case 'CLIENT': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Iniciar Nova Conversa</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <HiX size={24} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando usuários...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <HiUser size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Nenhum usuário disponível encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user.id.toString())}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left flex items-center gap-4"
                >
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 font-semibold">
                      {user.name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {user.name || user.username}
                      </p>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role?.toUpperCase() || '')}`}>
                        {getRoleLabel(user.role?.toUpperCase() || '')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
