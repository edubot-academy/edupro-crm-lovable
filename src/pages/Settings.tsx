import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ky } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi } from '@/api/modules';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    profileApi.get()
      .then((profile) => {
        setFullName(profile.fullName || '');
        setEmail(profile.email || '');
      })
      .catch(() => {
        // fallback to auth context
        setFullName(user?.fullName || '');
        setEmail(user?.email || '');
      })
      .finally(() => setIsLoadingProfile(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await profileApi.update({ fullName, email });
      toast({ title: 'Профиль ийгиликтүү сакталды' });
    } catch {
      toast({ title: 'Профилди сактоодо ката кетти', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader title={ky.settings.title} />

      <Card className="shadow-card border-border/50">
        <CardHeader><CardTitle className="text-base">Профиль</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {isLoadingProfile ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>{ky.common.name}</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{ky.common.email}</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              </div>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {ky.common.save}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/50">
        <CardHeader><CardTitle className="text-base">Билдирүүлөр</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Жаңы лид билдирүүсү</p>
              <p className="text-xs text-muted-foreground">Жаңы лид кошулганда эскертүү алуу</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Төлөм билдирүүсү</p>
              <p className="text-xs text-muted-foreground">Төлөм жиберилгенде эскертүү алуу</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Тобокелдик сигналдары</p>
              <p className="text-xs text-muted-foreground">LMS тобокелдик сигналдарын алуу</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
