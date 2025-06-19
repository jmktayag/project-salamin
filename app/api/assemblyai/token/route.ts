/**
 * AssemblyAI Temporary Token API Route
 * Generates temporary tokens for browser-based streaming transcription
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get API key from environment (server-side only)
    const apiKey = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY || process.env.ASSEMBLYAI_API_KEY;
    
    if (!apiKey) {
      console.error('AssemblyAI API key not found in environment variables');
      return NextResponse.json(
        { error: 'AssemblyAI API key not configured' },
        { status: 500 }
      );
    }

    // Parse request body for token options
    const body = await request.json().catch(() => ({}));
    const { expires_in = 3600 } = body; // Default 1 hour expiration

    // Generate temporary token using AssemblyAI API
    const tokenResponse = await fetch('https://api.assemblyai.com/v2/realtime/token', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        expires_in: expires_in
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to generate AssemblyAI token:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
        apiKeyLength: apiKey?.length || 0,
        requestBody: JSON.stringify({ expires_in })
      });

      // Check for specific error types
      const errorData = JSON.parse(errorText || '{}');
      const isPaidFeatureError = errorData.error?.includes('paid-only') || 
                                errorData.error?.includes('credit card');
      
      return NextResponse.json(
        { 
          error: 'Failed to generate temporary token',
          details: errorText,
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          isPaidFeatureError,
          fallbackRequired: isPaidFeatureError
        },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();
    
    console.log('✅ Generated AssemblyAI temporary token successfully');
    
    return NextResponse.json({
      token: tokenData.token,
      expires_in: expires_in,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating AssemblyAI token:', error);
    
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