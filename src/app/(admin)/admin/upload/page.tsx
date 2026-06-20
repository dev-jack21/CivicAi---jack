'use client';

import { useState, useEffect, useRef, type ChangeEvent, type DragEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const uploadFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255).trim(),
  ministry: z.string().min(2, 'Ministry is required').max(100).trim(),
  category_id: z.string().min(1, 'Category is required'),
  description: z.string().max(1000).trim().optional(),
  effective_date: z.string().optional(),
  file: z
    .instanceof(File, { message: 'Please upload a document' })
    .refine((f) => ALLOWED_TYPES.includes(f.type), 'Only PDF and DOCX files are allowed')
    .refine((f) => f.size <= MAX_FILE_SIZE, 'File size must not exceed 20MB'),
});

type FormData = z.infer<typeof uploadFormSchema>;

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function AdminUploadPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSyncing = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: '',
      ministry: '',
      category_id: '',
      description: '',
      effective_date: '',
    },
  });

  const ministryVal = watch('ministry');
  const categoryIdVal = watch('category_id');

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('categories')
      .select('id, name, slug')
      .order('name')
      .then(({ data, error: catError }) => {
        if (catError) {
          console.error('Failed to load categories', catError);
          return;
        }
        setCategories(data ?? []);
      });
  }, []);

  useEffect(() => {
    if (isSyncing.current || !ministryVal || categories.length === 0) return;
    const cat = categories.find((c) => `Ministry of ${c.name}` === ministryVal);
    if (cat) {
      isSyncing.current = true;
      setValue('category_id', String(cat.id));
      isSyncing.current = false;
    }
  }, [ministryVal, categories, setValue]);

  useEffect(() => {
    if (isSyncing.current || !categoryIdVal || categories.length === 0) return;
    const cat = categories.find((c) => String(c.id) === categoryIdVal);
    if (cat) {
      isSyncing.current = true;
      setValue('ministry', `Ministry of ${cat.name}`);
      isSyncing.current = false;
    }
  }, [categoryIdVal, categories, setValue]);

  const handleFileDrop = (file: File) => {
    setValue('file', file, { shouldValidate: true });
    setFileName(file.name);
    setIsDragOver(false);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileDrop(file);
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileDrop(file);
  };

  const handleRemoveFile = () => {
    setValue('file', undefined as unknown as File, { shouldValidate: false });
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const fileFormData = new FormData();
      fileFormData.append('file', data.file);

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fileFormData });
      const uploadResult = await uploadRes.json();

      if (!uploadRes.ok) {
        setError(uploadResult.error?.message || 'File upload failed');
        setIsLoading(false);
        return;
      }

      const policyBody = {
        title: data.title,
        ministry: data.ministry,
        category_id: Number(data.category_id),
        description: data.description || undefined,
        effective_date: data.effective_date || undefined,
        document_url: uploadResult.url,
      };

      const policyRes = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policyBody),
      });
      const policyResult = await policyRes.json();

      if (!policyRes.ok) {
        setError(policyResult.error?.message || 'Policy creation failed');
        setIsLoading(false);
        return;
      }

      setSuccessId(policyResult.id);

      fetch('/api/process/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_id: policyResult.id }),
      }).catch((err) => console.error('Failed to trigger summarization:', err));

      setTimeout(() => router.push('/admin/policies'), 2000);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5E7EB] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
          Upload New Policy Document
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Fill in the details and upload the document to publish a new policy.
        </p>
      </div>

      {error && (
        <div
          className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successId && (
        <div
          className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm flex items-center gap-2"
          role="status"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Policy uploaded successfully. Redirecting to manage policies...</span>
        </div>
      )}

      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[#6B7280] mb-1.5">
              Policy Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              aria-invalid={errors.title ? 'true' : 'false'}
              aria-describedby={errors.title ? 'title-error' : undefined}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B6CA8] focus:border-transparent text-sm transition-colors bg-white text-[#111827] placeholder-zinc-400 ${
                errors.title ? 'border-red-500 focus:ring-red-500' : 'border-[#E5E7EB]'
              }`}
              placeholder="Enter the policy title"
              disabled={isLoading || !!successId}
            />
            {errors.title && (
              <p
                id="title-error"
                className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5"
                role="alert"
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ministry" className="block text-sm font-medium text-[#6B7280] mb-1.5">
                Ministry <span className="text-red-500">*</span>
              </label>
              <select
                id="ministry"
                {...register('ministry')}
                aria-invalid={errors.ministry ? 'true' : 'false'}
                aria-describedby={errors.ministry ? 'ministry-error' : undefined}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B6CA8] focus:border-transparent text-sm transition-colors bg-white text-[#111827] ${
                  errors.ministry ? 'border-red-500 focus:ring-red-500' : 'border-[#E5E7EB]'
                }`}
                disabled={isLoading || !!successId}
              >
                <option value="">Select ministry...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={`Ministry of ${cat.name}`}>
                    Ministry of {cat.name}
                  </option>
                ))}
              </select>
              {errors.ministry && (
                <p
                  id="ministry-error"
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5"
                  role="alert"
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {errors.ministry.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="category_id"
                className="block text-sm font-medium text-[#6B7280] mb-1.5"
              >
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category_id"
                {...register('category_id')}
                aria-invalid={errors.category_id ? 'true' : 'false'}
                aria-describedby={errors.category_id ? 'category-error' : undefined}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B6CA8] focus:border-transparent text-sm transition-colors bg-white text-[#111827] ${
                  errors.category_id ? 'border-red-500 focus:ring-red-500' : 'border-[#E5E7EB]'
                }`}
                disabled={isLoading || !!successId}
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p
                  id="category-error"
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5"
                  role="alert"
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {errors.category_id.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-[#6B7280] mb-1.5"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              {...register('description')}
              aria-invalid={errors.description ? 'true' : 'false'}
              aria-describedby={errors.description ? 'description-error' : undefined}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B6CA8] focus:border-transparent text-sm transition-colors bg-white text-[#111827] placeholder-zinc-400 resize-y ${
                errors.description ? 'border-red-500 focus:ring-red-500' : 'border-[#E5E7EB]'
              }`}
              placeholder="Brief description of the policy (optional)"
              disabled={isLoading || !!successId}
            />
            {errors.description && (
              <p
                id="description-error"
                className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5"
                role="alert"
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="effective_date"
              className="block text-sm font-medium text-[#6B7280] mb-1.5"
            >
              Effective Date
            </label>
            <input
              id="effective_date"
              type="date"
              {...register('effective_date')}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B6CA8] focus:border-transparent text-sm transition-colors bg-white text-[#111827]"
              disabled={isLoading || !!successId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1.5">
              Upload Document <span className="text-red-500">*</span>
            </label>
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => !isLoading && !successId && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? 'border-[#1B6CA8] bg-blue-50'
                  : fileName
                    ? 'border-green-400 bg-green-50'
                    : errors.file
                      ? 'border-red-400 bg-red-50'
                      : 'border-zinc-300 hover:border-zinc-400 bg-white'
              }`}
              role="button"
              tabIndex={0}
              aria-label="Upload document: drop PDF or DOCX here or click to browse"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!isLoading && !successId) fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={onFileInputChange}
                className="hidden"
                aria-hidden="true"
                disabled={isLoading || !!successId}
              />

              {fileName ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <p className="text-sm font-medium text-[#111827]">{fileName}</p>
                  {!isLoading && !successId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Remove file
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-zinc-400" />
                  <p className="text-sm text-[#111827]">
                    📄 Drop PDF or DOCX here, or click to browse
                  </p>
                  <p className="text-xs text-[#9CA3AF]">Max 20MB | PDF and DOCX only</p>
                </div>
              )}
            </div>
            {errors.file && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5" role="alert">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.file.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/admin/policies"
              className={`py-2 px-4 border border-[#E5E7EB] text-[#6B7280] hover:bg-zinc-50 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B6CA8] focus:ring-offset-2 ${
                isLoading || !!successId ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || !!successId}
              className="py-2 px-6 bg-[#1B6CA8] hover:bg-[#0D4F80] disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium rounded-md shadow-sm transition-all text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B6CA8] cursor-pointer flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading & Processing...
                </>
              ) : successId ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Uploaded
                </>
              ) : (
                'Upload & Process →'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
