import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, microsoftProvider, DOMAIN_RESTRICTIONS } from '@/lib/firebase';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const { recinto, setRecinto } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!recinto) {
      toast({
        title: "Error",
        description: "Debe seleccionar un recinto para continuar.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPopup(auth, microsoftProvider);
      const email = result.user.email || '';
      const restrictions = DOMAIN_RESTRICTIONS[recinto];
      const isAllowed = restrictions.some(domain => email.toLowerCase().endsWith(domain.toLowerCase()));

      if (!isAllowed) {
        await signOut(auth);
        toast({
          title: "Acceso denegado",
          description: `Tu dominio de correo (${email.split('@')[1]}) no tiene permisos para acceder al recinto ${recinto}.`,
          variant: "destructive"
        });
        return;
      }

      navigate('/');
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo iniciar sesión con Microsoft.";
      toast({
        title: "Error de autenticación",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="https://costaricacc.com/cccr/Logoheroica.png" 
              alt="Logo Heroica" 
              className="h-24 w-auto"
            />
          </div>
          <CardTitle className="text-3xl font-bold">Planes de Accción de Calidad</CardTitle>
          <CardDescription>
            Ingrese con su cuenta corporativa para gestionar los planes de acción.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recinto">Recinto</Label>
            <Select onValueChange={setRecinto} defaultValue={recinto || undefined}>
              <SelectTrigger id="recinto">
                <SelectValue placeholder="Seleccione un recinto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CCCR">CCCR (Costa Rica)</SelectItem>
                <SelectItem value="CCCI">CCCI (Cartagena)</SelectItem>
                <SelectItem value="CEVP">CEVP (Cali)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full gap-2" 
            onClick={handleLogin} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Iniciando...
              </>
            ) : (
               <>
                 <svg className="h-4 w-4" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                   <path d="M11.412 0H0v11.412h11.412V0z" fill="#f25022"/>
                   <path d="M23 0H11.588v11.412H23V0z" fill="#7fbb00"/>
                   <path d="M11.412 11.588H0V23h11.412V11.588z" fill="#00a1f1"/>
                   <path d="M23 11.588H11.588V23H23V11.588z" fill="#ffb900"/>
                 </svg>
                 Iniciar Sesión con Microsoft
               </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
