import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import type { UserData } from '@/context/AppContext';
import { ref, onValue, update, DataSnapshot } from 'firebase/database';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { LoadingRow } from '@/components/ui/loading';

interface Dept {
  id: string;
  name: string;
}

export const Usuarios = () => {
  const { recinto, db } = useAppContext();
  const [usuarios, setUsuarios] = useState<UserData[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Escuchar departamentos
    const deptsRef = ref(db, `config/${recinto}/departamentos`);
    onValue(deptsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDepts(Object.entries(data).map(([id, val]: [string, any]) => ({ id, name: val.name })));
      }
    });

    // Escuchar usuarios del recinto
    const usersRef = ref(db, `users/${recinto}`);
    const unsubscribe = onValue(usersRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsuarios(Object.entries(data).map(([id, val]) => ({ uid: id, ...(val as object) })) as UserData[]);
      } else {
        setUsuarios([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [recinto, db]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await update(ref(db, `users/${recinto}/${userId}`), { role: newRole });
      toast({ title: "Rol actualizado", description: "El rol del usuario ha sido cambiado." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", variant: "destructive", description: "No se pudo cambiar el rol." });
    }
  };

  const handleDeptChange = async (userId: string, deptId: string) => {
    try {
      const deptName = depts.find(d => d.id === deptId)?.name || '';
      await update(ref(db, `users/${recinto}/${userId}`), { 
        departmentId: deptId,
        departmentName: deptName
      });
      toast({ title: "Departamento actualizado", description: "El departamento del usuario ha sido cambiado." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", variant: "destructive", description: "No se pudo cambiar el departamento." });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        <p className="text-muted-foreground">Administre los roles y departamentos de los usuarios del recinto.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / Email</TableHead>
                <TableHead>Rol Actual</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRow colSpan={4} />
              ) : usuarios.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center">No hay usuarios registrados.</TableCell></TableRow>
              ) : (
                usuarios.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell>
                      <div className="font-medium">{user.displayName || 'Sin nombre'}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'Administrador' ? 'default' : user.role === 'Calidad' ? 'secondary' : 'outline'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{user.departmentName || 'No asignado'}</div>
                    </TableCell>
                    <TableCell className="text-right space-y-2">
                      <div className="flex flex-col items-end gap-2">
                        <Select 
                          defaultValue={user.role} 
                          onValueChange={(val) => handleRoleChange(user.uid, val)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Cambiar rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Usuario">Usuario Normal</SelectItem>
                            <SelectItem value="Calidad">Usuario de Calidad</SelectItem>
                            <SelectItem value="Administrador">Administrador</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select 
                          defaultValue={user.departmentId} 
                          onValueChange={(val) => handleDeptChange(user.uid, val)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Cambiar depto" />
                          </SelectTrigger>
                          <SelectContent>
                            {depts.map((d) => (
                              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
