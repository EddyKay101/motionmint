import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  username: text("username").unique(),
  displayUsername: text("displayUsername"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(), expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(), token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(), updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ipAddress"), userAgent: text("userAgent"), userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (table) => [index("session_userId_idx").on(table.userId)]);

export const account = sqliteTable("account", {
  id: text("id").primaryKey(), issuer: text("issuer").notNull(), accountId: text("accountId").notNull(), providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }), accessToken: text("accessToken"), refreshToken: text("refreshToken"), idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp_ms" }), refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp_ms" }),
  scope: text("scope"), password: text("password"), createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(), updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("account_userId_idx").on(table.userId), uniqueIndex("account_issuer_accountId_idx").on(table.issuer, table.accountId)]);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(), expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(), updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("verification_identifier_idx").on(table.identifier)]);

export const templates = sqliteTable(
  "templates",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    status: text("status", { enum: ["draft", "published", "archived"] })
      .notNull()
      .default("published"),
    configJson: text("config_json").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_templates_status_category").on(table.status, table.category)],
);

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    ownerKey: text("owner_key").notNull(),
    title: text("title").notNull(),
    templateId: text("template_id").notNull(),
    projectJson: text("project_json").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_projects_owner_updated").on(table.ownerKey, table.updatedAt)],
);

export const renderJobs = sqliteTable(
  "render_jobs",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    ownerKey: text("owner_key").notNull(),
    status: text("status", {
      enum: ["queued", "rendering", "complete", "failed"],
    })
      .notNull()
      .default("queued"),
    requestJson: text("request_json").notNull(),
    outputKey: text("output_key"),
    errorMessage: text("error_message"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_render_jobs_owner_created").on(table.ownerKey, table.createdAt),
    index("idx_render_jobs_status_created").on(table.status, table.createdAt),
  ],
);

export const mediaAssets = sqliteTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    ownerKey: text("owner_key").notNull(),
    kind: text("kind", { enum: ["underlay", "soundtrack", "render"] }).notNull(),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: text("size_bytes").notNull(),
    storageKey: text("storage_key"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_media_assets_project").on(table.projectId, table.ownerKey)],
);
