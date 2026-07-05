import { z } from 'zod';

export const applyLeaveSchema = z.object({
  leaveTypeId: z.string().min(1, 'Leave type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  durationType: z.enum(['FULL_DAY', 'HALF_DAY', 'SHORT_LEAVE']).default('FULL_DAY'),
  reason: z.string().min(1, 'Reason is required'),
});

export const leaveActionSchema = z.object({
  comment: z.string().optional(),
});

export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;
