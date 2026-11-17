import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useAuthStore } from '../store/authStore';
import { viaCepApi, addressApi, authApi } from '../services/api';
import type { Address } from '../types';
import { HiPlus, HiTrash, HiEye, HiEyeOff, HiCheck, HiPencil } from 'react-icons/hi';

export const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Estados para dados cadastrais
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Estados para alteração de senha
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Estado para novo endereço
  const [newAddress, setNewAddress] = useState({
    cep: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
    loadAddresses();
  }, [user]);

  const loadAddresses = async () => {
    try {
      const data = await addressApi.getAll();
      setAddresses(data);
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setLoadingProfile(true);

    try {
      const updated = await authApi.updateProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      });

      updateUser(updated);
      setProfileSuccess('Dados cadastrais atualizados com sucesso!');
      setIsEditingProfile(false);
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.phone?.[0] ||
        'Erro ao atualizar dados cadastrais.';
      setProfileError(msg);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.new_password !== passwordData.new_password2) {
      setPasswordError('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoadingPassword(true);

    try {
      const res = await authApi.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
        new_password2: passwordData.new_password2,
      });

      setPasswordSuccess(res.message || 'Senha alterada com sucesso!');
      setPasswordData({
        old_password: '',
        new_password: '',
        new_password2: '',
      });
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      const msg =
        err.response?.data?.old_password ||
        err.response?.data?.new_password?.[0] ||
        err.response?.data?.new_password ||
        err.response?.data?.detail ||
        'Erro ao alterar senha. Verifique se a senha atual está correta.';
      setPasswordError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleCepBlur = async () => {
    const cleanCep = newAddress.cep.replace(/\D/g, '');
    if (cleanCep.length >= 8) {
      setLoadingAddress(true);
      try {
        const data = await viaCepApi.getByCep(cleanCep);
        if (!data.erro) {
          setNewAddress((prev) => ({
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
        setLoadingAddress(false);
      }
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAddress(true);
    try {
      await addressApi.create(newAddress);
      await loadAddresses();
      setNewAddress({
        cep: '',
        street: '',
        number: '',
        complement: '',
        district: '',
        city: '',
        state: '',
      });
      setShowAddressForm(false);
    } catch (error) {
      console.error('Erro ao adicionar endereço:', error);
      alert('Erro ao adicionar endereço.');
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (confirm('Deseja realmente excluir este endereço?')) {
      try {
        await addressApi.delete(id);
        await loadAddresses();
      } catch (error) {
        console.error('Erro ao excluir endereço:', error);
        alert('Erro ao excluir endereço.');
      }
    }
  };

  return (
    <Layout title="Perfil">
      <div className="space-y-6 py-4">
        {/* User Info / Cadastro */}
        <div className="bg-cake-cyan rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-cake-text">Dados Cadastrais</h2>
            {!isEditingProfile ? (
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-cake-text font-medium text-sm rounded-lg shadow-sm transition-colors"
              >
                <HiPencil size={16} />
                Editar Cadastro
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(false);
                  setProfileError('');
                  if (user) {
                    setProfileData({
                      name: user.name || '',
                      email: user.email || '',
                      phone: user.phone || '',
                    });
                  }
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Cancelar
              </button>
            )}
          </div>

          {profileSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded-lg text-sm mb-4 flex items-center gap-2">
              <HiCheck size={18} />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome Completo:</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                readOnly={!isEditingProfile}
                required
                className={`w-full px-4 py-2 rounded-lg border-0 outline-none transition-colors ${
                  isEditingProfile
                    ? 'bg-white focus:ring-2 focus:ring-cake-pink'
                    : 'bg-white/80 text-gray-700 cursor-not-allowed'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">E-mail:</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  readOnly={!isEditingProfile}
                  required
                  className={`w-full px-4 py-2 rounded-lg border-0 outline-none transition-colors ${
                    isEditingProfile
                      ? 'bg-white focus:ring-2 focus:ring-cake-pink'
                      : 'bg-white/80 text-gray-700 cursor-not-allowed'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Telefone / Celular:</label>
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  readOnly={!isEditingProfile}
                  className={`w-full px-4 py-2 rounded-lg border-0 outline-none transition-colors ${
                    isEditingProfile
                      ? 'bg-white focus:ring-2 focus:ring-cake-pink'
                      : 'bg-white/80 text-gray-700 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {isEditingProfile && (
              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={loadingProfile}
                  className="px-6 py-2.5 bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
                >
                  {loadingProfile ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Alterar Senha */}
        <div className="bg-cake-cyan rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-cake-text mb-4">Segurança & Senha</h2>

          {passwordSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded-lg text-sm mb-4 flex items-center gap-2">
              <HiCheck size={18} />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Senha Atual:</label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={passwordData.old_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, old_password: e.target.value })
                  }
                  required
                  placeholder="Digite sua senha atual"
                  className="w-full pl-4 pr-11 py-2 bg-white rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cake-text transition-colors p-1"
                  title={showOldPassword ? 'Ocultar senha' : 'Ver senha'}
                  aria-label={showOldPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showOldPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nova Senha:</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.new_password}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, new_password: e.target.value })
                    }
                    required
                    minLength={6}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full pl-4 pr-11 py-2 bg-white rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cake-text transition-colors p-1"
                    title={showNewPassword ? 'Ocultar senha' : 'Ver senha'}
                    aria-label={showNewPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showNewPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirmar Nova Senha:</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.new_password2}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, new_password2: e.target.value })
                    }
                    required
                    minLength={6}
                    placeholder="Repita a nova senha"
                    className="w-full pl-4 pr-11 py-2 bg-white rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cake-text transition-colors p-1"
                    title={showConfirmPassword ? 'Ocultar senha' : 'Ver senha'}
                    aria-label={showConfirmPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showConfirmPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loadingPassword}
                className="px-6 py-2.5 bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
              >
                {loadingPassword ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </form>
        </div>

        {/* Addresses */}
        <div className="bg-cake-cyan rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-cake-text">Meus Endereços</h2>

          <div className="space-y-4">
            {addresses.length === 0 ? (
              <p className="text-sm text-gray-600 bg-white/60 p-4 rounded-lg">
                Nenhum endereço cadastrado ainda.
              </p>
            ) : (
              addresses.map((address) => (
                <div key={address.id} className="bg-white rounded-lg p-4 relative shadow-sm">
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    className="absolute top-2 right-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Excluir"
                    title="Excluir endereço"
                  >
                    <HiTrash size={18} />
                  </button>
                  <div className="grid grid-cols-2 gap-2 text-sm pr-8">
                    <div>
                      <span className="font-medium text-gray-700">CEP:</span> {address.cep}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Número:</span> {address.number}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Endereço:</span> {address.street}
                      {address.complement && ` (${address.complement})`}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Bairro:</span> {address.district}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Cidade/UF:</span> {address.city}/{address.state}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {showAddressForm ? (
            <form onSubmit={handleAddAddress} className="mt-4 space-y-3 bg-white/70 p-4 rounded-xl">
              <h3 className="font-semibold text-cake-text text-sm">Novo Endereço</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">CEP:</label>
                  <input
                    type="text"
                    value={newAddress.cep}
                    placeholder="00000-000"
                    onChange={(e) => setNewAddress({ ...newAddress, cep: e.target.value })}
                    onBlur={handleCepBlur}
                    className="w-full px-3 py-2 bg-white rounded-lg border-0 text-sm outline-none focus:ring-2 focus:ring-cake-pink"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Número:</label>
                  <input
                    type="text"
                    value={newAddress.number}
                    placeholder="Ex: 123"
                    onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-lg border-0 text-sm outline-none focus:ring-2 focus:ring-cake-pink"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Endereço (Rua/Avenida):</label>
                <input
                  type="text"
                  value={newAddress.street}
                  placeholder="Nome da rua ou avenida"
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="w-full px-3 py-2 bg-white rounded-lg border-0 text-sm outline-none focus:ring-2 focus:ring-cake-pink"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Complemento (opcional):</label>
                  <input
                    type="text"
                    value={newAddress.complement}
                    placeholder="Apto, Bloco..."
                    onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-lg border-0 text-sm outline-none focus:ring-2 focus:ring-cake-pink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Bairro:</label>
                  <input
                    type="text"
                    value={newAddress.district}
                    placeholder="Bairro"
                    onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-lg border-0 text-sm outline-none focus:ring-2 focus:ring-cake-pink"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Cidade:</label>
                  <input
                    type="text"
                    value={newAddress.city}
                    placeholder="Cidade"
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-lg border-0 text-sm outline-none focus:ring-2 focus:ring-cake-pink"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">UF:</label>
                  <input
                    type="text"
                    value={newAddress.state}
                    placeholder="UF"
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value.toUpperCase() })}
                    maxLength={2}
                    className="w-full px-3 py-2 bg-white rounded-lg border-0 text-sm outline-none focus:ring-2 focus:ring-cake-pink"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loadingAddress}
                  className="flex-1 bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 text-sm shadow"
                >
                  {loadingAddress ? 'Salvando...' : 'Salvar Endereço'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-cake-text font-semibold py-2 rounded-lg transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddressForm(true)}
              className="w-full mt-4 bg-white hover:bg-gray-50 text-cake-text font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 shadow-sm"
            >
              <HiPlus size={20} />
              Adicionar endereço
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};
