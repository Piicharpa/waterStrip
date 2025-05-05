import { pgTable,serial, text, uuid, integer, doublePrecision, timestamp, json } from "drizzle-orm/pg-core";

// ตาราง USER
export const User = pgTable("user", {
  u_id: text("u_id").primaryKey(),
  u_name: text("u_name").notNull(),
  u_email: text("u_email").unique().notNull(),
  u_role: text("u_role").notNull(),
});

// ตาราง BRAND
export const Brand = pgTable("brand", {
  b_id: serial("b_id").primaryKey(),
  b_name: text("b_name").notNull(),
  b_chart: text("b_chart"), // อาจจะเก็บ URL ของภาพ color chart
});

// ตาราง STRIP
export const Strip = pgTable("strip", {
  s_id: uuid("s_id").primaryKey().defaultRandom(),
  u_id: text("u_id").references(() => User.u_id, { onDelete: "cascade" }).notNull(),
  b_id: integer("b_id").references(() => Brand.b_id, { onDelete: "cascade" }).notNull(),
  s_date: timestamp("s_date").notNull().defaultNow(),
  s_latitude: text("s_latitude"),
  s_longitude: text("s_longitude"),
  s_url: text("s_url"),
  s_quality: text("s_quality").notNull(),
  s_qualitycolor: text("s_qualitycolor").notNull(),
});

// ตาราง STRIP_STATUS
export const StripStatus = pgTable("strip_status", {
  st_id: serial("st_id").primaryKey(),
  u_id: text("u_id").references(() => User.u_id, { onDelete: "cascade" }).notNull(),
  s_id: uuid("s_id").references(() => Strip.s_id, { onDelete: "cascade" }).notNull(),
  status: text("status").notNull()
});

// ตาราง PARAMETER
export const Parameter = pgTable("parameter", {
  p_id: serial("p_id").primaryKey(),
  p_name: text("p_name").notNull(),
  p_unit: text("p_unit"),
  p_min: doublePrecision("p_min").notNull(),
  p_max: doublePrecision("p_max").notNull(),
});

// ตาราง STRIP_PARAMETER
export const StripParameter = pgTable("strip_parameter", {
  sp_id: serial("sp_id").primaryKey(),
  s_id: uuid("s_id").references(() => Strip.s_id, { onDelete: "cascade" }).notNull(),
  p_id: integer("p_id").references(() => Parameter.p_id, { onDelete: "cascade" }).notNull(),
  sp_value: doublePrecision("sp_value").notNull(),
});

// ตาราง COLOR
export const Color = pgTable("color", {
  c_id: serial("c_id").primaryKey(),
  b_id: integer("b_id").references(() => Brand.b_id, { onDelete: "cascade" }).notNull(),
  p_id: integer("p_id").references(() => Parameter.p_id, { onDelete: "cascade" }).notNull(),
  colors: json("colors").notNull(),
  values: json("values").notNull(),
});
