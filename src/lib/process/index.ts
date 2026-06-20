import { createServiceRoleClient } from '@/lib/supabase/server';
import { summarizeText } from '@/lib/ai/summarize';
import { generateSpeech } from '@/lib/ai/tts';
import { parsePDF } from '@/lib/parsers/pdf';
import { parseDOCX } from '@/lib/parsers/docx';

export async function runSummarize(policy_id: string): Promise<string> {
  const serviceRole = createServiceRoleClient();

  await serviceRole
    .from('processing_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('policy_id', policy_id)
    .eq('job_type', 'summarize');

  const { data: policy, error: fetchError } = await serviceRole
    .from('policies')
    .select('document_url, document_type')
    .eq('id', policy_id)
    .single();

  if (fetchError || !policy) {
    await serviceRole
      .from('processing_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('policy_id', policy_id)
      .eq('job_type', 'summarize');
    await serviceRole
      .from('policies')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', policy_id);
    throw new Error(`Failed to fetch policy: ${fetchError?.message ?? 'not found'}`);
  }

  let documentText: string;
  try {
    const urlObj = new URL(policy.document_url);
    const pathParts = urlObj.pathname.split('/');
    const publicIndex = pathParts.indexOf('public');
    const storagePath =
      publicIndex >= 0
        ? pathParts.slice(publicIndex + 2).join('/')
        : pathParts[pathParts.length - 1];

    const { data: fileData, error: dlError } = await serviceRole.storage
      .from('policy-documents')
      .download(storagePath);

    if (dlError || !fileData) {
      throw new Error(`Failed to download document: ${dlError?.message ?? 'no data'}`);
    }
    const buffer = Buffer.from(await fileData.arrayBuffer());

    if (policy.document_type === 'docx') {
      documentText = await parseDOCX(buffer);
    } else {
      documentText = await parsePDF(buffer);
    }
  } catch (err) {
    await serviceRole
      .from('processing_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('policy_id', policy_id)
      .eq('job_type', 'summarize');
    await serviceRole
      .from('policies')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', policy_id);
    throw err;
  }

  let summary: string;
  try {
    summary = await summarizeText(documentText);
  } catch (err) {
    await serviceRole
      .from('processing_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('policy_id', policy_id)
      .eq('job_type', 'summarize');
    await serviceRole
      .from('policies')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', policy_id);
    throw err;
  }

  await serviceRole
    .from('policies')
    .update({
      summary,
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', policy_id);

  await serviceRole
    .from('processing_jobs')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('policy_id', policy_id)
    .eq('job_type', 'summarize');

  return summary;
}

export async function runTts(policy_id: string): Promise<void> {
  const serviceRole = createServiceRoleClient();

  await serviceRole
    .from('processing_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('policy_id', policy_id)
    .eq('job_type', 'tts');

  const { data: policy, error: fetchError } = await serviceRole
    .from('policies')
    .select('summary, title')
    .eq('id', policy_id)
    .single();

  if (fetchError || !policy) {
    await serviceRole
      .from('processing_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('policy_id', policy_id)
      .eq('job_type', 'tts');
    await serviceRole
      .from('policies')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', policy_id);
    throw new Error(`Failed to fetch policy: ${fetchError?.message ?? 'not found'}`);
  }

  if (!policy.summary) {
    await serviceRole
      .from('processing_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('policy_id', policy_id)
      .eq('job_type', 'tts');
    await serviceRole
      .from('policies')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', policy_id);
    throw new Error('Policy has no summary — run summarize first');
  }

  let audioBuffer: Buffer;
  try {
    audioBuffer = await generateSpeech(policy.summary);
  } catch (err) {
    await serviceRole
      .from('processing_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('policy_id', policy_id)
      .eq('job_type', 'tts');
    await serviceRole
      .from('policies')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', policy_id);
    throw err;
  }

  const sanitizedTitle = policy.title.replace(/[^a-zA-Z0-9._-]/g, '_');
  const audioFilename = `policies/${policy_id}/${sanitizedTitle}_summary.mp3`;

  const { error: uploadError } = await serviceRole.storage
    .from('policy-audio')
    .upload(audioFilename, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (uploadError) {
    await serviceRole
      .from('processing_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('policy_id', policy_id)
      .eq('job_type', 'tts');
    await serviceRole
      .from('policies')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', policy_id);
    throw new Error(`Failed to upload audio: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = serviceRole.storage.from('policy-audio').getPublicUrl(audioFilename);

  await serviceRole
    .from('policies')
    .update({
      audio_url: publicUrl,
      status: 'ready',
      updated_at: new Date().toISOString(),
    })
    .eq('id', policy_id);

  await serviceRole
    .from('processing_jobs')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('policy_id', policy_id)
    .eq('job_type', 'tts');
}
