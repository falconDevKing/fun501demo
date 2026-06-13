type FetchJsonOptions = {
  body?: unknown;
  method?: string;
  token?: string;
};

export async function fetchJson<T>(url: string, options?: FetchJsonOptions) {
  const response = await fetch(url, {
    body: options?.body ? JSON.stringify(options.body) : undefined,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    method: options?.method,
  });

  const data = (await response.json()) as unknown;

  if (!response.ok) {
    throw new Error(readErrorMessage(data));
  }

  return data as T;
}

function readErrorMessage(data: unknown) {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return "Request failed.";
}
