import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  // Cadastro form
  const [registerData, setRegisterData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Limpar tokens antigos antes de fazer login para evitar conflitos
      localStorage.removeItem('auth-storage');
      
      const data = await authApi.login(loginData.username, loginData.password);
      
      // Fazer login com dados completos (token e refreshToken já incluem o perfil do usuário)
      login(data.user, data.token, data.refreshToken);
      navigate('/');
    } catch (err: any) {
      console.error('Erro no login:', err);
      
      // Tratar erros de rede (servidor não alcançável)
      if (!err.response) {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
        return;
      }
      
      // Tratar erros de autenticação
      let errorMsg = 'Erro ao fazer login. Verifique suas credenciais.';
      
      if (err.response?.data) {
        // Tratar erro de token inválido (pode acontecer se houver token antigo)
        if (err.response.data.code === 'token_not_valid') {
          errorMsg = 'Sessão expirada. Por favor, tente fazer login novamente.';
          // Limpar storage em caso de token inválido
          localStorage.removeItem('auth-storage');
        } else {
          errorMsg = 
            err.response.data.detail || 
            err.response.data.non_field_errors?.[0] || 
            err.response.data.message || 
            errorMsg;
        }
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.register(
        registerData.name,
        registerData.username,
        registerData.email,
        registerData.password,
        registerData.phone
      );
      login(data.user, data.token, data.refreshToken);
      navigate('/');
    } catch (err: any) {
      const errorMsg = err.response?.data?.username?.[0] || err.response?.data?.email?.[0] || err.response?.data?.password?.[0] || err.response?.data?.message || 'Erro ao cadastrar';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={isLogin ? 'Login' : 'Cadastro'}>
      <div className="py-4">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              isLogin
                ? 'bg-cake-pink text-cake-text font-semibold'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              !isLogin
                ? 'bg-cake-pink text-cake-text font-semibold'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Login de usuário</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Usuário ou Email:</label>
              <input
                type="text"
                placeholder="Ex: cliente1 ou cliente1@email.com"
                value={loginData.username}
                onChange={(e) =>
                  setLoginData({ ...loginData, username: e.target.value })
                }
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Senha:</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Cadastrar usuário</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Nome:</label>
              <input
                type="text"
                value={registerData.name}
                onChange={(e) =>
                  setRegisterData({ ...registerData, name: e.target.value })
                }
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Usuário:</label>
              <input
                type="text"
                placeholder="Ex: cliente1"
                value={registerData.username}
                onChange={(e) =>
                  setRegisterData({ ...registerData, username: e.target.value })
                }
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-mail:</label>
              <input
                type="email"
                placeholder="Ex: cliente1@email.com"
                value={registerData.email}
                onChange={(e) =>
                  setRegisterData({ ...registerData, email: e.target.value })
                }
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone (opcional):</label>
              <input
                type="tel"
                value={registerData.phone}
                onChange={(e) =>
                  setRegisterData({ ...registerData, phone: e.target.value })
                }
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Senha:</label>
              <input
                type="password"
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData({ ...registerData, password: e.target.value })
                }
                className="w-full px-4 py-2 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
};


