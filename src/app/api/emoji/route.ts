import { NextRequest, NextResponse } from 'next/server';
import { GroqClient } from '@/services/groqClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    console.log('🎵 Emoji API Request:', {
      transcript: transcript.substring(0, 100) + '...'
    });

    const groqClient = new GroqClient();
    const emoji = await groqClient.detectEmojiFromTranscript(transcript);

    console.log('🎵 Emoji API Response:', {
      transcript: transcript.substring(0, 100) + '...',
      detectedEmoji: emoji
    });

    return NextResponse.json({
      success: true,
      emoji,
      debug: {
        inputTranscript: transcript.substring(0, 100) + '...',
        detectedEmoji: emoji
      }
    });

  } catch (error) {
    console.error('❌ Emoji API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to detect emoji',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 