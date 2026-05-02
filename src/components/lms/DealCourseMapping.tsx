import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BookOpen, GraduationCap } from 'lucide-react';
import { formatLmsCourseType } from '@/lib/lms-formatting';

/**
 * DealCourseMapping - LMS Bridge Component
 * 
 * Optional component for LMS course/group mapping data.
 * This component should only be rendered when LMS bridge is enabled
 * and the user has appropriate permissions (admin/manager with canViewLmsTechnicalFields).
 * 
 * @param lmsCourseId - LMS course ID from the deal
 * @param lmsGroupId - LMS group ID from the deal
 * @param courseType - Course type (video, offline, online_live)
 * @param courseNameSnapshot - Snapshot of course name at deal creation
 * @param groupNameSnapshot - Snapshot of group name at deal creation
 * @param dealId - Deal ID for navigation
 * @param contactLmsStudentId - Contact's LMS student ID for enrollment navigation
 */
interface DealCourseMappingProps {
  lmsCourseId?: string;
  lmsGroupId?: string;
  courseType?: string;
  courseNameSnapshot?: string;
  groupNameSnapshot?: string;
  dealId: number;
  contactLmsStudentId?: string;
}

export function DealCourseMapping({
  lmsCourseId,
  lmsGroupId,
  courseType,
  courseNameSnapshot,
  groupNameSnapshot,
  dealId,
  contactLmsStudentId,
}: DealCourseMappingProps) {
  if (!lmsCourseId && !lmsGroupId) {
    return null;
  }

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          LMS Продукт
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {lmsCourseId && (
          <div>
            <Label className="text-xs text-muted-foreground">LMS Курс ID</Label>
            <p className="text-sm font-mono">{lmsCourseId}</p>
            {courseNameSnapshot && <p className="text-xs text-muted-foreground">{courseNameSnapshot}</p>}
          </div>
        )}
        {lmsGroupId && (
          <div>
            <Label className="text-xs text-muted-foreground">LMS Топ ID</Label>
            <p className="text-sm font-mono">{lmsGroupId}</p>
            {groupNameSnapshot && <p className="text-xs text-muted-foreground">{groupNameSnapshot}</p>}
          </div>
        )}
        {courseType && (
          <div>
            <Label className="text-xs text-muted-foreground">Курс Түрү</Label>
            <p className="text-sm">{formatLmsCourseType(courseType as 'video' | 'offline' | 'online_live')}</p>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            // Navigate to enrollments with CRM deal ID
            window.location.href = `/enrollments?crmDealId=${dealId}${contactLmsStudentId ? `&studentId=${encodeURIComponent(contactLmsStudentId)}` : ''}`;
          }}
        >
          <GraduationCap className="mr-2 h-4 w-4" />
          LMS Каттоо
        </Button>
      </CardContent>
    </Card>
  );
}
