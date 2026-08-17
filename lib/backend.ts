export type JsonObject = Record<string, unknown>;

export function isProjectPayload(value: unknown): value is JsonObject {
  if (!value || typeof value !== "object") return false;
  const project = value as JsonObject;
  return project.schemaVersion === 1 && typeof project.id === "string" && project.id.length > 0 && typeof project.title === "string" && typeof project.templateId === "string" && Array.isArray(project.scenes) && project.scenes.length > 0 && project.scenes.length <= 50 && typeof project.theme === "object" && project.theme !== null;
}

export function ownerKeyFrom(request: Request) {
  const key = request.headers.get("x-motionmint-owner")?.trim() ?? "";
  return /^[a-zA-Z0-9_-]{20,120}$/.test(key) ? key : null;
}

export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function databaseError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected database error";
  if (message.includes("no such table")) return apiError("The MotionMint database has not been migrated yet.", 503);
  return apiError("The backend is temporarily unavailable.", 503);
}
