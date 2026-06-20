import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'File uploaded' }, { status: 201 });
}
