/**
 * Test auth helper — signs into the RUNNING dev server's next-auth v4
 * credentials ("Guest") provider and returns a cookie-jar fetch client.
 */

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

export interface ApiResponse<T = any> {
  status: number;
  body: T;
}

export interface AuthedClient {
  email: string;
  fetch: (path: string, init?: RequestInit) => Promise<ApiResponse>;
}

function collectCookies(res: Response, jar: Map<string, string>) {
  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];
  for (const cookie of setCookies) {
    const pair = cookie.split(";")[0] ?? "";
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}

/** Sign in with the credentials provider and return an authed fetch client. */
export async function createAuthedClient(email: string): Promise<AuthedClient> {
  const jar = new Map<string, string>();
  const cookieHeader = () =>
    [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

  // 1) Obtain the CSRF token (also sets csrf + callback-url cookies).
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  collectCookies(csrfRes, jar);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  // 2) Sign in via the credentials callback (sets the session cookie).
  const callbackRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(),
    },
    body: new URLSearchParams({ csrfToken, email, json: "true" }).toString(),
    redirect: "manual",
  });
  collectCookies(callbackRes, jar);

  if (callbackRes.status !== 200) {
    throw new Error(
      `credentials sign-in failed for ${email}: HTTP ${callbackRes.status}`,
    );
  }

  const sessionCookie = jar.get("next-auth.session-token");
  if (!sessionCookie) {
    throw new Error(`no session cookie for ${email}`);
  }

  return {
    email,
    async fetch(path: string, init: RequestInit = {}) {
      const headers = new Headers(init.headers);
      headers.set("Cookie", cookieHeader());
      if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      const res = await fetch(`${BASE}${path}`, {
        ...init,
        headers,
        redirect: "manual",
      });
      const text = await res.text();
      let body: any = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      return { status: res.status, body };
    },
  };
}
