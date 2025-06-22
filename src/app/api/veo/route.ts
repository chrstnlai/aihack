import { NextRequest, NextResponse } from 'next/server';
import { veoClient } from '@/services/veoClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, options } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Veo API Request:', {
      transcript: transcript.substring(0, 100) + '...',
      options
    });

    // Call the Veo client
    const videoUrls = await veoClient.generateVideo(transcript, options);

    console.log('📹 Veo API Response - Video URLs:', videoUrls);
    console.log('📊 Veo API Response - Count:', videoUrls.length);

    return NextResponse.json({
      success: true,
      videoUrls,
      message: `Generated ${videoUrls.length} video(s) successfully`,
      debug: {
        requestTranscript: transcript.substring(0, 100) + '...',
        requestOptions: options,
        responseCount: videoUrls.length
      }
    });

  } catch (error) {
    console.error('❌ Veo API Error:', error);
    console.error('❌ Veo API Error Details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to generate video',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          errorName: error instanceof Error ? error.name : 'Unknown',
          errorStack: error instanceof Error ? error.stack : undefined
        }
      },
      { status: 500 }
    );
  }
} 