'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validators/auth';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    router.refresh();
    router.push('/');
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-zinc-800 rounded-xl shadow-sm p-8 transition-colors">
      {error && (
        <div
          className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-md text-sm flex items-center gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[#6B7280] dark:text-zinc-300 mb-1.5"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B6CA8] focus:border-transparent text-sm transition-colors bg-white dark:bg-zinc-900 text-[#111827] dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 ${
              errors.email
                ? 'border-red-500 focus:ring-red-500'
                : 'border-[#E5E7EB] dark:border-zinc-700'
            }`}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p
              id="email-error"
              className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5"
              role="alert"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[#6B7280] dark:text-zinc-300 mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B6CA8] focus:border-transparent text-sm transition-colors bg-white dark:bg-zinc-900 text-[#111827] dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 ${
              errors.password
                ? 'border-red-500 focus:ring-red-500'
                : 'border-[#E5E7EB] dark:border-zinc-700'
            }`}
            placeholder="Enter your password"
          />
          {errors.password && (
            <p
              id="password-error"
              className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5"
              role="alert"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full min-h-11 py-2.5 px-4 bg-[#1B6CA8] hover:bg-[#0D4F80] disabled:bg-blue-300 disabled:dark:bg-zinc-800 disabled:dark:text-zinc-500 text-white font-medium rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B6CA8] text-sm cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5E7EB] dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white dark:bg-[#121212] text-[#6B7280] dark:text-[#9CA3AF] transition-colors">
              or continue with
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="mt-4 w-full min-h-11 py-2 px-4 bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:bg-zinc-100 disabled:dark:bg-zinc-800 text-[#6B7280] dark:text-zinc-200 font-medium rounded-md shadow-sm transition-all flex items-center justify-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B6CA8] cursor-pointer"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-[#6B7280] dark:text-[#9CA3AF]">
        Don&apos;t have an account?{' '}
        <a
          href="/register"
          className="text-[#1B6CA8] hover:text-[#0D4F80] dark:text-[#60A5FA] dark:hover:text-blue-400 font-medium transition-colors"
        >
          Sign up
        </a>
      </p>
    </div>
  );
}
