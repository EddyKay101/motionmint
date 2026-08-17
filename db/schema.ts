import { sql } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
