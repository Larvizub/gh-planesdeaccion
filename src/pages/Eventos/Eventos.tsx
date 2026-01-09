import { useEffect, useState, useCallback } from 'react';
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
import { Loading } from '@/components/ui/loading';

import { startOfMonth, endOfMonth, setYear, setMonth, getYear, getMonth } from 'date-fns';

interface Evento {
  idEvent: number;
  title: string;
  startDate: string;
  endDate: string;
  statusName?: string; // Nombre del estado
  eventStatusDescription?: string;
  activities?: Array<{
    eventStatus?: {
      eventStatusDescription: string;
    };
  }>;
}

interface Departamento {
  id: string;
  name: string;
}

const MESES = [
  { value: '0', label: 'Enero' },
  { value: '1', label: 'Febrero' },
  { value: '2', label: 'Marzo' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Mayo' },
  { value: '5', label: 'Junio' },
  { value: '6', label: 'Julio' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Septiembre' },
  { value: '9', label: 'Octubre' },
  { value: '10', label: 'Noviembre' },
  { value: '11', label: 'Diciembre' },
];

export const Eventos = () => {
  const { idData, recinto, db } = useAppContext();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()).toString());
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()).toString());
  const [selectedStatus, setSelectedStatus] = useState('CON-POR'); // Especial para ambos
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const { toast } = useToast();

  // Form state
  const [comentario, setComentario] = useState('');
  const [idDepartamento, setIdDepartamento] = useState('');
  const [creatingPlan, setCreatingPlan] = useState(false);

  const fetchEventos = useCallback(async () => {
    if (!idData) {
      setEventos([]);
      return;
    }
    setLoading(true);
    try {
      const date = setYear(setMonth(new Date(), parseInt(selectedMonth)), parseInt(selectedYear));
      const start = format(startOfMonth(date), 'yyyy-MM-dd');
      const end = format(endOfMonth(date), 'yyyy-MM-dd');

      const token = await getAuthToken();
      const eventsData = await getEvents(token, idData, start, end);
      setHasSearched(true);
      
      // Mapear eventos para asegurar que tenemos un status manejable
      const mappedEvents = (eventsData || []).map((ev: Evento) => {
        // Intentar obtener el estado de varias fuentes comunes del API de Skill
        const status = ev.statusName || 
                      ev.eventStatusDescription || 
                      ev.activities?.[0]?.eventStatus?.eventStatusDescription || 
                      "Desconocido";
        return { ...ev, statusName: status };
      });

      setEventos(mappedEvents);
      if (!mappedEvents || mappedEvents.length === 0) {
        toast({
          title: "Información",
          description: "No se encontraron eventos para el periodo seleccionado.",
        });
      }
    } catch (error: unknown) {
      console.error(error);
      let errorMsg = "Error desconocido";
      if (error instanceof Error) errorMsg = error.message;
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { errorMessage?: string } }; message: string };
        errorMsg = axiosError.response?.data?.errorMessage || axiosError.message;
      }
      toast({
        title: "Error de Skill API",
        description: `No se pudieron cargar los eventos: ${errorMsg}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [idData, selectedMonth, selectedYear, toast]);

  useEffect(() => {
    const deptRef = ref(db, `config/${recinto}/departamentos`);
    const unsubscribe = onValue(deptRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({
          id,
          ...(val as object)
        })) as Departamento[];
        setDepartamentos(list);
      } else {
        setDepartamentos([]);
      }
    });

    return () => unsubscribe();
  }, [db, recinto, fetchEventos]);

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
        eventoId: selectedEvento.idEvent,
        eventoName: selectedEvento.title,
        comentario,
        departamentoId: idDepartamento,
        departamentoName: dept?.name,
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

  const years = Array.from({ length: 5 }, (_, i) => (getYear(new Date()) - 2 + i).toString());

  const filteredEventos = eventos.filter(ev => {
    const status = ev.statusName?.toLowerCase() || '';
    if (selectedStatus === 'CON-POR') {
      return status.includes('confirmado') || status.includes('por confirmar');
    }
    if (selectedStatus === 'CONFIRMADO') {
      return status === 'confirmado';
    }
    if (selectedStatus === 'POR CONFIRMAR') {
      return status === 'por confirmar';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Eventos de {recinto}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CON-POR">Confirmado / Por Conf.</SelectItem>
                  <SelectItem value="CONFIRMADO">Solo Confirmados</SelectItem>
                  <SelectItem value="POR CONFIRMAR">Solo Por Confirmar</SelectItem>
                  <SelectItem value="TODOS">Todos los estados</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchEventos} disabled={loading}>
                {loading ? "Cargando..." : "Consultar"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Evento</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loading message="Cargando eventos..." />
                  </TableCell>
                </TableRow>
              ) : !idData ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    Este recinto aún no está configurado para cargar eventos desde Skill API.
                  </TableCell>
                </TableRow>
              ) : !hasSearched ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    Seleccione el periodo y presione el botón "Consultar" para cargar los eventos.
                  </TableCell>
                </TableRow>
              ) : filteredEventos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">No hay eventos para este periodo o filtro.</TableCell>
                </TableRow>
              ) : (
                filteredEventos.map((evento) => (
                  <TableRow key={evento.idEvent}>
                    <TableCell className="font-medium">{evento.title}</TableCell>
                    <TableCell>{evento.startDate}</TableCell>
                    <TableCell>{evento.endDate}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        evento.statusName?.toLowerCase() === 'confirmado'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : evento.statusName?.toLowerCase() === 'por confirmar'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {evento.statusName}
                      </span>
                    </TableCell>
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
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Plan de Acción</DialogTitle>
            <DialogDescription>
              Evento: {selectedEvento?.title}
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
