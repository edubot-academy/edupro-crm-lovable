import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ky } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/components/core/FeatureFlagProvider';
import { useTenantConfig } from '@/components/core/TenantConfigProvider';
import { profileApi } from '@/api/modules';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PencilLine, ToggleLeft, Palette, Globe, DollarSign, Tag, CreditCard } from 'lucide-react';
import { getFriendlyError } from '@/lib/error-messages';
import { AiUsageSummary } from '@/components/ai/AiUsageSummary';
import { WhatsAppSettingsPanel } from '@/components/whatsapp/WhatsAppSettingsPanel';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { featureFlags, isFeatureEnabled, allowedFeatures, sources } = useFeatureFlags();
  const isAiDraftsEnabled =
    isFeatureEnabled('ai_assist_enabled') && isFeatureEnabled('ai_followup_drafts_enabled');
  const isWhatsAppEnabled = isFeatureEnabled('whatsapp_integration_enabled');
  const { tenantConfig, updateTenantConfig } = useTenantConfig();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [initialProfile, setInitialProfile] = useState({ fullName: user?.fullName || '', email: user?.email || '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Tenant config state
  const [currency, setCurrency] = useState(tenantConfig.currency);
  const [timezone, setTimezone] = useState(tenantConfig.timezone);
  const [language, setLanguage] = useState(tenantConfig.language);
  const [companyName, setCompanyName] = useState(tenantConfig.companyName || tenantConfig.branding?.companyName || '');
  const [primaryColor, setPrimaryColor] = useState(tenantConfig.primaryColor || tenantConfig.branding?.primaryColor || '');
  const [isEditingTenantConfig, setIsEditingTenantConfig] = useState(false);
  const [isSavingTenantConfig, setIsSavingTenantConfig] = useState(false);
  const [previousTenantConfig, setPreviousTenantConfig] = useState(tenantConfig);

  // Sync local state with tenantConfig when provider loads data from backend
  useEffect(() => {
    setCurrency(tenantConfig.currency);
    setTimezone(tenantConfig.timezone);
    setLanguage(tenantConfig.language);
    setCompanyName(tenantConfig.companyName || tenantConfig.branding?.companyName || '');
    setPrimaryColor(tenantConfig.primaryColor || tenantConfig.branding?.primaryColor || '');
    setPreviousTenantConfig(tenantConfig);
  }, [tenantConfig]);

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

  const handleSaveTenantConfig = async () => {
    setIsSavingTenantConfig(true);
    try {
      await updateTenantConfig({
        currency,
        timezone,
        language,
        companyName,
        primaryColor,
        branding: {
          companyName,
          primaryColor,
        },
      });
      setIsEditingTenantConfig(false);
      toast({ title: 'Уюм жөндөөлөрү сакталды' });
    } catch (error) {
      console.error('Failed to save tenant config:', error);
      toast({
        title: 'Ката',
        description: error instanceof Error ? error.message : 'Сакталоо учурунда ката кетти',
        variant: 'destructive'
      });
    } finally {
      setIsSavingTenantConfig(false);
    }
  };

  const handleCancelTenantConfigEdit = () => {
    // Revert to previous saved config
    setCurrency(previousTenantConfig.currency);
    setTimezone(previousTenantConfig.timezone);
    setLanguage(previousTenantConfig.language);
    setCompanyName(previousTenantConfig.companyName || previousTenantConfig.branding?.companyName || '');
    setPrimaryColor(previousTenantConfig.primaryColor || previousTenantConfig.branding?.primaryColor || '');
    setIsEditingTenantConfig(false);
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

      <Card className="shadow-card border-border/50">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Уюм жөндөөлөрү
          </CardTitle>
          {!isEditingTenantConfig && (
            <Button variant="outline" onClick={() => setIsEditingTenantConfig(true)}>
              <PencilLine className="mr-2 h-4 w-4" />
              {ky.common.edit}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Валюта</Label>
            {isEditingTenantConfig ? (
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KGS">KGS - Кыргыз сом</SelectItem>
                  <SelectItem value="USD">USD - АКШ доллары</SelectItem>
                  <SelectItem value="EUR">EUR - Евро</SelectItem>
                  <SelectItem value="RUB">RUB - Орус рубли</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-foreground">
                {currency}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Убакыт зонасы</Label>
            {isEditingTenantConfig ? (
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Bishkek">Asia/Bishkek</SelectItem>
                  <SelectItem value="Asia/Almaty">Asia/Almaty</SelectItem>
                  <SelectItem value="Europe/Moscow">Europe/Moscow</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-foreground">
                {timezone}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Тил</Label>
            {isEditingTenantConfig ? (
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ky">Кыргызча</SelectItem>
                  <SelectItem value="ru">Орусча</SelectItem>
                  <SelectItem value="en">Англисче</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-foreground">
                {language}
              </div>
            )}
          </div>
          {isEditingTenantConfig && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelTenantConfigEdit} disabled={isSavingTenantConfig}>
                {ky.common.cancel}
              </Button>
              <Button onClick={handleSaveTenantConfig} disabled={isSavingTenantConfig}>
                {isSavingTenantConfig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSavingTenantConfig ? 'Сакталууда...' : ky.common.save}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/50">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Брендинг
          </CardTitle>
          {!isEditingTenantConfig && (
            <Button variant="outline" onClick={() => setIsEditingTenantConfig(true)}>
              <PencilLine className="mr-2 h-4 w-4" />
              {ky.common.edit}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Компания аты</Label>
            {isEditingTenantConfig ? (
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            ) : (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-foreground">
                {companyName || '—'}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Башкы түс</Label>
            {isEditingTenantConfig ? (
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10 p-1"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#000000"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {primaryColor && (
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: primaryColor }}
                  />
                )}
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-foreground">
                  {primaryColor || '—'}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isAiDraftsEnabled ? (
        <AiUsageSummary className="shadow-card border-border/50" />
      ) : null}

      {isWhatsAppEnabled ? (
        <WhatsAppSettingsPanel />
      ) : (
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base">WhatsApp каналы</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              WhatsApp интеграциясы бул tenant үчүн азырынча план же платформа деңгээлинде иштетиле элек.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ToggleLeft className="h-4 w-4" />
            Мүмкүнчүлүктөр
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Уюм жөндөөлөрү</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Бул мүмкүнчүлүктөр сиздин уюм жөндөөлөрүңүзгө жараша көрсөтүлөт.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">CRM</p>
              <p className="text-xs text-muted-foreground">CRM модулу</p>
            </div>
            <Switch checked={true} disabled className="opacity-50" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">LMS байланышы</p>
              <p className="text-xs text-muted-foreground">LMS интеграциясы</p>
              {allowedFeatures?.lms_bridge_enabled === false && (
                <p className="text-xs text-destructive mt-1">Бул функция сиздин тарифиңизде жеткиликтүү эмес</p>
              )}
              {(sources?.lms_bridge_enabled === 'global' || sources?.lms_bridge_enabled === 'plan') && (
                <p className="text-xs text-muted-foreground mt-1">Бул функция платформа тарифи аркылуу башкарылат</p>
              )}
            </div>
            <Switch checked={featureFlags.lms_bridge_enabled} disabled className="opacity-50" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Сыноо сабактар</p>
              <p className="text-xs text-muted-foreground">Сыноо сабактары</p>
              {allowedFeatures?.trial_lessons_enabled === false && (
                <p className="text-xs text-destructive mt-1">Бул функция сиздин тарифиңизде жеткиликтүү эмес</p>
              )}
              {(sources?.trial_lessons_enabled === 'global' || sources?.trial_lessons_enabled === 'plan') && (
                <p className="text-xs text-muted-foreground mt-1">Бул функция платформа тарифи аркылуу башкарылат</p>
              )}
            </div>
            <Switch checked={featureFlags.trial_lessons_enabled} disabled className="opacity-50" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Студентти кармап калуу</p>
              <p className="text-xs text-muted-foreground">Тутумду сактоо</p>
              {allowedFeatures?.retention_enabled === false && (
                <p className="text-xs text-destructive mt-1">Бул функция сиздин тарифиңизде жеткиликтүү эмес</p>
              )}
              {(sources?.retention_enabled === 'global' || sources?.retention_enabled === 'plan') && (
                <p className="text-xs text-muted-foreground mt-1">Бул функция платформа тарифи аркылуу башкарылат</p>
              )}
            </div>
            <Switch checked={featureFlags.retention_enabled} disabled className="opacity-50" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Кеңейтилген отчеттор</p>
              <p className="text-xs text-muted-foreground">Кеңейтрилген отчеттор</p>
              {allowedFeatures?.advanced_reports_enabled === false && (
                <p className="text-xs text-destructive mt-1">Бул функция сиздин тарифиңизде жеткиликтүү эмес</p>
              )}
              {(sources?.advanced_reports_enabled === 'global' || sources?.advanced_reports_enabled === 'plan') && (
                <p className="text-xs text-muted-foreground mt-1">Бул функция платформа тарифи аркылуу башкарылат</p>
              )}
            </div>
            <Switch checked={featureFlags.advanced_reports_enabled} disabled className="opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Лид булактары
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Тенант конфигурациясы</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tenantConfig.leadSources.length > 0 ? (
            tenantConfig.leadSources.map((source) => (
              <div key={source.sourceKey} className="flex items-center justify-between py-2">
                <span className="text-sm">{source.sourceName}</span>
                <Switch checked={true} disabled />
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Лид булактары азырынча кошула элек
            </div>
          )}
          <Button variant="outline" className="w-full mt-2" onClick={() => toast({ title: 'Бул функция азырынча жеткиликтүү эмес', variant: 'destructive' })}>
            Лид булагын кошуу
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Төлөм ыкмалары
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Тенант конфигурациясы</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tenantConfig.paymentMethods.length > 0 ? (
            tenantConfig.paymentMethods.map((pm) => (
              <div key={pm.methodKey} className="flex items-center justify-between py-2">
                <span className="text-sm">{pm.methodName || pm.methodKey}</span>
                <Switch checked={pm.enabled} disabled />
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Төлөм ыкмалары азырынча кошула элек
            </div>
          )}
          <Button variant="outline" className="w-full mt-2" onClick={() => toast({ title: 'Бул функция азырынча жеткиликтүү эмес', variant: 'destructive' })}>
            Төлөм ыкмасын кошуу
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
