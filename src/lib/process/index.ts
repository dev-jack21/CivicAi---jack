import { createServiceRoleClient } from '@/lib/supabase/server';

export async function runSummarizeStub(policy_id: string) {
  const serviceRole = createServiceRoleClient();

  await serviceRole
    .from('processing_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('policy_id', policy_id)
    .eq('job_type', 'summarize');

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const placeholderSummary =
    '**Key Points**\n' +
    '- This policy outlines important government regulations for the relevant sector\n' +
    '- Implementation will be carried out by the respective ministry and local authorities\n' +
    '- Citizens are encouraged to participate in the public feedback process\n\n' +
    '**What This Means for You**\n' +
    'This policy affects how services are delivered to you. The government has designed ' +
    'these measures to improve accessibility and quality of public services. ' +
    'You may be eligible for new benefits or required to follow updated procedures.\n\n' +
    '**Next Steps**\n' +
    '1. Read the full policy document for detailed information\n' +
    '2. Submit your feedback using the form on this page\n' +
    '3. Stay informed about implementation timelines in your area';

  await serviceRole
    .from('policies')
    .update({
      summary: placeholderSummary,
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', policy_id);

  await serviceRole
    .from('processing_jobs')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('policy_id', policy_id)
    .eq('job_type', 'summarize');

  return placeholderSummary;
}

export async function runTtsStub(policy_id: string) {
  const serviceRole = createServiceRoleClient();

  await serviceRole
    .from('processing_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('policy_id', policy_id)
    .eq('job_type', 'tts');

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const placeholderAudioUrl = 'https://storage.googleapis.com/placeholder/policy-audio/sample.mp3';

  await serviceRole
    .from('policies')
    .update({
      audio_url: placeholderAudioUrl,
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
