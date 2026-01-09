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
import { Tiempos } from './pages/Configuracion/Tiempos';
import { Perfil } from './pages/Configuracion/Perfil';
import { AppLayout } from './components/layout/AppLayout';
import { Toaster } from './components/ui/toaster';
import { Loading } from './components/ui/loading';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, recinto } = useAppContext();

  if (loading) return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Loading />
    </div>
  );
  if (!user || !recinto) return <Navigate to="/login" />;

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/eventos" element={
        <ProtectedRoute>
          <AppLayout>
            <Eventos />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/planes-accion" element={
        <ProtectedRoute>
          <AppLayout>
            <PlanesAccion />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/aprobaciones" element={
        <ProtectedRoute>
          <AppLayout>
            <Aprobaciones />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/resultados" element={
        <ProtectedRoute>
          <AppLayout>
            <Resultados />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuracion/usuarios" element={
        <ProtectedRoute>
          <AppLayout>
            <Usuarios />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuracion/departamentos" element={
        <ProtectedRoute>
          <AppLayout>
            <Departamentos />
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
        <ProtectedRoute>
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
