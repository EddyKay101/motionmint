import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";

const localSecret = "motionmint-local-development-secret-change-before-production";

export function getAuth() {
  const runtime = env as unknown as Record<string, unknown>;
  const value = (key: string) => typeof runtime[key] === "string" ? String(runtime[key]).trim() : "";
  const configuredSecret = value("BETTER_AUTH_SECRET");
  const googleClientId = value("GOOGLE_CLIENT_ID");
  const googleClientSecret = value("GOOGLE_CLIENT_SECRET");
  const baseURL = value("BETTER_AUTH_URL") || "http://localhost:3000";
  const isLocal = baseURL.startsWith("http://localhost") || baseURL.startsWith("http://127.0.0.1");
  if ((!configuredSecret || configuredSecret.includes("replace_with")) && !isLocal) throw new Error("BETTER_AUTH_SECRET must be configured before production deployment.");
  const googleConfigured = Boolean(googleClientId && googleClientSecret && !googleClientId.includes("replace_with") && !googleClientSecret.includes("replace_with"));
  return betterAuth({
    database: env.DB,
    baseURL,
    secret: configuredSecret && !configuredSecret.includes("replace_with") ? configuredSecret : localSecret,
    emailAndPassword: { enabled: true, minPasswordLength: 10 },
    socialProviders: googleConfigured ? { google: { clientId: googleClientId, clientSecret: googleClientSecret, prompt: "select_account" } } : {},
    user: { additionalFields: { role: { type: "string", required: false, defaultValue: "user", input: false } } },
    plugins: [username({ minUsernameLength: 4, maxUsernameLength: 40 })],
    disabledPaths: ["/is-username-available"],
    rateLimit: { enabled: true, window: 60, max: 30 },
    advanced: { cookiePrefix: "motionmint", useSecureCookies: baseURL.startsWith("https://") },
  });
}

export function authConfiguration() {
  const runtime = env as unknown as Record<string, unknown>;
  const clientId = typeof runtime.GOOGLE_CLIENT_ID === "string" ? runtime.GOOGLE_CLIENT_ID : "";
  const clientSecret = typeof runtime.GOOGLE_CLIENT_SECRET === "string" ? runtime.GOOGLE_CLIENT_SECRET : "";
  return { google: Boolean(clientId && clientSecret && !clientId.includes("replace_with") && !clientSecret.includes("replace_with")) };
}
