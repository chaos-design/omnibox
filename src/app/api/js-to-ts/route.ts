import { NextResponse } from 'next/server';
import { compile } from 'json-schema-to-typescript';
import { json2Schema } from '../../../utils/tools/json';

export type CompileParameters = Parameters<typeof compile>[0];

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: Request) {
  try {
    const { json, interfaceName = 'JsonToTs' } = await request.json();

    if (!json) {
      return NextResponse.json(
        { error: 'Missing json in request body' },
        { status: 400 },
      );
    }

    const jsonSchema = await json2Schema(JSON.parse(json), interfaceName);

    const compileOptions = {
      bannerComment: '',
      declareExternallyReferenced: true,
      enableConstEnums: true,
      strictIndexSignatures: false,
      unreachableDefinitions: false,
    };

    const tsCode = await compile(jsonSchema, interfaceName, compileOptions);

    const response = NextResponse.json({ tsCode });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  } catch (error: any) {
    console.error('Error in js-to-ts API:', error);
    let errorMessage = 'Failed to convert JSON to TypeScript.';

    if (error instanceof SyntaxError) {
      errorMessage = 'Invalid JSON format.';
    } else if (error && typeof error.message === 'string') {
      errorMessage = error.message;
    }

    const response = NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
    response.headers.set('Access-Control-Allow-Origin', '*');

    return response;
  }
}
