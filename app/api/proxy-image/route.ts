import { NextRequest } from "next/server";

function isBlockedHost(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (normalized === "localhost" || normalized.endsWith(".local")) {
    return true;
  }

  if (normalized === "127.0.0.1" || normalized === "::1") {
    return true;
  }

  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(normalized)) {
    return true;
  }

  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(normalized)) {
    return true;
  }

  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(normalized)) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  if (!urlParam || !URL.canParse(urlParam)) {
    return Response.json({ error: "A valid url query parameter is required" }, { status: 400 });
  }

  const targetUrl = new URL(urlParam);
  if (!["http:", "https:"].includes(targetUrl.protocol)) {
    return Response.json({ error: "Only http and https URLs are allowed" }, { status: 400 });
  }

  if (isBlockedHost(targetUrl.hostname)) {
    return Response.json({ error: "Blocked host" }, { status: 400 });
  }

  const upstreamResponse = await fetch(targetUrl.toString(), {
    cache: "no-store",
    headers: {
      accept: "image/*,*/*;q=0.8",
      "user-agent": "catalog-image-proxy",
    },
  });

  if (!upstreamResponse.ok) {
    return Response.json({ error: "Failed to fetch image" }, { status: upstreamResponse.status });
  }

  const contentType = upstreamResponse.headers.get("content-type") ?? "application/octet-stream";
  const arrayBuffer = await upstreamResponse.arrayBuffer();

  return new Response(arrayBuffer, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=3600",
    },
  });
}
