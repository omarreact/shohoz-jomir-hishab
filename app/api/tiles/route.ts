import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const x = searchParams.get('x');
    const y = searchParams.get('y');
    const z = searchParams.get('z');
    const token = searchParams.get('token');

    if (!service || !x || !y || !z) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const rajukUrl = `https://masterplan.rajuk.gov.bd/server/rest/services/${service}/MapServer/tile/${z}/${y}/${x}${token ? `?token=${token}` : ''}`;

    const response = await fetch(rajukUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/png,image/jpeg,image/*,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch tile: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Rajuk tiles are typically PNG or JPEG
    const contentType = response.headers.get('content-type') || 'image/png';

    // Set aggressive caching headers:
    // public: cacheable by CDN and browser
    // max-age: browser cache for 1 day
    // s-maxage: CDN cache for 30 days
    // stale-while-revalidate: allow serving stale for 7 days while fetching fresh
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800, immutable');
    
    // Pass through useful headers from original response if present
    const etag = response.headers.get('etag');
    if (etag) {
      headers.set('ETag', etag);
    }
    const lastModified = response.headers.get('last-modified');
    if (lastModified) {
      headers.set('Last-Modified', lastModified);
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    console.error('Tile proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
