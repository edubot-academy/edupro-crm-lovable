import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { PageError, PageHeader, PageLoading } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatusBadge, getLeadStatusVariant } from '@/components/StatusBadge';
import { ky } from '@/lib/i18n';
import { ArrowLeft, Phone, Mail, Tag, User, MessageSquare, Loader2, Save, Calendar, Sparkles, MoreHorizontal } from 'lucide-react';
import { leadsApi, usersApi } from '@/api/modules';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { useLmsBridge } from '@/components/lms/LmsBridgeProvider';
import { useFeatureFlags } from '@/components/core/FeatureFlagProvider';
import { useTenantConfig } from '@/components/core/TenantConfigProvider';
import type { AssignableUser, Lead, LeadSource } from '@/types';
import type { LmsCourseType } from '@/types/lms';
import { getFriendlyError } from '@/lib/error-messages';
import { ScheduleTimelineEventDialog } from '@/components/ScheduleTimelineEventDialog';
import { ScheduledTimelineEventsCard } from '@/components/ScheduledTimelineEventsCard';
import { LeadCourseInterest } from '@/components/lms/LeadCourseInterest';
import { LmsCourseContextFields } from '@/components/lms/LmsCourseContextFields';
import { useLmsCourses, useLmsGroups } from '@/hooks/use-lms';
import { leadInterestLevelLabels } from '@/lib/lms-formatting';
import { AiDraftModal } from '@/components/ai/AiDraftModal';
import { AiDraftHandoffCard } from '@/components/ai/AiDraftHandoffCard';
import { PriorityIndicator, PriorityScore, RiskScore } from '@/components/ai/PriorityIndicator';
import { NextBestActionCard, NextBestAction } from '@/components/ai/NextBestActionCard';
import { CommunicationSummary, CommunicationSummary as CommunicationSummaryType } from '@/components/ai/CommunicationSummary';
import { StructuredSuggestionReview, SuggestionSet, FieldSuggestion } from '@/components/ai/StructuredSuggestionReview';
import { AiFeedbackControls } from '@/components/ai/AiFeedbackControls';
import { aiApi, type LeadPriorityScoreResult, type NextBestActionResult, type RiskScoreResult, type TimelineSummaryResult, type ExtractionResult, type FeedbackRequest } from '@/api/ai';

type LeadDetailFormState = {
  fullName: string;
  phone: string;
  email: string;
  source: LeadSource | '';
  status: string;
  assignedManagerId: string;
  notes: string;
  interestedCourseId: string;
  interestedGroupId: string;
  courseType: LmsCourseType | '';
  interestLevel: 'low' | 'medium' | 'high' | '';
};

// Helper functions for extraction mapping
function getFieldLabel(field: string): string {
  const fieldLabels: Record<string, string> = {
    preferredSchedule: 'Ыңгайлуу убакыт',
    courseInterest: 'Кызыккан курс',
    budgetSignal: 'Бюджет белгиси',
    objections: 'Каршылыктар',
    otherNotes: 'Кошумча белгилер',
  };
  return fieldLabels[field] || field;
}

function getCurrentFieldValue(field: string, item: Lead): string {
  switch (field) {
    case 'courseInterest':
      return 'interestedCourseId' in item ? (item.interestedCourseId || '') : '';
    case 'otherNotes':
      return item.notes || '';
    default:
      return '';
  }
}

function inferFieldType(field: string): FieldSuggestion['fieldType'] {
  return field === 'objections' || field === 'otherNotes' ? 'textarea' : 'text';
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureFlags();
  const { tenantConfig } = useTenantConfig();
  const { canAssignLeads } = useRolePermissions();
  const { isLmsBridgeEnabled } = useLmsBridge();
  const isAiDraftsEnabled =
    isFeatureEnabled('ai_assist_enabled') && isFeatureEnabled('ai_followup_drafts_enabled');
  const isAiOperationalIntelligenceEnabled =
    isFeatureEnabled('ai_assist_enabled') && isFeatureEnabled('ai_operator_guidance_enabled');
  const canAssignToSales = canAssignLeads();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isAiDraftOpen, setIsAiDraftOpen] = useState(false);
  const [aiDraftMessage, setAiDraftMessage] = useState('');
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [managers, setManagers] = useState<AssignableUser[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);

  // Release 2 - Operational Intelligence State
  const [priorityScore, setPriorityScore] = useState<PriorityScore | null>(null);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [nextBestAction, setNextBestAction] = useState<NextBestAction | null>(null);
  const [communicationSummary, setCommunicationSummary] = useState<CommunicationSummaryType | null>(null);
  const [extractionSuggestions, setExtractionSuggestions] = useState<SuggestionSet | null>(null);
  const [isSuggestionReviewOpen, setIsSuggestionReviewOpen] = useState(false);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [intelligenceError, setIntelligenceError] = useState<string | null>(null);
  const [intelligenceRefreshKey, setIntelligenceRefreshKey] = useState(0);

  // Use tenant-configured lead sources if available, otherwise use hardcoded sources
  const leadSourceOptions = useMemo(() => {
    if (tenantConfig.leadSources && tenantConfig.leadSources.length > 0) {
      return tenantConfig.leadSources.map(source => ({
        value: source.sourceKey as LeadSource,
        label: source.sourceName,
      }));
    }
    // Fallback to hardcoded sources
    return Object.entries(ky.leadSource).map(([value, label]) => ({
      value: value as LeadSource,
      label,
    }));
  }, [tenantConfig.leadSources]);

  // Use tenant-configured lead statuses if available, otherwise use hardcoded statuses
  const leadStatusOptions = useMemo(() => {
    if (tenantConfig.leadStatuses && tenantConfig.leadStatuses.length > 0) {
      return tenantConfig.leadStatuses.map(status => ({
        value: status.key,
        label: status.label,
      }));
    }
    // Fallback to hardcoded statuses
    return [
      { value: 'new', label: 'New' },
      { value: 'contacted', label: 'Contacted' },
      { value: 'interested', label: 'Interested' },
      { value: 'no_response', label: 'No Response' },
      { value: 'lost', label: 'Lost' },
    ];
  }, [tenantConfig.leadStatuses]);

  const [form, setForm] = useState<LeadDetailFormState>({
    fullName: '',
    phone: '',
    email: '',
    source: '' as LeadSource | '',
    status: 'new',
    assignedManagerId: '',
    notes: '',
    interestedCourseId: '',
    interestedGroupId: '',
    courseType: '',
    interestLevel: '',
  });

  const { data: coursesData } = useLmsCourses(isLmsBridgeEnabled ? { isActive: 'true' } : undefined);
  const courses = coursesData?.items ?? [];
  const selectedLeadCourseId = form.interestedCourseId || lead?.interestedCourseId || '';
  const selectedLeadCourse = courses.find((course) => course.id === selectedLeadCourseId) ?? null;
  const { data: groupsData } = useLmsGroups(
    isLmsBridgeEnabled && selectedLeadCourseId && selectedLeadCourse?.courseType !== 'video'
      ? { courseId: selectedLeadCourseId, limit: 100 }
      : undefined,
  );
  const groups = groupsData?.items ?? [];
  const leadCourseName = courses.find((course) => course.id === lead?.interestedCourseId)?.name;
  const leadGroupName = groups.find((group) => group.id === lead?.interestedGroupId)?.name;

  useEffect(() => {
    if (!id || id === 'new') return;
    const numId = Number(id);
    if (isNaN(numId)) { setError('Лид табылган жок'); setIsLoading(false); return; }
    setIsLoading(true);
    leadsApi.get(numId)
      .then(setLead)
      .catch(() => setError('Лид табылган жок'))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!lead) return;
    setForm({
      fullName: lead.fullName ?? '',
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      source: lead.source,
      status: lead.status,
      assignedManagerId: lead.assignedManager?.id ? String(lead.assignedManager.id) : '',
      notes: lead.notes || '',
      interestedCourseId: lead.interestedCourseId || '',
      interestedGroupId: lead.interestedGroupId || '',
      courseType: lead.courseType || '',
      interestLevel: lead.interestLevel || '',
    });
  }, [lead]);

  useEffect(() => {
    if (!isEditOpen) return;
    if (!canAssignToSales) {
      setManagers(user ? [{ id: user.id, fullName: user.fullName || user.email, email: user.email, role: user.role }] : []);
      setManagersLoading(false);
      return;
    }
    setManagersLoading(true);
    usersApi.assignables({ roles: 'sales' })
      .then((items) => {
        if (!user) {
          setManagers(items);
          return;
        }

        const hasCurrentUser = items.some((item) => item.id === user.id);
        const nextManagers = hasCurrentUser
          ? items
          : [{ id: user.id, fullName: user.fullName || user.email, email: user.email, role: user.role }, ...items];
        setManagers(nextManagers);
      })
      .catch(() => setManagers([]))
      .finally(() => setManagersLoading(false));
  }, [isEditOpen, canAssignToSales, user]);

  // Release 2 - Load operational intelligence data
  useEffect(() => {
    if (!lead || !isAiOperationalIntelligenceEnabled) return;

    const loadIntelligenceData = async () => {
      setIntelligenceLoading(true);
      setIntelligenceError(null);

      try {
        const leadId = Number(lead.id);

        // Load priority score
        try {
          const priorityData = await aiApi.getPriorityScore('lead', leadId);
          setPriorityScore({
            score: priorityData.score.score,
            level: priorityData.score.tier,
            factors: priorityData.score.breakdown,
            explanation: `Priority: ${priorityData.score.score}/${priorityData.score.maxScore}`,
            maxScore: priorityData.score.maxScore,
            tier: priorityData.score.tier,
          });
        } catch (err) {
          console.warn('Failed to load priority score:', err);
        }

        // Load risk score
        try {
          const riskData = await aiApi.getRiskScore('lead', leadId);
          setRiskScore({
            risk: riskData.risk,
            reasons: riskData.reasons,
            score: riskData.score,
          });
        } catch (err) {
          console.warn('Failed to load risk score:', err);
        }

        // Load next best action
        try {
          const actionData = await aiApi.getNextBestAction('lead', leadId);
          setNextBestAction(actionData);
        } catch (err) {
          console.warn('Failed to load next best action:', err);
        }

        // Load communication summary
        try {
          const summaryData = await aiApi.getTimelineSummary('lead', leadId);
          setCommunicationSummary(summaryData);
        } catch (err) {
          console.warn('Failed to load communication summary:', err);
        }

        // Load extraction suggestions
        try {
          // Extract text from lead notes for analysis
          const textToExtract = lead.notes || '';
          if (textToExtract.trim()) {
            const extractionData = await aiApi.getExtraction('lead', leadId, textToExtract);
            const rawSuggestions = [
              { field: 'preferredSchedule', value: extractionData.preferredSchedule },
              { field: 'courseInterest', value: extractionData.courseInterest },
              { field: 'budgetSignal', value: extractionData.budgetSignal },
              { field: 'objections', value: extractionData.objections.length > 0 ? extractionData.objections.join(', ') : null },
              { field: 'otherNotes', value: extractionData.otherNotes },
            ].filter((item): item is { field: string; value: string } => Boolean(item.value && item.value.trim()));

            if (rawSuggestions.length > 0) {
              const suggestions: FieldSuggestion[] = rawSuggestions.map((field) => ({
                field: field.field,
                fieldLabel: getFieldLabel(field.field),
                currentValue: getCurrentFieldValue(field.field, lead),
                suggestedValue: field.value,
                confidence: extractionData.confidence,
                reasoning: `Жазуудан ${Math.round(extractionData.confidence * 100)}% ишеним менен алынган`,
                fieldType: inferFieldType(field.field),
              }));

              setExtractionSuggestions({
                id: `extraction-${lead.id}`,
                targetType: 'lead',
                targetId: leadId,
                suggestions,
                overallConfidence: extractionData.confidence,
                source: 'ai_extraction',
                generatedAt: new Date().toISOString(),
                aiRequestId: extractionData.aiRequestId || null,
              });
            }
          }
        } catch (err) {
          console.warn('Failed to load extraction suggestions:', err);
        }
      } catch (err) {
        setIntelligenceError('Операциялык интеллект маалыматын жүктөөдө ката кетти');
      } finally {
        setIntelligenceLoading(false);
      }
    };

    loadIntelligenceData();
  }, [lead, isAiOperationalIntelligenceEnabled, intelligenceRefreshKey]);

  // Handle AI feedback submission
  const handleAiFeedback = async (feedback: FeedbackRequest) => {
    await aiApi.submitFeedback(feedback);
  };

  // Handle next best action execution
  const handleNextBestAction = (action: NextBestAction) => {
    switch (action.action) {
      case 'call':
        if (lead.phone) {
          window.location.href = `tel:${lead.phone}`;
        } else {
          toast({
            title: 'Телефон номери жок',
            description: 'Бул лидде телефон номери жазылган эмес',
            variant: 'destructive',
          });
        }
        break;
      case 'whatsapp':
        setIsAiDraftOpen(true);
        break;
      case 'schedule_trial':
        setIsScheduleOpen(true);
        break;
      case 'send_reminder':
        setIsAiDraftOpen(true);
        break;
      case 'follow_up':
        setIsAiDraftOpen(true);
        break;
      case 'escalate':
        toast({
          title: 'Жогорку деңгээлге өткөрүү',
          description: 'Бул лид жогорку деңгээлге өткөрүлдү',
        });
        break;
      default:
        toast({
          title: 'Аракет аткарылды',
          description: `${action.action} аракети аткарылды`,
        });
    }
  };

  // Handle suggestion application
  const handleApplySuggestions = async (acceptedSuggestions: { field: string; value: string }[]) => {
    if (!lead) return;

    try {
      // Update form with accepted suggestions
      const updatedForm = { ...form };

      acceptedSuggestions.forEach(suggestion => {
        switch (suggestion.field) {
          case 'fullName':
            updatedForm.fullName = suggestion.value;
            break;
          case 'phone':
            updatedForm.phone = suggestion.value;
            break;
          case 'email':
            updatedForm.email = suggestion.value;
            break;
          case 'notes':
            updatedForm.notes = suggestion.value;
            break;
          // Add more field mappings as needed
        }
      });

      setForm(updatedForm);

      // Optionally save immediately
      // await handleSave();

      toast({
        title: 'Сунуштар колдонулду',
        description: `${acceptedSuggestions.length} өзгөртүү колдонулду`,
      });
    } catch (error) {
      toast({
        title: 'Ката кетти',
        description: 'Сунуштарды колдонууда ката кетти',
        variant: 'destructive',
      });
    }
  };

  // Refresh intelligence data
  const refreshIntelligenceData = () => {
    if (lead && isAiOperationalIntelligenceEnabled) {
      setIntelligenceError(null);
      setIntelligenceRefreshKey((current) => current + 1);
    }
  };

  const resetEditForm = () => {
    if (!lead) {
      setIsEditOpen(false);
      return;
    }

    setForm({
      fullName: lead.fullName ?? '',
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      source: lead.source,
      status: lead.status,
      assignedManagerId: lead.assignedManager?.id ? String(lead.assignedManager.id) : '',
      notes: lead.notes || '',
      interestedCourseId: lead.interestedCourseId || '',
      interestedGroupId: lead.interestedGroupId || '',
      courseType: lead.courseType || '',
      interestLevel: lead.interestLevel || '',
    });
    setIsEditOpen(false);
  };

  const handleUseDraft = (message: string) => {
    setAiDraftMessage(message);
    toast({
      title: 'Сунуш кошулду',
      description: 'Сунушталган жооп төмөнкү талаага жайгаштырылды.',
    });
  };

  const handleSave = async () => {
    if (!lead || !form.fullName || !form.phone || !form.source) return;

    setIsSaving(true);
    try {
      const updatedLead = await leadsApi.update(lead.id, {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        source: form.source,
        status: form.status,
        assignedManagerId: canAssignToSales
          ? (form.assignedManagerId ? Number(form.assignedManagerId) : null)
          : undefined,
        notes: form.notes || undefined,
        interestedCourseId: isLmsBridgeEnabled ? form.interestedCourseId : undefined,
        interestedGroupId: isLmsBridgeEnabled ? form.interestedGroupId : undefined,
        courseType: isLmsBridgeEnabled ? (form.courseType || null) : undefined,
        interestLevel: isLmsBridgeEnabled ? (form.interestLevel || null) : undefined,
      });
      setLead(updatedLead);
      setIsEditOpen(false);
      toast({ title: 'Лид ийгиликтүү өзгөртүлдү' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Лидди сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToContact = async () => {
    if (!lead) return;

    setIsConverting(true);
    try {
      const result = await leadsApi.convertToContact(lead.id);
      setLead((prev) => (prev ? { ...prev, contactId: result.contact.id } : prev));
      toast({ title: 'Лид ийгиликтүү байланышка айландырылды' });
      navigate(`/contacts/${result.contact.id}`);
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Лидди байланышка айландыруу ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsConverting(false);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (error || !lead) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Лид"
          actions={
            <Button variant="outline" onClick={() => navigate('/leads')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {ky.common.back}
            </Button>
          }
        />
        <PageError message={error || 'Лид табылган жок'} onRetry={() => navigate('/leads')} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={lead.fullName}
        actions={
          <div className="flex w-full items-center justify-between gap-2 sm:flex-wrap sm:justify-end">
            <div className="flex items-center gap-2 sm:hidden">
              <Button className="h-9" variant="outline" onClick={() => navigate('/leads')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {ky.common.back}
              </Button>
              <Button className="h-9" variant="outline" onClick={() => setIsEditOpen(true)}>
                {ky.common.edit}
              </Button>
              {lead.contactId ? (
                <Button
                  className="h-9"
                  onClick={() => {
                    const params = new URLSearchParams({
                      create: '1',
                      leadId: String(lead.id),
                    });
                    if (lead.contactId) params.set('contactId', String(lead.contactId));
                    if (lead.interestedCourseId) params.set('courseId', lead.interestedCourseId);
                    if (lead.interestedGroupId) params.set('groupId', lead.interestedGroupId);
                    if (lead.courseType) params.set('courseType', lead.courseType);
                    if (leadCourseName) params.set('courseName', leadCourseName);
                    if (leadGroupName) params.set('groupName', leadGroupName);
                    navigate(`/deals?${params.toString()}`);
                  }}
                >
                  Келишим түзүү
                </Button>
              ) : null}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-9 w-9 sm:hidden" variant="outline" size="icon" aria-label="More actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {isAiDraftsEnabled ? (
                  <DropdownMenuItem onClick={() => setIsAiDraftOpen(true)}>
                    AI жооп сунушу
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={() => setIsScheduleOpen(true)}>
                  Пландоо
                </DropdownMenuItem>
                {!lead.contactId ? (
                  <DropdownMenuItem onClick={handleConvertToContact} disabled={isConverting}>
                    {ky.leads.convertToContact}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden sm:flex sm:flex-wrap sm:justify-end sm:gap-2">
              <Button className="h-9" variant="outline" onClick={() => navigate('/leads')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {ky.common.back}
              </Button>
              <Button className="h-9" variant="outline" onClick={() => setIsEditOpen(true)}>
                {ky.common.edit}
              </Button>
              {isAiDraftsEnabled ? (
                <Button className="h-9" variant="outline" onClick={() => setIsAiDraftOpen(true)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI жооп сунушу
                </Button>
              ) : null}
              <Button
                className="h-9"
                variant="outline"
                onClick={() => {
                  const params = new URLSearchParams({
                    create: '1',
                    leadId: String(lead.id),
                  });
                  if (lead.contactId) params.set('contactId', String(lead.contactId));
                  if (lead.interestedCourseId) params.set('courseId', lead.interestedCourseId);
                  if (lead.interestedGroupId) params.set('groupId', lead.interestedGroupId);
                  if (lead.courseType) params.set('courseType', lead.courseType);
                  if (leadCourseName) params.set('courseName', leadCourseName);
                  if (leadGroupName) params.set('groupName', leadGroupName);
                  navigate(`/deals?${params.toString()}`);
                }}
                disabled={!lead.contactId}
              >
                Келишим түзүү
              </Button>
              <Button className="h-9" variant="outline" onClick={() => setIsScheduleOpen(true)}>
                <Calendar className="mr-2 h-4 w-4" />
                Пландоо
              </Button>
              <Button className="h-9" onClick={handleConvertToContact} disabled={isConverting || !!lead.contactId}>
                {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {lead.contactId ? 'Байланышка айланган' : ky.leads.convertToContact}
              </Button>
            </div>
          </div>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {aiDraftMessage ? (
          <AiDraftHandoffCard
            value={aiDraftMessage}
            onChange={setAiDraftMessage}
            onClear={() => setAiDraftMessage('')}
            className="lg:col-span-3"
          />
        ) : null}

        <Card className="shadow-card border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Лид маалыматы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={User} label={ky.common.name} value={lead.fullName} />
              <InfoRow icon={Phone} label={ky.common.phone} value={lead.phone} />
              <InfoRow icon={Mail} label={ky.common.email} value={lead.email} />
              <InfoRow icon={MessageSquare} label={ky.leads.source} value={ky.leadSource[lead.source]} />
              <InfoRow icon={User} label={ky.leads.assignedManager} value={lead.assignedManager?.fullName || '—'} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{ky.common.status}</p>
              <StatusBadge variant={getLeadStatusVariant(lead.status)} dot>{leadStatusOptions.find(opt => opt.value === lead.status)?.label || lead.status}</StatusBadge>
            </div>
          </CardContent>
        </Card>

        {/* Release 2 - Operational Intelligence Components */}
        {isAiOperationalIntelligenceEnabled && (
          <div className="space-y-4 lg:col-span-3">
            <div className="rounded-2xl border border-orange-200/70 bg-orange-50/70 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-2 shadow-sm">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                </div>
                <div className="min-w-0 space-y-1">
                  <h2 className="text-base font-semibold text-foreground">AI жардамчысы</h2>
                  <p className="text-sm text-muted-foreground">
                    Бул блок приоритетти, тобокелдикти жана кийинки кадамды тез түшүнүүгө жардам берет. Сунуштар маалыматтык мүнөздө.
                  </p>
                </div>
              </div>
            </div>

            {(priorityScore || riskScore) && (
              <Card className="shadow-card border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Приоритет жана тобокелдик</CardTitle>
                </CardHeader>
                <CardContent>
                  <PriorityIndicator
                    priority={priorityScore}
                    risk={riskScore}
                    showDetails={true}
                  />
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-4">
                <NextBestActionCard
                  action={nextBestAction}
                  targetType="lead"
                  targetId={Number(lead.id)}
                  onActionExecute={handleNextBestAction}
                  loading={intelligenceLoading}
                  error={intelligenceError}
                />
                {nextBestAction?.aiRequestId && (
                  <AiFeedbackControls
                    targetType="lead"
                    targetId={Number(lead.id)}
                    feature="next_best_action"
                    aiRequestId={nextBestAction.aiRequestId}
                    disabled={intelligenceLoading}
                    onFeedbackSubmit={handleAiFeedback}
                  />
                )}
              </div>

              <div className="space-y-4">
                {communicationSummary && (
                  <Card className="shadow-card border-border/50">
                    <CardContent className="space-y-4 p-0">
                      <CommunicationSummary
                        summary={communicationSummary}
                        targetType="lead"
                        targetId={Number(lead.id)}
                        onRefresh={refreshIntelligenceData}
                        loading={intelligenceLoading}
                      />
                      {communicationSummary.aiRequestId && (
                        <div className="border-t px-6 pb-6 pt-4">
                          <p className="mb-3 text-sm font-medium text-foreground">Бул жыйынтык канчалык пайдалуу болду?</p>
                          <AiFeedbackControls
                            targetType="lead"
                            targetId={Number(lead.id)}
                            feature="timeline_summary"
                            aiRequestId={communicationSummary.aiRequestId}
                            disabled={intelligenceLoading}
                            onFeedbackSubmit={handleAiFeedback}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {extractionSuggestions && (
                  <Card className="shadow-card border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">Маалыматка сунушталган толуктоолор</CardTitle>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {extractionSuggestions.suggestions.length} талаа карап чыгууга даяр.
                          </p>
                        </div>
                        <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-800">
                          {Math.round(extractionSuggestions.overallConfidence * 100)}% ишеним
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                        AI сунуштаган талааларды текшерип, керектүүлөрүн гана колдонуңуз.
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button onClick={() => setIsSuggestionReviewOpen(true)} variant="outline" size="sm">
                          Сунуштарды кароо
                        </Button>
                        {extractionSuggestions.aiRequestId && (
                          <div className="min-w-full border-t pt-4 sm:min-w-0 sm:border-t-0 sm:pt-0">
                            <AiFeedbackControls
                              targetType="lead"
                              targetId={Number(lead.id)}
                              feature="extraction"
                              aiRequestId={extractionSuggestions.aiRequestId}
                              disabled={intelligenceLoading}
                              onFeedbackSubmit={handleAiFeedback}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {isLmsBridgeEnabled && (
          <LeadCourseInterest
            interestedCourseId={lead.interestedCourseId || undefined}
            interestedGroupId={lead.interestedGroupId || undefined}
            courseType={lead.courseType || undefined}
            interestLevel={lead.interestLevel || undefined}
            courseName={leadCourseName}
            groupName={leadGroupName}
          />
        )}

        <div className="space-y-4 lg:col-span-1">
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">{ky.common.tags}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(lead.tags || []).map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    <Tag className="h-3 w-3" />{tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">{ky.common.notes}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{lead.notes || 'Эскертүүлөр жок'}</p>
            </CardContent>
          </Card>
          <ScheduledTimelineEventsCard
            leadId={lead.id}
            contactId={lead.contactId || undefined}
            refreshKey={scheduleRefreshKey}
          />
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={(open) => {
        if (!open) {
          resetEditForm();
          return;
        }
        setIsEditOpen(open);
      }}>
        <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{ky.common.edit}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{ky.common.name} *</Label>
                <Input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{ky.common.phone} *</Label>
                <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{ky.common.email}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{ky.leads.source} *</Label>
                <Select value={form.source} onValueChange={(value) => setForm((prev) => ({ ...prev, source: value as LeadSource }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Булак тандаңыз" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSourceOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{ky.common.status}</Label>
                <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={ky.common.status} />
                  </SelectTrigger>
                  <SelectContent>
                    {leadStatusOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{ky.leads.assignedManager}</Label>
                {canAssignToSales ? (
                  <Select value={form.assignedManagerId || '__none__'} onValueChange={(value) => setForm((prev) => ({ ...prev, assignedManagerId: value === '__none__' ? '' : value }))} disabled={managersLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={managersLoading ? 'Жүктөлүүдө...' : 'Жооптуу sales тандаңыз'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Тандалган эмес</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={String(manager.id)}>
                          {manager.id === user?.id ? `${manager.fullName} (Мен)` : manager.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                    {lead.assignedManager?.fullName || 'Owner дайындалган эмес'}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{ky.common.notes}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} />
            </div>
            {isLmsBridgeEnabled ? (
              <>
                <LmsCourseContextFields
                  value={{
                    lmsCourseId: form.interestedCourseId,
                    lmsGroupId: form.interestedGroupId,
                    courseType: form.courseType,
                    courseNameSnapshot: '',
                    groupNameSnapshot: '',
                  }}
                  onChange={(next) => setForm((prev) => ({
                    ...prev,
                    interestedCourseId: next.lmsCourseId,
                    interestedGroupId: next.lmsGroupId,
                    courseType: next.courseType,
                  }))}
                  courseLabel="Кызыккан курс"
                  groupLabel="Кызыккан группа"
                  description="Бул тандоо кийинки келишимди алдын ала толтурууга колдонулат. Кааласаңыз бош калтырыңыз."
                />
                <div className="space-y-2">
                  <Label>Кызыгуу деңгээли</Label>
                  <Select
                    value={form.interestLevel || '__none__'}
                    onValueChange={(value) => setForm((prev) => ({
                      ...prev,
                      interestLevel: value === '__none__' ? '' : (value as LeadDetailFormState['interestLevel']),
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Кызыгуу деңгээлин тандаңыз" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Тандалган эмес</SelectItem>
                      <SelectItem value="low">{leadInterestLevelLabels.low}</SelectItem>
                      <SelectItem value="medium">{leadInterestLevelLabels.medium}</SelectItem>
                      <SelectItem value="high">{leadInterestLevelLabels.high}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetEditForm} disabled={isSaving}>
              {ky.common.cancel}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.fullName || !form.phone || !form.source}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isSaving && <Save className="mr-2 h-4 w-4" />}
              {ky.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {isScheduleOpen && (
        <ScheduleTimelineEventDialog
          open={isScheduleOpen}
          onOpenChange={setIsScheduleOpen}
          defaultType="call"
          leadId={lead.id}
          contactId={lead.contactId || undefined}
          onSaved={() => setScheduleRefreshKey((prev) => prev + 1)}
        />
      )}
      {isAiDraftsEnabled ? (
        <AiDraftModal
          open={isAiDraftOpen}
          onOpenChange={setIsAiDraftOpen}
          targetType="lead"
          targetId={lead.id}
          targetName={lead.fullName}
          onUseDraft={handleUseDraft}
        />
      ) : null}

      {/* Release 2 - Structured Suggestion Review Dialog */}
      {isAiOperationalIntelligenceEnabled && extractionSuggestions && (
        <StructuredSuggestionReview
          suggestions={extractionSuggestions}
          open={isSuggestionReviewOpen}
          onOpenChange={setIsSuggestionReviewOpen}
          onApplySuggestions={handleApplySuggestions}
          loading={intelligenceLoading}
          error={intelligenceError}
        />
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="rounded-md bg-muted p-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
