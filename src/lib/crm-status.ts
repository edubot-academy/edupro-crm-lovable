import type {
  Deal,
  DealPipelineStage,
  DealStage,
  Lead,
  LeadStatus,
  Task,
  TaskStatus,
  TaskWorkflowStatus,
  Payment,
  PaymentStatus,
} from '@/types';

export function getDealPipelineStage(
  deal: Pick<Deal, 'stage' | 'pipelineStage'>,
  tenantStages?: Array<{ key: string; label: string }>
): DealPipelineStage {
  if (deal.pipelineStage) return deal.pipelineStage;

  // If tenant stages are configured, check if the deal's stage matches any tenant stage key
  if (tenantStages && tenantStages.length > 0) {
    const matchedTenantStage = tenantStages.find(s => s.key === deal.stage);
    if (matchedTenantStage) {
      return matchedTenantStage.key as DealPipelineStage;
    }
  }

  // Fallback to hardcoded mapping
  switch (deal.stage) {
    case 'contacted':
      return 'consultation';
    case 'offer_sent':
    case 'negotiation':
      return 'negotiation';
    case 'payment_pending':
      return 'payment_pending';
    case 'won':
      return 'won';
    case 'lost':
      return 'lost';
    case 'new_lead':
    default:
      return 'new';
  }
}

export function getTaskWorkflowStatus(task: Pick<Task, 'status' | 'workflowStatus' | 'dueAt'>): TaskWorkflowStatus {
  if (task.workflowStatus) return task.workflowStatus;

  if (task.status === 'cancelled') return 'cancelled';
  if (task.status === 'done') return 'completed';

  if (task.dueAt) {
    const dueAt = new Date(task.dueAt);
    if (!Number.isNaN(dueAt.getTime()) && dueAt.getTime() < Date.now()) {
      return 'overdue';
    }
  }

  return 'pending';
}

export function getPaymentWorkflowStatus(payment: Pick<Payment, 'status' | 'paymentStatus'>): PaymentStatus {
  return payment.paymentStatus || payment.status;
}

export function mapPipelineToDealStage(
  stage: DealPipelineStage,
  tenantStages?: Array<{ key: string; label: string }>
): DealStage {
  // If tenant stages are configured, check if the pipeline stage matches any tenant stage key
  if (tenantStages && tenantStages.length > 0) {
    const matchedTenantStage = tenantStages.find(s => s.key === stage);
    if (matchedTenantStage) {
      return matchedTenantStage.key as DealStage;
    }
  }

  // Fallback to hardcoded mapping
  switch (stage) {
    case 'consultation':
      return 'contacted';
    case 'negotiation':
      return 'negotiation';
    case 'payment_pending':
      return 'payment_pending';
    case 'won':
      return 'won';
    case 'lost':
      return 'lost';
    case 'new':
    default:
      return 'new_lead';
  }
}

export function mapWorkflowToTaskStatus(status: TaskWorkflowStatus): TaskStatus {
  switch (status) {
    case 'completed':
      return 'done';
    case 'cancelled':
      return 'cancelled';
    case 'overdue':
    case 'pending':
    default:
      return 'open';
  }
}

export function mapPaymentWorkflowToPaymentStatus(status: PaymentStatus): PaymentStatus {
  return status;
}
