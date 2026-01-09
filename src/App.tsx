import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppProvider';
import { useAppContext } from './context/AppContext';
import { Login } from './pages/Login/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Eventos } from './pages/Eventos/Eventos';
import { PlanesAccion } from './pages/PlanesAccion/PlanesAccion';
import { Aprobaciones } from './pages/Aprobaciones/Aprobaciones';
import { Resultados } from './pages/Resultados/Resultados';
import { Departamentos } from './pages/Configuracion/Departamentos';
import { Usuarios } from './pages/Configuracion/Usuarios';
import { Roles } from './pages/Configuracion/Roles';
import { Tiempos } from './pages/Configuracion/Tiempos';
import { Perfil } from './pages/Configuracion/Perfil';
import { AppLayout } from './components/layout/AppLayout';
import { Toaster } from './components/ui/toaster';
import { Loading } from './components/ui/loading';

const ProtectedRoute = ({ children, moduleId }: { children: React.ReactNode, moduleId?: string }) => {
  const { user, permissions, loading, recinto } = useAppContext();

  if (loading) return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Loading />
    </div>
  );
  if (!user || !recinto) return <Navigate to="/login" />;
  
  // Si hay un moduleId y el usuario tiene permisos cargados
  // Solo redirigir si el permiso es explícitamente falso
  if (moduleId && permissions && permissions[moduleId] === false) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute moduleId="dashboard">
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/eventos" element={
        <ProtectedRoute moduleId="eventos">
          <AppLayout>
            <Eventos />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/planes-accion" element={
        <ProtectedRoute moduleId="planes">
          <AppLayout>
            <PlanesAccion />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/aprobaciones" element={
        <ProtectedRoute moduleId="aprobaciones">
          <AppLayout>
            <Aprobaciones />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/resultados" element={
        <ProtectedRoute moduleId="resultados">
          <AppLayout>
            <Resultados />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuracion/usuarios" element={
        <ProtectedRoute moduleId="usuarios">
          <AppLayout>
            <Usuarios />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuracion/departamentos" element={
        <ProtectedRoute moduleId="departamentos">
          <AppLayout>
            <Departamentos />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuracion/roles" element={
        <ProtectedRoute moduleId="roles">
          <AppLayout>
            <Roles />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuracion/perfil" element={
        <ProtectedRoute>
          <AppLayout>
            <Perfil />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuracion/tiempos" element={
        <ProtectedRoute moduleId="tiempos">
          <AppLayout>
            <Tiempos />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
        <Toaster />
      </Router>
    </AppProvider>
  );
}

export default App;
