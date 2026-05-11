function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    // Server-side rendering fallback
    return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
  }
  
  // Client-side: dynamically use the same host as the frontend
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  return `${protocol}//${hostname}:5000/api`;
}

const TOKEN_KEY = "triqi_token";
const USER_KEY = "triqi_user";

export type AccountType = "individual" | "enterprise";

export interface AuthSummary {
  id: number | string;
  firstName: string;
  lastName?: string;
  role: string;
  accountType: AccountType;
  profilePictureUrl: string | null;
  emailVerified?: boolean;
  onboardingCompleted: boolean;
}

export interface UserProfile extends AuthSummary {
  email: string;
  phone: string;
  dateOfBirth: string | null;
  companyName: string;
  companyAddress: string;
  companyWebsite: string;
  operatingCity: string;
  deliveryFocus: string;
  vehicleType: string;
  vehicleImageUrl: string | null;
  companySize: string;
  averageDailyOrders: number | null;
  notificationsEnabled: boolean;
  status: string;
  emailVerified: boolean;
}

export interface PostUser {
  id: number;
  first_name: string;
  last_name: string;
  company_name: string | null;
  account_type: AccountType;
  image: string | null;
}

export interface ClientPost {
  id: number;
  user: number | null;
  origin_wilaya: string;
  origin_commune?: string | null;
  destination: string;
  destination_commune?: string | null;
  weight: number | null;
  volume: number | null;
  vehicle_type: string | string[] | null;
  description: string | null;
  phone: string | null;
  image: string | null;
  delivery_date: string | null;
  created_at: string;
  users?: PostUser | null;
}

export interface ShipperPost {
  id: number;
  user: number | null;
  origin_wilaya: string;
  origin_commune?: string | null;
  destination: string;
  destination_commune?: string | null;
  wilaya_passage: string[];
  type: string | null;
  weight: number | null;
  volume: number | null;
  phone: string | null;
  description: string | null;
  image: string | null;
  availability_date: string | null;
  created_at: string;
  users?: PostUser | null;
}

class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init: RequestInit = {}, withAuth = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (withAuth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });
  } catch (_error) {
    throw new ApiError("Unable to reach the server. Check your connection.", 0);
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload && typeof (payload as { message?: string }).message === "string"
        ? (payload as { message: string }).message
        : null) || "Something went wrong.";
    throw new ApiError(message, response.status, payload);
  }

  return (payload as T) ?? ({} as T);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthSummary | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSummary;
  } catch {
    return null;
  }
}

function persistSession(token: string, user: AuthSummary) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

function buildQuery(params: Record<string, unknown>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const stringified = search.toString();
  return stringified ? `?${stringified}` : "";
}

export const authApi = {
  async register(payload: {
    accountType: AccountType;
    firstName?: string;
    lastName?: string;
    contactFirstName?: string;
    contactLastName?: string;
    companyName?: string;
    companyAddress?: string;
    companyWebsite?: string;
    dateOfBirth?: string;
    email: string;
    phone: string;
    password: string;
  }) {
    return request<{ message: string; user: AuthSummary }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async login(payload: { identifier: string; password: string }) {
    const data = await request<{ token: string; user: AuthSummary; message: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(payload) }
    );
    persistSession(data.token, data.user);
    return data;
  },

  async sendEmailOtp(email: string) {
    return request<{ message: string; maskedEmail: string }>("/auth/send-email-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async verifyEmail(email: string, code: string) {
    return request<{ message: string; token: string; onboardingToken: string; user: AuthSummary }>(
      "/auth/verify-email",
      { method: "POST", body: JSON.stringify({ email, code }) }
    );
  },

  async forgotPassword(email: string) {
    return request<{ message: string; maskedEmail: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async verifyResetOtp(email: string, code: string) {
    return request<{ message: string; resetToken: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  },

  async resetPassword(token: string, password: string) {
    return request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },

  async completeProfile(payload: {
    token: string;
    profilePictureUrl?: string | null;
    operatingCity: string;
    deliveryFocus: string;
    vehicleType?: string | null;
    vehicleImageUrl?: string | null;
    companySize?: string | null;
    averageDailyOrders?: number | null;
    notificationsEnabled?: boolean;
  }) {
    const data = await request<{ token: string; user: AuthSummary; message: string }>(
      "/auth/complete-profile",
      { method: "POST", body: JSON.stringify(payload) }
    );
    persistSession(data.token, data.user);
    return data;
  },

  async getProfile() {
    return request<{ user: UserProfile }>("/auth/profile", { method: "GET" }, true);
  },

  async updateProfile(payload: Partial<UserProfile>) {
    const data = await request<{ user: UserProfile; message: string }>(
      "/auth/profile",
      { method: "PUT", body: JSON.stringify(payload) },
      true
    );
    if (typeof window !== "undefined") {
      const summary: AuthSummary = {
        id: data.user.id,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role,
        accountType: data.user.accountType,
        profilePictureUrl: data.user.profilePictureUrl,
        emailVerified: data.user.emailVerified,
        onboardingCompleted: data.user.onboardingCompleted,
      };
      window.localStorage.setItem(USER_KEY, JSON.stringify(summary));
    }
    return data;
  },

  logout() {
    clearSession();
  },
};

export interface PostListQuery {
  q?: string;
  origin_wilaya?: string;
  destination?: string;
  type?: string;
  limit?: number;
  offset?: number;
  [key: string]: string | number | undefined;
}

export const postsApi = {
  async listClient(params: PostListQuery = {}) {
    const { posts } = await request<{ posts: ClientPost[] }>(
      `/posts/client${buildQuery(params)}`,
      { method: "GET" }
    );
    return posts;
  },
  async listShipper(params: PostListQuery = {}) {
    const { posts } = await request<{ posts: ShipperPost[] }>(
      `/posts/shipper${buildQuery(params)}`,
      { method: "GET" }
    );
    return posts;
  },
  async getClient(id: string | number) {
    const { post } = await request<{ post: ClientPost }>(`/posts/client/${id}`, { method: "GET" });
    return post;
  },
  async getShipper(id: string | number) {
    const { post } = await request<{ post: ShipperPost }>(`/posts/shipper/${id}`, { method: "GET" });
    return post;
  },
  async getClientMatches(id: string | number) {
    const { matches } = await request<{ matches: ShipperPost[] }>(
      `/posts/client/${id}/matches`,
      { method: "GET" }
    );
    return matches;
  },
  async getShipperMatches(id: string | number) {
    const { matches } = await request<{ matches: ClientPost[] }>(
      `/posts/shipper/${id}/matches`,
      { method: "GET" }
    );
    return matches;
  },
  async createClient(payload: Partial<ClientPost>) {
    const { post } = await request<{ post: ClientPost }>(
      "/posts/client",
      { method: "POST", body: JSON.stringify(payload) },
      true
    );
    return post;
  },
  async createShipper(payload: Partial<ShipperPost>) {
    const { post } = await request<{ post: ShipperPost }>(
      "/posts/shipper",
      { method: "POST", body: JSON.stringify(payload) },
      true
    );
    return post;
  },
  async updateClient(id: string | number, payload: Partial<ClientPost>) {
    const { post } = await request<{ post: ClientPost }>(
      `/posts/client/${id}`,
      { method: "PUT", body: JSON.stringify(payload) },
      true
    );
    return post;
  },
  async updateShipper(id: string | number, payload: Partial<ShipperPost>) {
    const { post } = await request<{ post: ShipperPost }>(
      `/posts/shipper/${id}`,
      { method: "PUT", body: JSON.stringify(payload) },
      true
    );
    return post;
  },
  async deleteClient(id: string | number) {
    return request<{ message: string }>(`/posts/client/${id}`, { method: "DELETE" }, true);
  },
  async deleteShipper(id: string | number) {
    return request<{ message: string }>(`/posts/shipper/${id}`, { method: "DELETE" }, true);
  },
  async listMine() {
    return request<{ clientPosts: ClientPost[]; shipperPosts: ShipperPost[] }>(
      "/posts/mine",
      { method: "GET" },
      true
    );
  },
};

export const storageApi = {
  async upload(file: File): Promise<string> {
    const token = getToken();
    if (!token) throw new ApiError("You must be logged in to upload files.", 401);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${getApiBaseUrl()}/storage/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { message: text };
      }
    }

    if (!response.ok) {
      const message =
        (payload && typeof payload === "object" && "message" in payload && typeof (payload as { message?: string }).message === "string"
          ? (payload as { message: string }).message
          : null) || "Upload failed.";
      throw new ApiError(message, response.status, payload);
    }

    const url = (payload as { url?: string })?.url;
    if (!url) throw new ApiError("Upload did not return a URL.", 500);
    return url;
  },
};

export { ApiError };
