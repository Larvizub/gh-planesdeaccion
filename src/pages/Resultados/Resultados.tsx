import { useEffect, useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Loading } from '@/components/ui/loading';
import { ref, onValue } from 'firebase/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
import { FileText, CheckCircle2, Clock, AlertCircle, Presentation, ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Plan {
  id: string;
  status: string;
  departamentoName: string;
  createdAt: string;
  eventoName: string;
  comentario: string;
  planAccionDetalle?: string;
  causas?: string;
  consecutivoNC?: string;
  fotosCierre?: string[];
}

interface DeptStat {
  name: string;
  abiertos: number;
  cerrados: number;
  aprobados: number;
  planes: Plan[];
}

const getPreviousMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const Resultados = () => {
  const { recinto, db } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getPreviousMonth());
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const planesRef = ref(db, `planes-accion/${recinto}`);
    const unsubscribe = onValue(planesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({
          id,
          ...(val as object)
        })) as Plan[];
        setPlanes(list);
      } else {
        setPlanes([]);
      }
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [recinto, db]);

  const filteredPlanes = useMemo(() => {
    return planes.filter(p => {
      const date = new Date(p.createdAt);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthStr === selectedMonth;
    });
  }, [planes, selectedMonth]);

  const stats = useMemo(() => {
    const counts = {
      total: filteredPlanes.length,
      abiertos: filteredPlanes.filter((p) => p.status === 'Abierto').length,
      proceso: filteredPlanes.filter((p) => p.status === 'En Proceso').length,
      cerrados: filteredPlanes.filter((p) => p.status === 'Cerrado').length,
      aprobados: filteredPlanes.filter((p) => p.status === 'Aprobado').length,
      rechazados: filteredPlanes.filter((p) => p.status === 'Rechazado').length,
    };
    return counts;
  }, [filteredPlanes]);

  const deptStats = useMemo(() => {
    const depts: Record<string, DeptStat> = {};
    filteredPlanes.forEach((p) => {
      if (!depts[p.departamentoName]) {
        depts[p.departamentoName] = { name: p.departamentoName, abiertos: 0, cerrados: 0, aprobados: 0, planes: [] };
      }
      if (p.status === 'Abierto' || p.status === 'En Proceso') depts[p.departamentoName].abiertos++;
      if (p.status === 'Cerrado') depts[p.departamentoName].cerrados++;
      if (p.status === 'Aprobado') depts[p.departamentoName].aprobados++;
      depts[p.departamentoName].planes.push(p);
    });
    return Object.values(depts);
  }, [filteredPlanes]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    planes.forEach(p => {
      const date = new Date(p.createdAt);
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    });
    // Asegurarse de que el mes actual y anterior estén si no hay datos
    const now = new Date();
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    const prev = new Date();
    prev.setMonth(prev.getMonth() - 1);
    months.add(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
    
    return Array.from(months).sort().reverse();
  }, [planes]);

  const statusData = [
    { name: 'Abiertos', value: stats.abiertos + stats.proceso, color: '#ef4444' },
    { name: 'Pend. Aprobación', value: stats.cerrados, color: '#f59e0b' },
    { name: 'Aprobados', value: stats.aprobados, color: '#10b981' },
    { name: 'Rechazados', value: stats.rechazados, color: '#6366f1' },
  ];

  const handleNextSlide = () => {
    if (currentSlideIndex < deptStats.length) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  if (loading) {
    return <Loading message="Cargando estadísticas..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Resultados y Estadísticas</h1>
          <p className="text-muted-foreground">Análisis de gestión de planes de acción de {recinto}.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex gap-2" onClick={() => {
            setCurrentSlideIndex(0);
            setIsPresentationMode(true);
          }}>
            <Presentation className="h-4 w-4" /> Modo Presentación
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Planes (Mes)</CardTitle>
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
            <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
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
              {stats.total > 0 ? Math.round((stats.aprobados / (stats.total - (stats.cerrados + stats.proceso))) * 100) || 0 : 0}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">S/ planes aprobados vs cerrados</p>
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

        <TabsContent value="departamentos">
          <Card>
            <CardHeader>
              <CardTitle>Desempeño por Departamento</CardTitle>
              <CardDescription>Planes asignados y su estado actual en el mes seleccionado.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="abiertos" name="Pendientes" fill="#ef4444" stackId="a" />
                  <Bar dataKey="cerrados" name="Pend. Aprobación" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="aprobados" name="Aprobados" fill="#10b981" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Presentation Mode Dialog */}
      <Dialog open={isPresentationMode} onOpenChange={setIsPresentationMode}>
        <DialogContent className="max-w-[100vw] h-[100vh] p-0 border-none bg-background flex flex-col [&>button]:hidden">
          <div className="flex items-center justify-between p-4 border-b shrink-0">
            <div className="flex items-center gap-4">
              <img 
                src="https://costaricacc.com/cccr/Logoheroica.png" 
                alt="Logo Heroica" 
                className="h-10 w-auto object-contain dark:invert"
              />
              <div className="h-8 w-[1px] bg-border mx-2" />
              <h2 className="text-xl font-bold uppercase tracking-tight">Presentación de Resultados - {selectedMonth}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsPresentationMode(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden relative flex flex-col px-12 py-8 bg-slate-50 dark:bg-slate-900/50">
            {currentSlideIndex === 0 ? (
              // Slide 0: General Overview
              <div className="flex flex-col h-full animate-in fade-in duration-500">
                <div className="text-center mb-12">
                  <h3 className="text-4xl font-extrabold text-primary mb-2">RESUMEN GENERAL</h3>
                  <p className="text-xl text-muted-foreground uppercase">{recinto} - Gestión de Calidad</p>
                </div>
                <div className="grid grid-cols-2 gap-8 flex-1">
                   <div className="bg-card border rounded-2xl shadow-xl flex flex-col p-8 items-center justify-center">
                      <p className="text-2xl font-bold text-muted-foreground uppercase mb-4">Eficiencia Global</p>
                      <div className="text-[120px] font-black text-primary leading-none">
                        {stats.total > 0 ? Math.round((stats.aprobados / (stats.total - (stats.cerrados + stats.proceso))) * 100) || 0 : 0}%
                      </div>
                      <p className="text-muted-foreground mt-4 text-center max-w-xs uppercase">Porcentaje de planes aprobados satisfactoriamente</p>
                   </div>
                   <div className="bg-card border rounded-2xl shadow-xl p-8 flex flex-col justify-center">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl">
                          <span className="text-xl font-bold uppercase">Total Reportado</span>
                          <span className="text-4xl font-black">{stats.total}</span>
                        </div>
                        <div className="flex justify-between items-center bg-green-50 dark:bg-green-950/30 p-4 rounded-xl text-green-700 dark:text-green-400">
                          <span className="text-xl font-bold uppercase">Aprobados</span>
                          <span className="text-4xl font-black">{stats.aprobados}</span>
                        </div>
                        <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl text-amber-700 dark:text-amber-400">
                          <span className="text-xl font-bold uppercase">En Revisión</span>
                          <span className="text-4xl font-black">{stats.cerrados}</span>
                        </div>
                        <div className="flex justify-between items-center bg-red-50 dark:bg-red-950/30 p-4 rounded-xl text-red-700 dark:text-red-400">
                          <span className="text-xl font-bold uppercase">Abiertos / Incumplidos</span>
                          <span className="text-4xl font-black">{stats.abiertos + stats.proceso}</span>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              // Department Slides
              <div className="flex flex-col h-full animate-in slide-in-from-right duration-500">
                {deptStats[currentSlideIndex - 1] && (
                  <>
                    <div className="flex justify-between items-start mb-8 border-b pb-6">
                      <div>
                        <h3 className="text-5xl font-black text-primary uppercase">{deptStats[currentSlideIndex - 1].name}</h3>
                        <p className="text-xl text-muted-foreground mt-1 uppercase">Detalle de Planes de Acción</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center px-6 py-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                          <p className="text-xs font-bold text-green-700 dark:text-green-300 uppercase">Aprobados</p>
                          <p className="text-3xl font-black text-green-700 dark:text-green-300">{deptStats[currentSlideIndex - 1].aprobados}</p>
                        </div>
                        <div className="text-center px-6 py-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                          <p className="text-xs font-bold text-red-700 dark:text-red-300 uppercase">Pendientes</p>
                          <p className="text-3xl font-black text-red-700 dark:text-red-300">{deptStats[currentSlideIndex - 1].abiertos}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                      {deptStats[currentSlideIndex - 1].planes.map((p) => (
                        <div key={p.id} className="bg-card border rounded-xl p-6 shadow-md border-l-8 border-l-primary flex flex-col gap-3">
                          <div className="flex justify-between items-center border-b pb-3">
                            <h4 className="text-2xl font-bold uppercase text-primary">Evento: {p.eventoName}</h4>
                            <div className="flex gap-2 items-center">
                               {p.consecutivoNC && (
                                 <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold uppercase">NC: {p.consecutivoNC}</span>
                               )}
                               <span className={cn(
                                 "px-3 py-1 rounded-full text-xs font-bold uppercase",
                                 p.status === 'Aprobado' ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                               )}>
                                 {p.status}
                               </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                             <div>
                               <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Comentario del Cliente</p>
                               <p className="text-sm italic">"{p.comentario}"</p>
                             </div>
                             <div>
                               <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Causas</p>
                               <p className="text-sm font-medium">{p.causas || 'No registradas'}</p>
                             </div>
                             <div>
                               <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Plan de Acción / Ejecución</p>
                               <p className="text-sm">{p.planAccionDetalle || 'Pendiente de definir'}</p>
                             </div>
                          </div>
                          {p.fotosCierre && p.fotosCierre.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                                <ImageIcon className="h-3 w-3" /> Evidencias Fotográficas
                              </p>
                              <div className="flex flex-wrap gap-3">
                                {p.fotosCierre.map((url, fIdx) => (
                                  <div 
                                    key={fIdx} 
                                    className="relative h-24 w-24 rounded-lg overflow-hidden border cursor-zoom-in hover:ring-2 hover:ring-primary transition-all shadow-sm"
                                    onClick={() => setSelectedImage(url)}
                                  >
                                    <img src={url} alt="Evidencia" className="h-full w-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {deptStats[currentSlideIndex - 1].planes.length === 0 && (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-2xl text-muted-foreground uppercase font-bold">Sin planes reportados para este departamento en este mes.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="p-6 border-t bg-card shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Página {currentSlideIndex + 1} de {deptStats.length + 1}</span>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" size="lg" className="w-40 flex gap-2 font-bold uppercase" onClick={handlePrevSlide} disabled={currentSlideIndex === 0}>
                <ChevronLeft className="h-5 w-5" /> Anterior
              </Button>
              <Button size="lg" className="w-40 flex gap-2 font-bold uppercase" onClick={handleNextSlide} disabled={currentSlideIndex === deptStats.length}>
                Siguiente <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="w-[100px]" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-none bg-black/90 flex items-center justify-center [&>button]:text-white [&>button]:h-10 [&>button]:w-10 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:top-4 [&>button]:right-4 [&>button]:bg-white/10 [&>button]:hover:bg-white/20 [&>button]:rounded-full [&>button]:transition-all">
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Evidencia Ampliada" 
              className="max-w-full max-h-[85vh] object-contain animate-in zoom-in-95 duration-300" 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
