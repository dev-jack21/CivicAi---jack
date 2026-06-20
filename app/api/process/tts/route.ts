import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'TTS generation started' }, { status: 202 });
}
