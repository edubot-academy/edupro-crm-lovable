import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await authApi.requestPasswordReset(email);
      setSent(true);
    } catch (err: unknown) {
      const message = typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message: string }).message)
        : 'Ката кетти';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elevated border-border/50">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
            E
          </div>
          <CardTitle className="text-2xl font-bold">Сырсөздү калыбына келтирүү</CardTitle>
          <CardDescription>Электрондук почтаңызга калыбына келтирүү шилтемеси жөнөтүлөт</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Эгер бул email менен каттоо бар болсо, калыбына келтирүү шилтемеси жөнөтүлдү.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Кирүүгө кайтуу
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Электрондук почта</Label>
                <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Шилтеме жөнөтүү
              </Button>
              <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="inline mr-1 h-3 w-3" />
                Кирүүгө кайтуу
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
