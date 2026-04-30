import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GraduationCap, Link2 } from 'lucide-react';

/**
 * PaymentEnrollmentMapping - LMS Bridge Component
 * 
 * Optional component for LMS enrollment mapping data.
 * This component should only be rendered when LMS bridge is enabled
 * and the user has appropriate permissions (admin/manager with canViewLmsTechnicalFields).
 * 
 * @param lmsEnrollmentId - LMS enrollment ID from the payment
 * @param paymentId - Payment ID for navigation
 * @param dealId - Deal ID for enrollment navigation
 * @param contactLmsStudentId - Contact's LMS student ID for enrollment navigation
 */
interface PaymentEnrollmentMappingProps {
  lmsEnrollmentId?: string;
  paymentId: number;
  dealId?: number;
  contactLmsStudentId?: string;
}

export function PaymentEnrollmentMapping({ lmsEnrollmentId, paymentId, dealId, contactLmsStudentId }: PaymentEnrollmentMappingProps) {
  if (!lmsEnrollmentId && !dealId) {
    return null;
  }

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          LMS Каттоо
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {lmsEnrollmentId && (
          <div>
            <Label className="text-xs text-muted-foreground">LMS Каттоо ID</Label>
            <p className="text-sm font-mono">{lmsEnrollmentId}</p>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            // Navigate to enrollments with deal ID or payment context
            const params = new URLSearchParams();
            if (dealId) params.set('dealId', String(dealId));
            if (contactLmsStudentId) params.set('studentId', contactLmsStudentId);
            window.location.href = `/enrollments?${params.toString()}`;
          }}
        >
          <Link2 className="mr-2 h-4 w-4" />
          LMS Каттоону Көрүү
        </Button>
      </CardContent>
    </Card>
  );
}
