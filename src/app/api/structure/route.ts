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

    console.log('📊 Structure API Request:', {
      transcript: transcript.substring(0, 100) + '...'
    });

    const groqClient = new GroqClient();
    const structuredData = await groqClient.structureTranscript(transcript);

    console.log('📊 Structure API Response:', {
      transcriptLength: transcript.length,
      structuredDataKeys: structuredData ? Object.keys(structuredData) : null
    });

    return NextResponse.json({
      success: true,
      structuredData,
      debug: {
        inputTranscriptLength: transcript.length,
        outputStructureKeys: structuredData ? Object.keys(structuredData) : null
      }
    });

  } catch (error) {
    console.error('❌ Structure API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to structure transcript',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 