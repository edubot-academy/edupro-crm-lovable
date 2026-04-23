import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface KanbanColumn<T> {
  id: string;
  title: string;
  color?: string;
  items: T[];
}

interface KanbanBoardProps<T extends { id: number | string }> {
  columns: KanbanColumn<T>[];
  renderCard: (item: T) => React.ReactNode;
  onCardClick?: (item: T) => void;
  activeColumn?: string;
  onColumnChange?: (columnId: string) => void;
}

export function KanbanBoard<T extends { id: number | string }>({
  columns,
  renderCard,
  onCardClick,
  activeColumn,
  onColumnChange,
}: KanbanBoardProps<T>) {
  const currentColumn = columns.find((c) => c.id === activeColumn) || columns[0];

  return (
    <>
      {/* Mobile view */}
      <div className="block lg:hidden">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {columns.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => onColumnChange?.(col.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                currentColumn?.id === col.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              )}
            >
              {col.title}
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-xs',
                currentColumn?.id === col.id
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}>
                {col.items.length}
              </span>
            </button>
          ))}
        </div>

        {currentColumn && (
          <div className="space-y-3">
            {currentColumn.items.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Бул тилкеде карточкалар жок
              </div>
            ) : (
              currentColumn.items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onCardClick?.(item)}
                  onKeyDown={(e) => {
                    if (!onCardClick) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onCardClick(item);
                    }
                  }}
                  role={onCardClick ? 'button' : undefined}
                  tabIndex={onCardClick ? 0 : undefined}
                  className="cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {renderCard(item)}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden lg:flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {columns.map((col) => (
          <div key={col.id} className="flex w-72 shrink-0 flex-col">
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="flex items-center justify-between text-sm font-semibold">
                  <span>{col.title}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {col.items.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                <ScrollArea className="max-h-[calc(100vh-280px)]">
                  <div className="space-y-2 px-2 pb-2">
                    {col.items.length === 0 ? (
                      <div className="rounded-lg border-2 border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                        Бул тилкеде карточкалар жок
                      </div>
                    ) : (
                      col.items.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => onCardClick?.(item)}
                          onKeyDown={(e) => {
                            if (!onCardClick) return;
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onCardClick(item);
                            }
                          }}
                          role={onCardClick ? 'button' : undefined}
                          tabIndex={onCardClick ? 0 : undefined}
                          className="cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {renderCard(item)}
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </>
  );
}
