/**
 * End-to-end pipeline timing test.
 *
 * Usage:
 *   npx tsx scripts/test-pipeline-timing.ts
 *
 * Requires:
 *   - .env.local with Supabase + Gemini credentials
 */

import { createServiceRoleClient } from '../src/lib/supabase/server';
import { runSummarize } from '../src/lib/process';
import { runTts } from '../src/lib/process';

const PASS = '\x1b[32;1mPASS\x1b[0m';
const FAIL = '\x1b[31;1mFAIL\x1b[0m';
const INFO = '\x1b[34mℹ\x1b[0m';
const WARN = '\x1b[33;1m⚠\x1b[0m';

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`  ${WARN}  Retry ${i + 1}/${retries}...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error('Unreachable');
}

async function main() {
  console.log(`\n${INFO} CivicAI Pipeline Timing Test\n`);
  console.log('─'.repeat(65));
  console.log(`  Testing: summarize → TTS (two separate function invocations)`);
  console.log(`  maxDuration: 60s each`);
  console.log('─'.repeat(65));

  // 1. Download a real-world multi-page policy PDF
  console.log(`\n${INFO} Step 1: Downloading real-world policy PDF...`);

  // Kenya Data Protection Act (public document from kenyalaw.org)
  const PDF_URLS = [
    'https://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/DataProtectionAct_2019.pdf',
    'https://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/PublicFinanceManagementAct_2012.pdf',
    'https://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/AccesstoInformationAct_2016.pdf',
  ];

  let pdfUrl: string | null = null;
  let pdfBuffer: Buffer | null = null;

  for (const url of PDF_URLS) {
    try {
      console.log(`  Trying: ${url}`);
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 50000) {
          pdfUrl = url;
          pdfBuffer = buf;
          console.log(`  ${PASS}  Downloaded: ${(buf.length / 1024).toFixed(0)} KB`);
          break;
        } else {
          console.log(`  ${WARN}  Too small (${buf.length} bytes), trying next...`);
        }
      } else {
        console.log(`  ${WARN}  HTTP ${res.status}, trying next...`);
      }
    } catch (err) {
      console.log(`  ${WARN}  Fetch failed: ${err instanceof Error ? err.message : 'unknown'}, trying next...`);
    }
  }

  if (!pdfBuffer) {
    // Fallback: generate a multi-page synthetic PDF
    console.log(`  ${WARN}  No external PDF available — generating synthetic 10-page test document`);
    const { PDFDocument, StandardFonts } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    for (let pageNum = 1; pageNum <= 10; pageNum++) {
      const page = pdfDoc.addPage([612, 792]);
      const paragraphs = [
        `Page ${pageNum} — Kenya National Digital Transformation Strategy 2024-2028`,
        '',
        'The Government of Kenya has developed this comprehensive strategy to guide the country\'s digital transformation agenda over the next five years.',
        'This strategy aligns with Kenya Vision 2030 and the Bottom-Up Economic Transformation Agenda (BETA).',
        '',
        'Pillar 1: Digital Infrastructure',
        'Expand broadband connectivity to all 47 counties through fiber optic and wireless technologies.',
        'Establish 1,450 digital villages with free public Wi-Fi hotspots in market centers.',
        'Deploy 5G networks in urban areas and enhance 4G coverage in rural regions.',
        'Invest in submarine cable redundancy to ensure reliable international connectivity.',
        '',
        'Pillar 2: Digital Government Services',
        'Migrate 80% of government services online through the e-Citizen platform by 2026.',
        'Implement interoperable digital identity system (Huduma Namba 2.0) for all citizens.',
        'Digitize land registries across all 47 counties to reduce corruption and transaction times.',
        'Create a unified government data center with robust disaster recovery capabilities.',
        '',
        'Pillar 3: Digital Skills & Innovation',
        'Train 1 million citizens in basic digital literacy through the Ajira Digital Program.',
        'Integrate coding and computational thinking into primary and secondary school curricula.',
        'Establish 100 innovation hubs across the country to support tech startups.',
        'Create a national digital talent registry to match skills with employment opportunities.',
        '',
        'Pillar 4: Data Protection & Cybersecurity',
        'Fully implement the Data Protection Act, 2019 with an independent Office of the Data Protection Commissioner.',
        'Establish a National Cybersecurity Operations Center for threat monitoring and incident response.',
        'Mandate data breach notification within 72 hours for all data controllers and processors.',
        'Develop sector-specific data protection guidelines for healthcare, finance, and education.',
        '',
        'Pillar 5: Digital Financial Inclusion',
        'Expand mobile money interoperability across all financial service providers.',
        'Reduce the cost of digital transactions to below 1% of transaction value.',
        'Promote open banking APIs to foster innovation in financial technology.',
        'Ensure 90% of adults have access to formal financial services through digital channels.',
        '',
        'Implementation Framework',
        'The strategy will be implemented through annual action plans coordinated by the Ministry of Information, Communications and the Digital Economy.',
        'A multi-stakeholder steering committee will provide oversight comprising government, private sector, civil society, and development partners.',
        'Progress will be measured through quarterly reviews and an annual Digital Transformation Index.',
        'The estimated total investment required is KES 450 billion over five years, with funding from the national budget, development partners, and public-private partnerships.',
        '',
        'Monitoring and Evaluation',
        'Key performance indicators include: internet penetration rate, e-government service uptake, digital literacy levels, cybersecurity incident response times, and digital financial inclusion metrics.',
        'An independent evaluator will conduct a mid-term review in 2026 and a final evaluation in 2028.',
        'Quarterly progress reports will be published on the ministry website for public scrutiny.',
        'Citizens can provide feedback through the e-Citizen portal and public participation forums.',
      ];
      page.drawText(paragraphs.join('\n'), {
        x: 50,
        y: 720,
        size: 10,
        font: helv,
        lineHeight: 14,
        maxWidth: 500,
      });
    }
    pdfBuffer = Buffer.from(await pdfDoc.save());
    console.log(`  ${PASS}  Synthetic PDF: ${(pdfBuffer.length / 1024).toFixed(0)} KB, 10 pages`);
  }

  // 2. Create a test policy directly via service role
  console.log(`\n${INFO} Step 2: Creating test policy...`);
  const serviceRole = createServiceRoleClient();

  // Upload the PDF to Supabase Storage
  const testFilename = `test-timing-${Date.now()}.pdf`;
  const { error: uploadError } = await serviceRole.storage
    .from('policy-documents')
    .upload(testFilename, pdfBuffer, { contentType: 'application/pdf' });

  if (uploadError) {
    console.log(`  ${FAIL}  Storage upload failed: ${uploadError.message}`);
    process.exit(1);
  }
  console.log(`  ${PASS}  Uploaded to storage: ${testFilename}`);

  const { data: { publicUrl } } = serviceRole.storage
    .from('policy-documents')
    .getPublicUrl(testFilename);

  const { data: policy, error: policyError } = await serviceRole
    .from('policies')
    .insert({
      title: `TEST — Pipeline Timing ${new Date().toISOString()}`,
      ministry: 'Ministry of Testing',
      category_id: 1,
      description: 'Automated timing test document',
      document_url: publicUrl,
      document_type: 'pdf',
      status: 'pending',
      uploaded_by: null,
    })
    .select('id')
    .single();

  if (policyError || !policy) {
    console.log(`  ${FAIL}  Policy creation failed: ${policyError?.message ?? 'unknown'}`);
    process.exit(1);
  }
  console.log(`  ${PASS}  Policy created: ${policy.id}`);

  // Create processing_jobs rows
  await serviceRole.from('processing_jobs').insert([
    { policy_id: policy.id, job_type: 'summarize', status: 'pending' },
    { policy_id: policy.id, job_type: 'tts', status: 'pending' },
  ]);

  // 3. Time the summarize step
  console.log(`\n${INFO} Step 3: Running summarize (maxDuration 60s)...`);
  console.log(`  ${INFO}  Start: ${new Date().toISOString()}`);
  const summarizeStart = Date.now();

  let summary: string;
  try {
    summary = await runSummarize(policy.id);
    const summarizeDuration = ((Date.now() - summarizeStart) / 1000).toFixed(1);
    console.log(`  ${PASS}  Summarize completed in ${summarizeDuration}s`);
    console.log(`  ${INFO}  Summary length: ${summary.length} chars`);
    console.log(`  ${INFO}  First 120 chars: ${summary.slice(0, 120).replace(/\n/g, ' ')}...`);

    if (parseFloat(summarizeDuration) > 40) {
      console.log(`  ${WARN}  ⚠️  Summarize took ${summarizeDuration}s — exceeds 40s threshold!`);
    }
    if (parseFloat(summarizeDuration) > 55) {
      console.log(`  ${FAIL}  ❌ Summarize took ${summarizeDuration}s — dangerously close to 60s maxDuration!`);
    }
  } catch (err) {
    const summarizeDuration = ((Date.now() - summarizeStart) / 1000).toFixed(1);
    console.log(`  ${FAIL}  Summarize failed after ${summarizeDuration}s: ${err instanceof Error ? err.message : err}`);
    await cleanup(serviceRole, policy.id, testFilename);
    process.exit(1);
  }

  // 4. Time the TTS step
  console.log(`\n${INFO} Step 4: Running TTS (maxDuration 60s)...`);
  console.log(`  ${INFO}  Start: ${new Date().toISOString()}`);
  const ttsStart = Date.now();

  try {
    await runTts(policy.id);
    const ttsDuration = ((Date.now() - ttsStart) / 1000).toFixed(1);
    console.log(`  ${PASS}  TTS completed in ${ttsDuration}s`);

    if (parseFloat(ttsDuration) > 40) {
      console.log(`  ${WARN}  ⚠️  TTS took ${ttsDuration}s — exceeds 40s threshold!`);
    }
    if (parseFloat(ttsDuration) > 55) {
      console.log(`  ${FAIL}  ❌ TTS took ${ttsDuration}s — dangerously close to 60s maxDuration!`);
    }
  } catch (err) {
    const ttsDuration = ((Date.now() - ttsStart) / 1000).toFixed(1);
    console.log(`  ${FAIL}  TTS failed after ${ttsDuration}s: ${err instanceof Error ? err.message : err}`);
    await cleanup(serviceRole, policy.id, testFilename);
    process.exit(1);
  }

  // 5. Verify final state
  console.log(`\n${INFO} Step 5: Verifying final state...`);
  const { data: finalPolicy } = await serviceRole
    .from('policies')
    .select('status, summary, audio_url')
    .eq('id', policy.id)
    .single();

  if (finalPolicy?.status === 'ready' && finalPolicy.summary && finalPolicy.audio_url) {
    console.log(`  ${PASS}  Policy status: ${finalPolicy.status}`);
    console.log(`  ${PASS}  Summary: ${finalPolicy.summary.slice(0, 60).replace(/\n/g, ' ')}...`);
    console.log(`  ${PASS}  Audio URL: ${finalPolicy.audio_url}`);
  } else {
    console.log(`  ${FAIL}  Policy state: ${JSON.stringify(finalPolicy)}`);
  }

  // 6. Check processing_jobs
  const { data: jobs } = await serviceRole
    .from('processing_jobs')
    .select('job_type, status, started_at, completed_at')
    .eq('policy_id', policy.id);

  if (jobs) {
    console.log(`\n${INFO} Processing jobs:`);
    for (const job of jobs) {
      const duration = job.started_at && job.completed_at
        ? ((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000).toFixed(1)
        : 'N/A';
      console.log(`  ${job.job_type}: status=${job.status}, duration=${duration}s`);
    }
  }

  // Cleanup
  console.log(`\n${INFO} Cleaning up test data...`);
  await cleanup(serviceRole, policy.id, testFilename);
  console.log(`  ${PASS}  Cleanup complete`);
  console.log('\n' + '─'.repeat(65));
  console.log(`  ${PASS}  Pipeline timing test complete`);
  console.log('─'.repeat(65));
}

async function cleanup(serviceRole: ReturnType<typeof createServiceRoleClient>, policyId: string, filename: string) {
  try {
    await serviceRole.from('processing_jobs').delete().eq('policy_id', policyId);
    await serviceRole.from('policies').delete().eq('id', policyId);
    await serviceRole.storage.from('policy-documents').remove([filename]);
  } catch {
    // best effort cleanup
  }
}

main().catch((err) => {
  console.error(`\n${FAIL}  Fatal error:`, err);
  process.exit(1);
});
