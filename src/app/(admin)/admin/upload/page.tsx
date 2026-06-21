'use client';

import { useState, useEffect, useRef, type ChangeEvent, type DragEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react';
import { Input, Textarea, Select, DatePicker } from '@/components/ui';

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

interface Ministry {
  id: number;
  name: string;
  slug: string;
}

const getMinistryForCategory = (categoryName: string) => {
  const name = categoryName.trim();
  const lower = name.toLowerCase();
  if (lower === 'treasury' || lower === 'finance') {
    return 'The National Treasury';
  }
  if (lower === 'justice' || lower === 'law') {
    return 'Office of the Attorney General';
  }
  return `Ministry of ${name}`;
};

const getCategoryForMinistry = (ministryName: string, categoriesList: Category[]) => {
  const name = ministryName.trim().toLowerCase();
  if (name === 'the national treasury') {
    return categoriesList.find(
      (c) => c.name.toLowerCase() === 'treasury' || c.name.toLowerCase() === 'finance'
    );
  }
  if (name === 'office of the attorney general') {
    return categoriesList.find(
      (c) => c.name.toLowerCase() === 'justice' || c.name.toLowerCase() === 'law'
    );
  }
  return categoriesList.find(
    (c) => `Ministry of ${c.name}`.toLowerCase() === name || c.name.toLowerCase() === name
  );
};

export default function AdminUploadPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
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

    // Fetch ministries from admin API
    fetch('/api/admin/ministries')
      .then((r) => r.json())
      .then((data) => setMinistries(data.ministries ?? []))
      .catch(() => console.error('Failed to load ministries'));
  }, []);

  useEffect(() => {
    if (isSyncing.current || !ministryVal || categories.length === 0) return;
    const cat = getCategoryForMinistry(ministryVal, categories);
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
      setValue('ministry', getMinistryForCategory(cat.name));
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
      router.push('/admin/policies');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Upload New Policy Document
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
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

      <div className="bg-surface border border-border-custom rounded-xl shadow-sm p-4 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div>
            <Input
              id="title"
              label="Policy Title"
              required
              {...register('title')}
              error={errors.title?.message}
              placeholder="Enter the policy title"
              disabled={isLoading || !!successId}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="ministry"
              label="Ministry"
              required
              value={ministryVal}
              onValueChange={(val) => setValue('ministry', val, { shouldValidate: true })}
              error={errors.ministry?.message}
              placeholder="Select ministry..."
              options={ministries.map((m) => ({ value: m.name, label: m.name }))}
              disabled={isLoading || !!successId}
              containerClassName="flex-1"
            />
            <Select
              id="category_id"
              label="Category"
              required
              value={categoryIdVal}
              onValueChange={(val) => setValue('category_id', val, { shouldValidate: true })}
              error={errors.category_id?.message}
              placeholder="Select category..."
              options={categories.map((cat) => ({ value: String(cat.id), label: cat.name }))}
              disabled={isLoading || !!successId}
              containerClassName="flex-1"
            />
          </div>

          <div>
            <Textarea
              id="description"
              label="Description"
              rows={3}
              {...register('description')}
              error={errors.description?.message}
              placeholder="Brief description of the policy (optional)"
              disabled={isLoading || !!successId}
            />
          </div>

          <DatePicker
            id="effective_date"
            label="Effective Date"
            value={watch('effective_date')}
            onChange={(val) => setValue('effective_date', val)}
            disabled={isLoading || !!successId}
            warnIfPast
          />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Upload Document <span className="text-red-500">*</span>
            </label>
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => !isLoading && !successId && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? 'border-primary bg-blue-50'
                  : fileName
                    ? 'border-green-400 bg-green-50'
                    : errors.file
                      ? 'border-red-400 bg-red-50'
                      : 'border-border-custom hover:border-zinc-400 bg-surface'
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
                  <p className="text-sm font-medium text-text-primary">{fileName}</p>
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
                  <p className="text-sm text-text-primary">
                    📄 Drop PDF or DOCX here, or click to browse
                  </p>
                  <p className="text-xs text-text-muted">Max 20MB | PDF and DOCX only</p>
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

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <Link
              href="/admin/policies"
              className={`inline-flex items-center justify-center min-h-11 py-2 px-4 border border-border-custom text-text-secondary hover:bg-bg-base rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isLoading || !!successId ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || !!successId}
              className="inline-flex items-center justify-center min-h-11 py-2 px-6 bg-primary hover:bg-primary-dark disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium rounded-md shadow-sm transition-all text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer gap-2"
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
