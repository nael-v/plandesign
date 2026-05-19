export type ApiErrorShape = {
  message: string;
  status: number;
  details?: unknown;
};

export async function apiRequest<T>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error: ApiErrorShape = {
      message: response.statusText || "Request failed",
      status: response.status,
    };

    throw error;
  }

  return (await response.json()) as T;
}