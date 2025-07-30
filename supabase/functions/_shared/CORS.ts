/**
 * Shared CORS headers for Supabase Edge Functions
 * 
 * These headers allow cross-origin requests from any domain and support
 * common HTTP methods used in web applications.
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
} as const;

/**
 * Helper function to create a Response with CORS headers
 * @param body - Response body (will be JSON stringified if not a string)
 * @param options - Response options (status, additional headers, etc.)
 * @returns Response with CORS headers applied
 */
export function createCORSResponse(
  body: unknown,
  options: {
    status?: number;
    headers?: Record<string, string>;
  } = {}
): Response {
  const { status = 200, headers = {} } = options;
  
  const responseBody = typeof body === 'string' ? body : JSON.stringify(body);
  
  return new Response(responseBody, {
    status,
    headers: {
      ...CORS_HEADERS,
      ...headers,
    },
  });
}

/**
 * Helper function to handle OPTIONS requests for CORS preflight
 * @returns Response with CORS headers for preflight requests
 */
export function handleCORSPreflight(): Response {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
