import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/useAppSelector';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Sales from './pages/Sales';
import MapView from './pages/MapView';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  const { token, user } = useAppSelector((s) => s.auth);
  const needsOnboarding = token && user && !user.onboarded;

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={token ? <Navigate to={needsOnboarding ? '/onboarding' : '/dashboard'} /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to={needsOnboarding ? '/onboarding' : '/dashboard'} /> : <Register />} />
      <Route path="/forgot-password" element={token ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
      <Route path="/reset-password" element={token ? <Navigate to="/dashboard" /> : <ResetPassword />} />

      {/* Onboarding — solo si está logueado y no onboarded */}
      <Route path="/onboarding" element={
        !token ? <Navigate to="/login" /> :
        user?.onboarded ? <Navigate to="/dashboard" /> :
        <Onboarding />
      } />

      {/* Protected routes — requieren onboarding completado */}
      <Route element={
        <ProtectedRoute requireOnboarded>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'EMPLEADO']}><Products /></ProtectedRoute>
        } />
        <Route path="/stock" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'EMPLEADO']}><Stock /></ProtectedRoute>
        } />
        <Route path="/sales" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'EMPLEADO']}><Sales /></ProtectedRoute>
        } />
        <Route path="/map" element={<MapView />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={
        <Navigate to={!token ? '/login' : needsOnboarding ? '/onboarding' : '/dashboard'} />
      } />
    </Routes>
  );
}
