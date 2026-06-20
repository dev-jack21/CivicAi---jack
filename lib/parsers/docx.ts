import mammoth from 'mammoth';

export async function parseDOCX(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}
