import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, FileText, CheckCircle2, Settings } from 'lucide-react';

export const Dashboard = () => {
  const { recinto, user } = useAppContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido, {user?.displayName || 'Usuario'}</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Skill API</div>
            <p className="text-xs text-muted-foreground mb-4">Eventos del mes seleccionados</p>
            <Button asChild size="sm" className="w-full">
              <Link to="/eventos">Ver Eventos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planes de Acción</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Seguimiento</div>
            <p className="text-xs text-muted-foreground mb-4">Gestión de comentarios y planes</p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to="/planes-accion">Ver Planes</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobaciones</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Calidad</div>
            <p className="text-xs text-muted-foreground mb-4">Pendientes de aprobación final</p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to="/aprobaciones">Ver Aprobaciones</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuración</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Sistema</div>
            <p className="text-xs text-muted-foreground mb-4">Departamentos y usuarios</p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to="/configuracion/departamentos">Configurar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Resumen Recinto: {recinto}</CardTitle>
            <CardDescription>Estadísticas rápidas del recinto actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-md">
               Gráfico de resumen próximamente en Resultados
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos planes generados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <p className="text-sm text-muted-foreground">Consulte la sección de Planes de Acción para más detalle.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
