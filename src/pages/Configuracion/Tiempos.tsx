import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { ref, onValue, set, update } from 'firebase/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Clock, Unlock, Lock, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Plan {
  id: string;
  departamentoId: string;
  departamentoName: string;
  status: string;
}

export const Tiempos = () => {
  const { recinto, db } = useAppContext();
  const [fechaLimite, setFechaLimite] = useState<string>('');
  const [desbloqueados, setDesbloqueados] = useState<Record<string, boolean>>({});
  const [planesPendientes, setPlanesPendientes] = useState<Plan[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Configuración de tiempos
    const configRef = ref(db, `config/${recinto}/tiempos`);
    onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.fechaLimite) setFechaLimite(data.fechaLimite);
        if (data.desbloqueados) setDesbloqueados(data.desbloqueados);
      }
    });

    // Planes pendientes por departamento
    const planesRef = ref(db, `planes-accion/${recinto}`);
    onValue(planesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({
          id,
          ...(val as object)
        })) as Plan[];
        
        // Solo planes que el departamento debe llenar
        setPlanesPendientes(list.filter(p => p.status === 'Abierto' || p.status === 'Rechazado'));
      } else {
        setPlanesPendientes([]);
      }
    });
  }, [recinto, db]);

  const handleSave = async () => {
    if (!fechaLimite) {
      toast({ title: "Error", variant: "destructive", description: "Debe seleccionar una fecha y hora." });
      return;
    }

    const selectedDate = new Date(fechaLimite);
    if (selectedDate < new Date()) {
      toast({ title: "Error", variant: "destructive", description: "La fecha límite no puede ser anterior a la fecha actual." });
      return;
    }

    try {
      await update(ref(db, `config/${recinto}/tiempos`), { fechaLimite });
      toast({ title: "Configuración guardada", description: "La fecha límite de registro ha sido actualizada." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", variant: "destructive", description: "No se pudo guardar la configuración." });
    }
  };

  const toggleUnlock = async (deptId: string) => {
    const newVal = !desbloqueados[deptId];
    try {
      await set(ref(db, `config/${recinto}/tiempos/desbloqueados/${deptId}`), newVal);
      toast({ 
        title: newVal ? "Departamento Desbloqueado" : "Departamento Bloqueado",
        description: newVal ? "Ahora podrán llenar planes fuera de tiempo." : "Se han restablecido las restricciones de tiempo."
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Obtener departamentos únicos con planes pendientes
  const deptsConPendientes = Array.from(new Set(planesPendientes.map(p => p.departamentoId)))
    .map(id => {
      const plan = planesPendientes.find(p => p.departamentoId === id);
      return {
        id,
        name: plan?.departamentoName || 'Desconocido',
        count: planesPendientes.filter(p => p.departamentoId === id).length
      };
    });

  const isExpired = fechaLimite ? new Date() > new Date(fechaLimite) : false;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Clock className="h-5 w-5 text-primary" /> Configuración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fecha" className="font-semibold">Fecha Límite Global</Label>
              <Input 
                id="fecha" 
                type="datetime-local" 
                value={fechaLimite} 
                onChange={(e) => setFechaLimite(e.target.value)} 
              />
            </div>
            {isExpired && (
              <div className="flex items-center gap-2 text-destructive font-bold text-sm bg-destructive/10 p-2 rounded border border-destructive/20 animate-pulse">
                <Lock className="h-4 w-4" /> TIEMPO AGOTADO
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} className="w-full">Actualizar Límite</Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <Unlock className="h-5 w-5 text-amber-500" /> Control de Desbloqueo
                </CardTitle>
                <CardDescription>
                  Permita que departamentos específicos llenen sus planes aunque el tiempo haya expirado.
                </CardDescription>
              </div>
              <Badge variant="outline" className="px-3 py-1 uppercase font-bold">
                {planesPendientes.length} Planes Pendientes
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-center">Pendientes</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deptsConPendientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground italic">
                      No hay departamentos con planes pendientes de llenar.
                    </TableCell>
                  </TableRow>
                ) : (
                  deptsConPendientes.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-bold uppercase text-sm">{dept.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{dept.count}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant={desbloqueados[dept.id] ? "default" : "outline"}
                          size="sm"
                          className={desbloqueados[dept.id] ? "bg-amber-500 hover:bg-amber-600 border-none" : ""}
                          onClick={() => toggleUnlock(dept.id)}
                        >
                          {desbloqueados[dept.id] ? (
                            <><Unlock className="h-4 w-4 mr-2" /> Desbloqueado</>
                          ) : (
                            <><Lock className="h-4 w-4 mr-2" /> Bloquear</> // El estado base es bloqueado por el tiempo global
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6 flex gap-4 items-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            <strong>Instrucción de uso:</strong> Los departamentos que aparecen en la lista son aquellos que tienen planes con estado "Abierto" o "Rechazado". Al presionar <strong>Desbloquear</strong>, ese departamento podrá editar sus planes en el módulo correspondiente ignorando la fecha límite global establecida.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
