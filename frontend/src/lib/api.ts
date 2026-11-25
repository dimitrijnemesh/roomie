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
  /** Always `{ sent: true }` — even for an unknown email, so nobody can check who is registered. */
  forgotPassword: (email: string) => request<{ sent: true }>("/auth/forgot-password", { method: "POST", body: { email } }),
  /** New password by the code from the email; returns a new token (old ones stop working). */
  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
    request<AuthResult>("/auth/reset-password", { method: "POST", body }),
  updateMe: (body: { name: string }) => request<User>("/auth/me", { method: "PATCH", body, auth: true }),
  /** Returns a new token — the old one (and every other device) stops working. */
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<AuthResult>("/auth/change-password", { method: "POST", body, auth: true }),
  deleteAccount: (password: string) =>
    request<{ deleted: true }>("/auth/me", { method: "DELETE", body: { password }, auth: true }),
};

// ---------- Profile / onboarding ----------

export type Gender = "male" | "female";
export type Habits = {
  sleep?: "early" | "late" | "flexible";
  clean?: number;
  smoking?: boolean;
  guests?: "never" | "rarely" | "often";
};
export type Looking = {
  roommateGender?: "male" | "female" | "any";
  housing?: "dorm" | "flat" | "any";
  budget?: [number, number];
  district?: string;
};
export type Photo = { id: string; url: string };
export type Profile = {
  id: string;
  name: string;
  university: string;
  gender: Gender | null;
  /** Own profile only, YYYY-MM-DD */
  birthDate?: string | null;
  /** Calculated from the date of birth */
  age: number | null;
  degree: "bachelor" | "master" | "phd" | null;
  faculty: string | null;
  specialty: string | null;
  specialization: string | null;
  course: number | null;
  bio: string | null;
  habits: Habits | null;
  looking: Looking | null;
  photos: Photo[];
  onboarded: boolean;
};
export type ProfileUpdate = Partial<Pick<Profile, "faculty" | "specialty" | "specialization" | "course" | "bio">> & {
  birthDate?: string;
  degree?: "bachelor" | "master" | "phd";
  gender?: Gender;
  habits?: Habits;
  looking?: Looking;
};

async function upload<T>(path: string, field: string, file: Blob, filename: string): Promise<T> {
  const body = new FormData();
  body.append(field, file, filename);
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Немає зв’язку із сервером. Перевір інтернет і спробуй ще раз");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = data?.error;
    throw new ApiError(res.status, e?.code ?? "ERROR", e?.message ?? "Не вдалося завантажити фото", e?.field);
  }
  return data as T;
}

export const profileApi = {
  get: () => request<Profile>("/profile/me", { auth: true }),
  update: (body: ProfileUpdate) => request<Profile>("/profile/me", { method: "PUT", body, auth: true }),
  addPhoto: (file: Blob) => upload<Photo[]>("/profile/me/photos", "photo", file, "photo.jpg"),
  deletePhoto: (id: string) => request<Photo[]>(`/profile/me/photos/${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  reorderPhotos: (ids: string[]) => request<Photo[]>("/profile/me/photos/order", { method: "PUT", body: { ids }, auth: true }),
};
