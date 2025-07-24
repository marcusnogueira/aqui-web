

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."feedback_type_enum" AS ENUM (
    'BUG',
    'FEATURE',
    'GENERAL'
);


ALTER TYPE "public"."feedback_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."notification_type_enum" AS ENUM (
    'new_vendor_signup',
    'vendor_report',
    'review_report',
    'system_alert'
);


ALTER TYPE "public"."notification_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."priority_enum" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE "public"."priority_enum" OWNER TO "postgres";


CREATE TYPE "public"."vendor_status_enum" AS ENUM (
    'pending',
    'approved',
    'active',
    'inactive',
    'rejected',
    'suspended'
);


ALTER TYPE "public"."vendor_status_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clear_auth_context"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM set_config('request.auth.user_id', '', false);
  PERFORM set_config('request.auth.role', '', false);
END;
$$;


ALTER FUNCTION "public"."clear_auth_context"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clear_current_user_context"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', true);
    PERFORM set_config('app.current_role', '', true);
END;
$$;


ALTER FUNCTION "public"."clear_current_user_context"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."clear_current_user_context"() IS 'Clears user context - called at end of API requests';



CREATE OR REPLACE FUNCTION "public"."get_current_user_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_id UUID;
BEGIN
    -- In NextAuth, we'll pass the user ID through the request context
    -- For now, we'll use a session variable that will be set by our API routes
    SELECT current_setting('app.current_user_id', true)::UUID INTO user_id;
    
    -- If no user ID is set, return NULL (unauthenticated)
    IF user_id IS NULL OR user_id = '00000000-0000-0000-0000-000000000000' THEN
        RETURN NULL;
    END IF;
    
    RETURN user_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."get_current_user_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_current_user_id"() IS 'NextAuth replacement for auth.uid() - gets current user ID from session context';



CREATE OR REPLACE FUNCTION "public"."handle_platform_settings_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_platform_settings_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_current_user_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_id UUID;
    is_admin BOOLEAN := FALSE;
BEGIN
    user_id := public.get_current_user_id();
    
    IF user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has admin role in users table
    SELECT COALESCE(is_admin, FALSE) INTO is_admin
    FROM public.users
    WHERE id = user_id;
    
    RETURN COALESCE(is_admin, FALSE);
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."is_current_user_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_current_user_admin"() IS 'Helper function to check if current user has admin privileges';



CREATE OR REPLACE FUNCTION "public"."is_service_role"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    role_name TEXT;
BEGIN
    -- Check if the current role is the service role
    SELECT current_setting('app.current_role', true) INTO role_name;
    
    -- Service role requests will set this variable
    RETURN role_name = 'service_role';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."is_service_role"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_service_role"() IS 'NextAuth replacement for auth.role() = service_role - checks if request is from service role';



CREATE OR REPLACE FUNCTION "public"."set_auth_role"("role" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM set_config('request.auth.role', role, false);
END;
$$;


ALTER FUNCTION "public"."set_auth_role"("role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_auth_user_id"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM set_config('request.auth.user_id', user_id::text, false);
END;
$$;


ALTER FUNCTION "public"."set_auth_user_id"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_current_user_context"("user_id" "uuid", "role_name" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Set the current user ID for RLS policies
    PERFORM set_config('app.current_user_id', user_id::TEXT, true);
    
    -- Set the current role if provided
    IF role_name IS NOT NULL THEN
        PERFORM set_config('app.current_role', role_name, true);
    END IF;
END;
$$;


ALTER FUNCTION "public"."set_current_user_context"("user_id" "uuid", "role_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_current_user_context"("user_id" "uuid", "role_name" "text") IS 'Sets user context for RLS policies - called by API routes';



CREATE OR REPLACE FUNCTION "public"."update_is_active_on_end"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
    NEW.is_active = false;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_is_active_on_end"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_vendor_rating_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE vendors
  SET
    average_rating = (
      SELECT ROUND(AVG(rating)::NUMERIC, 1)
      FROM reviews
      WHERE reviews.vendor_id = NEW.vendor_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE reviews.vendor_id = NEW.vendor_id
    )
  WHERE vendors.id = NEW.vendor_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_vendor_rating_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_vendor_upload"("p_user_id" "uuid", "p_vendor_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if user owns the vendor
  RETURN EXISTS(
    SELECT 1 FROM public.vendors 
    WHERE id = p_vendor_id AND user_id = p_user_id
  );
END;
$$;


ALTER FUNCTION "public"."validate_vendor_upload"("p_user_id" "uuid", "p_vendor_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "provider_account_id" "text" NOT NULL,
    "refresh_token" "text",
    "access_token" "text",
    "expires_at" bigint,
    "token_type" "text",
    "scope" "text",
    "id_token" "text",
    "session_state" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "username" character varying(100) NOT NULL,
    "password_hash" character varying(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_exports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid",
    "vendor_id" "uuid",
    "export_type" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'pending'::"text",
    "download_url" "text",
    CONSTRAINT "analytics_exports_export_type_check" CHECK (("export_type" = ANY (ARRAY['vendor'::"text", 'platform'::"text"])))
);


ALTER TABLE "public"."analytics_exports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_subcategories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "business_type_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."business_subcategories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."business_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_on_the_way" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid",
    "user_id" "uuid",
    "clicked_at" timestamp without time zone DEFAULT "now"(),
    "customer_latitude" double precision,
    "customer_longitude" double precision
);


ALTER TABLE "public"."customer_on_the_way" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_id" "uuid",
    "vendor_id" "uuid",
    "issue" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "resolved" boolean DEFAULT false,
    "resolution_notes" "text"
);


ALTER TABLE "public"."customer_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_live_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid",
    "start_time" timestamp without time zone NOT NULL,
    "end_time" timestamp without time zone,
    "was_scheduled_duration" integer,
    "estimated_customers" integer DEFAULT 0,
    "latitude" double precision,
    "longitude" double precision,
    "address" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "auto_end_time" timestamp without time zone,
    "ended_by" "text" DEFAULT 'vendor'::"text",
    CONSTRAINT "vendor_live_sessions_ended_by_check" CHECK (("ended_by" = ANY (ARRAY['vendor'::"text", 'timer'::"text"])))
);


ALTER TABLE "public"."vendor_live_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "business_name" "text" NOT NULL,
    "description" "text",
    "business_type" "text",
    "subcategory" "text",
    "tags" "text"[],
    "profile_image_url" "text",
    "banner_image_url" "text"[],
    "contact_email" "text",
    "phone" "text",
    "address" "text",
    "approved_by" "uuid",
    "approved_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "average_rating" numeric DEFAULT 0,
    "total_reviews" integer DEFAULT 0,
    "admin_notes" "text",
    "latitude" double precision,
    "longitude" double precision,
    "city" "text",
    "status" "public"."vendor_status_enum" DEFAULT 'pending'::"public"."vendor_status_enum",
    "rejection_reason" "text",
    "subcategory__other" "text",
    "gallery_images" "text"[] DEFAULT '{}'::"text"[],
    "gallery_titles" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."live_vendors_with_sessions" AS
 SELECT "v"."id",
    "v"."user_id",
    "v"."business_name",
    "v"."description",
    "v"."business_type",
    "v"."subcategory",
    "v"."tags",
    "v"."profile_image_url",
    "v"."banner_image_url",
    "v"."contact_email",
    "v"."phone",
    "v"."address",
    "v"."approved_by",
    "v"."approved_at",
    "v"."created_at",
    "v"."updated_at",
    "v"."average_rating",
    "v"."total_reviews",
    "v"."admin_notes",
    "v"."latitude",
    "v"."longitude",
    "v"."city",
    "v"."status",
    "v"."rejection_reason",
    "v"."subcategory__other",
    "vls"."id" AS "session_id",
    "vls"."start_time",
    "vls"."end_time",
    "vls"."is_active",
    "vls"."latitude" AS "live_latitude",
    "vls"."longitude" AS "live_longitude"
   FROM ("public"."vendors" "v"
     JOIN "public"."vendor_live_sessions" "vls" ON (("v"."id" = "vls"."vendor_id")))
  WHERE (("v"."status" = 'active'::"public"."vendor_status_enum") AND ("vls"."is_active" = true));


ALTER VIEW "public"."live_vendors_with_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moderation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid",
    "vendor_id" "uuid",
    "action" "text",
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "priority" "public"."priority_enum"
);


ALTER TABLE "public"."moderation_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_id" "uuid",
    "type" "public"."notification_type_enum" NOT NULL,
    "message" "text" NOT NULL,
    "link" "text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "allow_auto_vendor_approval" boolean DEFAULT true NOT NULL,
    "maintenance_mode" boolean DEFAULT false NOT NULL,
    "require_vendor_approval" boolean DEFAULT false NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."platform_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_settings_broken" (
    "id" boolean DEFAULT true NOT NULL,
    "allow_auto_vendor_approval" boolean DEFAULT false,
    "maintenance_mode" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "require_vendor_approval" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."platform_settings_broken" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "review_id" "uuid",
    "vendor_id" "uuid",
    "reason" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "resolved" boolean DEFAULT false
);


ALTER TABLE "public"."review_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid",
    "user_id" "uuid",
    "rating" integer,
    "review" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "edited_at" timestamp without time zone,
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."search_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "search_query" "text",
    "filters" "jsonb",
    "location" "public"."geography"(Point,4326),
    "searched_at" timestamp without time zone DEFAULT "now"(),
    "vendor_clicked" "uuid"
);


ALTER TABLE "public"."search_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_token" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "expires" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "is_vendor" boolean DEFAULT false,
    "is_admin" boolean DEFAULT false,
    "active_role" "text" DEFAULT 'customer'::"text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "email" "text",
    "phone" "text",
    "preferred_language" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "external_id" "uuid",
    "emailVerified" timestamp without time zone,
    "name" "text",
    "image" "text",
    "password_hash" "text",
    CONSTRAINT "chk_users_active_role" CHECK (("active_role" = ANY (ARRAY['customer'::"text", 'vendor'::"text", 'admin'::"text"]))),
    CONSTRAINT "users_active_role_check" CHECK (("active_role" = ANY (ARRAY['customer'::"text", 'vendor'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid",
    "message" "text",
    "image_url" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."vendor_announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid",
    "message" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "feedback_type" "public"."feedback_type_enum",
    "priority" "public"."priority_enum",
    CONSTRAINT "chk_vendor_feedback_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'resolved'::"text"]))),
    CONSTRAINT "vendor_feedback_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'resolved'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."vendor_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_hours" (
    "id" integer NOT NULL,
    "vendor_id" "uuid",
    "weekday" integer,
    "open_time" time without time zone,
    "close_time" time without time zone,
    CONSTRAINT "vendor_hours_weekday_check" CHECK ((("weekday" >= 0) AND ("weekday" <= 6)))
);


ALTER TABLE "public"."vendor_hours" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."vendor_hours_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."vendor_hours_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."vendor_hours_id_seq" OWNED BY "public"."vendor_hours"."id";



CREATE TABLE IF NOT EXISTS "public"."vendor_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved" boolean DEFAULT false,
    "resolution_notes" "text"
);


ALTER TABLE "public"."vendor_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_specials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid",
    "title" "text",
    "description" "text",
    "image_url" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."vendor_specials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_static_locations" (
    "id" integer NOT NULL,
    "vendor_id" "uuid",
    "address" "text",
    "latitude" double precision,
    "longitude" double precision,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vendor_static_locations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."vendor_static_locations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."vendor_static_locations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."vendor_static_locations_id_seq" OWNED BY "public"."vendor_static_locations"."id";



CREATE TABLE IF NOT EXISTS "public"."verification_tokens" (
    "identifier" "text" NOT NULL,
    "token" "text" NOT NULL,
    "expires" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."verification_tokens" OWNER TO "postgres";


ALTER TABLE ONLY "public"."vendor_hours" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."vendor_hours_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."vendor_static_locations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."vendor_static_locations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."analytics_exports"
    ADD CONSTRAINT "analytics_exports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_subcategories"
    ADD CONSTRAINT "business_subcategories_name_business_type_id_key" UNIQUE ("name", "business_type_id");



ALTER TABLE ONLY "public"."business_subcategories"
    ADD CONSTRAINT "business_subcategories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_types"
    ADD CONSTRAINT "business_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."business_types"
    ADD CONSTRAINT "business_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_on_the_way"
    ADD CONSTRAINT "customer_on_the_way_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_reports"
    ADD CONSTRAINT "customer_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_customer_id_vendor_id_key" UNIQUE ("customer_id", "vendor_id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderation_logs"
    ADD CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_settings_broken"
    ADD CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_reports"
    ADD CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_logs"
    ADD CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_external_id_key" UNIQUE ("external_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_announcements"
    ADD CONSTRAINT "vendor_announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_feedback"
    ADD CONSTRAINT "vendor_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_hours"
    ADD CONSTRAINT "vendor_hours_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_live_sessions"
    ADD CONSTRAINT "vendor_live_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_reports"
    ADD CONSTRAINT "vendor_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_specials"
    ADD CONSTRAINT "vendor_specials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_static_locations"
    ADD CONSTRAINT "vendor_static_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_business_name_unique" UNIQUE ("business_name");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_contact_email_unique" UNIQUE ("contact_email");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."verification_tokens"
    ADD CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("identifier", "token");



CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "public"."accounts" USING "btree" ("provider", "provider_account_id");



CREATE INDEX "idx_admin_users_email" ON "public"."admin_users" USING "btree" ("email");



CREATE INDEX "idx_admin_users_username" ON "public"."admin_users" USING "btree" ("username");



CREATE INDEX "idx_analytics_exports_admin_id" ON "public"."analytics_exports" USING "btree" ("admin_id");



CREATE INDEX "idx_analytics_exports_status" ON "public"."analytics_exports" USING "btree" ("status");



CREATE INDEX "idx_customer_on_the_way_user_id" ON "public"."customer_on_the_way" USING "btree" ("user_id");



CREATE INDEX "idx_customer_on_the_way_vendor_id" ON "public"."customer_on_the_way" USING "btree" ("vendor_id");



CREATE INDEX "idx_customer_reports_reporter_id" ON "public"."customer_reports" USING "btree" ("reporter_id");



CREATE INDEX "idx_customer_reports_vendor_id" ON "public"."customer_reports" USING "btree" ("vendor_id");



CREATE INDEX "idx_favorites_customer_id" ON "public"."favorites" USING "btree" ("customer_id");



CREATE INDEX "idx_favorites_vendor_id" ON "public"."favorites" USING "btree" ("vendor_id");



CREATE INDEX "idx_moderation_logs_priority" ON "public"."moderation_logs" USING "btree" ("priority");



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_recipient_id" ON "public"."notifications" USING "btree" ("recipient_id");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_reviews_created_at" ON "public"."reviews" USING "btree" ("created_at");



CREATE INDEX "idx_reviews_rating" ON "public"."reviews" USING "btree" ("rating");



CREATE INDEX "idx_reviews_user_id" ON "public"."reviews" USING "btree" ("user_id");



CREATE INDEX "idx_reviews_vendor_id" ON "public"."reviews" USING "btree" ("vendor_id");



CREATE INDEX "idx_vendor_announcements_created_at" ON "public"."vendor_announcements" USING "btree" ("created_at");



CREATE INDEX "idx_vendor_announcements_vendor_id" ON "public"."vendor_announcements" USING "btree" ("vendor_id");



CREATE INDEX "idx_vendor_feedback_priority" ON "public"."vendor_feedback" USING "btree" ("priority");



CREATE INDEX "idx_vendor_live_sessions_active" ON "public"."vendor_live_sessions" USING "btree" ("vendor_id", "is_active");



CREATE INDEX "idx_vendor_live_sessions_vendor_id" ON "public"."vendor_live_sessions" USING "btree" ("vendor_id");



CREATE INDEX "idx_vendor_reports_reporter_id" ON "public"."vendor_reports" USING "btree" ("reporter_id");



CREATE INDEX "idx_vendor_reports_vendor_id" ON "public"."vendor_reports" USING "btree" ("vendor_id");



CREATE INDEX "idx_vendor_specials_created_at" ON "public"."vendor_specials" USING "btree" ("created_at");



CREATE INDEX "idx_vendor_specials_vendor_id" ON "public"."vendor_specials" USING "btree" ("vendor_id");



CREATE INDEX "idx_vendor_static_locations_coordinates" ON "public"."vendor_static_locations" USING "btree" ("latitude", "longitude");



CREATE INDEX "idx_vendor_static_locations_vendor_id" ON "public"."vendor_static_locations" USING "btree" ("vendor_id");



CREATE INDEX "idx_vendors_status" ON "public"."vendors" USING "btree" ("status");



CREATE INDEX "idx_vendors_status_user_id" ON "public"."vendors" USING "btree" ("status", "user_id");



CREATE UNIQUE INDEX "uniq_live_active" ON "public"."vendor_live_sessions" USING "btree" ("vendor_id") WHERE "is_active";



CREATE OR REPLACE TRIGGER "on_platform_settings_update" BEFORE UPDATE ON "public"."platform_settings_broken" FOR EACH ROW EXECUTE FUNCTION "public"."handle_platform_settings_update"();



CREATE OR REPLACE TRIGGER "trg_update_vendor_rating" AFTER INSERT OR DELETE OR UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_vendor_rating_stats"();



CREATE OR REPLACE TRIGGER "trg_users_updated" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_is_active" BEFORE UPDATE ON "public"."vendor_live_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_is_active_on_end"();



CREATE OR REPLACE TRIGGER "update_admin_users_updated_at" BEFORE UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_customer_on_the_way_updated_at" BEFORE UPDATE ON "public"."customer_on_the_way" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_exports"
    ADD CONSTRAINT "analytics_exports_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."business_subcategories"
    ADD CONSTRAINT "business_subcategories_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "public"."business_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_on_the_way"
    ADD CONSTRAINT "customer_on_the_way_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."customer_on_the_way"
    ADD CONSTRAINT "customer_on_the_way_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_reports"
    ADD CONSTRAINT "customer_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."customer_reports"
    ADD CONSTRAINT "customer_reports_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_static_locations"
    ADD CONSTRAINT "fk_static_vendor" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moderation_logs"
    ADD CONSTRAINT "moderation_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."moderation_logs"
    ADD CONSTRAINT "moderation_logs_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."admin_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_reports"
    ADD CONSTRAINT "review_reports_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_reports"
    ADD CONSTRAINT "review_reports_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."search_logs"
    ADD CONSTRAINT "search_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."search_logs"
    ADD CONSTRAINT "search_logs_vendor_clicked_fkey" FOREIGN KEY ("vendor_clicked") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_announcements"
    ADD CONSTRAINT "vendor_announcements_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_feedback"
    ADD CONSTRAINT "vendor_feedback_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_hours"
    ADD CONSTRAINT "vendor_hours_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_live_sessions"
    ADD CONSTRAINT "vendor_live_sessions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_reports"
    ADD CONSTRAINT "vendor_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_reports"
    ADD CONSTRAINT "vendor_reports_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_specials"
    ADD CONSTRAINT "vendor_specials_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_static_locations"
    ADD CONSTRAINT "vendor_static_locations_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_approved_by_fkey1" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin users are only accessible by service role" ON "public"."admin_users" USING ("public"."is_service_role"());



CREATE POLICY "Admins can manage business subcategories" ON "public"."business_subcategories" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Admins can manage business types" ON "public"."business_types" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Admins can mark their own notifications as read" ON "public"."notifications" FOR UPDATE USING (("recipient_id" = "auth"."uid"()));



CREATE POLICY "Admins can view their own notifications" ON "public"."notifications" FOR SELECT USING (("recipient_id" = "auth"."uid"()));



CREATE POLICY "Allow insert for matching user" ON "public"."vendors" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow verification token access" ON "public"."verification_tokens" TO "service_role" USING (true);



CREATE POLICY "Allow verification token insert" ON "public"."verification_tokens" FOR INSERT WITH CHECK (true);



CREATE POLICY "Analytics exports are only accessible by service role" ON "public"."analytics_exports" USING ("public"."is_service_role"());



CREATE POLICY "Anyone can view vendor announcements" ON "public"."vendor_announcements" FOR SELECT USING (true);



CREATE POLICY "Anyone can view vendor hours" ON "public"."vendor_hours" FOR SELECT USING (true);



CREATE POLICY "Anyone can view vendor profiles" ON "public"."vendors" FOR SELECT USING (true);



CREATE POLICY "Anyone can view vendor specials" ON "public"."vendor_specials" FOR SELECT USING (true);



CREATE POLICY "Anyone can view vendor static locations" ON "public"."vendor_static_locations" FOR SELECT USING (true);



CREATE POLICY "Moderation logs are only accessible by service role" ON "public"."moderation_logs" USING ("public"."is_service_role"());



CREATE POLICY "Notifications are only accessible by service role" ON "public"."notifications" USING ("public"."is_service_role"());



CREATE POLICY "Platform settings are only accessible by service role" ON "public"."platform_settings" USING ("public"."is_service_role"());



CREATE POLICY "Platform settings are only accessible by service role" ON "public"."platform_settings_broken" USING ("public"."is_service_role"());



CREATE POLICY "Public can view business subcategories" ON "public"."business_subcategories" FOR SELECT USING (true);



CREATE POLICY "Public can view business types" ON "public"."business_types" FOR SELECT USING (true);



CREATE POLICY "Public can view live sessions" ON "public"."vendor_live_sessions" FOR SELECT USING (true);



CREATE POLICY "Review reports are only accessible by service role" ON "public"."review_reports" USING ("public"."is_service_role"());



CREATE POLICY "Service role has full access to notifications" ON "public"."notifications" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can delete their own favorites" ON "public"."favorites" FOR DELETE USING (("public"."get_current_user_id"() = "customer_id"));



CREATE POLICY "Users can delete their own reviews" ON "public"."reviews" FOR DELETE USING (("public"."get_current_user_id"() = "user_id"));



CREATE POLICY "Users can insert customer reports" ON "public"."customer_reports" FOR INSERT WITH CHECK (("public"."get_current_user_id"() = "reporter_id"));



CREATE POLICY "Users can insert their own favorites" ON "public"."favorites" FOR INSERT WITH CHECK (("public"."get_current_user_id"() = "customer_id"));



CREATE POLICY "Users can insert their own reviews" ON "public"."reviews" FOR INSERT WITH CHECK (("public"."get_current_user_id"() = "user_id"));



CREATE POLICY "Users can insert vendor reports" ON "public"."vendor_reports" FOR INSERT WITH CHECK (("public"."get_current_user_id"() = "reporter_id"));



CREATE POLICY "Users can manage their own accounts" ON "public"."accounts" USING (("public"."get_current_user_id"() = "user_id")) WITH CHECK (("public"."get_current_user_id"() = "user_id"));



CREATE POLICY "Users can manage their own search logs" ON "public"."search_logs" USING (("public"."get_current_user_id"() = "user_id")) WITH CHECK (("public"."get_current_user_id"() = "user_id"));



CREATE POLICY "Users can manage their own sessions" ON "public"."sessions" USING (("public"."get_current_user_id"() = "user_id")) WITH CHECK (("public"."get_current_user_id"() = "user_id"));



CREATE POLICY "Users can manage their own tracking" ON "public"."customer_on_the_way" USING (("public"."get_current_user_id"() = "user_id")) WITH CHECK (("public"."get_current_user_id"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE USING (("public"."get_current_user_id"() = "id"));



CREATE POLICY "Users can update their own reviews" ON "public"."reviews" FOR UPDATE USING (("public"."get_current_user_id"() = "user_id"));



CREATE POLICY "Users can view all reviews" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Users can view all user profiles" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Users can view their own customer reports" ON "public"."customer_reports" FOR SELECT USING (("public"."get_current_user_id"() = "reporter_id"));



CREATE POLICY "Users can view their own favorites" ON "public"."favorites" FOR SELECT USING (("public"."get_current_user_id"() = "customer_id"));



CREATE POLICY "Users can view their own reports" ON "public"."vendor_reports" FOR SELECT USING (("public"."get_current_user_id"() = "reporter_id"));



CREATE POLICY "Vendors can manage their own announcements" ON "public"."vendor_announcements" USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "vendor_announcements"."vendor_id") AND ("vendors"."user_id" = "public"."get_current_user_id"())))));



CREATE POLICY "Vendors can manage their own feedback" ON "public"."vendor_feedback" USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "vendor_feedback"."vendor_id") AND ("vendors"."user_id" = "public"."get_current_user_id"())))));



CREATE POLICY "Vendors can manage their own hours" ON "public"."vendor_hours" USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "vendor_hours"."vendor_id") AND ("vendors"."user_id" = "public"."get_current_user_id"())))));



CREATE POLICY "Vendors can manage their own profile" ON "public"."vendors" USING (("public"."get_current_user_id"() = "user_id")) WITH CHECK (("public"."get_current_user_id"() = "user_id"));



CREATE POLICY "Vendors can manage their own specials" ON "public"."vendor_specials" USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "vendor_specials"."vendor_id") AND ("vendors"."user_id" = "public"."get_current_user_id"())))));



CREATE POLICY "Vendors can manage their own static locations" ON "public"."vendor_static_locations" USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "vendor_static_locations"."vendor_id") AND ("vendors"."user_id" = "public"."get_current_user_id"())))));



CREATE POLICY "Vendors can manage their sessions" ON "public"."vendor_live_sessions" USING ((EXISTS ( SELECT 1
   FROM "public"."vendors"
  WHERE (("vendors"."id" = "vendor_live_sessions"."vendor_id") AND ("vendors"."user_id" = COALESCE((NULLIF("current_setting"('app.current_user_id'::"text", true), ''::"text"))::"uuid", "auth"."uid"(),
        CASE
            WHEN (CURRENT_USER = 'service_role'::"name") THEN "vendors"."user_id"
            ELSE NULL::"uuid"
        END))))));



ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_exports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_subcategories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_on_the_way" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."favorites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendor_announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendor_live_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendor_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendor_specials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendor_static_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification_tokens" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_auth_context"() TO "anon";
GRANT ALL ON FUNCTION "public"."clear_auth_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_auth_context"() TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_current_user_context"() TO "anon";
GRANT ALL ON FUNCTION "public"."clear_current_user_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_current_user_context"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_platform_settings_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_platform_settings_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_platform_settings_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_current_user_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_current_user_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_current_user_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_service_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_service_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_service_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_auth_role"("role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_auth_role"("role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_auth_role"("role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_auth_user_id"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_auth_user_id"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_auth_user_id"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_current_user_context"("user_id" "uuid", "role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_current_user_context"("user_id" "uuid", "role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_current_user_context"("user_id" "uuid", "role_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_is_active_on_end"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_is_active_on_end"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_is_active_on_end"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_vendor_rating_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_vendor_rating_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_vendor_rating_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_vendor_upload"("p_user_id" "uuid", "p_vendor_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_vendor_upload"("p_user_id" "uuid", "p_vendor_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_vendor_upload"("p_user_id" "uuid", "p_vendor_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_exports" TO "anon";
GRANT ALL ON TABLE "public"."analytics_exports" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_exports" TO "service_role";



GRANT ALL ON TABLE "public"."business_subcategories" TO "anon";
GRANT ALL ON TABLE "public"."business_subcategories" TO "authenticated";
GRANT ALL ON TABLE "public"."business_subcategories" TO "service_role";



GRANT ALL ON TABLE "public"."business_types" TO "anon";
GRANT ALL ON TABLE "public"."business_types" TO "authenticated";
GRANT ALL ON TABLE "public"."business_types" TO "service_role";



GRANT ALL ON TABLE "public"."customer_on_the_way" TO "anon";
GRANT ALL ON TABLE "public"."customer_on_the_way" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_on_the_way" TO "service_role";



GRANT ALL ON TABLE "public"."customer_reports" TO "anon";
GRANT ALL ON TABLE "public"."customer_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_reports" TO "service_role";



GRANT ALL ON TABLE "public"."favorites" TO "anon";
GRANT ALL ON TABLE "public"."favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_live_sessions" TO "anon";
GRANT ALL ON TABLE "public"."vendor_live_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_live_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."vendors" TO "anon";
GRANT ALL ON TABLE "public"."vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."vendors" TO "service_role";



GRANT ALL ON TABLE "public"."live_vendors_with_sessions" TO "anon";
GRANT ALL ON TABLE "public"."live_vendors_with_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."live_vendors_with_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."moderation_logs" TO "anon";
GRANT ALL ON TABLE "public"."moderation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."moderation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."platform_settings" TO "anon";
GRANT ALL ON TABLE "public"."platform_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_settings" TO "service_role";



GRANT ALL ON TABLE "public"."platform_settings_broken" TO "anon";
GRANT ALL ON TABLE "public"."platform_settings_broken" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_settings_broken" TO "service_role";



GRANT ALL ON TABLE "public"."review_reports" TO "anon";
GRANT ALL ON TABLE "public"."review_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."review_reports" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."search_logs" TO "anon";
GRANT ALL ON TABLE "public"."search_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."search_logs" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_announcements" TO "anon";
GRANT ALL ON TABLE "public"."vendor_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_announcements" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_feedback" TO "anon";
GRANT ALL ON TABLE "public"."vendor_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_hours" TO "anon";
GRANT ALL ON TABLE "public"."vendor_hours" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_hours" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vendor_hours_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vendor_hours_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vendor_hours_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_reports" TO "anon";
GRANT ALL ON TABLE "public"."vendor_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_reports" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_specials" TO "anon";
GRANT ALL ON TABLE "public"."vendor_specials" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_specials" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_static_locations" TO "anon";
GRANT ALL ON TABLE "public"."vendor_static_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_static_locations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vendor_static_locations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vendor_static_locations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vendor_static_locations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."verification_tokens" TO "anon";
GRANT ALL ON TABLE "public"."verification_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."verification_tokens" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
