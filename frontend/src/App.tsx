import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/useAppSelector';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Sales from './pages/Sales';
import MapView from './pages/MapView';

export default function App() {
  const { token } = useAppSelector((s) => s.auth);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
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
      <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
    </Routes>
  );
}
