import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  try {
    // 1. Auth & Admin check
    const { authorized, errorResponse, supabase } = await verifyAdmin();
    if (!authorized) {
      return errorResponse!;
    }

    // 3. Parse request body
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid form data.',
            status: 422,
          },
        },
        { status: 422 }
      );
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No file uploaded.',
            status: 422,
          },
        },
        { status: 422 }
      );
    }

    // 4. File validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: {
            code: 'UNSUPPORTED_FORMAT',
            message: 'Only PDF and DOCX files are allowed.',
            status: 415,
          },
        },
        { status: 415 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size must not exceed 20MB.',
            status: 413,
          },
        },
        { status: 413 }
      );
    }

    // 5. Filename sanitization
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `${Date.now()}_${sanitizedFilename}`;

    // Convert file to Buffer for upload
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 6. Upload to Supabase Storage policy-documents bucket
    const { error: uploadError } = await supabase.storage
      .from('policy-documents')
      .upload(uniqueFilename, fileBuffer, {
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          error: {
            code: 'PROCESSING_FAILED',
            message: uploadError.message || 'Failed to upload file to storage.',
            status: 500,
          },
        },
        { status: 500 }
      );
    }

    // 7. Get URL of the uploaded document
    const {
      data: { publicUrl },
    } = supabase.storage.from('policy-documents').getPublicUrl(uniqueFilename);

    return NextResponse.json(
      {
        url: publicUrl,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json(
      {
        error: {
          code: 'PROCESSING_FAILED',
          message,
          status: 500,
        },
      },
      { status: 500 }
    );
  }
}
