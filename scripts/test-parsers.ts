import { parsePDF, PDFParseError } from '../src/lib/parsers/pdf';
import { parseDOCX, DOCXParseError } from '../src/lib/parsers/docx';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const PASS = '\x1b[32;1mPASS\x1b[0m';
const FAIL = '\x1b[31;1mFAIL\x1b[0m';
const INFO = '\x1b[34mℹ\x1b[0m';

let failures = 0;
let tests_run = 0;

async function runTest(name: string, fn: () => Promise<void>) {
  tests_run++;
  try {
    await fn();
    console.log(`  ${PASS}  ${name}`);
  } catch (e) {
    console.log(`  ${FAIL}  ${name}: ${e instanceof Error ? e.message : e}`);
    failures++;
  }
}

async function createMultiPagePDF(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let pageNum = 1; pageNum <= 3; pageNum++) {
    const page = pdfDoc.addPage([612, 792]);
    const content = [
      `Page ${pageNum} — Kenya Health Sector Strategic Plan 2024-2028`,
      '',
      'The Kenyan health sector has undergone significant transformation over the past decade.',
      'This strategic plan outlines key priorities and interventions for the period 2024-2028.',
      'It builds on previous achievements while addressing emerging challenges.',
      '',
      'Priority Area 1: Universal Health Coverage',
      'The government aims to achieve universal health coverage by 2028.',
      'This includes expanding access to primary healthcare across all 47 counties.',
      'Special focus will be given to rural and marginalized communities.',
      '',
      'Priority Area 2: Digital Health Transformation',
      'Investment in health information systems and telemedicine infrastructure.',
      'Electronic medical records will be implemented in all public health facilities.',
      'Mobile health platforms will be expanded to reach remote populations.',
      '',
      'Priority Area 3: Health Workforce Development',
      'Recruitment and training of 10,000 additional healthcare workers.',
      'Continuing professional development programs will be strengthened.',
      'Incentive schemes will be introduced for workers in hard-to-reach areas.',
      '',
      `--- End of Page ${pageNum} ---`,
    ].join('\n');
    page.drawText(content, {
      x: 50,
      y: 700,
      size: 11,
      font: helv,
      lineHeight: 16,
      maxWidth: 500,
    });
  }

  return Buffer.from(await pdfDoc.save());
}

async function createImageOnlyPDF(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const redPixel = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x03, 0x00, 0x01, 0x36, 0x28, 0x19, 0x00, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
    0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  const pngImage = await pdfDoc.embedPng(redPixel);
  page.drawImage(pngImage, { x: 0, y: 0, width: 1, height: 1 });
  return Buffer.from(await pdfDoc.save());
}

async function createDOCXBuffer(): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun(
                "The Data Protection Act, 2019 is Kenya's primary data privacy legislation."
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'It establishes the Office of the Data Protection Commissioner and sets rules for processing personal data.'
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Key principles include consent, data minimization, and purpose limitation.'
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Public participation under Article 118 of the Constitution requires that Parliament conduct its business openly and involve the public in legislative processes.'
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'This includes public hearings, submission of memoranda, and stakeholder consultations.'
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun('Section 5 outlines the procedures for data breach notification.'),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Data controllers must notify the Commissioner within 72 hours of becoming aware of a breach.'
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'The Act represents a significant step forward for digital rights in Kenya.'
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun('Citizens are encouraged to exercise their rights under the Act.'),
            ],
          }),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

async function main() {
  console.log(`\n${INFO} CivicAI Parser Tests\n`);
  console.log('─'.repeat(55));

  // Test 1: Multi-page PDF with real text content
  await runTest('parsePDF  — multi-page PDF extracts text', async () => {
    const buffer = await createMultiPagePDF();
    console.log(`        buffer: ${(buffer.length / 1024).toFixed(0)} KB, 3 pages`);
    const text = await parsePDF(buffer);
    if (text.length < 500) throw new Error(`Too short (${text.length} chars)`);
    console.log(`        output: ${text.length} chars`);
    const hasPage2 = text.includes('Page 2');
    console.log(`        multi-page: ${hasPage2 ? 'yes' : 'check sample'}`);
    console.log(`        sample: ${text.slice(0, 200).replace(/\n/g, ' ')}...`);
  });

  // Test 2: DOCX file
  await runTest('parseDOCX — DOCX file extracts text', async () => {
    const buffer = await createDOCXBuffer();
    console.log(`        buffer: ${(buffer.length / 1024).toFixed(0)} KB`);
    const text = await parseDOCX(buffer);
    if (text.length < 100) throw new Error(`Too short (${text.length} chars)`);
    console.log(`        output: ${text.length} chars`);
    console.log(`        sample: ${text.slice(0, 200).replace(/\n/g, ' ')}...`);
  });

  // Test 3: Image-only PDF → NO_TEXT error
  await runTest('parsePDF  — image-only PDF throws NO_TEXT', async () => {
    const buffer = await createImageOnlyPDF();
    try {
      await parsePDF(buffer);
      throw new Error('Expected PDFParseError but none was thrown');
    } catch (e) {
      if (!(e instanceof PDFParseError) || e.code !== 'NO_TEXT') throw e;
    }
  });

  // Test 4: Empty PDF buffer → EMPTY_BUFFER error
  await runTest('parsePDF  — empty buffer throws EMPTY_BUFFER', async () => {
    try {
      await parsePDF(Buffer.from([]));
      throw new Error('Expected PDFParseError but none was thrown');
    } catch (e) {
      if (!(e instanceof PDFParseError) || e.code !== 'EMPTY_BUFFER') throw e;
    }
  });

  // Test 5: Empty DOCX buffer → EMPTY_BUFFER error
  await runTest('parseDOCX — empty buffer throws EMPTY_BUFFER', async () => {
    try {
      await parseDOCX(Buffer.from([]));
      throw new Error('Expected DOCXParseError but none was thrown');
    } catch (e) {
      if (!(e instanceof DOCXParseError) || e.code !== 'EMPTY_BUFFER') throw e;
    }
  });

  // Test 6: Corrupted DOCX → PARSE_FAILED
  await runTest('parseDOCX — corrupted buffer throws PARSE_FAILED', async () => {
    try {
      await parseDOCX(Buffer.from([0, 1, 2, 3]));
      throw new Error('Expected DOCXParseError but none was thrown');
    } catch (e) {
      if (!(e instanceof DOCXParseError) || e.code !== 'PARSE_FAILED') throw e;
    }
  });

  // Test 7: Corrupted PDF → PARSE_FAILED
  await runTest('parsePDF  — corrupted buffer throws PARSE_FAILED', async () => {
    try {
      await parsePDF(Buffer.from([0, 1, 2, 3]));
      throw new Error('Expected PDFParseError but none was thrown');
    } catch (e) {
      if (!(e instanceof PDFParseError) || e.code !== 'PARSE_FAILED') throw e;
    }
  });

  console.log('\n' + '─'.repeat(55));
  if (failures === 0) {
    console.log(`\n\u001b[32;1m✓ All ${tests_run} parser tests passed\u001b[0m\n`);
  } else {
    console.log(`\n\u001b[31;1m✗ ${failures}/${tests_run} test(s) failed\u001b[0m\n`);
    process.exit(1);
  }
}

main();
