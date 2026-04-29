import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ky } from '@/lib/i18n';
import { Loader2, HelpCircle, Mail, Phone, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenantBranding } from '@/hooks/use-tenant-branding';
import { getDevelopmentTenantId } from '@/lib/tenant-bootstrap';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { tenant, isLoading: isTenantLoading, isProductionDomain, isLocalDevelopment, error: tenantError } = useTenant();
  const tenantBranding = useTenantBranding();
  const navigate = useNavigate();
  const { toast } = useToast();
  const developmentTenantId = getDevelopmentTenantId();

  useEffect(() => {
    document.title = `${tenantBranding.displayName} | ${ky.auth.login}`;
  }, [tenantBranding.displayName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Block login if tenant resolution failed on production domain
    if (isProductionDomain && tenantError) {
      toast({ title: tenantError, variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const loginTenantId = isProductionDomain
        ? tenant?.tenantId.toString() ?? null
        : developmentTenantId ?? null;

      if (!loginTenantId) {
        toast({
          title: 'Тенант контексти табылган жок',
          description: 'Туура тенант доменин ачыңыз. Local development үчүн `VITE_DEV_TENANT_ID` же `?tenantId=` колдонуңуз.',
          variant: 'destructive',
        });
        return;
      }

      await login(email, password, loginTenantId);

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

  const brandingName = tenantBranding.displayName;
  const firstChar = brandingName.charAt(0) || 'E';
  const hasSupportContacts = tenantBranding.supportEmail || tenantBranding.supportPhone;
  const accentStyle = tenantBranding.brandColor
    ? { background: `linear-gradient(135deg, ${tenantBranding.brandColor}, ${tenantBranding.brandColor}dd)` }
    : undefined;
  const logoBadgeStyle = tenantBranding.brandColor
    ? { backgroundColor: tenantBranding.brandColor }
    : undefined;

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 flex-col justify-between p-12 text-primary-foreground"
        style={accentStyle}
      >
        <div className="flex items-center gap-3">
          {tenantBranding.logoUrl ? (
            <img src={tenantBranding.logoUrl} alt={brandingName} className="h-12 w-12 rounded-xl bg-white/15 object-cover p-1" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm font-bold text-2xl">
              {firstChar}
            </div>
          )}
          <span className="text-2xl font-bold">{brandingName}</span>
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
          {tenantBranding.supportEmail && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{tenantBranding.supportEmail}</span>
            </div>
          )}
          {tenantBranding.supportPhone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{tenantBranding.supportPhone}</span>
            </div>
          )}
          {!hasSupportContacts && (
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span>{tenantBranding.supportLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex flex-1 items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-elevated border-border/50">
          <CardHeader className="text-center space-y-2 pb-2">
            {tenantBranding.logoUrl ? (
              <img src={tenantBranding.logoUrl} alt={brandingName} className="mx-auto mb-4 h-14 w-14 rounded-xl object-cover p-1 shadow-sm" />
            ) : (
              <div className="lg:hidden mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl mb-4" style={logoBadgeStyle}>
                {firstChar}
              </div>
            )}
            <CardTitle className="text-2xl font-bold">{ky.auth.loginTitle}</CardTitle>
            <CardDescription>{brandingName}</CardDescription>
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

              {/* Tenant resolution error alert */}
              {isProductionDomain && tenantError && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{tenantError}</span>
                </div>
              )}

              {isLocalDevelopment && !developmentTenantId && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-muted/60 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Local development үчүн `VITE_DEV_TENANT_ID` же `?tenantId=` керек.</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isTenantLoading || (isProductionDomain && !!tenantError) || (isLocalDevelopment && !developmentTenantId)}
              >
                {(isLoading || isTenantLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {ky.auth.loginButton}
              </Button>
            </form>
            <div className="mt-6 space-y-3">
              <Link to="/forgot-password" className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                {ky.auth.forgotPassword}
              </Link>
              <div className="flex items-center justify-center gap-2 pt-4 border-t">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  {ky.auth.help}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
