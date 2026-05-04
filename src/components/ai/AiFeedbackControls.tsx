import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ThumbsUp,
  ThumbsDown,
  Edit,
  MessageSquare,
  CheckCircle,
  X,
  Star,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FeedbackRequest } from '@/api/ai';

export type FeedbackType = 'helpful' | 'edited' | 'rejected' | 'inaccurate' | 'inappropriate';

// Internal interface for component state
interface ComponentFeedbackRequest {
  aiRequestId: string;
  targetType: 'lead' | 'contact' | 'deal';
  targetId: number;
  feature: 'followup_draft' | 'next_best_action' | 'timeline_summary' | 'extraction';
  feedbackType: FeedbackType;
  comment?: string;
  rating?: number; // 1-5 stars
  editedContent?: string; // if user edited the AI output
}


interface AiFeedbackControlsProps {
  aiRequestId: string;
  targetType: 'lead' | 'contact' | 'deal';
  targetId: number;
  feature: 'followup_draft' | 'next_best_action' | 'timeline_summary' | 'extraction';
  onFeedbackSubmit?: (feedback: FeedbackRequest) => void;
  disabled?: boolean;
  compact?: boolean;
  showRating?: boolean;
  editedContent?: string;
}

// Map frontend feedback to backend format
function mapToBackendFeedback(frontendFeedback: ComponentFeedbackRequest): FeedbackRequest {
  const outcomeMap: Record<FeedbackType, 'accepted' | 'accepted_with_changes' | 'rejected' | 'ignored'> = {
    helpful: 'accepted',
    edited: 'accepted_with_changes',
    rejected: 'rejected',
    inaccurate: 'rejected',
    inappropriate: 'rejected',
  };

  const featureMap: Record<string, 'followup_draft' | 'timeline_summary' | 'structured_extraction' | 'next_best_action' | 'lead_priority_score' | 'risk_score'> = {
    followup_draft: 'followup_draft',
    next_best_action: 'next_best_action',
    timeline_summary: 'timeline_summary',
    extraction: 'structured_extraction',
  };

  return {
    outcome: outcomeMap[frontendFeedback.feedbackType],
    targetType: featureMap[frontendFeedback.feature], // Map feature to backend targetType
    aiRequestId: frontendFeedback.aiRequestId,
    sourceEntityType: frontendFeedback.targetType, // Use targetType as sourceEntityType (entity type)
    sourceEntityId: frontendFeedback.targetId,
    comment: frontendFeedback.comment,
    editedOutputPreview: frontendFeedback.editedContent,
  };
}

const feedbackConfig = {
  helpful: {
    label: 'Пайдалуу',
    icon: ThumbsUp,
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'AI жооп пайдалуу болду',
  },
  edited: {
    label: 'Өзгөртүлдү',
    icon: Edit,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Жоопту өзгөрттүм',
  },
  rejected: {
    label: 'Четке кагылды',
    icon: X,
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'AI жооп колдонулган жок',
  },
  inaccurate: {
    label: 'Так эмес',
    icon: AlertCircle,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Маалымат так эмес',
  },
  inappropriate: {
    label: 'Туура келбейт',
    icon: AlertCircle,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Жооп туура келбейт',
  },
};

function RatingStars({ rating, onRatingChange, disabled }: {
  rating?: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <TooltipProvider key={star}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => !disabled && onRatingChange(star)}
                disabled={disabled}
                className={`p-1 rounded transition-colors ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100'
                  }`}
              >
                <Star
                  className={`w-4 h-4 ${rating && star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                    }`}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{star} {star === 1 ? 'жылдыз' : 'жылдыз'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}

export function AiFeedbackControls({
  aiRequestId,
  targetType,
  targetId,
  feature,
  onFeedbackSubmit,
  disabled = false,
  compact = false,
  showRating = false,
  editedContent
}: AiFeedbackControlsProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType | null>(null);
  const [rating, setRating] = useState<number | undefined>();
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFeedbackSelect = async (feedbackType: FeedbackType) => {
    if (disabled || isSubmitting) return;

    setSelectedFeedback(feedbackType);

    // For simple feedback types, submit immediately
    if (feedbackType === 'helpful' || feedbackType === 'rejected') {
      await submitFeedback(feedbackType);
    } else {
      // For complex feedback, show comment dialog
      setShowComment(true);
    }
  };

  const submitFeedback = async (feedbackType: FeedbackType, commentText?: string) => {
    if (!onFeedbackSubmit) return;

    setIsSubmitting(true);

    try {
      const frontendFeedback: ComponentFeedbackRequest = {
        aiRequestId,
        targetType,
        targetId,
        feature,
        feedbackType,
        comment: commentText || comment,
        rating: showRating ? rating : undefined,
        editedContent: feedbackType === 'edited' ? editedContent : undefined,
      };

      const backendFeedback = mapToBackendFeedback(frontendFeedback);
      await onFeedbackSubmit(backendFeedback);

      const config = feedbackConfig[feedbackType];
      toast({
        title: 'Фидбек жөнөтүлдү',
        description: config.description,
      });

      // Reset state
      setSelectedFeedback(null);
      setComment('');
      setRating(undefined);
      setShowComment(false);
    } catch (error) {
      toast({
        title: 'Ката кетти',
        description: 'Фидбекти жөнөтүүдө ката кетти',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (selectedFeedback) {
      await submitFeedback(selectedFeedback, comment);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {Object.entries(feedbackConfig).map(([type, config]) => (
          <TooltipProvider key={type}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFeedbackSelect(type as FeedbackType)}
                  disabled={disabled || isSubmitting}
                  className={`h-8 w-8 p-0 ${selectedFeedback === type
                    ? config.color
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  <config.icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{config.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Feedback Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">AI жоопту баалоо:</span>

        {Object.entries(feedbackConfig).map(([type, config]) => (
          <TooltipProvider key={type}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFeedbackSelect(type as FeedbackType)}
                  disabled={disabled || isSubmitting}
                  className={`${selectedFeedback === type
                    ? config.color
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <config.icon className="w-4 h-4 mr-1" />
                  {config.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{config.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {/* Rating Stars */}
      {showRating && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Баа:</span>
          <RatingStars
            rating={rating}
            onRatingChange={setRating}
            disabled={disabled || isSubmitting}
          />
        </div>
      )}

      {/* Comment Dialog */}
      {showComment && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-orange-500" />
            <span className="font-medium">
              {selectedFeedback && feedbackConfig[selectedFeedback].label} - Кошумча маалымат
            </span>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Фидбегиңиз жөнүндө кошумча маалымат бериңиз (милдеттүү эмес)..."
            className="w-full p-3 border rounded-md resize-none min-h-[80px]"
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowComment(false);
                setSelectedFeedback(null);
                setComment('');
              }}
              disabled={isSubmitting}
            >
              Жокко чыгуу
            </Button>

            <Button
              size="sm"
              onClick={handleCommentSubmit}
              disabled={isSubmitting || !selectedFeedback}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Жөнөтүлүүдө...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Фидбек жөнөтүү
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Success Indicator */}
      {selectedFeedback && !showComment && (
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-700">
            Фидбек жөнөтүлдү: {feedbackConfig[selectedFeedback].label}
          </span>
        </div>
      )}
    </div>
  );
}

// Quick feedback button for inline use
export function QuickFeedbackButton({
  aiRequestId,
  targetType,
  targetId,
  feature,
  onFeedbackSubmit,
  feedbackType,
  disabled = false
}: {
  aiRequestId: string;
  targetType: 'lead' | 'contact' | 'deal';
  targetId: number;
  feature: 'followup_draft' | 'next_best_action' | 'timeline_summary' | 'extraction';
  onFeedbackSubmit?: (feedback: FeedbackRequest) => void;
  feedbackType: FeedbackType;
  disabled?: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleQuickFeedback = async () => {
    if (!onFeedbackSubmit || isSubmitting || disabled) return;

    setIsSubmitting(true);

    try {
      const frontendFeedback: ComponentFeedbackRequest = {
        aiRequestId,
        targetType,
        targetId,
        feature,
        feedbackType,
      };

      const backendFeedback = mapToBackendFeedback(frontendFeedback);
      await onFeedbackSubmit(backendFeedback);

      const config = feedbackConfig[feedbackType];
      toast({
        title: 'Фидбек жөнөтүлдү',
        description: config.description,
      });
    } catch (error) {
      toast({
        title: 'Ката кетти',
        description: 'Фидбекти жөнөтүүдө ката кетти',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const config = feedbackConfig[feedbackType];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleQuickFeedback}
            disabled={disabled || isSubmitting}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
          >
            {isSubmitting ? (
              <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
