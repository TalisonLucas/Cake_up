import { useState, useEffect } from 'react';
import { usersApi } from '../../services/api';
import type { User, UserRole } from '../../types';
import { 
  HiUsers, 
  HiSearch, 
  HiPencil, 
  HiX, 
  HiCheck, 
  HiXCircle
} from 'react-icons/hi';

interface UsersManagementTabProps {}

export const UsersManagementTab = ({}: UsersManagementTabProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'operator' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    firstName: '',
    lastName: '',
    role: 'CLIENT' as 'CLIENT' | 'OPERATOR' | 'ADMIN',
    phone: '',
    cpf: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (roleFilter !== 'all') {
        filters.role = roleFilter.toUpperCase();
      }
      if (statusFilter !== 'all') {
        filters.isActive = statusFilter === 'active';
      }
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }
      
      const result = await usersApi.getAll(filters);
      setUsers(result.users);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      alert('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      password2: '',
      firstName: '',
      lastName: '',
      role: 'CLIENT',
      phone: '',
      cpf: '',
      isActive: true,
    });
    setFormErrors({});
    setSelectedUser(null);
    setShowCreateModal(true);
  };

  const handleEdit = (user: User) => {
    setFormData({
      username: user.username || '',
      email: user.email,
      password: '',
      password2: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role.toUpperCase() as 'CLIENT' | 'OPERATOR' | 'ADMIN',
      phone: user.phone || '',
      cpf: user.cpf || '',
      isActive: user.isActive !== false,
    });
    setFormErrors({});
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleToggleActive = async (user: User) => {
    if (!window.confirm(`Tem certeza que deseja ${user.isActive ? 'desativar' : 'ativar'} o usuário ${user.name}?`)) {
      return;
    }

    try {
      await usersApi.toggleActive(user.id, !user.isActive);
      await loadUsers();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      alert(error.response?.data?.error || 'Erro ao alterar status do usuário');
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username é obrigatório';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    if (showCreateModal) {
      if (!formData.password) {
        errors.password = 'Senha é obrigatória';
      } else if (formData.password.length < 8) {
        errors.password = 'Senha deve ter pelo menos 8 caracteres';
      }
      
      if (formData.password !== formData.password2) {
        errors.password2 = 'As senhas não coincidem';
      }
    }
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'Nome é obrigatório';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      if (showCreateModal) {
        await usersApi.create({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          password2: formData.password2,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          phone: formData.phone || undefined,
          cpf: formData.cpf || undefined,
          isActive: formData.isActive,
        });
        alert('Usuário criado com sucesso!');
      } else {
        await usersApi.update(selectedUser!.id, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          phone: formData.phone || undefined,
          cpf: formData.cpf || undefined,
          isActive: formData.isActive,
        });
        alert('Usuário atualizado com sucesso!');
      }
      
      setShowCreateModal(false);
      setShowEditModal(false);
      await loadUsers();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.detail || 
                      Object.values(error.response?.data || {})[0] ||
                      'Erro ao salvar usuário';
      alert(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    total: users.length,
    clients: users.filter(u => u.role === 'client').length,
    operators: users.filter(u => u.role === 'operator').length,
    admins: users.filter(u => u.role === 'admin').length,
    active: users.filter(u => u.isActive !== false).length,
    inactive: users.filter(u => u.isActive === false).length,
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'client': return 'Cliente';
      case 'operator': return 'Operador';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'client': return 'bg-blue-100 text-blue-800';
      case 'operator': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col desktop:flex-row justify-between items-start desktop:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <HiUsers className="text-purple-600" size={28} />
              Gerenciamento de Usuários
            </h2>
            <p className="text-gray-600 mt-1">Gerencie usuários, permissões e acessos</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 font-semibold shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <span>+</span>
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 desktop:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
          <p className="text-sm text-gray-600">Clientes</p>
          <p className="text-2xl font-bold text-blue-600">{stats.clients}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
          <p className="text-sm text-gray-600">Operadores</p>
          <p className="text-2xl font-bold text-green-600">{stats.operators}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
          <p className="text-sm text-gray-600">Admins</p>
          <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
          <p className="text-sm text-gray-600">Ativos</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
          <p className="text-sm text-gray-600">Inativos</p>
          <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
        <div className="flex flex-col desktop:flex-row gap-4">
          <div className="flex-1 relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, email ou username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Todos os roles</option>
              <option value="client">Clientes</option>
              <option value="operator">Operadores</option>
              <option value="admin">Admins</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Usuários */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando usuários...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-100">
          <HiUsers size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum usuário encontrado</h3>
          <p className="text-gray-500">Tente ajustar os filtros ou criar um novo usuário</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className={user.isActive === false ? 'bg-gray-50 opacity-75' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-600 font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">@{user.username || user.email.split('@')[0]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      {user.phone && (
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isActive === false ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Inativo
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Ativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Editar"
                        >
                          <HiPencil size={20} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={user.isActive === false ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}
                          title={user.isActive === false ? 'Ativar' : 'Desativar'}
                        >
                          {user.isActive === false ? <HiCheck size={20} /> : <HiX size={20} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Criar/Editar */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  {showCreateModal ? 'Criar Novo Usuário' : 'Editar Usuário'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setFormErrors({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiXCircle size={24} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 desktop:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={showEditModal}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                      formErrors.username ? 'border-red-500' : 'border-gray-300'
                    } ${showEditModal ? 'bg-gray-100' : ''}`}
                  />
                  {formErrors.username && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>

                {showCreateModal && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Senha *
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                          formErrors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.password && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar Senha *
                      </label>
                      <input
                        type="password"
                        value={formData.password2}
                        onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                          formErrors.password2 ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.password2 && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.password2}</p>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                      formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="CLIENT">Cliente</option>
                    <option value="OPERATOR">Operador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="desktop:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Usuário ativo</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setFormErrors({});
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : showCreateModal ? 'Criar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
