import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'questions.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const questions = JSON.parse(fileData);
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to read questions dataset' }, { status: 500 });
  }
}
