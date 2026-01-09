import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { ref, push, set, onValue, remove, update, DataSnapshot } from 'firebase/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { LoadingRow } from '@/components/ui/loading';

interface Departamento {
  id: string;
  name: string;
}

export const Departamentos = () => {
  const { recinto, db } = useAppContext();
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const deptRef = ref(db, `config/${recinto}/departamentos`);
    const unsubscribe = onValue(deptRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        setDepartamentos(Object.entries(data).map(([id, val]) => ({ id, ...(val as object) })) as Departamento[]);
      } else {
        setDepartamentos([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [recinto]);

  const handleSubmit = async () => {
    if (!name) return;

    try {
      if (editingId) {
        await update(ref(db, `config/${recinto}/departamentos/${editingId}`), { name });
        toast({ title: "Actualizado", description: "Departamento actualizado." });
      } else {
        const newRef = push(ref(db, `config/${recinto}/departamentos`));
        await set(newRef, { name });
        toast({ title: "Creado", description: "Departamento creado." });
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", variant: "destructive", description: "Ocurrió un error." });
    }
  };

  const resetForm = () => {
    setName('');
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (dept: Departamento) => {
    setEditingId(dept.id);
    setName(dept.name);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este departamento?')) return;
    try {
      await remove(ref(db, `config/${recinto}/departamentos/${id}`));
      toast({ title: "Eliminado", description: "Departamento eliminado." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", variant: "destructive", description: "Ocurrió un error." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Departamentos</h2>
          <p className="text-muted-foreground">Gestione las áreas responsables de los planes de acción.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Agregar Departamento
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Departamento</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRow colSpan={2} />
              ) : departamentos.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-center">No hay departamentos configurados.</TableCell></TableRow>
              ) : (
                departamentos.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(dept)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(dept.id)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editingId ? 'Editar Departamento' : 'Nuevo Departamento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Departamento</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Operaciones" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editingId ? 'Actualizar' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
