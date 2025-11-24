import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { Products } from './pages/Products';
import { Orders } from './pages/Orders';
import { Historia } from './pages/Historia';
import { QuemSomos } from './pages/QuemSomos';
import { MontarCupcake } from './pages/MontarCupcake';
import { Carrinho } from './pages/Carrinho';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/historia" element={<Historia />} />
        <Route path="/quem-somos" element={<QuemSomos />} />
        <Route path="/produtos" element={<Products />} />
        
        {/* Cupcake Builder */}
        <Route path="/montar" element={<MontarCupcake />} />
        <Route path="/carrinho" element={<Carrinho />} />

        {/* Protected Routes */}
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pedidos"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meus-pedidos"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
