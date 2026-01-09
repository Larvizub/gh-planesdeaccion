import { useEffect, useState, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { ref, onValue, update, DataSnapshot } from 'firebase/database';
import { storage } from '@/lib/firebase';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import { Camera, FileUp, X } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

interface PlanAccion {
  id: string;
  eventoName: string;
  comentario: string;
  departamentoId: string;
  departamentoName: string;
  status: 'Abierto' | 'En Proceso' | 'Cerrado' | 'Revision' | 'Aprobado' | 'Rechazado';
  consecutivoNC?: string;
  causas?: string;
  planAccionDetalle: string;
  comentarioCierre?: string;
  rejectReason?: string;
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
  const [causas, setCausas] = useState('');
  const [planDetalle, setPlanDetalle] = useState('');
  const [consecutivoNC, setConsecutivoNC] = useState('');
  const [comentarioCierre, setComentarioCierre] = useState('');
  const [fotosCierre, setFotosCierre] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

        // Hide approved plans from this view (they go to Reports/History)
        list = list.filter(p => p.status !== 'Aprobado');
        
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
    setCausas(plan.causas || '');
    setPlanDetalle(plan.planAccionDetalle || '');
    setConsecutivoNC(plan.consecutivoNC || '');
    setComentarioCierre(plan.comentarioCierre || '');
    setFotosCierre(plan.fotosCierre || []);
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedPlan) return;

    setUpdating(true);
    try {
      const planRef = ref(db, `planes-accion/${recinto}/${selectedPlan.id}`);
      const updates: Record<string, string | string[] | undefined> = {
        status,
        causas,
        planAccionDetalle: planDetalle,
        consecutivoNC,
        fotosCierre,
        updatedAt: new Date().toISOString(),
      };

      if (status === 'Cerrado') {
        updates.comentarioCierre = comentarioCierre;
        updates.closedAt = new Date().toISOString();
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCamera = false) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPlan) return;

    setUploading(true);
    try {
      const storagePath = `evidencias/${recinto}/${selectedPlan.id}/${Date.now()}_${file.name}`;
      const imageRef = sRef(storage, storagePath);
      
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      
      setFotosCierre(prev => [...prev, url]);
      toast({
        title: "Éxito",
        description: isCamera ? "Fotografía capturada." : "Archivo subido correctamente.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo subir el archivo.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFoto = (index: number) => {
    setFotosCierre(prev => prev.filter((_, i) => i !== index));
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'Abierto': return 'destructive';
      case 'En Proceso': return 'secondary';
      case 'Cerrado': return 'outline';
      case 'Revision': return 'default';
      case 'Aprobado': return 'default';
      case 'Rechazado': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Abierto': return 'Pendiente de aprobación';
      case 'En Proceso': return 'Pendiente de aprobación';
      case 'Cerrado': return 'Pendiente de aprobación';
      case 'Revision': return 'En revisión';
      default: return status;
    }
  };

  const isReadOnly = (plan: PlanAccion) => {
    if (!userData) return true;
    if (userData.role === 'Usuario') {
      return ['Cerrado', 'Revision', 'Aprobado'].includes(plan.status);
    }
    return false;
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
                        <Badge variant={getBadgeVariant(plan.status)}>
                          {getStatusLabel(plan.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(plan.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(plan)}>
                          {isReadOnly(plan) ? 'Ver' : 'Gestionar'}
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
            <DialogTitle>{selectedPlan && isReadOnly(selectedPlan) ? 'Consultar Plan de Acción' : 'Gestionar Plan de Acción'}</DialogTitle>
            <DialogDescription>
              Evento: {selectedPlan?.eventoName} | Comentario: {selectedPlan?.comentario}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {selectedPlan?.status === 'Rechazado' && (
              <div className="md:col-span-2 bg-destructive/10 p-3 rounded-md border border-destructive/20">
                <p className="text-sm font-semibold text-destructive mb-1">Motivo del Rechazo:</p>
                <p className="text-sm italic">{selectedPlan.rejectReason}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select onValueChange={setStatus} value={status} disabled={selectedPlan ? isReadOnly(selectedPlan) : false}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Abierto">Abierto</SelectItem>
                  <SelectItem value="Cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nc">Consecutivo No Conformidad (Opcional)</Label>
              <Input 
                id="nc" 
                placeholder="Ej: H-CR-2026-0001" 
                value={consecutivoNC}
                onChange={(e) => setConsecutivoNC(e.target.value)}
                disabled={selectedPlan ? isReadOnly(selectedPlan) : false}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="causas">Causas</Label>
              <Textarea 
                id="causas" 
                placeholder="Describa las causas que originaron el comentario..." 
                className="min-h-[80px]"
                value={causas}
                onChange={(e) => setCausas(e.target.value)}
                disabled={selectedPlan ? isReadOnly(selectedPlan) : false}
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
                disabled={selectedPlan ? isReadOnly(selectedPlan) : false}
              />
            </div>
            {(status === 'Cerrado' || (selectedPlan && isReadOnly(selectedPlan))) && (
              <>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="cierre">Comentario de Cierre</Label>
                  <Textarea 
                    id="cierre" 
                    placeholder="Evidencia de las acciones realizadas..." 
                    value={comentarioCierre}
                    onChange={(e) => setComentarioCierre(e.target.value)}
                    disabled={selectedPlan ? isReadOnly(selectedPlan) : false}
                  />
                </div>
                {(status === 'Cerrado' || (selectedPlan && isReadOnly(selectedPlan)) || fotosCierre.length > 0) && (
                  <div className="md:col-span-2 space-y-4">
                    <Label>Pruebas Fotográficas {status === 'Cerrado' ? "(Obligatorio)" : ""}</Label>
                    
                    {/* Previsualización de imágenes */}
                    <div className="flex flex-wrap gap-2">
                      {fotosCierre.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url} 
                            alt={`Evidencia ${index + 1}`} 
                            className="h-20 w-20 object-cover rounded-md border"
                          />
                          {selectedPlan && !isReadOnly(selectedPlan) && (
                            <button
                              type="button"
                              onClick={() => removeFoto(index)}
                              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {uploading && (
                        <div className="h-20 w-20 flex items-center justify-center border rounded-md border-dashed">
                          <Loading message="" />
                        </div>
                      )}
                    </div>

                    {selectedPlan && !isReadOnly(selectedPlan) && (
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          hidden 
                          ref={cameraInputRef}
                          onChange={(e) => handleFileUpload(e, true)}
                        />
                        <input 
                          type="file" 
                          accept="image/*, application/pdf" 
                          hidden 
                          ref={fileInputRef}
                          onChange={(e) => handleFileUpload(e)}
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          className="flex-1 flex gap-2" 
                          onClick={() => cameraInputRef.current?.click()}
                          disabled={uploading}
                        >
                          <Camera className="h-4 w-4" /> Tomar Foto
                        </Button>
                        <Button 
                          type="button"
                          variant="outline" 
                          className="flex-1 flex gap-2" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          <FileUp className="h-4 w-4" /> Subir Archivo
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {selectedPlan && isReadOnly(selectedPlan) ? 'Cerrar' : 'Cancelar'}
            </Button>
            {selectedPlan && !isReadOnly(selectedPlan) && (
              <Button onClick={handleUpdateStatus} disabled={updating}>
                {updating ? "Guardando..." : "Guardar Cambios"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
