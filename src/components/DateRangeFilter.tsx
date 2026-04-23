import { Calendar } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ky } from '@/lib/i18n';

interface DateRangeFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onClearCustom?: () => void;
}

export function DateRangeFilter({
  value,
  onValueChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClearCustom,
}: DateRangeFilterProps) {
  const showCustomDateRange = value === 'custom';

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={ky.common.filter} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ky.dateRange.all}</SelectItem>
              <SelectItem value="today">{ky.dateRange.today}</SelectItem>
              <SelectItem value="week">{ky.dateRange.week}</SelectItem>
              <SelectItem value="month">{ky.dateRange.month}</SelectItem>
              <SelectItem value="custom">{ky.dateRange.custom}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showCustomDateRange && (
        <div className="flex items-center gap-3 flex-wrap rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm">{ky.dateRange.fromDate}:</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">{ky.dateRange.toDate}:</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="w-40"
            />
          </div>
          {onClearCustom && (
            <Button variant="outline" size="sm" onClick={onClearCustom}>
              {ky.common.cancel}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
