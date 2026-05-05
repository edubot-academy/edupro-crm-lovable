import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ky } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/components/core/FeatureFlagProvider';
import { useTenantConfig } from '@/components/core/TenantConfigProvider';
import { profileApi } from '@/api/modules';
import { tenantConfigApi, type TenantApprovalRuleResponse, type TenantConfigUpdatePayload } from '@/api/tenant-config';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, PencilLine, ToggleLeft, Palette, Globe, CreditCard, Tag, Workflow,
  Shield, Plus, Trash2, Save, RefreshCw,
} from 'lucide-react';
import { getFriendlyError } from '@/lib/error-messages';
import { AiUsageSummary } from '@/components/ai/AiUsageSummary';
import type { PipelineStageConfig, RoleConfig, StatusConfig, TenantLeadSource, TenantPaymentMethod } from '@/types';

const LEAD_SOURCE_OPTIONS = [
  'instagram',
  'telegram',
  'whatsapp',
  'website',
  'phone_call',
  'referral',
] as const;

const LEAD_STATUS_OPTIONS = [
  'new',
  'no_response',
  'contacted',
  'interested',
  'offer_sent',
  'negotiation',
  'payment_pending',
  'won',
  'lost',
] as const;

const DEAL_PIPELINE_OPTIONS = [
  'new',
  'consultation',
  'negotiation',
  'payment_pending',
  'won',
  'lost',
] as const;

const PAYMENT_METHOD_TYPES = [
  { value: 'card', label: 'Карта' },
  { value: 'qr', label: 'QR' },
  { value: 'bank', label: 'Банк' },
  { value: 'manual', label: 'Кол менен' },
  { value: 'other', label: 'Башка' },
] as const;

const PERMISSION_OPTIONS = [
  { key: 'assign_leads', label: 'Лид бөлүштүрүү' },
  { key: 'view_admin_panel', label: 'Админ панелди көрүү' },
  { key: 'view_integration_history', label: 'Интеграция тарыхын көрүү' },
  { key: 'view_student_summary', label: 'Студент сводкасын көрүү' },
  { key: 'view_technical_fields', label: 'Техникалык талааларды көрүү' },
  { key: 'manage_users', label: 'Колдонуучуларды башкаруу' },
  { key: 'manage_settings', label: 'Жөндөөлөрдү башкаруу' },
  { key: 'view_retention_cases', label: 'Тобокелдик учурларды көрүү' },
  { key: 'manage_retention_cases', label: 'Тобокелдик учурларды башкаруу' },
  { key: 'view_bridge_admin', label: 'Bridge admin бөлүмүн көрүү' },
  { key: 'manage_bridge', label: 'Bridge бөлүмүн башкаруу' },
] as const;

const emptySourceForm = { sourceKey: LEAD_SOURCE_OPTIONS[0], sourceName: '', isDefault: false };
const emptyMethodForm = { methodKey: '', methodName: '', methodType: 'manual' as TenantPaymentMethod['methodType'], enabled: true, displayOrder: 0 };
const emptyStatusForm = { statusKey: LEAD_STATUS_OPTIONS[0], statusName: '', statusOrder: 0 };
const emptyStageForm = { stageKey: DEAL_PIPELINE_OPTIONS[0], stageName: '', stageOrder: 0, isDefault: false };
const emptyRoleForm = { roleKey: '', roleName: '', permissions: {} as Record<string, boolean> };
const emptyApprovalRuleForm = { ruleKey: '', ruleName: '', entityType: 'enrollment', requiredRoles: [] as string[], enabled: true };

type DialogMode = 'create' | 'edit';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { featureFlags, isFeatureEnabled, allowedFeatures, sources } = useFeatureFlags();
  const { tenantConfig, updateTenantConfig, refreshTenantConfig } = useTenantConfig();
  const isAiDraftsEnabled =
    isFeatureEnabled('ai_assist_enabled') && isFeatureEnabled('ai_followup_drafts_enabled');
  const customRolesEnabled = isFeatureEnabled('custom_roles_enabled');

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [initialProfile, setInitialProfile] = useState({ fullName: user?.fullName || '', email: user?.email || '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [orgForm, setOrgForm] = useState({
    currency: tenantConfig.currency,
    timezone: tenantConfig.timezone,
    language: tenantConfig.language,
    companyName: tenantConfig.companyName || tenantConfig.branding?.companyName || '',
    primaryColor: tenantConfig.primaryColor || tenantConfig.branding?.primaryColor || '',
    logoUrl: tenantConfig.logoUrl || tenantConfig.branding?.logoUrl || '',
    supportEmail: tenantConfig.supportEmail || '',
  });
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  const [approvalRules, setApprovalRules] = useState<TenantApprovalRuleResponse[]>([]);
  const [isLoadingApprovalRules, setIsLoadingApprovalRules] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<TenantPaymentMethod[]>([]);

  const [sourceDialogMode, setSourceDialogMode] = useState<DialogMode>('create');
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [sourceForm, setSourceForm] = useState(emptySourceForm);
  const [sourceOriginalKey, setSourceOriginalKey] = useState<string | null>(null);
  const [isSavingSource, setIsSavingSource] = useState(false);

  const [methodDialogMode, setMethodDialogMode] = useState<DialogMode>('create');
  const [methodDialogOpen, setMethodDialogOpen] = useState(false);
  const [methodForm, setMethodForm] = useState(emptyMethodForm);
  const [methodOriginalKey, setMethodOriginalKey] = useState<string | null>(null);
  const [isSavingMethod, setIsSavingMethod] = useState(false);

  const [statusDialogMode, setStatusDialogMode] = useState<DialogMode>('create');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusForm, setStatusForm] = useState(emptyStatusForm);
  const [statusOriginalKey, setStatusOriginalKey] = useState<string | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const [stageDialogMode, setStageDialogMode] = useState<DialogMode>('create');
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [stageForm, setStageForm] = useState(emptyStageForm);
  const [stageOriginalKey, setStageOriginalKey] = useState<string | null>(null);
  const [isSavingStage, setIsSavingStage] = useState(false);

  const [roleDialogMode, setRoleDialogMode] = useState<DialogMode>('create');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [roleOriginalKey, setRoleOriginalKey] = useState<string | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);

  const [approvalDialogMode, setApprovalDialogMode] = useState<DialogMode>('create');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalRuleForm, setApprovalRuleForm] = useState(emptyApprovalRuleForm);
  const [approvalOriginalKey, setApprovalOriginalKey] = useState<string | null>(null);
  const [isSavingApprovalRule, setIsSavingApprovalRule] = useState(false);

  const roleOptions = useMemo(
    () => tenantConfig.roles.filter((role) => role.key !== 'superadmin'),
    [tenantConfig.roles]
  );

  const loadApprovalRules = useCallback(async () => {
    setIsLoadingApprovalRules(true);
    try {
      const items = await tenantConfigApi.getApprovalRules();
      setApprovalRules(items);
    } catch (error) {
      console.error('Failed to load approval rules', error);
      setApprovalRules([]);
    } finally {
      setIsLoadingApprovalRules(false);
    }
  }, []);

  const loadPaymentMethods = useCallback(async () => {
    try {
      const items = await tenantConfigApi.getPaymentMethods({ includeDisabled: true });
      setPaymentMethods(items.map((method) => ({
        id: String(method.id),
        methodKey: method.methodKey,
        methodName: method.methodName,
        methodType: method.methodType,
        enabled: method.enabled,
        displayOrder: method.displayOrder,
      })));
    } catch (error) {
      console.error('Failed to load payment methods', error);
      setPaymentMethods([]);
    }
  }, []);

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
        setFullName(user?.fullName || '');
        setEmail(user?.email || '');
        setInitialProfile({
          fullName: user?.fullName || '',
          email: user?.email || '',
        });
      })
      .finally(() => setIsLoadingProfile(false));
  }, [user?.email, user?.fullName]);

  useEffect(() => {
    setOrgForm({
      currency: tenantConfig.currency,
      timezone: tenantConfig.timezone,
      language: tenantConfig.language,
      companyName: tenantConfig.companyName || tenantConfig.branding?.companyName || '',
      primaryColor: tenantConfig.primaryColor || tenantConfig.branding?.primaryColor || '',
      logoUrl: tenantConfig.logoUrl || tenantConfig.branding?.logoUrl || '',
      supportEmail: tenantConfig.supportEmail || '',
    });
  }, [tenantConfig]);

  useEffect(() => {
    loadApprovalRules();
  }, [loadApprovalRules]);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const refreshSettingsData = async () => {
    await Promise.all([refreshTenantConfig(), loadApprovalRules(), loadPaymentMethods()]);
  };

  const handleProfileSave = async () => {
    setIsSavingProfile(true);
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
      setIsSavingProfile(false);
    }
  };

  const handleOrgSave = async () => {
    setIsSavingOrg(true);
    try {
      const payload: TenantConfigUpdatePayload = {
        currency: orgForm.currency,
        timezone: orgForm.timezone,
        language: orgForm.language,
        companyName: orgForm.companyName || null,
        primaryColor: orgForm.primaryColor || null,
        logoUrl: orgForm.logoUrl || null,
        supportEmail: orgForm.supportEmail || null,
        branding: {
          companyName: orgForm.companyName || null,
          primaryColor: orgForm.primaryColor || null,
          logoUrl: orgForm.logoUrl || null,
        },
      };
      await updateTenantConfig(payload);
      await refreshTenantConfig();
      setIsEditingOrg(false);
      toast({ title: 'Уюм жөндөөлөрү сакталды' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Уюм жөндөөлөрүн сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSavingOrg(false);
    }
  };

  const openSourceDialog = (mode: DialogMode, source?: TenantLeadSource) => {
    setSourceDialogMode(mode);
    setSourceOriginalKey(source?.sourceKey ?? null);
    setSourceForm(source ? {
      sourceKey: source.sourceKey as typeof emptySourceForm.sourceKey,
      sourceName: source.sourceName,
      isDefault: !!source.isDefault,
    } : emptySourceForm);
    setSourceDialogOpen(true);
  };

  const handleSaveSource = async () => {
    setIsSavingSource(true);
    try {
      if (sourceDialogMode === 'create') {
        await tenantConfigApi.createLeadSource(sourceForm);
      } else if (sourceOriginalKey) {
        await tenantConfigApi.updateLeadSource(sourceOriginalKey, sourceForm);
      }
      await refreshTenantConfig();
      setSourceDialogOpen(false);
      toast({ title: 'Лид булагы сакталды' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Лид булагын сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSavingSource(false);
    }
  };

  const handleDeleteSource = async (sourceKey: string) => {
    if (!window.confirm('Бул лид булагын өчүрөсүзбү?')) return;
    try {
      await tenantConfigApi.deleteLeadSource(sourceKey);
      await refreshTenantConfig();
      toast({ title: 'Лид булагы өчүрүлдү' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Лид булагын өчүрүү ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    }
  };

  const openMethodDialog = (mode: DialogMode, method?: TenantPaymentMethod) => {
    setMethodDialogMode(mode);
    setMethodOriginalKey(method?.methodKey ?? null);
    setMethodForm(method ? {
      methodKey: method.methodKey,
      methodName: method.methodName,
      methodType: method.methodType,
      enabled: method.enabled,
      displayOrder: method.displayOrder,
    } : emptyMethodForm);
    setMethodDialogOpen(true);
  };

  const handleSaveMethod = async () => {
    setIsSavingMethod(true);
    try {
      if (methodDialogMode === 'create') {
        await tenantConfigApi.createPaymentMethod(methodForm);
      } else if (methodOriginalKey) {
        await tenantConfigApi.updatePaymentMethod(methodOriginalKey, methodForm);
      }
      await Promise.all([refreshTenantConfig(), loadPaymentMethods()]);
      setMethodDialogOpen(false);
      toast({ title: 'Төлөм ыкмасы сакталды' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Төлөм ыкмасын сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSavingMethod(false);
    }
  };

  const handleDeleteMethod = async (methodKey: string) => {
    if (!window.confirm('Бул төлөм ыкмасын өчүрөсүзбү?')) return;
    try {
      await tenantConfigApi.deletePaymentMethod(methodKey);
      await Promise.all([refreshTenantConfig(), loadPaymentMethods()]);
      toast({ title: 'Төлөм ыкмасы өчүрүлдү' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Төлөм ыкмасын өчүрүү ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    }
  };

  const openStatusDialog = (mode: DialogMode, status?: StatusConfig) => {
    setStatusDialogMode(mode);
    setStatusOriginalKey(status?.key ?? null);
    setStatusForm(status ? {
      statusKey: status.key as typeof emptyStatusForm.statusKey,
      statusName: status.label,
      statusOrder: status.order,
    } : emptyStatusForm);
    setStatusDialogOpen(true);
  };

  const handleSaveStatus = async () => {
    setIsSavingStatus(true);
    try {
      if (statusDialogMode === 'create') {
        await tenantConfigApi.createStatus({
          entityType: 'lead',
          statusKey: statusForm.statusKey,
          statusName: statusForm.statusName,
          statusOrder: statusForm.statusOrder,
        });
      } else if (statusOriginalKey) {
        await tenantConfigApi.updateStatus('lead', statusOriginalKey, {
          statusKey: statusForm.statusKey,
          statusName: statusForm.statusName,
          statusOrder: statusForm.statusOrder,
        });
      }
      await refreshTenantConfig();
      setStatusDialogOpen(false);
      toast({ title: 'Лид статусу сакталды' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Лид статусун сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleDeleteStatus = async (statusKey: string) => {
    if (!window.confirm('Бул лид статусун өчүрөсүзбү?')) return;
    try {
      await tenantConfigApi.deleteStatus('lead', statusKey);
      await refreshTenantConfig();
      toast({ title: 'Лид статусу өчүрүлдү' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Лид статусун өчүрүү ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    }
  };

  const openStageDialog = (mode: DialogMode, stage?: PipelineStageConfig) => {
    setStageDialogMode(mode);
    setStageOriginalKey(stage?.key ?? null);
    setStageForm(stage ? {
      stageKey: stage.key as typeof emptyStageForm.stageKey,
      stageName: stage.label,
      stageOrder: stage.order,
      isDefault: false,
    } : emptyStageForm);
    setStageDialogOpen(true);
  };

  const handleSaveStage = async () => {
    setIsSavingStage(true);
    try {
      if (stageDialogMode === 'create') {
        await tenantConfigApi.createPipelineStage(stageForm);
      } else if (stageOriginalKey) {
        await tenantConfigApi.updatePipelineStage(stageOriginalKey, {
          stageKey: stageForm.stageKey,
          stageName: stageForm.stageName,
          stageOrder: stageForm.stageOrder,
        });
      }
      await refreshTenantConfig();
      setStageDialogOpen(false);
      toast({ title: 'Пайплайн этабы сакталды' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Пайплайн этабын сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSavingStage(false);
    }
  };

  const handleDeleteStage = async (stageKey: string) => {
    if (!window.confirm('Бул пайплайн этабын өчүрөсүзбү?')) return;
    try {
      await tenantConfigApi.deletePipelineStage(stageKey);
      await refreshTenantConfig();
      toast({ title: 'Пайплайн этабы өчүрүлдү' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Пайплайн этабын өчүрүү ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    }
  };

  const openRoleDialog = (mode: DialogMode, role?: RoleConfig) => {
    setRoleDialogMode(mode);
    setRoleOriginalKey(role?.key ?? null);
    setRoleForm(role ? {
      roleKey: role.key,
      roleName: role.label,
      permissions: role.permissions || {},
    } : emptyRoleForm);
    setRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    setIsSavingRole(true);
    try {
      if (roleDialogMode === 'create') {
        await tenantConfigApi.createRole({
          roleKey: roleForm.roleKey,
          roleName: roleForm.roleName,
          permissions: roleForm.permissions,
        });
      } else if (roleOriginalKey) {
        await tenantConfigApi.updateRole(roleOriginalKey, {
          roleKey: roleForm.roleKey,
          roleName: roleForm.roleName,
          permissions: roleForm.permissions,
        });
      }
      await refreshTenantConfig();
      setRoleDialogOpen(false);
      toast({ title: 'Роль сакталды' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Ролду сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleDeleteRole = async (roleKey: string) => {
    if (!window.confirm('Бул ролду өчүрөсүзбү?')) return;
    try {
      await tenantConfigApi.deleteRole(roleKey);
      await refreshTenantConfig();
      toast({ title: 'Роль өчүрүлдү' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Ролду өчүрүү ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    }
  };

  const openApprovalDialog = (mode: DialogMode, rule?: TenantApprovalRuleResponse) => {
    const requiredRoles =
      rule?.requiredRoles && typeof rule.requiredRoles === 'object' && Array.isArray((rule.requiredRoles as { roles?: unknown[] }).roles)
        ? ((rule.requiredRoles as { roles: string[] }).roles)
        : [];
    setApprovalDialogMode(mode);
    setApprovalOriginalKey(rule?.ruleKey ?? null);
    setApprovalRuleForm(rule ? {
      ruleKey: rule.ruleKey,
      ruleName: rule.ruleName,
      entityType: 'enrollment',
      requiredRoles,
      enabled: rule.enabled,
    } : emptyApprovalRuleForm);
    setApprovalDialogOpen(true);
  };

  const handleSaveApprovalRule = async () => {
    setIsSavingApprovalRule(true);
    try {
      const payload = {
        ruleKey: approvalRuleForm.ruleKey,
        ruleName: approvalRuleForm.ruleName,
        entityType: 'enrollment',
        requiredRoles: { roles: approvalRuleForm.requiredRoles },
        enabled: approvalRuleForm.enabled,
      };
      if (approvalDialogMode === 'create') {
        await tenantConfigApi.createApprovalRule(payload);
      } else if (approvalOriginalKey) {
        await tenantConfigApi.updateApprovalRule(approvalOriginalKey, payload);
      }
      await loadApprovalRules();
      setApprovalDialogOpen(false);
      toast({ title: 'Бекитүү эрежеси сакталды' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Бекитүү эрежесин сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSavingApprovalRule(false);
    }
  };

  const handleDeleteApprovalRule = async (ruleKey: string) => {
    if (!window.confirm('Бул бекитүү эрежесин өчүрөсүзбү?')) return;
    try {
      await tenantConfigApi.deleteApprovalRule(ruleKey);
      await loadApprovalRules();
      toast({ title: 'Бекитүү эрежеси өчүрүлдү' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Бекитүү эрежесин өчүрүү ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.settings.title} />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="profile">Профиль</TabsTrigger>
          <TabsTrigger value="organization">Уюм</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="payments">Төлөмдөр</TabsTrigger>
          {customRolesEnabled && <TabsTrigger value="roles">Ролдор</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
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
                    {isEditingProfile ? <Input value={fullName} onChange={(e) => setFullName(e.target.value)} /> : <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{fullName || '—'}</div>}
                  </div>
                  <div className="space-y-2">
                    <Label>{ky.common.email}</Label>
                    {isEditingProfile ? <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /> : <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{email || '—'}</div>}
                  </div>
                  {isEditingProfile && (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setFullName(initialProfile.fullName);
                        setEmail(initialProfile.email);
                        setIsEditingProfile(false);
                      }} disabled={isSavingProfile}>
                        {ky.common.cancel}
                      </Button>
                      <Button onClick={handleProfileSave} disabled={isSavingProfile}>
                        {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {ky.common.save}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {isAiDraftsEnabled ? (
            <AiUsageSummary className="shadow-card border-border/50" />
          ) : null}
        </TabsContent>

        <TabsContent value="organization" className="space-y-6">
          <Card className="shadow-card border-border/50">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Уюм жана брендинг
              </CardTitle>
              {!isEditingOrg && (
                <Button variant="outline" onClick={() => setIsEditingOrg(true)}>
                  <PencilLine className="mr-2 h-4 w-4" />
                  {ky.common.edit}
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Компания аты</Label>
                {isEditingOrg ? <Input value={orgForm.companyName} onChange={(e) => setOrgForm((prev) => ({ ...prev, companyName: e.target.value }))} /> : <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{orgForm.companyName || '—'}</div>}
              </div>
              <div className="space-y-2">
                <Label>Support email</Label>
                {isEditingOrg ? <Input type="email" value={orgForm.supportEmail} onChange={(e) => setOrgForm((prev) => ({ ...prev, supportEmail: e.target.value }))} /> : <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{orgForm.supportEmail || '—'}</div>}
              </div>
              <div className="space-y-2">
                <Label>Лого URL</Label>
                {isEditingOrg ? <Input value={orgForm.logoUrl} onChange={(e) => setOrgForm((prev) => ({ ...prev, logoUrl: e.target.value }))} /> : <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm break-all">{orgForm.logoUrl || '—'}</div>}
              </div>
              <div className="space-y-2">
                <Label>Башкы түс</Label>
                {isEditingOrg ? (
                  <div className="flex gap-2">
                    <Input type="color" value={orgForm.primaryColor || '#000000'} onChange={(e) => setOrgForm((prev) => ({ ...prev, primaryColor: e.target.value }))} className="h-10 w-20 p-1" />
                    <Input value={orgForm.primaryColor} onChange={(e) => setOrgForm((prev) => ({ ...prev, primaryColor: e.target.value }))} placeholder="#000000" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {orgForm.primaryColor ? <div className="h-8 w-8 rounded border" style={{ backgroundColor: orgForm.primaryColor }} /> : null}
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{orgForm.primaryColor || '—'}</div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Валюта</Label>
                {isEditingOrg ? (
                  <Select value={orgForm.currency} onValueChange={(value) => setOrgForm((prev) => ({ ...prev, currency: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KGS">KGS - Кыргыз сом</SelectItem>
                      <SelectItem value="USD">USD - АКШ доллары</SelectItem>
                      <SelectItem value="EUR">EUR - Евро</SelectItem>
                      <SelectItem value="RUB">RUB - Орус рубли</SelectItem>
                    </SelectContent>
                  </Select>
                ) : <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{orgForm.currency}</div>}
              </div>
              <div className="space-y-2">
                <Label>Убакыт зонасы</Label>
                {isEditingOrg ? (
                  <Select value={orgForm.timezone} onValueChange={(value) => setOrgForm((prev) => ({ ...prev, timezone: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Bishkek">Asia/Bishkek</SelectItem>
                      <SelectItem value="Asia/Almaty">Asia/Almaty</SelectItem>
                      <SelectItem value="Europe/Moscow">Europe/Moscow</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                ) : <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{orgForm.timezone}</div>}
              </div>
              <div className="space-y-2">
                <Label>Тил</Label>
                {isEditingOrg ? (
                  <Select value={orgForm.language} onValueChange={(value) => setOrgForm((prev) => ({ ...prev, language: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ky">Кыргызча</SelectItem>
                      <SelectItem value="ru">Орусча</SelectItem>
                      <SelectItem value="en">Англисче</SelectItem>
                    </SelectContent>
                  </Select>
                ) : <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{orgForm.language}</div>}
              </div>
              {isEditingOrg && (
                <div className="md:col-span-2 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditingOrg(false)} disabled={isSavingOrg}>{ky.common.cancel}</Button>
                  <Button onClick={handleOrgSave} disabled={isSavingOrg}>
                    {isSavingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {ky.common.save}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ToggleLeft className="h-4 w-4" />
                Мүмкүнчүлүктөр
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ['lms_bridge_enabled', 'LMS байланышы', 'LMS интеграциясы'],
                ['trial_lessons_enabled', 'Сыноо сабактар', 'Сыноо сабактары'],
                ['retention_enabled', 'Студентти кармап калуу', 'Тутумду сактоо'],
                ['advanced_reports_enabled', 'Кеңейтилген отчеттор', 'Кеңейтрилген отчеттор'],
                ['payments_enabled', 'Төлөмдөр', 'Төлөм модулу'],
                ['telegram_notifications_enabled', 'Telegram билдирүүлөрү', 'Telegram интеграциясы'],
              ].map(([flagKey, title, description], index) => (
                <div key={flagKey}>
                  {index > 0 ? <Separator className="mb-4" /> : null}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                      {allowedFeatures?.[flagKey as keyof typeof allowedFeatures] === false && (
                        <p className="text-xs text-destructive mt-1">Бул функция сиздин тарифиңизде жеткиликтүү эмес</p>
                      )}
                      {(sources?.[flagKey as keyof typeof sources] === 'global' || sources?.[flagKey as keyof typeof sources] === 'plan') && (
                        <p className="text-xs text-muted-foreground mt-1">Бул функция платформа тарифи аркылуу башкарылат</p>
                      )}
                    </div>
                    <Switch checked={featureFlags[flagKey as keyof typeof featureFlags]} disabled className="opacity-50" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crm" className="space-y-6">
          <Card className="shadow-card border-border/50">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Лид булактары
              </CardTitle>
              <Button onClick={() => openSourceDialog('create')}>
                <Plus className="mr-2 h-4 w-4" />
                Кошуу
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {tenantConfig.leadSources.map((source) => (
                <div key={source.sourceKey} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{source.sourceName}</p>
                    <p className="text-xs text-muted-foreground">{source.sourceKey}{source.isDefault ? ' • default' : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openSourceDialog('edit', source)}>Түзөтүү</Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteSource(source.sourceKey)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="shadow-card border-border/50">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Лид статустары</CardTitle>
                <Button onClick={() => openStatusDialog('create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Кошуу
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {tenantConfig.leadStatuses.map((status) => (
                  <div key={status.key} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{status.label}</p>
                      <p className="text-xs text-muted-foreground">{status.key} • order {status.order}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openStatusDialog('edit', status)}>Түзөтүү</Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteStatus(status.key)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-card border-border/50">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Workflow className="h-4 w-4" />
                  Deal pipeline
                </CardTitle>
                <Button onClick={() => openStageDialog('create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Кошуу
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {tenantConfig.pipelineStages.map((stage) => (
                  <div key={stage.key} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{stage.label}</p>
                      <p className="text-xs text-muted-foreground">{stage.key} • order {stage.order}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openStageDialog('edit', stage)}>Түзөтүү</Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteStage(stage.key)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card className="shadow-card border-border/50">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Төлөм ыкмалары
              </CardTitle>
              <Button onClick={() => openMethodDialog('create')}>
                <Plus className="mr-2 h-4 w-4" />
                Кошуу
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.methodKey} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{method.methodName || method.methodKey}</p>
                    <p className="text-xs text-muted-foreground">{method.methodKey} • {method.methodType} • order {method.displayOrder}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={method.enabled} disabled />
                    <Button variant="outline" size="sm" onClick={() => openMethodDialog('edit', method)}>Түзөтүү</Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteMethod(method.methodKey)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Бекитүү эрежелери</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={loadApprovalRules}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Жаңыртуу
                </Button>
                <Button onClick={() => openApprovalDialog('create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Кошуу
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingApprovalRules ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : approvalRules.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Бекитүү эрежелери азырынча кошула элек</div>
              ) : approvalRules.map((rule) => {
                const roles =
                  rule.requiredRoles && typeof rule.requiredRoles === 'object' && Array.isArray((rule.requiredRoles as { roles?: unknown[] }).roles)
                    ? (rule.requiredRoles as { roles: string[] }).roles.join(', ')
                    : '—';
                return (
                  <div key={rule.ruleKey} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{rule.ruleName}</p>
                      <p className="text-xs text-muted-foreground">{rule.ruleKey} • каттоо auto-approve • roles: {roles}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={rule.enabled} disabled />
                      <Button variant="outline" size="sm" onClick={() => openApprovalDialog('edit', rule)}>Түзөтүү</Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteApprovalRule(rule.ruleKey)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {customRolesEnabled && (
          <TabsContent value="roles" className="space-y-6">
            <Card className="shadow-card border-border/50">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Ролдор жана уруксаттар
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tenantConfig.roles.map((role) => (
                  <div key={role.key} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{role.label}</p>
                      <p className="text-xs text-muted-foreground">{role.key} • {Object.values(role.permissions || {}).filter(Boolean).length} уруксат</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openRoleDialog('edit', role)}>Түзөтүү</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={sourceDialogOpen} onOpenChange={setSourceDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{sourceDialogMode === 'create' ? 'Лид булагын кошуу' : 'Лид булагын түзөтүү'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Техникалык ачкыч</Label>
              <Select value={sourceForm.sourceKey} onValueChange={(value) => setSourceForm((prev) => ({ ...prev, sourceKey: value as typeof emptySourceForm.sourceKey }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Аталышы</Label>
              <Input value={sourceForm.sourceName} onChange={(e) => setSourceForm((prev) => ({ ...prev, sourceName: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={sourceForm.isDefault} onCheckedChange={(checked) => setSourceForm((prev) => ({ ...prev, isDefault: checked }))} />
              <Label>Default</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSourceDialogOpen(false)}>{ky.common.cancel}</Button>
            <Button onClick={handleSaveSource} disabled={isSavingSource || !sourceForm.sourceName.trim()}>
              {isSavingSource && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={methodDialogOpen} onOpenChange={setMethodDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{methodDialogMode === 'create' ? 'Төлөм ыкмасын кошуу' : 'Төлөм ыкмасын түзөтүү'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ачкыч</Label>
              <Input value={methodForm.methodKey} onChange={(e) => setMethodForm((prev) => ({ ...prev, methodKey: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Аталышы</Label>
              <Input value={methodForm.methodName} onChange={(e) => setMethodForm((prev) => ({ ...prev, methodName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Түрү</Label>
              <Select value={methodForm.methodType} onValueChange={(value) => setMethodForm((prev) => ({ ...prev, methodType: value as TenantPaymentMethod['methodType'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Тартип номери</Label>
              <Input type="number" value={methodForm.displayOrder} onChange={(e) => setMethodForm((prev) => ({ ...prev, displayOrder: Number(e.target.value) || 0 }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={methodForm.enabled} onCheckedChange={(checked) => setMethodForm((prev) => ({ ...prev, enabled: checked }))} />
              <Label>Иштейт</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMethodDialogOpen(false)}>{ky.common.cancel}</Button>
            <Button onClick={handleSaveMethod} disabled={isSavingMethod || !methodForm.methodKey.trim() || !methodForm.methodName.trim()}>
              {isSavingMethod && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{statusDialogMode === 'create' ? 'Лид статусун кошуу' : 'Лид статусун түзөтүү'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ачкыч</Label>
              <Select value={statusForm.statusKey} onValueChange={(value) => setStatusForm((prev) => ({ ...prev, statusKey: value as typeof emptyStatusForm.statusKey }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUS_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Аталышы</Label>
              <Input value={statusForm.statusName} onChange={(e) => setStatusForm((prev) => ({ ...prev, statusName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Тартип номери</Label>
              <Input type="number" value={statusForm.statusOrder} onChange={(e) => setStatusForm((prev) => ({ ...prev, statusOrder: Number(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>{ky.common.cancel}</Button>
            <Button onClick={handleSaveStatus} disabled={isSavingStatus || !statusForm.statusName.trim()}>
              {isSavingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{stageDialogMode === 'create' ? 'Пайплайн этабын кошуу' : 'Пайплайн этабын түзөтүү'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ачкыч</Label>
              <Select value={stageForm.stageKey} onValueChange={(value) => setStageForm((prev) => ({ ...prev, stageKey: value as typeof emptyStageForm.stageKey }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEAL_PIPELINE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Аталышы</Label>
              <Input value={stageForm.stageName} onChange={(e) => setStageForm((prev) => ({ ...prev, stageName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Тартип номери</Label>
              <Input type="number" value={stageForm.stageOrder} onChange={(e) => setStageForm((prev) => ({ ...prev, stageOrder: Number(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageDialogOpen(false)}>{ky.common.cancel}</Button>
            <Button onClick={handleSaveStage} disabled={isSavingStage || !stageForm.stageName.trim()}>
              {isSavingStage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Роль уруксаттарын түзөтүү</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Ачкыч</Label>
                <Input value={roleForm.roleKey} readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label>Аталышы</Label>
                <Input value={roleForm.roleName} readOnly disabled />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Уруктар</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {PERMISSION_OPTIONS.map((permission) => (
                  <label key={permission.key} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                    <Checkbox
                      checked={!!roleForm.permissions[permission.key]}
                      onCheckedChange={(checked) => setRoleForm((prev) => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          [permission.key]: checked === true,
                        },
                      }))}
                    />
                    <span>{permission.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>{ky.common.cancel}</Button>
            <Button onClick={handleSaveRole} disabled={isSavingRole || !roleForm.roleKey.trim() || !roleForm.roleName.trim()}>
              {isSavingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{approvalDialogMode === 'create' ? 'Бекитүү эрежесин кошуу' : 'Бекитүү эрежесин түзөтүү'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Ачкыч</Label>
                <Input value={approvalRuleForm.ruleKey} onChange={(e) => setApprovalRuleForm((prev) => ({ ...prev, ruleKey: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Аталышы</Label>
                <Input value={approvalRuleForm.ruleName} onChange={(e) => setApprovalRuleForm((prev) => ({ ...prev, ruleName: e.target.value }))} />
              </div>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Бул эрежелер азыр каттоо суроо-талаптарын auto-approve кылуу үчүн гана иштейт.
            </div>
            <div className="space-y-2">
              <Label>Уруксат берилген ролдор</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {roleOptions.map((role) => (
                  <label key={role.key} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                    <Checkbox
                      checked={approvalRuleForm.requiredRoles.includes(role.key)}
                      onCheckedChange={(checked) => setApprovalRuleForm((prev) => ({
                        ...prev,
                        requiredRoles: checked === true
                          ? [...prev.requiredRoles, role.key]
                          : prev.requiredRoles.filter((item) => item !== role.key),
                      }))}
                    />
                    <span>{role.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={approvalRuleForm.enabled} onCheckedChange={(checked) => setApprovalRuleForm((prev) => ({ ...prev, enabled: checked }))} />
              <Label>Иштейт</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>{ky.common.cancel}</Button>
            <Button onClick={handleSaveApprovalRule} disabled={isSavingApprovalRule || !approvalRuleForm.ruleKey.trim() || !approvalRuleForm.ruleName.trim()}>
              {isSavingApprovalRule && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
