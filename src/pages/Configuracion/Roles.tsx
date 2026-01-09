import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { ref, onValue, set } from 'firebase/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, UserCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';

interface Permissions {
  [role: string]: {
    [moduleId: string]: boolean;
  };
}

const MODULES = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'eventos', name: 'Eventos' },
  { id: 'planes', name: 'Planes de Acción' },
  { id: 'aprobaciones', name: 'Aprobaciones' },
  { id: 'resultados', name: 'Resultados' },
  { id: 'usuarios', name: 'Config - Usuarios' },
  { id: 'departamentos', name: 'Config - Departamentos' },
  { id: 'roles', name: 'Config - Roles' },
  { id: 'tiempos', name: 'Config - Tiempos' },
];

const ROLES = ['Usuario', 'Calidad', 'Administrador'];

export const Roles = () => {
  const { recinto, db } = useAppContext();
  const [permissions, setPermissions] = useState<Permissions>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const rolesRef = ref(db, `config/${recinto}/permisos`);
    const unsubscribe = onValue(rolesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPermissions(data);
      } else {
        // Inicializar por defecto si no existe
        const defaults: Permissions = {
          Usuario: { dashboard: true, eventos: true, planes: true, resultados: true },
          Calidad: { dashboard: true, eventos: true, planes: true, aprobaciones: true, resultados: true, departamentos: true, tiempos: true },
          Administrador: { dashboard: true, eventos: true, planes: true, aprobaciones: true, resultados: true, usuarios: true, departamentos: true, roles: true, tiempos: true }
        };
        setPermissions(defaults);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [recinto, db]);

  const togglePermission = async (role: string, moduleId: string) => {
    const newPermissions = {
      ...permissions,
      [role]: {
        ...permissions[role],
        [moduleId]: !permissions[role]?.[moduleId]
      }
    };
    
    try {
      await set(ref(db, `config/${recinto}/permisos`), newPermissions);
      toast({
        title: "Permiso actualizado",
        description: `Se ha cambiado el acceso a ${moduleId} para el rol ${role}.`
      });
    } catch (error: unknown) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el permiso.",
        variant: "destructive"
      });
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestión de Accesos por Rol</h2>
        <p className="text-muted-foreground">Configure a qué módulos puede acceder cada tipo de usuario.</p>
      </div>

      <div className="grid gap-6">
        {ROLES.map((role) => (
          <Card key={role}>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {role === 'Administrador' ? <Shield className="h-6 w-6 text-primary" /> : 
                 role === 'Calidad' ? <UserCheck className="h-6 w-6 text-primary" /> : 
                 <User className="h-6 w-6 text-primary" />}
              </div>
              <div>
                <CardTitle>{role}</CardTitle>
                <CardDescription>Permisos asignados al nivel {role}.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {MODULES.map((module) => (
                  <div key={module.id} className="flex items-center space-x-2">
                    <Switch 
                      id={`${role}-${module.id}`}
                      checked={permissions[role]?.[module.id] || false}
                      onCheckedChange={() => togglePermission(role, module.id)}
                      disabled={role === 'Administrador' && module.id === 'roles'} // Evitar bloqueo total
                    />
                    <Label htmlFor={`${role}-${module.id}`} className="cursor-pointer">
                      {module.name}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
