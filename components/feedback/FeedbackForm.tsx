'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackFormProps {
  policyId: string;
}

export default function FeedbackForm({ policyId }: FeedbackFormProps) {
  const { register, handleSubmit } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { rating: 5, comment: '' },
  });

  const onSubmit = (data: FeedbackFormData) => {
    console.log('Submit feedback for', policyId, data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="rating" className="block font-medium">
          Rating (1-5)
        </label>
        <input
          id="rating"
          type="number"
          min="1"
          max="5"
          {...register('rating', { valueAsNumber: true })}
          className="mt-1 w-full rounded border p-2"
        />
      </div>
      <div>
        <label htmlFor="comment" className="block font-medium">
          Comment (optional)
        </label>
        <textarea
          id="comment"
          {...register('comment')}
          className="mt-1 w-full rounded border p-2"
        />
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
        Submit
      </button>
    </form>
  );
}
