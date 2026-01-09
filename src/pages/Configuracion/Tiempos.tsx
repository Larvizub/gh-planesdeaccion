import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { ref, onValue, set } from 'firebase/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Clock } from 'lucide-react';

export const Tiempos = () => {
  const { recinto, db } = useAppContext();
  const [diasLimite, setDiasLimite] = useState<number>(3);
  const { toast } = useToast();

  useEffect(() => {
    const configRef = ref(db, `config/${recinto}/tiempos`);
    onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.diasLimite) {
        setDiasLimite(data.diasLimite);
      }
    });
  }, [recinto]);

  const handleSave = async () => {
    try {
      await set(ref(db, `config/${recinto}/tiempos`), { diasLimite });
      toast({ title: "Configuración guardada", description: "Los tiempos límites han sido actualizados." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", variant: "destructive", description: "No se pudo guardar la configuración." });
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Configuración de Tiempos
          </CardTitle>
          <CardDescription>
            Defina el tiempo límite (en días) que tienen los usuarios para completar un plan de acción.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dias">Días hábiles para cierre</Label>
            <Input 
              id="dias" 
              type="number" 
              value={diasLimite} 
              onChange={(e) => setDiasLimite(parseInt(e.target.value))} 
              min={1}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} className="w-full">Guardar Configuración</Button>
        </CardFooter>
      </Card>
      
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Este tiempo se utiliza para calcular el estado de los planes y enviar recordatorios automáticos (vía Functions).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
