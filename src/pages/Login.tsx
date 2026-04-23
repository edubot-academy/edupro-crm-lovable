import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ky } from '@/lib/i18n';
import { Loader2, HelpCircle, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: string }).message)
          : ky.auth.loginError;
      toast({ title: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 flex-col justify-between p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm font-bold text-2xl">
            E
          </div>
          <span className="text-2xl font-bold">EduPro CRM</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Билим берүү бизнесиңизди кесиптик башкаруу
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Лиддерди, окуучуларды жана төлөмдөрдү бир платформада башкарыңыз.
          </p>
        </div>
        <div className="space-y-4 text-sm text-primary-foreground/70">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>support@edupro.kg</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>+996 555 123 456</span>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex flex-1 items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-elevated border-border/50">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="lg:hidden mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl mb-4">
              E
            </div>
            <CardTitle className="text-2xl font-bold">{ky.auth.loginTitle}</CardTitle>
            <CardDescription>{ky.auth.loginSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{ky.auth.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={ky.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{ky.auth.password}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={ky.auth.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {ky.auth.loginButton}
              </Button>
            </form>
            <div className="mt-6 space-y-3">
              <Link to="/forgot-password" className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                Сырсөзүңүздү унутуңузбу?
              </Link>
              <div className="flex items-center justify-center gap-2 pt-4 border-t">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Жардам
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
