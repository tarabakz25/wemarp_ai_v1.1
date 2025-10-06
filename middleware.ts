import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Example: Log the request method and URL
  console.log(`Request Method: ${request.method}, Request URL: ${request.url}`);

  // Example: Add a custom header to the response
  const response = NextResponse.next();
  response.headers.set('X-Custom-Header', 'MyCustomHeaderValue');

  return response;
}
