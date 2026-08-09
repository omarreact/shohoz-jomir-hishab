/**
 * @deprecated This FeatureServer proxy is orphaned — no in-repo callers as of 2026-08.
 * Kept for backward compatibility with potential external consumers.
 * New code should use /api/unified or /api/tiles instead.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/src/modules/database/prisma";

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 3600000; // ১ ঘণ্টা
const POST_THRESHOLD = 1800;

async function loadRajukToken(): Promise<string> {
  const envToken = process.env.RAJUK_MAP_TOKEN;
  if (envToken) return envToken;

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "rajuk_api_token" },
    });
    if (!setting?.value) {
      throw new Error("Rajuk token is not configured");
    }
    return setting.value;
  } catch (err) {
    console.error("Failed to load Rajuk token from DB:", err);
    throw err;
  }
}

function parseQueryParams(source: URLSearchParams) {
  return {
    servicePath: source.get("servicePath"),
    layer: source.get("layer"),
    where: source.get("where"),
    outFields: source.get("outFields") || "*",
    offset: source.get("offset") || "0",
    operation:
      source.get("operation") !== null ? source.get("operation") : "query",
    geometry: source.get("geometry"),
    geometryType: source.get("geometryType"),
    spatialRel: source.get("spatialRel"),
    returnGeometry: source.get("returnGeometry") || "false",
    inSR: source.get("inSR"),
    outSR: source.get("outSR"),
  };
}

async function parseRequestBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json();
  }

  const text = await request.text();
  if (!text) return {};

  return Object.fromEntries(new URLSearchParams(text).entries());
}

function buildRajukUrl(targetPath: string, operation: string) {
  return `https://masterplan.rajuk.gov.bd/server/rest/services/${targetPath}${operation ? `/${operation}` : ""}`;
}

function buildRajukParams(params: {
  where?: string | null;
  outFields: string;
  returnGeometry: string;
  offset: string;
  token: string;
  geometry?: string | null;
  geometryType?: string | null;
  spatialRel?: string | null;
  inSR?: string | null;
  outSR?: string | null;
}) {
  const search = new URLSearchParams({
    f: "json",
    where: params.where || "1=1",
    outFields: params.outFields,
    returnGeometry: params.returnGeometry,
    resultRecordCount: "100",
    resultOffset: params.offset,
    token: params.token,
  });

  if (params.geometry) search.append("geometry", params.geometry);
  if (params.geometryType) search.append("geometryType", params.geometryType);
  if (params.spatialRel) search.append("spatialRel", params.spatialRel);
  if (params.inSR) search.append("inSR", params.inSR);
  if (params.outSR) search.append("outSR", params.outSR);

  return search;
}

async function handleRequest(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  let requestParams = parseQueryParams(searchParams);

  if (request.method !== "GET" && request.method !== "HEAD") {
    const bodyParams = await parseRequestBody(request);
    requestParams = {
      ...requestParams,
      ...bodyParams,
      outFields: bodyParams.outFields || requestParams.outFields || "*",
      offset: bodyParams.offset || requestParams.offset || "0",
      operation:
        bodyParams.operation !== undefined
          ? bodyParams.operation
          : requestParams.operation,
      returnGeometry:
        bodyParams.returnGeometry || requestParams.returnGeometry || "false",
    };
  }

  const cacheKey = new URLSearchParams({
    ...Object.entries(requestParams).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          acc[key] = String(value);
        }
        return acc;
      },
      {} as Record<string, string>,
    ),
  }).toString();

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }

  const {
    servicePath,
    layer,
    where,
    outFields,
    offset,
    operation,
    geometry,
    geometryType,
    spatialRel,
    returnGeometry,
    inSR,
    outSR,
  } = requestParams;

  if (!where && !geometry && operation === "query") {
    return NextResponse.json(
      { error: "Missing 'where' or 'geometry' parameter" },
      { status: 400 },
    );
  }

  const targetPath =
    servicePath || `rajuk_db/Rajuk_dap_db/FeatureServer/${layer || "1"}`;
  const baseUrl = buildRajukUrl(targetPath, operation || "query");
  const activeToken = await loadRajukToken();
  const params = buildRajukParams({
    where,
    outFields: outFields || "*",
    returnGeometry: returnGeometry || "false",
    offset: offset || "0",
    token: activeToken,
    geometry,
    geometryType,
    spatialRel,
    inSR,
    outSR,
  });

  const usePost =
    Boolean(geometry) || params.toString().length > POST_THRESHOLD;

  try {
    const requestInit: RequestInit = {
      method: usePost ? "POST" : "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "application/json",
        Referer: "https://masterplan.rajuk.gov.bd/",
      },
    };

    let response: Response;
    if (usePost) {
      requestInit.headers = {
        ...requestInit.headers,
        "Content-Type": "application/x-www-form-urlencoded",
      };
      requestInit.body = params.toString();
      response = await fetch(baseUrl, requestInit);
    } else {
      response = await fetch(`${baseUrl}?${params.toString()}`, requestInit);
    }

    const rawData = await response.text();
    if (!response.ok) {
      console.error("Rajuk Server HTTP Error:", rawData);
      return NextResponse.json(
        { error: "Bad Request", details: rawData },
        { status: response.status },
      );
    }

    const data = JSON.parse(rawData);
    if (data.error) {
      const isAuthError = data.error.code === 498 || data.error.code === 499;
      return NextResponse.json(
        { error: data.error.message || "Rajuk API Error", details: data.error },
        { status: isAuthError ? 401 : 400 },
      );
    }

    cache.set(cacheKey, { data, timestamp: Date.now() });
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
