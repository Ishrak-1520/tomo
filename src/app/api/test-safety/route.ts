import { NextResponse } from 'next/server';
import { runSafetyPipeline } from '@/lib/safety/pipeline';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await runSafetyPipeline(message);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Safety test API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
