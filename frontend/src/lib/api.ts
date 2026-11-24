import { getToken } from "./session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init.auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Немає зв’язку із сервером. Перевір інтернет і спробуй ще раз");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = data?.error;
    throw new ApiError(res.status, e?.code ?? "ERROR", e?.message ?? "Щось пішло не так, спробуй ще раз", e?.field);
  }
  return data as T;
}

export type User = { id: string; email: string; name: string; verified: boolean; onboarded: boolean };
export type AuthResult = { accessToken: string; user: User };

export const authApi = {
  register: (body: { email: string; password: string; name: string }) =>
    request<{ sent: true }>("/auth/register", { method: "POST", body }),
  verifyEmail: (body: { email: string; code: string }) =>
    request<AuthResult>("/auth/verify-email", { method: "POST", body }),
  resendCode: (email: string) => request<{ sent: true }>("/auth/resend-code", { method: "POST", body: { email } }),
  login: (body: { email: string; password: string }) => request<AuthResult>("/auth/login", { method: "POST", body }),
  me: () => request<User>("/auth/me", { auth: true }),
};
