import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Link2, GraduationCap } from 'lucide-react';

/**
 * ContactStudentMapping - LMS Bridge Component
 * 
 * Optional component for LMS student identity mapping.
 * This component should only be rendered when LMS bridge is enabled
 * and the user has appropriate permissions (admin/manager with canViewLmsTechnicalFields).
 * 
 * @param lmsStudentId - LMS student ID from the contact
 * @param externalStudentId - External student ID from the contact
 * @param contactId - CRM contact ID for navigation
 */
interface ContactStudentMappingProps {
  lmsStudentId?: string;
  externalStudentId?: string;
  contactId: number;
}

export function ContactStudentMapping({ lmsStudentId, externalStudentId, contactId }: ContactStudentMappingProps) {
  if (!lmsStudentId && !externalStudentId) {
    return null;
  }

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          LMS Студент
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {lmsStudentId && (
          <div>
            <Label className="text-xs text-muted-foreground">LMS Студент ID</Label>
            <p className="text-sm font-mono">{lmsStudentId}</p>
          </div>
        )}
        {externalStudentId && (
          <div>
            <Label className="text-xs text-muted-foreground">Тышкы Студент ID</Label>
            <p className="text-sm font-mono">{externalStudentId}</p>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            // Navigate to enrollments with CRM contact ID
            window.location.href = `/enrollments?crmContactId=${contactId}${lmsStudentId ? `&studentId=${encodeURIComponent(lmsStudentId)}` : ''}`;
          }}
        >
          <Link2 className="mr-2 h-4 w-4" />
          LMS Каттоо
        </Button>
      </CardContent>
    </Card>
  );
}
