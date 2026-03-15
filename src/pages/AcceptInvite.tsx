import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/api/auth';

export default function AcceptInvitePage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({ title: 'Чакыруу токени табылган жок', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Сырсөздөр дал келбейт', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Сырсөз кеминде 6 символдон турушу керек', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await authApi.acceptInvite({ token, password });
      toast({ title: 'Каттоо ийгиликтүү аяктады!' });
      navigate('/login');
    } catch (err: unknown) {
      const message = typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message: string }).message)
        : 'Ката кетти';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Жараксыз чакыруу шилтемеси</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elevated border-border/50">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
            E
          </div>
          <CardTitle className="text-2xl font-bold">Чакырууну кабыл алуу</CardTitle>
          <CardDescription>Жаңы сырсөзүңүздү коюңуз</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Жаңы сырсөз</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Сырсөздү ырастаңыз</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Катталуу
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
