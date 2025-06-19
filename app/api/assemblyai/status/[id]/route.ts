/**
 * AssemblyAI Transcription Status API Route
 * Polls transcription status and retrieves results
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get API key from environment (server-side only)
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    
    if (!apiKey) {
      console.error('AssemblyAI API key not found in environment variables');
      return NextResponse.json(
        { error: 'AssemblyAI API key not configured' },
        { status: 500 }
      );
    }

    const transcriptId = params.id;

    if (!transcriptId) {
      return NextResponse.json(
        { error: 'Transcript ID is required' },
        { status: 400 }
      );
    }

    // Get transcription status from AssemblyAI
    const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      method: 'GET',
      headers: {
        'authorization': apiKey,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get transcription status:', errorText);
      return NextResponse.json(
        { error: 'Failed to get transcription status', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log(`📊 Transcription ${transcriptId} status: ${data.status}`);

    // Return relevant fields based on status
    if (data.status === 'completed') {
      return NextResponse.json({
        id: data.id,
        status: data.status,
        text: data.text,
        confidence: data.confidence,
        words: data.words,
        audio_duration: data.audio_duration,
        language_code: data.language_code,
        updated: new Date().toISOString()
      });
    } else if (data.status === 'error') {
      return NextResponse.json({
        id: data.id,
        status: data.status,
        error: data.error,
        updated: new Date().toISOString()
      });
    } else {
      // queued, processing
      return NextResponse.json({
        id: data.id,
        status: data.status,
        updated: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error in status API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}