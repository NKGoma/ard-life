import { NextResponse } from 'next/server';

// Only allow base64/base64url-like IDs (prevents SSRF / injection).
// ARD media IDs are base64-encoded CRIDs, ~60-100 chars.
const ID_RE = /^[A-Za-z0-9_\-=+/]{10,300}$/;

interface Stream { url: string; type: string; }

interface MediaEntry {
  mimeType?: string;
  url?: string;
  maxVResolutionPx?: number;
}

interface StreamEntry {
  media?: MediaEntry[];
}

interface ARDResponse {
  streams?: StreamEntry[];
}

function extractStreams(data: ARDResponse): Stream[] {
  const result: Stream[] = [];
  for (const stream of data.streams ?? []) {
    for (const m of stream.media ?? []) {
      if (typeof m.url === 'string' && m.url.startsWith('https://')) {
        result.push({ url: m.url, type: m.mimeType ?? '' });
      }
    }
  }
  return result;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') ?? '';

  if (!ID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const apiUrl =
      `https://api.ardmediathek.de/page-gateway/mediacollectionv6/` +
      `${encodeURIComponent(id)}?devicetype=pc`;

    const res = await fetch(apiUrl, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `ARD API ${res.status}` }, { status: 502 });
    }

    const data = await res.json() as ARDResponse;
    const streams = extractStreams(data);

    if (streams.length === 0) {
      return NextResponse.json({ error: 'No streams found' }, { status: 502 });
    }

    return NextResponse.json({ streams });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

