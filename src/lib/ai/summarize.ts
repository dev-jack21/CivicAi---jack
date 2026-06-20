import { GoogleGenerativeAI } from '@google/generative-ai';

const MAX_CHUNK_SIZE = 2000;
const MAX_SUMMARY_WORDS = 800;

const SYSTEM_PROMPT = `You are a plain-language government policy expert for Kenya.
Simplify the following policy document for a general Kenyan citizen.
Use short sentences. Avoid jargon. Be factual and neutral.
Output in 3 sections: Key Points (bullet list), What This Means for You, Next Steps.
Keep the entire summary under ${MAX_SUMMARY_WORDS} words.`;

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Add it to your .env.local file.');
  }
  return new GoogleGenerativeAI(apiKey);
}

function trimToWordLimit(text: string): string {
  const words = text.split(/\s+/);
  if (words.length <= MAX_SUMMARY_WORDS) return text;
  return words.slice(0, MAX_SUMMARY_WORDS).join(' ') + '\n\n*[trimmed to meet length limit]*';
}

function chunkText(text: string, maxTokens: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current: string[] = [];

  for (const word of words) {
    current.push(word);
    if (current.length >= maxTokens) {
      chunks.push(current.join(' '));
      current = [];
    }
  }
  if (current.length > 0) {
    chunks.push(current.join(' '));
  }
  return chunks;
}

async function generateWithRetry(
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  content: string,
  maxRetries = 3
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(content);
      const response = result.response;
      const text = response.text();
      if (!text) {
        throw new Error('Empty response');
      }
      return text;
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (
        message.includes('429') ||
        message.includes('Too Many Requests') ||
        message.includes('quota')
      ) {
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 2000;
          console.warn(
            `Gemini rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }
      throw err;
    }
  }
  throw new Error('Gemini failed after all retries');
}

export async function summarizeText(text: string): Promise<string> {
  if (!text || text.trim().length < 50) {
    throw new Error('Text is too short to summarize (minimum 50 characters required)');
  }

  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const chunks = chunkText(text, MAX_CHUNK_SIZE);
  const summaries: string[] = [];

  for (const chunk of chunks) {
    const summary = await generateWithRetry(model, chunk);
    summaries.push(summary);
  }

  if (summaries.length === 1) {
    return trimToWordLimit(summaries[0]);
  }

  const model2 = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `You are a plain-language government policy expert for Kenya.
Combine the following partial summaries of a policy document into one cohesive summary.
Output in 3 sections: Key Points (bullet list), What This Means for You, Next Steps.
Keep the entire summary under ${MAX_SUMMARY_WORDS} words.`,
  });

  const combined = await generateWithRetry(model2, summaries.join('\n\n---\n\n'));
  return trimToWordLimit(combined);
}
