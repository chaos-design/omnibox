import { NextResponse } from 'next/server';
import { compile } from 'json-schema-to-typescript';

export type CompileParameters = Parameters<typeof compile>[0];

function convertJsonToSchema(json: any): CompileParameters {
  return {
    type: 'object',
    properties: Object.keys(json).reduce(
      (acc, key) => {
        const value = json[key];
        let type;
        if (Array.isArray(value)) {
          type = 'array';
          if (value.length > 0) {
            acc[key] = {
              type: 'array',
              items: convertJsonToSchema(value[0]),
            };
          } else {
            acc[key] = {
              type: 'array',
              items: {},
            };
          }
        } else if (typeof value === 'object' && value !== null) {
          acc[key] = convertJsonToSchema(value);
        } else {
          type = typeof value;
          acc[key] = { type };
        }
        return acc;
      },
      {} as Record<string, any>,
    ),
  };
}

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
    const {
      json,
      interfaceName = 'JsonToTs',
      splitTypes = true,
    } = await request.json();

    if (!json) {
      return NextResponse.json(
        { error: 'Missing json in request body' },
        { status: 400 },
      );
    }

    const jsonObj = JSON.parse(json);
    const jsonSchema = convertJsonToSchema(jsonObj);

    const compileOptions = {
      bannerComment: '',
      unreachableDefinitions: splitTypes,
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
