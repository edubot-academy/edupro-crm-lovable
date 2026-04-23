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
import { Loader2, PencilLine } from 'lucide-react';
import { getFriendlyError } from '@/lib/error-messages';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [initialProfile, setInitialProfile] = useState({ fullName: user?.fullName || '', email: user?.email || '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    profileApi.get()
      .then((profile) => {
        setFullName(profile.fullName || '');
        setEmail(profile.email || '');
        setInitialProfile({
          fullName: profile.fullName || '',
          email: profile.email || '',
        });
      })
      .catch(() => {
        // fallback to auth context
        setFullName(user?.fullName || '');
        setEmail(user?.email || '');
        setInitialProfile({
          fullName: user?.fullName || '',
          email: user?.email || '',
        });
      })
      .finally(() => setIsLoadingProfile(false));
  }, [user?.email, user?.fullName]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const profile = await profileApi.update({ fullName, email });
      setFullName(profile.fullName || '');
      setEmail(profile.email || '');
      setInitialProfile({
        fullName: profile.fullName || '',
        email: profile.email || '',
      });
      setIsEditingProfile(false);
      toast({ title: 'Профиль ийгиликтүү сакталды' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Профилди сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFullName(initialProfile.fullName);
    setEmail(initialProfile.email);
    setIsEditingProfile(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader title={ky.settings.title} />

      <Card className="shadow-card border-border/50">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Профиль</CardTitle>
          {!isLoadingProfile && !isEditingProfile && (
            <Button variant="outline" onClick={() => setIsEditingProfile(true)}>
              <PencilLine className="mr-2 h-4 w-4" />
              {ky.common.edit}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingProfile ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>{ky.common.name}</Label>
                {isEditingProfile ? (
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                ) : (
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-foreground">
                    {fullName || '—'}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>{ky.common.email}</Label>
                {isEditingProfile ? (
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                  />
                ) : (
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-foreground">
                    {email || '—'}
                  </div>
                )}
              </div>
              {isEditingProfile && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                    {ky.common.cancel}
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {ky.common.save}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/50 opacity-75">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Билдирүүлөр
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Тез арада</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Жаңы лид билдирүүсү</p>
              <p className="text-xs text-muted-foreground">Жаңы лид кошулганда эскертүү алуу</p>
            </div>
            <Switch disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Төлөм билдирүүсү</p>
              <p className="text-xs text-muted-foreground">Төлөм жиберилгенде эскертүү алуу</p>
            </div>
            <Switch disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Тобокелдик сигналдары</p>
              <p className="text-xs text-muted-foreground">LMS тобокелдик сигналдарын алуу</p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
