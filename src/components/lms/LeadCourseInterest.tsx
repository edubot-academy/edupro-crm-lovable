import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BookOpen } from 'lucide-react';
import { formatLmsCourseType, leadInterestLevelLabels } from '@/lib/lms-formatting';

/**
 * LeadCourseInterest - LMS Bridge Component
 * 
 * Optional component for LMS-specific course/group interest data.
 * This component should only be rendered when LMS bridge is enabled
 * and the user has appropriate permissions (admin/manager with canViewLmsTechnicalFields).
 * 
 * @param interestedCourseId - LMS course ID from the lead
 * @param interestedGroupId - LMS group ID from the lead
 * @param courseName - Course name for display
 * @param groupName - Group name for display
 */
interface LeadCourseInterestProps {
  interestedCourseId?: string;
  interestedGroupId?: string;
  courseType?: string;
  interestLevel?: 'low' | 'medium' | 'high';
  courseName?: string;
  groupName?: string;
}

export function LeadCourseInterest({
  interestedCourseId,
  interestedGroupId,
  courseType,
  interestLevel,
  courseName,
  groupName,
}: LeadCourseInterestProps) {
  if (!interestedCourseId && !interestedGroupId && !interestLevel) {
    return null;
  }

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          LMS Кызыгуу
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {interestedCourseId && (
          <div>
            <Label className="text-xs text-muted-foreground">Курс ID</Label>
            <p className="text-sm font-medium">{interestedCourseId}</p>
            {courseName && <p className="text-xs text-muted-foreground">{courseName}</p>}
          </div>
        )}
        {interestedGroupId && (
          <div>
            <Label className="text-xs text-muted-foreground">Топ ID</Label>
            <p className="text-sm font-medium">{interestedGroupId}</p>
            {groupName && <p className="text-xs text-muted-foreground">{groupName}</p>}
          </div>
        )}
        {courseType && (
          <div>
            <Label className="text-xs text-muted-foreground">Курс түрү</Label>
            <p className="text-sm font-medium">{formatLmsCourseType(courseType as 'video' | 'offline' | 'online_live')}</p>
          </div>
        )}
        {interestLevel && (
          <div>
            <Label className="text-xs text-muted-foreground">Кызыгуу деңгээли</Label>
            <p className="text-sm font-medium">{leadInterestLevelLabels[interestLevel]}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
