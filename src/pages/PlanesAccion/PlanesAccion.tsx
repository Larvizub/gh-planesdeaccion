import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { ref, onValue, update, DataSnapshot } from 'firebase/database';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Camera, FileUp } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

interface PlanAccion {
  id: string;
  eventoName: string;
  comentario: string;
  departamentoId: string;
  departamentoName: string;
  status: 'Abierto' | 'En Proceso' | 'Cerrado' | 'Revision' | 'Aprobado' | 'Rechazado';
  consecutivoNC?: string;
  planAccionDetalle: string;
  comentarioCierre?: string;
  fotosCierre?: string[];
  createdAt: string;
}

export const PlanesAccion = () => {
  const { recinto, db, userData } = useAppContext();
  const [planes, setPlanes] = useState<PlanAccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanAccion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Update state
  const [status, setStatus] = useState<string>('');
  const [planDetalle, setPlanDetalle] = useState('');
  const [consecutivoNC, setConsecutivoNC] = useState('');
  const [comentarioCierre, setComentarioCierre] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const planesRef = ref(db, `planes-accion/${recinto}`);
    const unsubscribe = onValue(planesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        let list = Object.entries(data).map(([id, val]) => ({
          id,
          ...(val as object)
        })) as PlanAccion[];
        
        // Filter by user role/dept
        if (userData && userData.role === 'Usuario') {
          list = list.filter(p => p.departamentoId === userData.departmentId);
        }
        
        setPlanes(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        setPlanes([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [recinto, userData, db]);

  const handleOpenDialog = (plan: PlanAccion) => {
    setSelectedPlan(plan);
    setStatus(plan.status);
    setPlanDetalle(plan.planAccionDetalle || '');
    setConsecutivoNC(plan.consecutivoNC || '');
    setComentarioCierre(plan.comentarioCierre || '');
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedPlan) return;

    setUpdating(true);
    try {
      const planRef = ref(db, `planes-accion/${recinto}/${selectedPlan.id}`);
      const updates: Record<string, string | string[] | undefined> = {
        status,
        planAccionDetalle: planDetalle,
        consecutivoNC,
        updatedAt: new Date().toISOString(),
      };

      if (status === 'Cerrado') {
        updates.comentarioCierre = comentarioCierre;
        updates.closedAt = new Date().toISOString();
        // Here you would also handle file uploads to storage
      }

      await update(planRef, updates);
      
      toast({
        title: "Actualizado",
        description: "El plan de acción ha sido actualizado.",
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el plan de acción.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'Abierto': return 'destructive';
      case 'En Proceso': return 'secondary';
      case 'Cerrado': return 'outline';
      case 'Revision': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Listado de Planes de Acción</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loading message="Cargando planes de acción..." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">No hay planes de acción registrados.</TableCell>
                  </TableRow>
                ) : (
                  planes.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.eventoName}</TableCell>
                      <TableCell>{plan.departamentoName}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(plan.status)}>{plan.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(plan.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(plan)}>
                          Gestionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar Plan de Acción</DialogTitle>
            <DialogDescription>
              Evento: {selectedPlan?.eventoName} | Comentario: {selectedPlan?.comentario}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select onValueChange={setStatus} value={status}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Abierto">Abierto</SelectItem>
                  <SelectItem value="En Proceso">En Proceso</SelectItem>
                  <SelectItem value="Cerrado">Cerrado (Enviar a revisión)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nc">Consecutivo No Conformidad (Opcional)</Label>
              <Input 
                id="nc" 
                placeholder="Ej: NC-2026-001" 
                value={consecutivoNC}
                onChange={(e) => setConsecutivoNC(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="detalle">Detalle del Plan de Acción</Label>
              <Textarea 
                id="detalle" 
                placeholder="Describa las acciones a tomar..." 
                className="min-h-[100px]"
                value={planDetalle}
                onChange={(e) => setPlanDetalle(e.target.value)}
              />
            </div>
            {status === 'Cerrado' && (
              <>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="cierre">Comentario de Cierre</Label>
                  <Textarea 
                    id="cierre" 
                    placeholder="Evidencia de las acciones realizadas..." 
                    value={comentarioCierre}
                    onChange={(e) => setComentarioCierre(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Pruebas Fotográficas</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 flex gap-2">
                      <Camera className="h-4 w-4" /> Tomar Foto
                    </Button>
                    <Button variant="outline" className="flex-1 flex gap-2">
                      <FileUp className="h-4 w-4" /> Subir Archivo
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateStatus} disabled={updating}>
              {updating ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
