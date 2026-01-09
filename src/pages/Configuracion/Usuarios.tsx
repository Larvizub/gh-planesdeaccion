import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
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

interface UserData {
  id: string;
  email: string;
  displayName?: string;
  role: 'Normal' | 'Calidad' | 'Admin';
}

export const Usuarios = () => {
  const { recinto, db } = useAppContext();
  const [usuarios, setUsuarios] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, users might be managed in a global 'users' node or per recinto
    const usersRef = ref(db, `config/${recinto}/usuarios`);
    const unsubscribe = onValue(usersRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsuarios(Object.entries(data).map(([id, val]) => ({ id, ...(val as object) })) as UserData[]);
      } else {
        setUsuarios([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [recinto]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await update(ref(db, `config/${recinto}/usuarios/${userId}`), { role: newRole });
      toast({ title: "Rol actualizado", description: "El rol del usuario ha sido cambiado." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", variant: "destructive", description: "No se pudo cambiar el rol." });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        <p className="text-muted-foreground">Administre los roles y permisos de los usuarios del recinto.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / Email</TableHead>
                <TableHead>Rol Actual</TableHead>
                <TableHead className="text-right">Cambiar Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRow colSpan={3} />
              ) : usuarios.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center">No hay usuarios registrados.</TableCell></TableRow>
              ) : (
                usuarios.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.displayName || 'Sin nombre'}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'Admin' ? 'default' : user.role === 'Calidad' ? 'secondary' : 'outline'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select 
                        defaultValue={user.role} 
                        onValueChange={(val) => handleRoleChange(user.id, val)}
                      >
                        <SelectTrigger className="w-[180px] ml-auto">
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Normal">Usuario Normal</SelectItem>
                          <SelectItem value="Calidad">Usuario de Calidad</SelectItem>
                          <SelectItem value="Admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
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
