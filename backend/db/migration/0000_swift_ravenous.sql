CREATE TABLE "brand" (
	"b_id" serial PRIMARY KEY NOT NULL,
	"b_name" text NOT NULL,
	"b_chart" text
);
--> statement-breakpoint
CREATE TABLE "parameter" (
	"p_id" serial PRIMARY KEY NOT NULL,
	"p_name" text NOT NULL,
	"p_unit" text
);
--> statement-breakpoint
CREATE TABLE "strip" (
	"s_id" serial PRIMARY KEY NOT NULL,
	"b_id" integer NOT NULL,
	"s_date" timestamp DEFAULT now() NOT NULL,
	"s_latitude" double precision,
	"s_longitude" double precision
);
--> statement-breakpoint
CREATE TABLE "strip_parameter" (
	"s_id" integer NOT NULL,
	"p_id" integer NOT NULL,
	"sp_value" double precision NOT NULL,
	"sp_id" serial PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"u_id" serial PRIMARY KEY NOT NULL,
	"u_name" text NOT NULL,
	"u_email" text NOT NULL,
	"u_password" text NOT NULL,
	"u_role" text NOT NULL,
	"u_profile_pic" text,
	CONSTRAINT "user_u_email_unique" UNIQUE("u_email")
);
--> statement-breakpoint
ALTER TABLE "strip" ADD CONSTRAINT "strip_b_id_brand_b_id_fk" FOREIGN KEY ("b_id") REFERENCES "public"."brand"("b_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strip_parameter" ADD CONSTRAINT "strip_parameter_s_id_strip_s_id_fk" FOREIGN KEY ("s_id") REFERENCES "public"."strip"("s_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strip_parameter" ADD CONSTRAINT "strip_parameter_p_id_parameter_p_id_fk" FOREIGN KEY ("p_id") REFERENCES "public"."parameter"("p_id") ON DELETE no action ON UPDATE no action;