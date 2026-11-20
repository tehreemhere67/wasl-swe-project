/** Small fetch helper shared by the Member 4 client forms. */

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiReply {
  ok: boolean;
  status: number;
  errors?: ApiFieldError[];
  redirect?: string;
  data: Record<string, unknown>;
}

export async function sendJson(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body: unknown,
): Promise<ApiReply> {
  try {
    const response = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      ok: response.ok && data.ok !== false,
      status: response.status,
      errors: Array.isArray(data.errors) ? (data.errors as ApiFieldError[]) : undefined,
      redirect: typeof data.redirect === "string" ? data.redirect : undefined,
      data,
    };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

/** Maps the API's field errors to the translated text under each field. */
export function fieldMessages(
  errors: ApiFieldError[] | undefined,
  labels: Record<string, string>,
  generic: string,
): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const error of errors ?? []) mapped[error.field] = labels[error.message] ?? generic;
  return mapped;
}
