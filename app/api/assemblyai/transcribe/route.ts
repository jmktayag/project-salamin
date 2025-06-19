/**
 * AssemblyAI File Transcription API Route
 * Handles file uploads and transcription through server-side AssemblyAI calls
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

    // Parse form data for file upload
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const config = JSON.parse(formData.get('config') as string || '{}');

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await audioFile.arrayBuffer());

    console.log(`📁 Uploading audio file: ${audioFile.name} (${buffer.length} bytes)`);

    // Step 1: Upload file to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
      },
      body: buffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Failed to upload file to AssemblyAI:', errorText);
      return NextResponse.json(
        { error: 'Failed to upload file', details: errorText },
        { status: uploadResponse.status }
      );
    }

    const uploadData = await uploadResponse.json();
    const audioUrl = uploadData.upload_url;

    console.log(`✅ File uploaded successfully: ${audioUrl}`);

    // Step 2: Create transcription job
    const transcriptionConfig = {
      audio_url: audioUrl,
      language_code: config.language_code || 'en_us',
      punctuate: config.punctuate !== false,
      format_text: config.format_text !== false,
      speaker_labels: config.speaker_labels || false,
      ...config
    };

    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(transcriptionConfig)
    });

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error('Failed to create transcription job:', errorText);
      return NextResponse.json(
        { error: 'Failed to create transcription job', details: errorText },
        { status: transcriptResponse.status }
      );
    }

    const transcriptData = await transcriptResponse.json();
    
    console.log(`🎯 Transcription job created: ${transcriptData.id}`);

    return NextResponse.json({
      id: transcriptData.id,
      status: transcriptData.status,
      audio_url: audioUrl,
      created: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in transcribe API:', error);
    
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