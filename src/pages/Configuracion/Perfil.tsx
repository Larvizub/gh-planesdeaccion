import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export const Perfil = () => {
  const { user, recinto } = useAppContext();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // En una app real de Firebase Auth con Microsoft, el perfil suele manejarse desde el portal de MS.
    // Pero aquí mostramos la información y permitimos "simular" una actualización si fuera necesario localmente.
    toast({
      title: "Información",
      description: "La información de perfil proviene de tu cuenta de Microsoft.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu información personal y preferencias.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
            <CardDescription>Detalles básicos de tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                <AvatarFallback className="text-2xl">
                  {user?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-medium">{user?.displayName}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{recinto?.toUpperCase()}</Badge>
                  <Badge variant="secondary">Usuario Activo</Badge>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input 
                  id="name" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled
                />
              </div>
              <Button type="submit" className="w-full" disabled>Actualizar Perfil (Solo Lectura)</Button>
              <p className="text-xs text-center text-muted-foreground">
                Para cambiar estos datos, contacta al administrador de TI de tu organización.
              </p>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Sesión</CardTitle>
            <CardDescription>Preferencias de tu entorno de trabajo actual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Recinto Seleccionado</p>
                <p className="text-sm text-muted-foreground">Estás trabajando en {recinto?.toUpperCase()}</p>
              </div>
              <Badge>{recinto}</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Método de Autenticación</p>
                <p className="text-sm text-muted-foreground">Iniciaste sesión vía Microsoft Graph</p>
              </div>
              <Badge variant="outline">OAuth2</Badge>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-4">Seguridad</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Tu cuenta está protegida por las políticas de seguridad de tu organización.
              </p>
              <Button variant="outline" className="w-full" onClick={() => window.open('https://myaccount.microsoft.com/', '_blank')}>
                Ir a mi cuenta de Microsoft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
