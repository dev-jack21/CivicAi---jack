'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { feedbackSchema, type FeedbackInput } from '@/lib/validators/feedback';

interface FeedbackFormProps {
  policyId: string;
  user?: { id: string; full_name?: string | null } | null;
}

export default function FeedbackForm({ policyId, user }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = async (data: FeedbackInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/policies/${policyId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please log in to submit feedback');
        } else if (response.status === 409) {
          setError('You have already submitted feedback for this policy');
        } else {
          setError(result.error || 'Failed to submit feedback');
        }
        return;
      }

      setSuccess(true);
      reset();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 border border-border-custom rounded-lg p-6 text-center">
        <p className="text-text-secondary mb-4">Login to submit your feedback</p>
        <a
          href="/login"
          className="inline-flex items-center justify-center min-h-11 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Log In
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-border-custom rounded-lg p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Submit Your Feedback</h3>

      {success && (
        <div
          role="alert"
          className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md text-sm"
        >
          Thank you! Your feedback has been submitted successfully.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-text-secondary mb-1">
            Your Feedback
          </label>
          <textarea
            id="content"
            rows={4}
            {...register('content')}
            placeholder="Share your thoughts on this policy..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || success}
          />
          {errors.content && (
            <p role="alert" className="mt-1 text-sm text-red-600">
              {errors.content.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">Minimum 10 characters, maximum 2000 characters</p>
          <button
            type="submit"
            disabled={isSubmitting || success}
            className="inline-flex items-center justify-center min-h-11 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
}
