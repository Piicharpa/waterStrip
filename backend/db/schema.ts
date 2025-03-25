import { pgTable, serial, text, integer, doublePrecision, timestamp, primaryKey } from "drizzle-orm/pg-core";

// ตาราง USER
export const User = pgTable("user", {
  u_id: serial("u_id").primaryKey(),
  u_name: text("u_name").notNull(),
  u_email: text("u_email").unique().notNull(),
  u_password: text("u_password").notNull(),
  u_role: text("u_role").notNull(),
  u_profile_pic: text("u_profile_pic"),
});

// ตาราง BRAND
export const Brand = pgTable("brand", {
  b_id: serial("b_id").primaryKey(),
  b_name: text("b_name").notNull(),
  b_chart: text("b_chart"), // อาจจะเก็บ URL ของภาพ color chart
});

// ตาราง STRIP
export const Strip = pgTable("strip", {
  s_id: serial("s_id").primaryKey(),
  b_id: integer("b_id").references(() => Brand.b_id).notNull(),
  s_date: timestamp("s_date").notNull().defaultNow(),
  s_latitude: doublePrecision("s_latitude"),
  s_longitude: doublePrecision("s_longitude"),
});

// ตาราง PARAMETER
export const Parameter = pgTable("parameter", {
  p_id: serial("p_id").primaryKey(),
  p_name: text("p_name").notNull(),
  p_unit: text("p_unit"),
});

// ตาราง STRIP_PARAMETER (M:N)
export const StripParameter = pgTable("strip_parameter", {
  s_id: integer("s_id").references(() => Strip.s_id, { onDelete: "cascade" }) .notNull() .primaryKey(), // Define primary key here
  p_id: integer("p_id").references(() => Parameter.p_id) .notNull() .primaryKey(), // Define composite primary key inline
  sp_value: doublePrecision("sp_value").notNull(),
});

