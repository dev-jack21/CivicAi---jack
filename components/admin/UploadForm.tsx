'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const uploadSchema = z.object({
  title: z.string().min(1),
  ministry: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

export default function UploadForm() {
  const { register, handleSubmit } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  const onSubmit = (data: UploadFormData) => {
    console.log('Upload', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <div>
        <label htmlFor="title" className="block font-medium">
          Title
        </label>
        <input id="title" {...register('title')} className="mt-1 w-full rounded border p-2" />
      </div>
      <div>
        <label htmlFor="ministry" className="block font-medium">
          Ministry
        </label>
        <input id="ministry" {...register('ministry')} className="mt-1 w-full rounded border p-2" />
      </div>
      <div>
        <label htmlFor="category" className="block font-medium">
          Category
        </label>
        <input id="category" {...register('category')} className="mt-1 w-full rounded border p-2" />
      </div>
      <div>
        <label htmlFor="description" className="block font-medium">
          Description (optional)
        </label>
        <textarea
          id="description"
          {...register('description')}
          className="mt-1 w-full rounded border p-2"
        />
      </div>
      <div>
        <label htmlFor="file" className="block font-medium">
          Document (PDF/DOCX)
        </label>
        <input id="file" type="file" accept=".pdf,.docx" className="mt-1 w-full" />
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
        Upload
      </button>
    </form>
  );
}
