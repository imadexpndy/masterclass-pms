import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Tables from './pages/Tables';
import Kitchen from './pages/Kitchen';
import Reports from './pages/Reports';
import Inventory from './pages/Inventory';
import UserMgmt from './pages/UserMgmt';
import MenuMgmt from './pages/MenuMgmt';
import Settings from './pages/Settings';
import AppShell from './components/AppShell';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Tables />} />
        <Route path="dashboard" element={<ProtectedRoute roles={['admin']}><Dashboard /></ProtectedRoute>} />
        <Route path="pos" element={<POS />} />
        <Route path="tables" element={<Tables />} />
        <Route path="kitchen" element={<ProtectedRoute roles={['admin', 'kitchen']}><Kitchen /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['admin', 'cashier']}><Reports /></ProtectedRoute>} />
        <Route path="inventory" element={<ProtectedRoute roles={['admin']}><Inventory /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={['admin']}><UserMgmt /></ProtectedRoute>} />
        <Route path="menu" element={<ProtectedRoute roles={['admin']}><MenuMgmt /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
