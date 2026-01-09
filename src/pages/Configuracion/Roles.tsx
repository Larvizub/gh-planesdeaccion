import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, UserCheck } from 'lucide-react';

export const Roles = () => {
  const roles = [
    { 
      name: 'Usuario', 
      description: 'Puede ver eventos y gestionar los planes de acción asignados a su departamento.',
      icon: User
    },
    { 
      name: 'Calidad', 
      description: 'Puede ver todos los planes de acción y tiene permisos para aprobar o rechazar cierres.',
      icon: UserCheck
    },
    { 
      name: 'Administrador', 
      description: 'Acceso total a la configuración del sistema, gestión de usuarios, departamentos y tiempos.',
      icon: Shield
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Roles del Sistema</h2>
        <p className="text-muted-foreground">Definición de permisos y niveles de acceso.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <role.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{role.name}</CardTitle>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};
