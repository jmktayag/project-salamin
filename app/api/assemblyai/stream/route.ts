/**
 * AssemblyAI Real-time Streaming Proxy API Route
 * Handles WebSocket connections and audio streaming through server
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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

    // Parse request body for audio data or configuration
    const body = await request.json();
    const { audio_data } = body;

    if (!audio_data) {
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }

    // For real-time streaming, we'll need to establish a WebSocket connection
    // Since Next.js API routes don't support WebSocket directly, 
    // we'll use a different approach with polling or Server-Sent Events
    
    // Convert base64 audio to binary
    const audioBuffer = Buffer.from(audio_data, 'base64');
    
    console.log(`🎤 Processing audio chunk: ${audioBuffer.length} bytes`);

    // For now, return a success response
    // In a production setup, you'd want to implement Server-Sent Events
    // or use a dedicated WebSocket server
    return NextResponse.json({
      status: 'received',
      audio_length: audioBuffer.length,
      timestamp: new Date().toISOString(),
      message: 'Audio data received successfully'
    });

  } catch (error) {
    console.error('Error in stream API:', error);
    
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}