import { fetchWithAuth } from '@/lib/fetchWithAuth';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handleRequest(request: Request, { params }: RouteContext) {
  const { path } = await params;
  const backendPath = `/api/${path.join('/')}`;

  const { searchParams } = new URL(request.url);
  const url = searchParams.toString() ? `${backendPath}?${searchParams}` : backendPath;

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const reqContentType = request.headers.get('Content-Type');
  const requestBody = hasBody
    ? reqContentType?.includes('multipart/form-data')
      ? await request.arrayBuffer()
      : await request.text()
    : undefined;

  try {
    const res = await fetchWithAuth(url, {
      method: request.method,
      ...(requestBody !== undefined && {
        headers: { 'Content-Type': reqContentType ?? 'application/json' },
        body: requestBody,
      }),
    });

    const contentType = res.headers.get('Content-Type') ?? '';

    if (contentType.includes('application/json')) {
      const data = await res.json();
      return Response.json(data, { status: res.status });
    }

    const responseBody = await res.arrayBuffer();
    return new Response(responseBody, {
      status: res.status,
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    console.error(`[BFF] ${request.method} ${backendPath} failed:`, error);
    return Response.json({ status: 500, message: '서버와 통신 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export {
  handleRequest as GET,
  handleRequest as POST,
  handleRequest as PUT,
  handleRequest as PATCH,
  handleRequest as DELETE,
};
