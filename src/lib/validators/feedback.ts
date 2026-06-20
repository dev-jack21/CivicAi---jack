import { z } from 'zod';

export const feedbackSchema = z.object({
  content: z
    .string()
    .min(10, 'Feedback must be at least 10 characters')
    .max(2000, 'Feedback cannot exceed 2000 characters')
    .trim(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
