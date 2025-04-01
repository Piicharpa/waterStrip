import { pgTable, serial, text, integer, doublePrecision, timestamp, primaryKey, json } from "drizzle-orm/pg-core";

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
  s_id: serial("s_id").primaryKey(),
  b_id: integer("b_id").references(() => Brand.b_id).notNull(),
  s_date: timestamp("s_date").notNull().defaultNow(),
  s_latitude: text("s_latitude"),
  s_longitude: text("s_longitude"),
  u_id: text("u_id").references(() => User.u_id).notNull(),
  s_url: text("s_url"),
  s_quality: doublePrecision("s_quality").notNull(),
});

// ตาราง PARAMETER
export const Parameter = pgTable("parameter", {
  p_id: serial("p_id").primaryKey(),
  p_name: text("p_name").notNull(),
  p_unit: text("p_unit"),
});

// ตาราง STRIP_PARAMETER (M:N)
export const StripParameter = pgTable("strip_parameter", {
  sp_id: serial("sp_id").primaryKey(),
  s_id: integer("s_id").references(() => Strip.s_id, { onDelete: "cascade" }) .notNull(), // Define primary key here
  p_id: integer("p_id").references(() => Parameter.p_id) .notNull(), // Define composite primary key inline
  sp_value: doublePrecision("sp_value").notNull(),
  
});

// ตาราง COLOR
export const Color = pgTable("color", {
  c_id: serial("c_id").primaryKey(),
  b_id: integer("b_id").references(() => Brand.b_id).notNull(),
  p_id: integer("p_id").references(() => Parameter.p_id).notNull(),
  colors: json("colors").notNull(),
  values: json("values").notNull(), 
});
