import { useEffect, useState } from 'react';
import { getAuthToken, getEvents } from '@/services/skillApi';
import { useAppContext } from '@/context/AppContext';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ref, push, set, onValue, DataSnapshot } from 'firebase/database';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loading } from '@/components/ui/loading';

interface Evento {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  // Add other fields from Skill API
}

interface Departamento {
  id: string;
  name: string;
  managerEmail: string;
}

export const Eventos = () => {
  const { idData, recinto, db } = useAppContext();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const { toast } = useToast();

  // Form state
  const [comentario, setComentario] = useState('');
  const [idDepartamento, setIdDepartamento] = useState('');
  const [creatingPlan, setCreatingPlan] = useState(false);

  useEffect(() => {
    const fetchEventos = async () => {
      setLoading(true);
      try {
        const token = await getAuthToken();
        const data = await getEvents(token, idData);
        // Assuming data is an array of events or has a specific structure
        setEventos(data || []);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los eventos de Skill API.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchDepartamentos = () => {
      const deptRef = ref(db, `config/${recinto}/departamentos`);
      onValue(deptRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data).map(([id, val]) => ({
            id,
            ...(val as object)
          })) as Departamento[];
          setDepartamentos(list);
        }
      });
    };

    fetchEventos();
    fetchDepartamentos();
  }, [idData, recinto, toast]);

  const handleCreatePlan = async () => {
    if (!selectedEvento || !comentario || !idDepartamento) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios.",
        variant: "destructive"
      });
      return;
    }

    setCreatingPlan(true);
    try {
      const dept = departamentos.find(d => d.id === idDepartamento);
      const newPlanRef = push(ref(db, `planes-accion/${recinto}`));
      await set(newPlanRef, {
        eventoId: selectedEvento.id,
        eventoName: selectedEvento.name,
        comentario,
        departamentoId: idDepartamento,
        departamentoName: dept?.name,
        responsableEmail: dept?.managerEmail,
        status: 'Abierto',
        createdAt: new Date().toISOString(),
        recinto,
      });

      toast({
        title: "Éxito",
        description: "Plan de acción generado correctamente.",
      });
      setIsDialogOpen(false);
      setComentario('');
      setIdDepartamento('');
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo crear el plan de acción.",
        variant: "destructive"
      });
    } finally {
      setCreatingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Eventos de {recinto} - {format(new Date(), 'MMMM yyyy', { locale: es })}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loading message="Cargando eventos..." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Evento</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">No hay eventos para este mes.</TableCell>
                  </TableRow>
                ) : (
                  eventos.map((evento) => (
                    <TableRow key={evento.id}>
                      <TableCell className="font-medium">{evento.name}</TableCell>
                      <TableCell>{evento.startDate}</TableCell>
                      <TableCell>{evento.endDate}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedEvento(evento);
                            setIsDialogOpen(true);
                          }}
                        >
                          Generar Plan
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Plan de Acción</DialogTitle>
            <DialogDescription>
              Evento: {selectedEvento?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento</Label>
              <Select onValueChange={setIdDepartamento} value={idDepartamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comentario">Comentario / Observación</Label>
              <Textarea 
                id="comentario" 
                placeholder="Describa el comentario del cliente..." 
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreatePlan} disabled={creatingPlan}>
              {creatingPlan ? "Creando..." : "Crear Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
