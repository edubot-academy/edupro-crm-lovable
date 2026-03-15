import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { ky } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  headerActions?: React.ReactNode;
  renderMobileCard?: (item: T) => React.ReactNode;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  isLoading,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  page = 1,
  totalPages = 1,
  onPageChange,
  onRowClick,
  emptyMessage,
  headerActions,
  renderMobileCard,
}: DataTableProps<T>) {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      {/* Search + Actions */}
      {(onSearchChange || headerActions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {onSearchChange && (
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder || ky.common.search}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}

      {/* Mobile cards */}
      {isMobile && renderMobileCard ? (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center rounded-lg border bg-card shadow-card">
              <div className="text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">{ky.common.loading}</p>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-lg border bg-card shadow-card">
              <p className="text-sm text-muted-foreground">{emptyMessage || ky.common.noData}</p>
            </div>
          ) : (
            data.map((item) => (
              <div
                key={item.id}
                className={cn(onRowClick && 'cursor-pointer')}
                onClick={() => onRowClick?.(item)}
              >
                {renderMobileCard(item)}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {columns.map((col) => (
                  <TableHead key={col.key} className={cn('font-semibold text-foreground/80', col.className)}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">{ky.common.loading}</p>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <p className="text-sm text-muted-foreground">{emptyMessage || ky.common.noData}</p>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(onRowClick && 'cursor-pointer hover:bg-muted/30')}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.className}>
                        {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {ky.common.showing} {page} {ky.common.of} {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
