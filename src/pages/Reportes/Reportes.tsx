import { useEffect, useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { ref, onValue, DataSnapshot } from 'firebase/database';
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
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Search, Download } from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import * as XLSX from 'xlsx';

interface PlanAccion {
  id: string;
  eventoName: string;
  comentario: string;
  departamentoName: string;
  status: string;
  causas?: string;
  planAccionDetalle: string;
  comentarioCierre?: string;
  consecutivoNC?: string;
  rejectReason?: string;
  fotosCierre?: string[];
  createdAt: string;
  closedAt?: string;
}

export const Reportes = () => {
  const { recinto, db } = useAppContext();
  const [planes, setPlanes] = useState<PlanAccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanAccion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  useEffect(() => {
    if (!db || !recinto) return;
    
    const planesRef = ref(db, `planes-accion/${recinto}`);
    const unsubscribe = onValue(planesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({
          id,
          ...(val as object)
        })) as PlanAccion[];
        
        const sorted = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPlanes(sorted);
      } else {
        setPlanes([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [recinto, db]);

  const departamentos = useMemo(() => {
    return Array.from(new Set(planes.map(p => p.departamentoName))).filter(Boolean).sort();
  }, [planes]);

  const filteredPlanes = useMemo(() => {
    let result = [...planes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.eventoName.toLowerCase().includes(term) || 
        p.comentario.toLowerCase().includes(term) ||
        p.consecutivoNC?.toLowerCase().includes(term) ||
        p.causas?.toLowerCase().includes(term) ||
        p.planAccionDetalle?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    if (deptFilter !== 'all') {
      result = result.filter(p => p.departamentoName === deptFilter);
    }

    return result;
  }, [searchTerm, statusFilter, deptFilter, planes]);

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

  const handleExport = () => {
    const data = filteredPlanes.map(p => ({
      "ID": p.id,
      "Evento": p.eventoName,
      "Departamento": p.departamentoName,
      "Estado": p.status,
      "Fecha Evento": new Date(p.createdAt).toLocaleDateString(),
      "No. Conformidad": p.consecutivoNC || 'N/A',
      "Comentario del Cliente": p.comentario,
      "Causas": p.causas || '',
      "Detalle Plan de Acción": p.planAccionDetalle,
      "Comentario de Cierre": p.comentarioCierre || '',
      "Motivo de Rechazo": p.rejectReason || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Planes de Acción");

    // Generar archivo y descargar
    XLSX.writeFile(workbook, `Reporte_Planes_${recinto}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Historial de Planes de Acción</h1>
          <p className="text-muted-foreground">Consulte y exporte el histórico de todos los planes del recinto.</p>
        </div>
        <Button onClick={handleExport} className="flex gap-2">
          <Download className="h-4 w-4" /> Exportar Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Buscar por Evento o NC</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ej: Fiesta Senti..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select onValueChange={setStatusFilter} value={statusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Abierto">Pendiente de aprobación</SelectItem>
                  <SelectItem value="Revision">En revisión</SelectItem>
                  <SelectItem value="Aprobado">Aprobado</SelectItem>
                  <SelectItem value="Rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select onValueChange={setDeptFilter} value={deptFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los departamentos</SelectItem>
                  {departamentos.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDeptFilter('all');
              }}>
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <Loading message="Cargando historial..." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>NC</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlanes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">No se encontraron registros con los filtros aplicados.</TableCell>
                  </TableRow>
                ) : (
                  filteredPlanes.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.eventoName}</TableCell>
                      <TableCell>{plan.departamentoName}</TableCell>
                      <TableCell>{plan.consecutivoNC || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(plan.status)}>
                          {getStatusLabel(plan.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(plan.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedPlan(plan); setIsDialogOpen(true); }}>
                          <Eye className="h-4 w-4 mr-2" /> Detalle
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Plan de Acción</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                   <Label className="text-muted-foreground">Evento</Label>
                   <p className="font-medium">{selectedPlan?.eventoName}</p>
                </div>
                <div>
                   <Label className="text-muted-foreground">Departamento</Label>
                   <p className="font-medium">{selectedPlan?.departamentoName}</p>
                </div>
                <div>
                   <Label className="text-muted-foreground">Estado Actual</Label>
                   <div>
                     <Badge variant={getBadgeVariant(selectedPlan?.status || '')}>
                       {getStatusLabel(selectedPlan?.status || '')}
                     </Badge>
                   </div>
                </div>
                <div>
                   <Label className="text-muted-foreground">Consecutivo NC</Label>
                   <p className="font-medium">{selectedPlan?.consecutivoNC || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                   <Label className="text-muted-foreground">Comentario del Cliente</Label>
                   <p className="bg-muted p-2 rounded-md">{selectedPlan?.comentario}</p>
                </div>
                <div className="col-span-2">
                   <Label className="text-muted-foreground">Causas Identificadas</Label>
                   <p className="bg-muted p-2 rounded-md">{selectedPlan?.causas || 'No especificadas'}</p>
                </div>
                <div className="col-span-2">
                   <Label className="text-muted-foreground">Detalle del Plan de Acción</Label>
                   <p className="bg-muted p-2 rounded-md">{selectedPlan?.planAccionDetalle}</p>
                </div>
                {selectedPlan?.comentarioCierre && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Comentario de Cierre/Acciones Realizadas</Label>
                    <p className="bg-primary/5 p-2 border rounded-md">{selectedPlan?.comentarioCierre}</p>
                  </div>
                )}
                {selectedPlan?.rejectReason && (
                   <div className="col-span-2">
                      <Label className="text-destructive">Motivo del Rechazo</Label>
                      <p className="bg-destructive/5 p-2 border border-destructive/20 rounded-md text-destructive italic">{selectedPlan?.rejectReason}</p>
                   </div>
                )}
                {selectedPlan?.fotosCierre && selectedPlan.fotosCierre.length > 0 && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Evidencias Fotográficas</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedPlan.fotosCierre.map((url, index) => (
                        <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={url} 
                            alt={`Evidencia ${index + 1}`} 
                            className="h-24 w-24 object-cover rounded-md border hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
