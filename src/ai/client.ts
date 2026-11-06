export class HttpError extends Error {
  constructor(public status: number) {
    super(`status ${status}`);
    this.name = 'HttpError';
  }
}

export function chatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/chat/completions')) return trimmed;
  return `${trimmed}/chat/completions`;
}

export async function completeChat(options: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  responseFormat?: boolean;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<string> {
  const fetchFn = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20000);

  try {
    const response = await fetchFn(chatCompletionsUrl(options.baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        temperature: 0.3,
        messages: options.messages,
        ...(options.responseFormat ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) throw new HttpError(response.status);
    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('empty');
    }
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

export async function completeChatFlexible(options: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  fetchImpl?: typeof fetch;
}): Promise<string> {
  try {
    return await completeChat({ ...options, responseFormat: true });
  } catch (error) {
    if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
      return completeChat({ ...options, responseFormat: false });
    }
    throw error;
  }
}
