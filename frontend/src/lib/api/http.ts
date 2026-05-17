type PrimitiveQueryValue = string | number | boolean | null | undefined;
type QueryValue = PrimitiveQueryValue | PrimitiveQueryValue[];

type HttpOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: FormData | Record<string, unknown> | unknown[] | string | number | boolean | null;
  query?: Record<string, QueryValue>;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const appendQuery = (url: URL, query?: Record<string, QueryValue>) => {
  if (!query) return;

  for (const [key, rawValue] of Object.entries(query)) {
    if (rawValue == null) continue;

    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) {
      if (value == null) continue;
      url.searchParams.append(key, String(value));
    }
  }
};

const buildUrl = (path: string, query?: Record<string, QueryValue>) => {
  const url = new URL(path, API_URL);
  appendQuery(url, query);
  return url.toString();
};

const isFormData = (value: HttpOptions["body"]): value is FormData =>
  typeof FormData !== "undefined" && value instanceof FormData;

const parseResponseBody = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  if (
    contentType.includes("text/html") ||
    /^\s*<!doctype/i.test(text) ||
    /^\s*<html/i.test(text)
  ) {
    throw new ApiError(
      `API returned HTML instead of JSON for ${response.url}. Check NEXT_PUBLIC_API_URL and make sure the backend is running.`,
      response.status || 500,
      text,
    );
  }
  return text ? text : null;
};

export async function httpJson<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const { method = "GET", headers = {}, body, query } = options;
  const requestHeaders = new Headers(headers);
  let requestBody: BodyInit | undefined;

  if (body !== undefined && body !== null) {
    if (isFormData(body)) {
      requestBody = body;
    } else if (
      typeof body === "string" ||
      typeof body === "number" ||
      typeof body === "boolean"
    ) {
      requestBody = String(body);
      if (!requestHeaders.has("Content-Type")) {
        requestHeaders.set("Content-Type", "text/plain");
      }
    } else {
      requestBody = JSON.stringify(body);
      if (!requestHeaders.has("Content-Type")) {
        requestHeaders.set("Content-Type", "application/json");
      }
    }
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body: requestBody,
  });

  const data = await parseResponseBody(response);
  if (!response.ok) {
    const message =
      (typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof (data as { message?: unknown }).message === "string" &&
        (data as { message: string }).message) ||
      response.statusText ||
      "Request failed.";
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}
