import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Loading } from '@/components/ui/loading';
import { ref, onValue } from 'firebase/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface Stats {
  total: number;
  abiertos: number;
  proceso: number;
  cerrados: number;
  aprobados: number;
  rechazados: number;
}

interface Plan {
  status: string;
  departamentoName: string;
}

interface DeptStat {
  name: string;
  abiertos: number;
  cerrados: number;
  aprobados: number;
}

export const Resultados = () => {
  const { recinto, db } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, abiertos: 0, proceso: 0, cerrados: 0, aprobados: 0, rechazados: 0 });
  const [deptStats, setDeptStats] = useState<DeptStat[]>([]);

  useEffect(() => {
    // Evitamos el setState síncrono que causa cascading renders
    const planesRef = ref(db, `planes-accion/${recinto}`);
    const unsubscribe = onValue(planesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data) as Plan[];
        
        const counts = {
          total: list.length,
          abiertos: list.filter((p) => p.status === 'Abierto').length,
          proceso: list.filter((p) => p.status === 'En Proceso').length,
          cerrados: list.filter((p) => p.status === 'Cerrado').length,
          aprobados: list.filter((p) => p.status === 'Aprobado').length,
          rechazados: list.filter((p) => p.status === 'Rechazado').length,
        };
        setStats(counts);

        // Group by department
        const depts: Record<string, { name: string, abiertos: number, cerrados: number, aprobados: number }> = {};
        list.forEach((p) => {
          if (!depts[p.departamentoName]) {
            depts[p.departamentoName] = { name: p.departamentoName, abiertos: 0, cerrados: 0, aprobados: 0 };
          }
          if (p.status === 'Abierto' || p.status === 'En Proceso') depts[p.departamentoName].abiertos++;
          if (p.status === 'Cerrado') depts[p.departamentoName].cerrados++;
          if (p.status === 'Aprobado') depts[p.departamentoName].aprobados++;
        });
        setDeptStats(Object.values(depts));
      } else {
        setStats({ total: 0, abiertos: 0, proceso: 0, cerrados: 0, aprobados: 0, rechazados: 0 });
        setDeptStats([]);
      }
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [recinto, db]);

  const statusData = [
    { name: 'Abiertos', value: stats.abiertos + stats.proceso, color: '#ef4444' },
    { name: 'Pend. Aprobación', value: stats.cerrados, color: '#f59e0b' },
    { name: 'Aprobados', value: stats.aprobados, color: '#10b981' },
    { name: 'Rechazados', value: stats.rechazados, color: '#6366f1' },
  ];

  if (loading) {
    return <Loading message="Cargando estadísticas..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Planes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Abiertos</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.abiertos + stats.proceso}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cerrados / Aprobados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aprobados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.aprobados / stats.total) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Resumen General</TabsTrigger>
          <TabsTrigger value="departamentos">Por Departamento</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Distribución de Estados</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Planes por Estado</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desempeño por Departamento</CardTitle>
              <CardDescription>Planes abiertos vs aprobados por cada área.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="abiertos" name="Abiertos/Proceso" fill="#ef4444" />
                  <Bar dataKey="aprobados" name="Aprobados" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
