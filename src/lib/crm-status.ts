import type {
  Deal,
  DealPipelineStage,
  DealStage,
  Lead,
  LeadQualificationStatus,
  LeadStatus,
  Task,
  TaskStatus,
  TaskWorkflowStatus,
  Payment,
  PaymentStatus,
} from '@/types';

export function getLeadQualificationStatus(lead: Pick<Lead, 'status' | 'qualificationStatus'>): LeadQualificationStatus {
  if (lead.qualificationStatus) return lead.qualificationStatus;

  switch (lead.status) {
    case 'contacted':
      return 'contacted';
    case 'interested':
    case 'trial_scheduled':
    case 'trial_completed':
    case 'offer_sent':
    case 'negotiation':
    case 'payment_pending':
    case 'won':
      return 'qualified';
    case 'lost':
      return 'disqualified';
    case 'new':
    default:
      return 'new';
  }
}

export function getDealPipelineStage(deal: Pick<Deal, 'stage' | 'pipelineStage'>): DealPipelineStage {
  if (deal.pipelineStage) return deal.pipelineStage;

  switch (deal.stage) {
    case 'contacted':
      return 'consultation';
    case 'trial_booked':
    case 'trial_completed':
      return 'trial';
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

export function mapQualificationToLeadStatus(status: LeadQualificationStatus): LeadStatus {
  switch (status) {
    case 'contacted':
      return 'contacted';
    case 'qualified':
      return 'interested';
    case 'disqualified':
      return 'lost';
    case 'no_response':
      return 'new';
    case 'new':
    default:
      return 'new';
  }
}

export function mapPipelineToDealStage(stage: DealPipelineStage): DealStage {
  switch (stage) {
    case 'consultation':
      return 'contacted';
    case 'trial':
      return 'trial_booked';
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
