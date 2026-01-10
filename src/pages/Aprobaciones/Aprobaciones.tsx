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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

interface PlanAccion {
  id: string;
  eventoName: string;
  comentario: string;
  departamentoName: string;
  status: string;
  causas?: string;
  planAccionDetalle: string;
  comentarioCierre?: string;
  fotosCierre?: string[];
  rejectReason?: string;
  gestionado?: boolean;
  createdAt: string;
}

export const Aprobaciones = () => {
  const { recinto, db } = useAppContext();
  const [planes, setPlanes] = useState<PlanAccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanAccion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!db || !recinto) return;
    
    // Only fetch planes that are closed (awaiting approval) or in revision
    const planesRef = ref(db, `planes-accion/${recinto}`);
    const unsubscribe = onValue(planesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]) => ({ id, ...(val as object) }))
          .filter((p) => {
            const plan = p as any;
            // Solo mostrar si el departamento ya presionó "Enviar a Aprobación"
            // y aún no ha sido aprobado definitivamente
            return plan.gestionado === true && plan.status !== 'Aprobado';
          }) as PlanAccion[];
        setPlanes(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        setPlanes([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [recinto, db]);

  const handleApprove = async () => {
    if (!selectedPlan) return;
    setProcessing(true);
    try {
      await update(ref(db, `planes-accion/${recinto}/${selectedPlan.id}`), {
        status: 'Aprobado',
        approvedAt: new Date().toISOString(),
      });
      toast({ title: "Aprobado", description: "El plan de acción ha sido aprobado." });
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", variant: "destructive", description: "Ocurrió un error." });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPlan || !rejectReason) return;
    setProcessing(true);
    try {
      await update(ref(db, `planes-accion/${recinto}/${selectedPlan.id}`), {
        status: 'Rechazado',
        rejectReason,
        gestionado: false, // Regresa al departamento para que lo vuelva a gestionar
        rejectedAt: new Date().toISOString(),
      });
      toast({ title: "Rechazado", description: "El plan de acción ha sido devuelto al responsable." });
      setIsRejectDialogOpen(false);
      setIsDialogOpen(false);
      setRejectReason('');
    } catch (err) {
      console.error(err);
      toast({ title: "Error", variant: "destructive", description: "Ocurrió un error." });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Aprobaciones Pendientes (Calidad)</CardTitle>
          <CardDescription>Revise los planes de acción cerrados por los departamentos.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loading message="Cargando aprobaciones..." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Fecha Cierre</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">No hay planes pendientes de aprobación.</TableCell>
                  </TableRow>
                ) : (
                  planes.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.eventoName}</TableCell>
                      <TableCell>{plan.departamentoName}</TableCell>
                      <TableCell>{new Date(plan.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedPlan(plan); setIsDialogOpen(true); }}>
                          <Eye className="h-4 w-4 mr-2" /> Revisar
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
            <DialogTitle>Revisión de Plan de Acción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                   <Label className="text-muted-foreground">Evento</Label>
                   <p className="font-medium">{selectedPlan?.eventoName}</p>
                </div>
                <div>
                   <Label className="text-muted-foreground">Departamento</Label>
                   <p className="font-medium">{selectedPlan?.departamentoName}</p>
                </div>
                <div className="col-span-2">
                   <Label className="text-muted-foreground">Comentario Inicial</Label>
                   <p className="bg-muted p-2 rounded-md">{selectedPlan?.comentario}</p>
                </div>
                <div className="col-span-2">
                   <Label className="text-muted-foreground">Causas</Label>
                   <p className="bg-muted p-2 rounded-md">{selectedPlan?.causas || 'No especificado'}</p>
                </div>
                <div className="col-span-2">
                   <Label className="text-muted-foreground">Detalle del Plan</Label>
                   <p className="bg-muted p-2 rounded-md">{selectedPlan?.planAccionDetalle}</p>
                </div>
                <div className="col-span-2">
                   <Label className="text-muted-foreground">Comentario de Cierre</Label>
                   <p className="bg-primary/10 p-2 border border-primary/20 rounded-md">{selectedPlan?.comentarioCierre}</p>
                </div>
                {selectedPlan?.fotosCierre && selectedPlan.fotosCierre.length > 0 && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Evidencia Fotográfica</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedPlan.fotosCierre.map((url, index) => (
                        <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={url} 
                            alt={`Evidencia ${index + 1}`} 
                            className="h-20 w-20 object-cover rounded-md border hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="destructive" onClick={() => setIsRejectDialogOpen(true)} disabled={processing}>
              <XCircle className="h-4 w-4 mr-2" /> Rechazar
            </Button>
            <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={processing}>
              <CheckCircle className="h-4 w-4 mr-2" /> Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
              <DialogTitle>Motivo del Rechazo</DialogTitle>
              <DialogDescription>Indique por qué el plan de acción no fue aprobado.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
              <Textarea 
                placeholder="Escriba el motivo aquí..." 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectReason}>
               Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
