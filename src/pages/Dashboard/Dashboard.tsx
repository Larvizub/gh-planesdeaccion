import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Settings, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ListTodo
} from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { format, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Badge } from '@/components/ui/badge';

interface Plan {
  id: string;
  eventoName: string;
  departamentoName: string;
  status: string;
  createdAt: string;
  gestionado?: boolean;
}

export const Dashboard = () => {
  const { recinto, user, db, userData } = useAppContext();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [fechaLimite, setFechaLimite] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !recinto) return;

    // Escuchar planes
    const planesRef = ref(db, `planes-accion/${recinto}`);
    const unsubPlanes = onValue(planesRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({
          id,
          ...(val as object)
        })) as Plan[];
        setPlanes(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        setPlanes([]);
      }
      setLoading(false);
    });

    // Escuchar fecha limite
    const limitRef = ref(db, `config/${recinto}/tiempos/fechaLimite`);
    const unsubLimit = onValue(limitRef, (snap) => {
      setFechaLimite(snap.val());
    });

    return () => {
      unsubPlanes();
      unsubLimit();
    };
  }, [db, recinto]);

  const stats = useMemo(() => {
    const s = {
      total: planes.length,
      pendientes: planes.filter(p => !p.gestionado && p.status !== 'Aprobado').length,
      aprobaciones: planes.filter(p => p.gestionado && p.status !== 'Aprobado').length,
      aprobados: planes.filter(p => p.status === 'Aprobado').length,
      rechazados: planes.filter(p => p.status === 'Rechazado').length
    };
    return s;
  }, [planes]);

  const chartData = useMemo(() => {
    return [
      { name: 'Abiertos', value: planes.filter(p => p.status === 'Abierto').length, color: '#ef4444' },
      { name: 'Proceso', value: planes.filter(p => p.status === 'En Proceso').length, color: '#3b82f6' },
      { name: 'Cerrados', value: planes.filter(p => p.status === 'Cerrado').length, color: '#f59e0b' },
      { name: 'Aprobados', value: planes.filter(p => p.status === 'Aprobado').length, color: '#10b981' },
      { name: 'Rechazados', value: planes.filter(p => p.status === 'Rechazado').length, color: '#6366f1' },
    ];
  }, [planes]);

  const recentPlanes = planes.slice(0, 5);
  const timeExpired = fechaLimite ? isAfter(new Date(), new Date(fechaLimite)) : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido, {user?.displayName || 'Usuario'}</h1>
          <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest mt-1">
            Recinto Actual: <span className="text-primary">{recinto}</span>
          </p>
        </div>
        {fechaLimite && (
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${timeExpired ? 'bg-destructive/10 border-destructive animate-pulse' : 'bg-primary/5 border-primary/20'}`}>
            <Clock className={`h-5 w-5 ${timeExpired ? 'text-destructive' : 'text-primary'}`} />
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Límite de Registro</p>
              <p className="text-sm font-black uppercase">
                {format(new Date(fechaLimite), "dd MMM, HH:mm 'hs'", { locale: es })}
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center justify-between">
              Total Reportado
              <FileText className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.total}</div>
            <div className="text-[10px] text-muted-foreground uppercase mt-1">Planes generados históricamente</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center justify-between">
              Pendientes Depto
              <ListTodo className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600">{stats.pendientes}</div>
            <div className="text-[10px] text-muted-foreground uppercase mt-1">Sin enviar a aprobación</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center justify-between">
              Pendientes Calidad
              <CheckCircle2 className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">{stats.aprobaciones}</div>
            <div className="text-[10px] text-muted-foreground uppercase mt-1">A la espera de validación</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center justify-between">
              Aprobados
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-600">{stats.aprobados}</div>
            <div className="text-[10px] text-muted-foreground uppercase mt-1">Planes cerrados con éxito</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Distribución de Estados
              </CardTitle>
              <CardDescription>Visualización detallada de la gestión del recinto.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={12} 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={12} 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Reciente
              </CardTitle>
              <CardDescription>Últimos 5 planes generados.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/planes-accion" className="text-xs font-bold uppercase gap-1">
                Ver Todo <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground animate-pulse">
                  Cargando actividad...
                </div>
              ) : recentPlanes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                  <AlertTriangle className="h-10 w-10 mb-2" />
                  <p className="text-sm font-bold uppercase">Sin actividad reciente</p>
                </div>
              ) : (
                recentPlanes.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between group">
                    <div className="space-y-1">
                      <p className="text-sm font-bold leading-none group-hover:text-primary transition-colors truncate max-w-[180px]">
                        {plan.eventoName}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        {plan.departamentoName}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={plan.status === 'Aprobado' ? 'default' : plan.status === 'Abierto' ? 'destructive' : 'secondary'} 
                        className="text-[9px] h-5 px-1.5 uppercase font-black"
                      >
                        {plan.status}
                      </Badge>
                      <p className="text-[9px] text-muted-foreground mt-1">
                        {format(new Date(plan.createdAt), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {(userData?.role === 'Administrador' || userData?.role === 'Calidad') && (
        <div className={`grid gap-4 grid-cols-1 ${userData?.role === 'Administrador' ? 'md:grid-cols-2' : ''}`}>
           <Link to="/configuracion/tiempos" className="block">
             <Card className="bg-primary/5 border-dashed border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer">
               <CardContent className="flex items-center gap-4 py-8">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-black uppercase text-sm">Configurar Tiempos Límites</h3>
                    <p className="text-xs text-muted-foreground">Ajuste la fecha de cierre de registro para este periodo.</p>
                  </div>
               </CardContent>
             </Card>
           </Link>

           {userData?.role === 'Administrador' && (
             <Link to="/configuracion/usuarios" className="block">
               <Card className="bg-muted hover:bg-muted/80 transition-colors cursor-pointer">
                 <CardContent className="flex items-center gap-4 py-8">
                    <div className="h-12 w-12 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                      <Settings className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-black uppercase text-sm">Gestión de Usuarios</h3>
                      <p className="text-xs text-muted-foreground">Administre los roles y permisos de los departamentos.</p>
                    </div>
                 </CardContent>
               </Card>
             </Link>
           )}
        </div>
      )}
    </div>
  );
};

