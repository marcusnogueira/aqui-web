create extension if not exists "postgis" with schema "public" version '3.3.7';

create type "public"."feedback_type_enum" as enum ('BUG', 'FEATURE', 'GENERAL');

create type "public"."notification_type_enum" as enum ('new_vendor_signup', 'vendor_report', 'review_report', 'system_alert');

create type "public"."priority_enum" as enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

create type "public"."vendor_status_enum" as enum ('pending', 'approved', 'active', 'inactive', 'rejected', 'suspended');

create sequence "public"."vendor_hours_id_seq";

create sequence "public"."vendor_static_locations_id_seq";

create table "public"."admin_users" (
    "id" uuid not null default gen_random_uuid(),
    "email" character varying(255) not null,
    "username" character varying(100) not null,
    "password_hash" character varying(255) not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."admin_users" enable row level security;

create table "public"."analytics_exports" (
    "id" uuid not null default gen_random_uuid(),
    "admin_id" uuid,
    "vendor_id" uuid,
    "export_type" text,
    "created_at" timestamp without time zone default now(),
    "status" text default 'pending'::text,
    "download_url" text
);


alter table "public"."analytics_exports" enable row level security;

create table "public"."business_subcategories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "business_type_id" uuid not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."business_subcategories" enable row level security;

create table "public"."business_types" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."business_types" enable row level security;

create table "public"."customer_on_the_way" (
    "id" uuid not null default gen_random_uuid(),
    "vendor_id" uuid,
    "user_id" uuid,
    "clicked_at" timestamp without time zone default now(),
    "customer_latitude" double precision,
    "customer_longitude" double precision
);


alter table "public"."customer_on_the_way" enable row level security;

create table "public"."customer_reports" (
    "id" uuid not null default gen_random_uuid(),
    "reporter_id" uuid,
    "vendor_id" uuid,
    "issue" text,
    "created_at" timestamp without time zone default now(),
    "resolved" boolean default false,
    "resolution_notes" text
);


alter table "public"."customer_reports" enable row level security;

create table "public"."favorites" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid not null,
    "vendor_id" uuid not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."favorites" enable row level security;

create table "public"."moderation_logs" (
    "id" uuid not null default gen_random_uuid(),
    "admin_id" uuid,
    "vendor_id" uuid,
    "action" text,
    "notes" text,
    "created_at" timestamp without time zone default now(),
    "priority" priority_enum
);


create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "recipient_id" uuid,
    "type" notification_type_enum not null,
    "message" text not null,
    "link" text,
    "is_read" boolean default false,
    "created_at" timestamp with time zone default now()
);


alter table "public"."notifications" enable row level security;

create table "public"."platform_settings" (
    "id" boolean not null default true,
    "allow_auto_vendor_approval" boolean default false,
    "maintenance_mode" boolean default false,
    "updated_at" timestamp without time zone default now()
);


create table "public"."review_reports" (
    "id" uuid not null default gen_random_uuid(),
    "review_id" uuid,
    "vendor_id" uuid,
    "reason" text,
    "created_at" timestamp without time zone default now(),
    "resolved" boolean default false
);


create table "public"."reviews" (
    "id" uuid not null default gen_random_uuid(),
    "vendor_id" uuid,
    "user_id" uuid,
    "rating" integer,
    "review" text,
    "created_at" timestamp without time zone default now(),
    "edited_at" timestamp without time zone
);


alter table "public"."reviews" enable row level security;

create table "public"."search_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "search_query" text,
    "filters" jsonb,
    "location" geography(Point,4326),
    "searched_at" timestamp without time zone default now(),
    "vendor_clicked" uuid
);


create table "public"."users" (
    "id" uuid not null,
    "full_name" text,
    "avatar_url" text,
    "is_vendor" boolean default false,
    "is_admin" boolean default false,
    "active_role" text default 'customer'::text,
    "created_at" timestamp without time zone default now(),
    "email" text,
    "phone" text,
    "preferred_language" text,
    "updated_at" timestamp with time zone default now(),
    "external_id" uuid,
    "email_verified" timestamp without time zone,
    "name" text,
    "image" text,
    "password" text
);


create table "public"."vendor_announcements" (
    "id" uuid not null default gen_random_uuid(),
    "vendor_id" uuid,
    "message" text,
    "image_url" text,
    "created_at" timestamp without time zone default now()
);


alter table "public"."vendor_announcements" enable row level security;

create table "public"."vendor_feedback" (
    "id" uuid not null default gen_random_uuid(),
    "vendor_id" uuid,
    "message" text,
    "status" text default 'pending'::text,
    "created_at" timestamp without time zone default now(),
    "feedback_type" feedback_type_enum,
    "priority" priority_enum
);


create table "public"."vendor_hours" (
    "id" integer not null default nextval('vendor_hours_id_seq'::regclass),
    "vendor_id" uuid,
    "weekday" integer,
    "open_time" time without time zone,
    "close_time" time without time zone
);


create table "public"."vendor_live_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "vendor_id" uuid,
    "start_time" timestamp without time zone not null,
    "end_time" timestamp without time zone,
    "was_scheduled_duration" integer,
    "estimated_customers" integer default 0,
    "latitude" double precision,
    "longitude" double precision,
    "address" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "auto_end_time" timestamp without time zone,
    "ended_by" text default 'vendor'::text
);


alter table "public"."vendor_live_sessions" enable row level security;

create table "public"."vendor_reports" (
    "id" uuid not null default gen_random_uuid(),
    "vendor_id" uuid not null,
    "reporter_id" uuid not null,
    "reason" text not null,
    "created_at" timestamp with time zone default now(),
    "resolved" boolean default false,
    "resolution_notes" text
);


alter table "public"."vendor_reports" enable row level security;

create table "public"."vendor_specials" (
    "id" uuid not null default gen_random_uuid(),
    "vendor_id" uuid,
    "title" text,
    "description" text,
    "image_url" text,
    "created_at" timestamp without time zone default now()
);


alter table "public"."vendor_specials" enable row level security;

create table "public"."vendor_static_locations" (
    "id" integer not null default nextval('vendor_static_locations_id_seq'::regclass),
    "vendor_id" uuid,
    "address" text,
    "latitude" double precision,
    "longitude" double precision
);


alter table "public"."vendor_static_locations" enable row level security;

create table "public"."vendors" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "business_name" text not null,
    "description" text,
    "business_type" text,
    "subcategory" text,
    "tags" text[],
    "profile_image_url" text,
    "banner_image_url" text[],
    "contact_email" text,
    "phone" text,
    "address" text,
    "approved_by" uuid,
    "approved_at" timestamp without time zone,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "average_rating" numeric default 0,
    "total_reviews" integer default 0,
    "admin_notes" text,
    "latitude" double precision,
    "longitude" double precision,
    "city" text,
    "status" vendor_status_enum default 'pending'::vendor_status_enum,
    "rejection_reason" text,
    "subcategory__other" text
);


alter table "public"."vendors" enable row level security;

alter sequence "public"."vendor_hours_id_seq" owned by "public"."vendor_hours"."id";

alter sequence "public"."vendor_static_locations_id_seq" owned by "public"."vendor_static_locations"."id";

CREATE UNIQUE INDEX admin_users_email_key ON public.admin_users USING btree (email);

CREATE UNIQUE INDEX admin_users_pkey ON public.admin_users USING btree (id);

CREATE UNIQUE INDEX admin_users_username_key ON public.admin_users USING btree (username);

CREATE UNIQUE INDEX analytics_exports_pkey ON public.analytics_exports USING btree (id);

CREATE UNIQUE INDEX business_subcategories_name_business_type_id_key ON public.business_subcategories USING btree (name, business_type_id);

CREATE UNIQUE INDEX business_subcategories_pkey ON public.business_subcategories USING btree (id);

CREATE UNIQUE INDEX business_types_name_key ON public.business_types USING btree (name);

CREATE UNIQUE INDEX business_types_pkey ON public.business_types USING btree (id);

CREATE UNIQUE INDEX customer_on_the_way_pkey ON public.customer_on_the_way USING btree (id);

CREATE UNIQUE INDEX customer_reports_pkey ON public.customer_reports USING btree (id);

CREATE UNIQUE INDEX favorites_customer_id_vendor_id_key ON public.favorites USING btree (customer_id, vendor_id);

CREATE UNIQUE INDEX favorites_pkey ON public.favorites USING btree (id);

CREATE INDEX idx_admin_users_email ON public.admin_users USING btree (email);

CREATE INDEX idx_admin_users_username ON public.admin_users USING btree (username);

CREATE INDEX idx_analytics_exports_admin_id ON public.analytics_exports USING btree (admin_id);

CREATE INDEX idx_analytics_exports_status ON public.analytics_exports USING btree (status);

CREATE INDEX idx_customer_on_the_way_user_id ON public.customer_on_the_way USING btree (user_id);

CREATE INDEX idx_customer_on_the_way_vendor_id ON public.customer_on_the_way USING btree (vendor_id);

CREATE INDEX idx_customer_reports_reporter_id ON public.customer_reports USING btree (reporter_id);

CREATE INDEX idx_customer_reports_vendor_id ON public.customer_reports USING btree (vendor_id);

CREATE INDEX idx_favorites_customer_id ON public.favorites USING btree (customer_id);

CREATE INDEX idx_favorites_vendor_id ON public.favorites USING btree (vendor_id);

CREATE INDEX idx_moderation_logs_priority ON public.moderation_logs USING btree (priority);

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);

CREATE INDEX idx_notifications_recipient_id ON public.notifications USING btree (recipient_id);

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);

CREATE INDEX idx_reviews_created_at ON public.reviews USING btree (created_at);

CREATE INDEX idx_reviews_rating ON public.reviews USING btree (rating);

CREATE INDEX idx_reviews_user_id ON public.reviews USING btree (user_id);

CREATE INDEX idx_reviews_vendor_id ON public.reviews USING btree (vendor_id);

CREATE INDEX idx_vendor_announcements_created_at ON public.vendor_announcements USING btree (created_at);

CREATE INDEX idx_vendor_announcements_vendor_id ON public.vendor_announcements USING btree (vendor_id);

CREATE INDEX idx_vendor_feedback_priority ON public.vendor_feedback USING btree (priority);

CREATE INDEX idx_vendor_live_sessions_active ON public.vendor_live_sessions USING btree (vendor_id, is_active);

CREATE INDEX idx_vendor_live_sessions_vendor_id ON public.vendor_live_sessions USING btree (vendor_id);

CREATE INDEX idx_vendor_reports_reporter_id ON public.vendor_reports USING btree (reporter_id);

CREATE INDEX idx_vendor_reports_vendor_id ON public.vendor_reports USING btree (vendor_id);

CREATE INDEX idx_vendor_specials_created_at ON public.vendor_specials USING btree (created_at);

CREATE INDEX idx_vendor_specials_vendor_id ON public.vendor_specials USING btree (vendor_id);

CREATE INDEX idx_vendor_static_locations_coordinates ON public.vendor_static_locations USING btree (latitude, longitude);

CREATE INDEX idx_vendor_static_locations_vendor_id ON public.vendor_static_locations USING btree (vendor_id);

CREATE INDEX idx_vendors_status ON public.vendors USING btree (status);

CREATE UNIQUE INDEX moderation_logs_pkey ON public.moderation_logs USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX platform_settings_pkey ON public.platform_settings USING btree (id);

CREATE UNIQUE INDEX review_reports_pkey ON public.review_reports USING btree (id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE UNIQUE INDEX search_logs_pkey ON public.search_logs USING btree (id);

CREATE UNIQUE INDEX uniq_live_active ON public.vendor_live_sessions USING btree (vendor_id) WHERE is_active;

CREATE UNIQUE INDEX users_external_id_key ON public.users USING btree (external_id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX vendor_announcements_pkey ON public.vendor_announcements USING btree (id);

CREATE UNIQUE INDEX vendor_feedback_pkey ON public.vendor_feedback USING btree (id);

CREATE UNIQUE INDEX vendor_hours_pkey ON public.vendor_hours USING btree (id);

CREATE UNIQUE INDEX vendor_live_sessions_pkey ON public.vendor_live_sessions USING btree (id);

CREATE UNIQUE INDEX vendor_reports_pkey ON public.vendor_reports USING btree (id);

CREATE UNIQUE INDEX vendor_specials_pkey ON public.vendor_specials USING btree (id);

CREATE UNIQUE INDEX vendor_static_locations_pkey ON public.vendor_static_locations USING btree (id);

CREATE UNIQUE INDEX vendors_pkey1 ON public.vendors USING btree (id);

alter table "public"."admin_users" add constraint "admin_users_pkey" PRIMARY KEY using index "admin_users_pkey";

alter table "public"."analytics_exports" add constraint "analytics_exports_pkey" PRIMARY KEY using index "analytics_exports_pkey";

alter table "public"."business_subcategories" add constraint "business_subcategories_pkey" PRIMARY KEY using index "business_subcategories_pkey";

alter table "public"."business_types" add constraint "business_types_pkey" PRIMARY KEY using index "business_types_pkey";

alter table "public"."customer_on_the_way" add constraint "customer_on_the_way_pkey" PRIMARY KEY using index "customer_on_the_way_pkey";

alter table "public"."customer_reports" add constraint "customer_reports_pkey" PRIMARY KEY using index "customer_reports_pkey";

alter table "public"."favorites" add constraint "favorites_pkey" PRIMARY KEY using index "favorites_pkey";

alter table "public"."moderation_logs" add constraint "moderation_logs_pkey" PRIMARY KEY using index "moderation_logs_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."platform_settings" add constraint "platform_settings_pkey" PRIMARY KEY using index "platform_settings_pkey";

alter table "public"."review_reports" add constraint "review_reports_pkey" PRIMARY KEY using index "review_reports_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."search_logs" add constraint "search_logs_pkey" PRIMARY KEY using index "search_logs_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."vendor_announcements" add constraint "vendor_announcements_pkey" PRIMARY KEY using index "vendor_announcements_pkey";

alter table "public"."vendor_feedback" add constraint "vendor_feedback_pkey" PRIMARY KEY using index "vendor_feedback_pkey";

alter table "public"."vendor_hours" add constraint "vendor_hours_pkey" PRIMARY KEY using index "vendor_hours_pkey";

alter table "public"."vendor_live_sessions" add constraint "vendor_live_sessions_pkey" PRIMARY KEY using index "vendor_live_sessions_pkey";

alter table "public"."vendor_reports" add constraint "vendor_reports_pkey" PRIMARY KEY using index "vendor_reports_pkey";

alter table "public"."vendor_specials" add constraint "vendor_specials_pkey" PRIMARY KEY using index "vendor_specials_pkey";

alter table "public"."vendor_static_locations" add constraint "vendor_static_locations_pkey" PRIMARY KEY using index "vendor_static_locations_pkey";

alter table "public"."vendors" add constraint "vendors_pkey1" PRIMARY KEY using index "vendors_pkey1";

alter table "public"."admin_users" add constraint "admin_users_email_key" UNIQUE using index "admin_users_email_key";

alter table "public"."admin_users" add constraint "admin_users_username_key" UNIQUE using index "admin_users_username_key";

alter table "public"."analytics_exports" add constraint "analytics_exports_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES users(id) not valid;

alter table "public"."analytics_exports" validate constraint "analytics_exports_admin_id_fkey";

alter table "public"."analytics_exports" add constraint "analytics_exports_export_type_check" CHECK ((export_type = ANY (ARRAY['vendor'::text, 'platform'::text]))) not valid;

alter table "public"."analytics_exports" validate constraint "analytics_exports_export_type_check";

alter table "public"."business_subcategories" add constraint "business_subcategories_business_type_id_fkey" FOREIGN KEY (business_type_id) REFERENCES business_types(id) ON DELETE CASCADE not valid;

alter table "public"."business_subcategories" validate constraint "business_subcategories_business_type_id_fkey";

alter table "public"."business_subcategories" add constraint "business_subcategories_name_business_type_id_key" UNIQUE using index "business_subcategories_name_business_type_id_key";

alter table "public"."business_types" add constraint "business_types_name_key" UNIQUE using index "business_types_name_key";

alter table "public"."customer_on_the_way" add constraint "customer_on_the_way_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) not valid;

alter table "public"."customer_on_the_way" validate constraint "customer_on_the_way_user_id_fkey";

alter table "public"."customer_on_the_way" add constraint "customer_on_the_way_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE not valid;

alter table "public"."customer_on_the_way" validate constraint "customer_on_the_way_vendor_id_fkey";

alter table "public"."customer_reports" add constraint "customer_reports_reporter_id_fkey" FOREIGN KEY (reporter_id) REFERENCES users(id) not valid;

alter table "public"."customer_reports" validate constraint "customer_reports_reporter_id_fkey";

alter table "public"."customer_reports" add constraint "customer_reports_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE not valid;

alter table "public"."customer_reports" validate constraint "customer_reports_vendor_id_fkey";

alter table "public"."favorites" add constraint "favorites_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."favorites" validate constraint "favorites_customer_id_fkey";

alter table "public"."favorites" add constraint "favorites_customer_id_vendor_id_key" UNIQUE using index "favorites_customer_id_vendor_id_key";

alter table "public"."favorites" add constraint "favorites_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE not valid;

alter table "public"."favorites" validate constraint "favorites_vendor_id_fkey";

alter table "public"."moderation_logs" add constraint "moderation_logs_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES users(id) not valid;

alter table "public"."moderation_logs" validate constraint "moderation_logs_admin_id_fkey";

alter table "public"."moderation_logs" add constraint "moderation_logs_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE not valid;

alter table "public"."moderation_logs" validate constraint "moderation_logs_vendor_id_fkey";

alter table "public"."notifications" add constraint "notifications_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES admin_users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_recipient_id_fkey";

alter table "public"."review_reports" add constraint "review_reports_review_id_fkey" FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE not valid;

alter table "public"."review_reports" validate constraint "review_reports_review_id_fkey";

alter table "public"."review_reports" add constraint "review_reports_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE not valid;

alter table "public"."review_reports" validate constraint "review_reports_vendor_id_fkey";

alter table "public"."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_check";

alter table "public"."reviews" add constraint "reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."reviews" validate constraint "reviews_user_id_fkey";

alter table "public"."reviews" add constraint "reviews_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_vendor_id_fkey";

alter table "public"."search_logs" add constraint "search_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) not valid;

alter table "public"."search_logs" validate constraint "search_logs_user_id_fkey";

alter table "public"."search_logs" add constraint "search_logs_vendor_clicked_fkey" FOREIGN KEY (vendor_clicked) REFERENCES vendors(id) ON DELETE SET NULL not valid;

alter table "public"."search_logs" validate constraint "search_logs_vendor_clicked_fkey";

alter table "public"."users" add constraint "chk_users_active_role" CHECK ((active_role = ANY (ARRAY['customer'::text, 'vendor'::text, 'admin'::text]))) not valid;

alter table "public"."users" validate constraint "chk_users_active_role";

alter table "public"."users" add constraint "users_active_role_check" CHECK ((active_role = ANY (ARRAY['customer'::text, 'vendor'::text]))) not valid;

alter table "public"."users" validate constraint "users_active_role_check";

alter table "public"."users" add constraint "users_external_id_key" UNIQUE using index "users_external_id_key";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

alter table "public"."vendor_announcements" add constraint "vendor_announcements_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE not valid;

alter table "public"."vendor_announcements" validate constraint "vendor_announcements_vendor_id_fkey";

alter table "public"."vendor_feedback" add constraint "chk_vendor_feedback_status" CHECK ((status = ANY (ARRAY['pending'::text, 'resolved'::text]))) not valid;

alter table "public"."vendor_feedback" validate constraint "chk_vendor_feedback_status";

alter table "public"."vendor_feedback" add constraint "vendor_feedback_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'resolved'::text, 'dismissed'::text]))) not valid;

alter table "public"."vendor_feedback" validate constraint "vendor_feedback_status_check";

alter table "public"."vendor_feedback" add constraint "vendor_feedback_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE not valid;

alter table "public"."vendor_feedback" validate constraint "vendor_feedback_vendor_id_fkey";

alter table "public"."vendor_hours" add constraint "vendor_hours_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE not valid;

alter table "public"."vendor_hours" validate constraint "vendor_hours_vendor_id_fkey";

alter table "public"."vendor_hours" add constraint "vendor_hours_weekday_check" CHECK (((weekday >= 0) AND (weekday <= 6))) not valid;

alter table "public"."vendor_hours" validate constraint "vendor_hours_weekday_check";

alter table "public"."vendor_live_sessions" add constraint "vendor_live_sessions_ended_by_check" CHECK ((ended_by = ANY (ARRAY['vendor'::text, 'timer'::text]))) not valid;

alter table "public"."vendor_live_sessions" validate constraint "vendor_live_sessions_ended_by_check";

alter table "public"."vendor_live_sessions" add constraint "vendor_live_sessions_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE not valid;

alter table "public"."vendor_live_sessions" validate constraint "vendor_live_sessions_vendor_id_fkey";

alter table "public"."vendor_reports" add constraint "vendor_reports_reporter_id_fkey" FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."vendor_reports" validate constraint "vendor_reports_reporter_id_fkey";

alter table "public"."vendor_reports" add constraint "vendor_reports_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE not valid;

alter table "public"."vendor_reports" validate constraint "vendor_reports_vendor_id_fkey";

alter table "public"."vendor_specials" add constraint "vendor_specials_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE not valid;

alter table "public"."vendor_specials" validate constraint "vendor_specials_vendor_id_fkey";

alter table "public"."vendor_static_locations" add constraint "fk_static_vendor" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE not valid;

alter table "public"."vendor_static_locations" validate constraint "fk_static_vendor";

alter table "public"."vendor_static_locations" add constraint "vendor_static_locations_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE not valid;

alter table "public"."vendor_static_locations" validate constraint "vendor_static_locations_vendor_id_fkey";

alter table "public"."vendors" add constraint "vendors_approved_by_fkey1" FOREIGN KEY (approved_by) REFERENCES users(id) not valid;

alter table "public"."vendors" validate constraint "vendors_approved_by_fkey1";

alter table "public"."vendors" add constraint "vendors_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."vendors" validate constraint "vendors_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.clear_current_user_context()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    PERFORM set_config('app.current_user_id', '', true);
    PERFORM set_config('app.current_role', '', true);
END;
$function$
;

create type "public"."geometry_dump" as ("path" integer[], "geom" geometry);

CREATE OR REPLACE FUNCTION public.get_current_user_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_platform_settings_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.is_service_role()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

create or replace view "public"."live_vendors_with_sessions" as  SELECT v.id,
    v.user_id,
    v.business_name,
    v.description,
    v.business_type,
    v.subcategory,
    v.tags,
    v.profile_image_url,
    v.banner_image_url,
    v.contact_email,
    v.phone,
    v.address,
    v.approved_by,
    v.approved_at,
    v.created_at,
    v.updated_at,
    v.average_rating,
    v.total_reviews,
    v.admin_notes,
    v.latitude,
    v.longitude,
    v.city,
    v.status,
    v.rejection_reason,
    v.subcategory__other,
    vls.id AS session_id,
    vls.start_time,
    vls.end_time,
    vls.is_active,
    vls.latitude AS live_latitude,
    vls.longitude AS live_longitude
   FROM (vendors v
     JOIN vendor_live_sessions vls ON ((v.id = vls.vendor_id)))
  WHERE ((v.status = 'active'::vendor_status_enum) AND (vls.is_active = true));


CREATE OR REPLACE FUNCTION public.set_current_user_context(user_id uuid, role_name text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Set the current user ID for RLS policies
    PERFORM set_config('app.current_user_id', user_id::TEXT, true);
    
    -- Set the current role if provided
    IF role_name IS NOT NULL THEN
        PERFORM set_config('app.current_role', role_name, true);
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_vendor_rating_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

create type "public"."valid_detail" as ("valid" boolean, "reason" character varying, "location" geometry);

grant delete on table "public"."admin_users" to "anon";

grant insert on table "public"."admin_users" to "anon";

grant references on table "public"."admin_users" to "anon";

grant select on table "public"."admin_users" to "anon";

grant trigger on table "public"."admin_users" to "anon";

grant truncate on table "public"."admin_users" to "anon";

grant update on table "public"."admin_users" to "anon";

grant delete on table "public"."admin_users" to "authenticated";

grant insert on table "public"."admin_users" to "authenticated";

grant references on table "public"."admin_users" to "authenticated";

grant select on table "public"."admin_users" to "authenticated";

grant trigger on table "public"."admin_users" to "authenticated";

grant truncate on table "public"."admin_users" to "authenticated";

grant update on table "public"."admin_users" to "authenticated";

grant delete on table "public"."admin_users" to "service_role";

grant insert on table "public"."admin_users" to "service_role";

grant references on table "public"."admin_users" to "service_role";

grant select on table "public"."admin_users" to "service_role";

grant trigger on table "public"."admin_users" to "service_role";

grant truncate on table "public"."admin_users" to "service_role";

grant update on table "public"."admin_users" to "service_role";

grant delete on table "public"."analytics_exports" to "anon";

grant insert on table "public"."analytics_exports" to "anon";

grant references on table "public"."analytics_exports" to "anon";

grant select on table "public"."analytics_exports" to "anon";

grant trigger on table "public"."analytics_exports" to "anon";

grant truncate on table "public"."analytics_exports" to "anon";

grant update on table "public"."analytics_exports" to "anon";

grant delete on table "public"."analytics_exports" to "authenticated";

grant insert on table "public"."analytics_exports" to "authenticated";

grant references on table "public"."analytics_exports" to "authenticated";

grant select on table "public"."analytics_exports" to "authenticated";

grant trigger on table "public"."analytics_exports" to "authenticated";

grant truncate on table "public"."analytics_exports" to "authenticated";

grant update on table "public"."analytics_exports" to "authenticated";

grant delete on table "public"."analytics_exports" to "service_role";

grant insert on table "public"."analytics_exports" to "service_role";

grant references on table "public"."analytics_exports" to "service_role";

grant select on table "public"."analytics_exports" to "service_role";

grant trigger on table "public"."analytics_exports" to "service_role";

grant truncate on table "public"."analytics_exports" to "service_role";

grant update on table "public"."analytics_exports" to "service_role";

grant delete on table "public"."business_subcategories" to "anon";

grant insert on table "public"."business_subcategories" to "anon";

grant references on table "public"."business_subcategories" to "anon";

grant select on table "public"."business_subcategories" to "anon";

grant trigger on table "public"."business_subcategories" to "anon";

grant truncate on table "public"."business_subcategories" to "anon";

grant update on table "public"."business_subcategories" to "anon";

grant delete on table "public"."business_subcategories" to "authenticated";

grant insert on table "public"."business_subcategories" to "authenticated";

grant references on table "public"."business_subcategories" to "authenticated";

grant select on table "public"."business_subcategories" to "authenticated";

grant trigger on table "public"."business_subcategories" to "authenticated";

grant truncate on table "public"."business_subcategories" to "authenticated";

grant update on table "public"."business_subcategories" to "authenticated";

grant delete on table "public"."business_subcategories" to "service_role";

grant insert on table "public"."business_subcategories" to "service_role";

grant references on table "public"."business_subcategories" to "service_role";

grant select on table "public"."business_subcategories" to "service_role";

grant trigger on table "public"."business_subcategories" to "service_role";

grant truncate on table "public"."business_subcategories" to "service_role";

grant update on table "public"."business_subcategories" to "service_role";

grant delete on table "public"."business_types" to "anon";

grant insert on table "public"."business_types" to "anon";

grant references on table "public"."business_types" to "anon";

grant select on table "public"."business_types" to "anon";

grant trigger on table "public"."business_types" to "anon";

grant truncate on table "public"."business_types" to "anon";

grant update on table "public"."business_types" to "anon";

grant delete on table "public"."business_types" to "authenticated";

grant insert on table "public"."business_types" to "authenticated";

grant references on table "public"."business_types" to "authenticated";

grant select on table "public"."business_types" to "authenticated";

grant trigger on table "public"."business_types" to "authenticated";

grant truncate on table "public"."business_types" to "authenticated";

grant update on table "public"."business_types" to "authenticated";

grant delete on table "public"."business_types" to "service_role";

grant insert on table "public"."business_types" to "service_role";

grant references on table "public"."business_types" to "service_role";

grant select on table "public"."business_types" to "service_role";

grant trigger on table "public"."business_types" to "service_role";

grant truncate on table "public"."business_types" to "service_role";

grant update on table "public"."business_types" to "service_role";

grant delete on table "public"."customer_on_the_way" to "anon";

grant insert on table "public"."customer_on_the_way" to "anon";

grant references on table "public"."customer_on_the_way" to "anon";

grant select on table "public"."customer_on_the_way" to "anon";

grant trigger on table "public"."customer_on_the_way" to "anon";

grant truncate on table "public"."customer_on_the_way" to "anon";

grant update on table "public"."customer_on_the_way" to "anon";

grant delete on table "public"."customer_on_the_way" to "authenticated";

grant insert on table "public"."customer_on_the_way" to "authenticated";

grant references on table "public"."customer_on_the_way" to "authenticated";

grant select on table "public"."customer_on_the_way" to "authenticated";

grant trigger on table "public"."customer_on_the_way" to "authenticated";

grant truncate on table "public"."customer_on_the_way" to "authenticated";

grant update on table "public"."customer_on_the_way" to "authenticated";

grant delete on table "public"."customer_on_the_way" to "service_role";

grant insert on table "public"."customer_on_the_way" to "service_role";

grant references on table "public"."customer_on_the_way" to "service_role";

grant select on table "public"."customer_on_the_way" to "service_role";

grant trigger on table "public"."customer_on_the_way" to "service_role";

grant truncate on table "public"."customer_on_the_way" to "service_role";

grant update on table "public"."customer_on_the_way" to "service_role";

grant delete on table "public"."customer_reports" to "anon";

grant insert on table "public"."customer_reports" to "anon";

grant references on table "public"."customer_reports" to "anon";

grant select on table "public"."customer_reports" to "anon";

grant trigger on table "public"."customer_reports" to "anon";

grant truncate on table "public"."customer_reports" to "anon";

grant update on table "public"."customer_reports" to "anon";

grant delete on table "public"."customer_reports" to "authenticated";

grant insert on table "public"."customer_reports" to "authenticated";

grant references on table "public"."customer_reports" to "authenticated";

grant select on table "public"."customer_reports" to "authenticated";

grant trigger on table "public"."customer_reports" to "authenticated";

grant truncate on table "public"."customer_reports" to "authenticated";

grant update on table "public"."customer_reports" to "authenticated";

grant delete on table "public"."customer_reports" to "service_role";

grant insert on table "public"."customer_reports" to "service_role";

grant references on table "public"."customer_reports" to "service_role";

grant select on table "public"."customer_reports" to "service_role";

grant trigger on table "public"."customer_reports" to "service_role";

grant truncate on table "public"."customer_reports" to "service_role";

grant update on table "public"."customer_reports" to "service_role";

grant delete on table "public"."favorites" to "anon";

grant insert on table "public"."favorites" to "anon";

grant references on table "public"."favorites" to "anon";

grant select on table "public"."favorites" to "anon";

grant trigger on table "public"."favorites" to "anon";

grant truncate on table "public"."favorites" to "anon";

grant update on table "public"."favorites" to "anon";

grant delete on table "public"."favorites" to "authenticated";

grant insert on table "public"."favorites" to "authenticated";

grant references on table "public"."favorites" to "authenticated";

grant select on table "public"."favorites" to "authenticated";

grant trigger on table "public"."favorites" to "authenticated";

grant truncate on table "public"."favorites" to "authenticated";

grant update on table "public"."favorites" to "authenticated";

grant delete on table "public"."favorites" to "service_role";

grant insert on table "public"."favorites" to "service_role";

grant references on table "public"."favorites" to "service_role";

grant select on table "public"."favorites" to "service_role";

grant trigger on table "public"."favorites" to "service_role";

grant truncate on table "public"."favorites" to "service_role";

grant update on table "public"."favorites" to "service_role";

grant delete on table "public"."moderation_logs" to "anon";

grant insert on table "public"."moderation_logs" to "anon";

grant references on table "public"."moderation_logs" to "anon";

grant select on table "public"."moderation_logs" to "anon";

grant trigger on table "public"."moderation_logs" to "anon";

grant truncate on table "public"."moderation_logs" to "anon";

grant update on table "public"."moderation_logs" to "anon";

grant delete on table "public"."moderation_logs" to "authenticated";

grant insert on table "public"."moderation_logs" to "authenticated";

grant references on table "public"."moderation_logs" to "authenticated";

grant select on table "public"."moderation_logs" to "authenticated";

grant trigger on table "public"."moderation_logs" to "authenticated";

grant truncate on table "public"."moderation_logs" to "authenticated";

grant update on table "public"."moderation_logs" to "authenticated";

grant delete on table "public"."moderation_logs" to "service_role";

grant insert on table "public"."moderation_logs" to "service_role";

grant references on table "public"."moderation_logs" to "service_role";

grant select on table "public"."moderation_logs" to "service_role";

grant trigger on table "public"."moderation_logs" to "service_role";

grant truncate on table "public"."moderation_logs" to "service_role";

grant update on table "public"."moderation_logs" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."platform_settings" to "anon";

grant insert on table "public"."platform_settings" to "anon";

grant references on table "public"."platform_settings" to "anon";

grant select on table "public"."platform_settings" to "anon";

grant trigger on table "public"."platform_settings" to "anon";

grant truncate on table "public"."platform_settings" to "anon";

grant update on table "public"."platform_settings" to "anon";

grant delete on table "public"."platform_settings" to "authenticated";

grant insert on table "public"."platform_settings" to "authenticated";

grant references on table "public"."platform_settings" to "authenticated";

grant select on table "public"."platform_settings" to "authenticated";

grant trigger on table "public"."platform_settings" to "authenticated";

grant truncate on table "public"."platform_settings" to "authenticated";

grant update on table "public"."platform_settings" to "authenticated";

grant delete on table "public"."platform_settings" to "service_role";

grant insert on table "public"."platform_settings" to "service_role";

grant references on table "public"."platform_settings" to "service_role";

grant select on table "public"."platform_settings" to "service_role";

grant trigger on table "public"."platform_settings" to "service_role";

grant truncate on table "public"."platform_settings" to "service_role";

grant update on table "public"."platform_settings" to "service_role";

grant delete on table "public"."review_reports" to "anon";

grant insert on table "public"."review_reports" to "anon";

grant references on table "public"."review_reports" to "anon";

grant select on table "public"."review_reports" to "anon";

grant trigger on table "public"."review_reports" to "anon";

grant truncate on table "public"."review_reports" to "anon";

grant update on table "public"."review_reports" to "anon";

grant delete on table "public"."review_reports" to "authenticated";

grant insert on table "public"."review_reports" to "authenticated";

grant references on table "public"."review_reports" to "authenticated";

grant select on table "public"."review_reports" to "authenticated";

grant trigger on table "public"."review_reports" to "authenticated";

grant truncate on table "public"."review_reports" to "authenticated";

grant update on table "public"."review_reports" to "authenticated";

grant delete on table "public"."review_reports" to "service_role";

grant insert on table "public"."review_reports" to "service_role";

grant references on table "public"."review_reports" to "service_role";

grant select on table "public"."review_reports" to "service_role";

grant trigger on table "public"."review_reports" to "service_role";

grant truncate on table "public"."review_reports" to "service_role";

grant update on table "public"."review_reports" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant references on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant trigger on table "public"."reviews" to "anon";

grant truncate on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";

grant delete on table "public"."search_logs" to "anon";

grant insert on table "public"."search_logs" to "anon";

grant references on table "public"."search_logs" to "anon";

grant select on table "public"."search_logs" to "anon";

grant trigger on table "public"."search_logs" to "anon";

grant truncate on table "public"."search_logs" to "anon";

grant update on table "public"."search_logs" to "anon";

grant delete on table "public"."search_logs" to "authenticated";

grant insert on table "public"."search_logs" to "authenticated";

grant references on table "public"."search_logs" to "authenticated";

grant select on table "public"."search_logs" to "authenticated";

grant trigger on table "public"."search_logs" to "authenticated";

grant truncate on table "public"."search_logs" to "authenticated";

grant update on table "public"."search_logs" to "authenticated";

grant delete on table "public"."search_logs" to "service_role";

grant insert on table "public"."search_logs" to "service_role";

grant references on table "public"."search_logs" to "service_role";

grant select on table "public"."search_logs" to "service_role";

grant trigger on table "public"."search_logs" to "service_role";

grant truncate on table "public"."search_logs" to "service_role";

grant update on table "public"."search_logs" to "service_role";

grant delete on table "public"."spatial_ref_sys" to "anon";

grant insert on table "public"."spatial_ref_sys" to "anon";

grant references on table "public"."spatial_ref_sys" to "anon";

grant select on table "public"."spatial_ref_sys" to "anon";

grant trigger on table "public"."spatial_ref_sys" to "anon";

grant truncate on table "public"."spatial_ref_sys" to "anon";

grant update on table "public"."spatial_ref_sys" to "anon";

grant delete on table "public"."spatial_ref_sys" to "authenticated";

grant insert on table "public"."spatial_ref_sys" to "authenticated";

grant references on table "public"."spatial_ref_sys" to "authenticated";

grant select on table "public"."spatial_ref_sys" to "authenticated";

grant trigger on table "public"."spatial_ref_sys" to "authenticated";

grant truncate on table "public"."spatial_ref_sys" to "authenticated";

grant update on table "public"."spatial_ref_sys" to "authenticated";

grant delete on table "public"."spatial_ref_sys" to "postgres";

grant insert on table "public"."spatial_ref_sys" to "postgres";

grant references on table "public"."spatial_ref_sys" to "postgres";

grant select on table "public"."spatial_ref_sys" to "postgres";

grant trigger on table "public"."spatial_ref_sys" to "postgres";

grant truncate on table "public"."spatial_ref_sys" to "postgres";

grant update on table "public"."spatial_ref_sys" to "postgres";

grant delete on table "public"."spatial_ref_sys" to "service_role";

grant insert on table "public"."spatial_ref_sys" to "service_role";

grant references on table "public"."spatial_ref_sys" to "service_role";

grant select on table "public"."spatial_ref_sys" to "service_role";

grant trigger on table "public"."spatial_ref_sys" to "service_role";

grant truncate on table "public"."spatial_ref_sys" to "service_role";

grant update on table "public"."spatial_ref_sys" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."vendor_announcements" to "anon";

grant insert on table "public"."vendor_announcements" to "anon";

grant references on table "public"."vendor_announcements" to "anon";

grant select on table "public"."vendor_announcements" to "anon";

grant trigger on table "public"."vendor_announcements" to "anon";

grant truncate on table "public"."vendor_announcements" to "anon";

grant update on table "public"."vendor_announcements" to "anon";

grant delete on table "public"."vendor_announcements" to "authenticated";

grant insert on table "public"."vendor_announcements" to "authenticated";

grant references on table "public"."vendor_announcements" to "authenticated";

grant select on table "public"."vendor_announcements" to "authenticated";

grant trigger on table "public"."vendor_announcements" to "authenticated";

grant truncate on table "public"."vendor_announcements" to "authenticated";

grant update on table "public"."vendor_announcements" to "authenticated";

grant delete on table "public"."vendor_announcements" to "service_role";

grant insert on table "public"."vendor_announcements" to "service_role";

grant references on table "public"."vendor_announcements" to "service_role";

grant select on table "public"."vendor_announcements" to "service_role";

grant trigger on table "public"."vendor_announcements" to "service_role";

grant truncate on table "public"."vendor_announcements" to "service_role";

grant update on table "public"."vendor_announcements" to "service_role";

grant delete on table "public"."vendor_feedback" to "anon";

grant insert on table "public"."vendor_feedback" to "anon";

grant references on table "public"."vendor_feedback" to "anon";

grant select on table "public"."vendor_feedback" to "anon";

grant trigger on table "public"."vendor_feedback" to "anon";

grant truncate on table "public"."vendor_feedback" to "anon";

grant update on table "public"."vendor_feedback" to "anon";

grant delete on table "public"."vendor_feedback" to "authenticated";

grant insert on table "public"."vendor_feedback" to "authenticated";

grant references on table "public"."vendor_feedback" to "authenticated";

grant select on table "public"."vendor_feedback" to "authenticated";

grant trigger on table "public"."vendor_feedback" to "authenticated";

grant truncate on table "public"."vendor_feedback" to "authenticated";

grant update on table "public"."vendor_feedback" to "authenticated";

grant delete on table "public"."vendor_feedback" to "service_role";

grant insert on table "public"."vendor_feedback" to "service_role";

grant references on table "public"."vendor_feedback" to "service_role";

grant select on table "public"."vendor_feedback" to "service_role";

grant trigger on table "public"."vendor_feedback" to "service_role";

grant truncate on table "public"."vendor_feedback" to "service_role";

grant update on table "public"."vendor_feedback" to "service_role";

grant delete on table "public"."vendor_hours" to "anon";

grant insert on table "public"."vendor_hours" to "anon";

grant references on table "public"."vendor_hours" to "anon";

grant select on table "public"."vendor_hours" to "anon";

grant trigger on table "public"."vendor_hours" to "anon";

grant truncate on table "public"."vendor_hours" to "anon";

grant update on table "public"."vendor_hours" to "anon";

grant delete on table "public"."vendor_hours" to "authenticated";

grant insert on table "public"."vendor_hours" to "authenticated";

grant references on table "public"."vendor_hours" to "authenticated";

grant select on table "public"."vendor_hours" to "authenticated";

grant trigger on table "public"."vendor_hours" to "authenticated";

grant truncate on table "public"."vendor_hours" to "authenticated";

grant update on table "public"."vendor_hours" to "authenticated";

grant delete on table "public"."vendor_hours" to "service_role";

grant insert on table "public"."vendor_hours" to "service_role";

grant references on table "public"."vendor_hours" to "service_role";

grant select on table "public"."vendor_hours" to "service_role";

grant trigger on table "public"."vendor_hours" to "service_role";

grant truncate on table "public"."vendor_hours" to "service_role";

grant update on table "public"."vendor_hours" to "service_role";

grant delete on table "public"."vendor_live_sessions" to "anon";

grant insert on table "public"."vendor_live_sessions" to "anon";

grant references on table "public"."vendor_live_sessions" to "anon";

grant select on table "public"."vendor_live_sessions" to "anon";

grant trigger on table "public"."vendor_live_sessions" to "anon";

grant truncate on table "public"."vendor_live_sessions" to "anon";

grant update on table "public"."vendor_live_sessions" to "anon";

grant delete on table "public"."vendor_live_sessions" to "authenticated";

grant insert on table "public"."vendor_live_sessions" to "authenticated";

grant references on table "public"."vendor_live_sessions" to "authenticated";

grant select on table "public"."vendor_live_sessions" to "authenticated";

grant trigger on table "public"."vendor_live_sessions" to "authenticated";

grant truncate on table "public"."vendor_live_sessions" to "authenticated";

grant update on table "public"."vendor_live_sessions" to "authenticated";

grant delete on table "public"."vendor_live_sessions" to "service_role";

grant insert on table "public"."vendor_live_sessions" to "service_role";

grant references on table "public"."vendor_live_sessions" to "service_role";

grant select on table "public"."vendor_live_sessions" to "service_role";

grant trigger on table "public"."vendor_live_sessions" to "service_role";

grant truncate on table "public"."vendor_live_sessions" to "service_role";

grant update on table "public"."vendor_live_sessions" to "service_role";

grant delete on table "public"."vendor_reports" to "anon";

grant insert on table "public"."vendor_reports" to "anon";

grant references on table "public"."vendor_reports" to "anon";

grant select on table "public"."vendor_reports" to "anon";

grant trigger on table "public"."vendor_reports" to "anon";

grant truncate on table "public"."vendor_reports" to "anon";

grant update on table "public"."vendor_reports" to "anon";

grant delete on table "public"."vendor_reports" to "authenticated";

grant insert on table "public"."vendor_reports" to "authenticated";

grant references on table "public"."vendor_reports" to "authenticated";

grant select on table "public"."vendor_reports" to "authenticated";

grant trigger on table "public"."vendor_reports" to "authenticated";

grant truncate on table "public"."vendor_reports" to "authenticated";

grant update on table "public"."vendor_reports" to "authenticated";

grant delete on table "public"."vendor_reports" to "service_role";

grant insert on table "public"."vendor_reports" to "service_role";

grant references on table "public"."vendor_reports" to "service_role";

grant select on table "public"."vendor_reports" to "service_role";

grant trigger on table "public"."vendor_reports" to "service_role";

grant truncate on table "public"."vendor_reports" to "service_role";

grant update on table "public"."vendor_reports" to "service_role";

grant delete on table "public"."vendor_specials" to "anon";

grant insert on table "public"."vendor_specials" to "anon";

grant references on table "public"."vendor_specials" to "anon";

grant select on table "public"."vendor_specials" to "anon";

grant trigger on table "public"."vendor_specials" to "anon";

grant truncate on table "public"."vendor_specials" to "anon";

grant update on table "public"."vendor_specials" to "anon";

grant delete on table "public"."vendor_specials" to "authenticated";

grant insert on table "public"."vendor_specials" to "authenticated";

grant references on table "public"."vendor_specials" to "authenticated";

grant select on table "public"."vendor_specials" to "authenticated";

grant trigger on table "public"."vendor_specials" to "authenticated";

grant truncate on table "public"."vendor_specials" to "authenticated";

grant update on table "public"."vendor_specials" to "authenticated";

grant delete on table "public"."vendor_specials" to "service_role";

grant insert on table "public"."vendor_specials" to "service_role";

grant references on table "public"."vendor_specials" to "service_role";

grant select on table "public"."vendor_specials" to "service_role";

grant trigger on table "public"."vendor_specials" to "service_role";

grant truncate on table "public"."vendor_specials" to "service_role";

grant update on table "public"."vendor_specials" to "service_role";

grant delete on table "public"."vendor_static_locations" to "anon";

grant insert on table "public"."vendor_static_locations" to "anon";

grant references on table "public"."vendor_static_locations" to "anon";

grant select on table "public"."vendor_static_locations" to "anon";

grant trigger on table "public"."vendor_static_locations" to "anon";

grant truncate on table "public"."vendor_static_locations" to "anon";

grant update on table "public"."vendor_static_locations" to "anon";

grant delete on table "public"."vendor_static_locations" to "authenticated";

grant insert on table "public"."vendor_static_locations" to "authenticated";

grant references on table "public"."vendor_static_locations" to "authenticated";

grant select on table "public"."vendor_static_locations" to "authenticated";

grant trigger on table "public"."vendor_static_locations" to "authenticated";

grant truncate on table "public"."vendor_static_locations" to "authenticated";

grant update on table "public"."vendor_static_locations" to "authenticated";

grant delete on table "public"."vendor_static_locations" to "service_role";

grant insert on table "public"."vendor_static_locations" to "service_role";

grant references on table "public"."vendor_static_locations" to "service_role";

grant select on table "public"."vendor_static_locations" to "service_role";

grant trigger on table "public"."vendor_static_locations" to "service_role";

grant truncate on table "public"."vendor_static_locations" to "service_role";

grant update on table "public"."vendor_static_locations" to "service_role";

grant delete on table "public"."vendors" to "anon";

grant insert on table "public"."vendors" to "anon";

grant references on table "public"."vendors" to "anon";

grant select on table "public"."vendors" to "anon";

grant trigger on table "public"."vendors" to "anon";

grant truncate on table "public"."vendors" to "anon";

grant update on table "public"."vendors" to "anon";

grant delete on table "public"."vendors" to "authenticated";

grant insert on table "public"."vendors" to "authenticated";

grant references on table "public"."vendors" to "authenticated";

grant select on table "public"."vendors" to "authenticated";

grant trigger on table "public"."vendors" to "authenticated";

grant truncate on table "public"."vendors" to "authenticated";

grant update on table "public"."vendors" to "authenticated";

grant delete on table "public"."vendors" to "service_role";

grant insert on table "public"."vendors" to "service_role";

grant references on table "public"."vendors" to "service_role";

grant select on table "public"."vendors" to "service_role";

grant trigger on table "public"."vendors" to "service_role";

grant truncate on table "public"."vendors" to "service_role";

grant update on table "public"."vendors" to "service_role";

create policy "Admin users are only accessible by service role"
on "public"."admin_users"
as permissive
for all
to public
using (is_service_role());


create policy "Analytics exports are only accessible by service role"
on "public"."analytics_exports"
as permissive
for all
to public
using (is_service_role());


create policy "Admins can manage business subcategories"
on "public"."business_subcategories"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Public can view business subcategories"
on "public"."business_subcategories"
as permissive
for select
to public
using (true);


create policy "Admins can manage business types"
on "public"."business_types"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Public can view business types"
on "public"."business_types"
as permissive
for select
to public
using (true);


create policy "Users can manage their own tracking"
on "public"."customer_on_the_way"
as permissive
for all
to public
using ((get_current_user_id() = user_id))
with check ((get_current_user_id() = user_id));


create policy "Users can insert customer reports"
on "public"."customer_reports"
as permissive
for insert
to public
with check ((get_current_user_id() = reporter_id));


create policy "Users can view their own customer reports"
on "public"."customer_reports"
as permissive
for select
to public
using ((get_current_user_id() = reporter_id));


create policy "Users can delete their own favorites"
on "public"."favorites"
as permissive
for delete
to public
using ((get_current_user_id() = customer_id));


create policy "Users can insert their own favorites"
on "public"."favorites"
as permissive
for insert
to public
with check ((get_current_user_id() = customer_id));


create policy "Users can view their own favorites"
on "public"."favorites"
as permissive
for select
to public
using ((get_current_user_id() = customer_id));


create policy "Moderation logs are only accessible by service role"
on "public"."moderation_logs"
as permissive
for all
to public
using (is_service_role());


create policy "Admins can mark their own notifications as read"
on "public"."notifications"
as permissive
for update
to public
using ((recipient_id = auth.uid()));


create policy "Admins can view their own notifications"
on "public"."notifications"
as permissive
for select
to public
using ((recipient_id = auth.uid()));


create policy "Notifications are only accessible by service role"
on "public"."notifications"
as permissive
for all
to public
using (is_service_role());


create policy "Service role has full access to notifications"
on "public"."notifications"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Platform settings are only accessible by service role"
on "public"."platform_settings"
as permissive
for all
to public
using (is_service_role());


create policy "Review reports are only accessible by service role"
on "public"."review_reports"
as permissive
for all
to public
using (is_service_role());


create policy "Users can delete their own reviews"
on "public"."reviews"
as permissive
for delete
to public
using ((get_current_user_id() = user_id));


create policy "Users can insert their own reviews"
on "public"."reviews"
as permissive
for insert
to public
with check ((get_current_user_id() = user_id));


create policy "Users can update their own reviews"
on "public"."reviews"
as permissive
for update
to public
using ((get_current_user_id() = user_id));


create policy "Users can view all reviews"
on "public"."reviews"
as permissive
for select
to public
using (true);


create policy "Users can manage their own search logs"
on "public"."search_logs"
as permissive
for all
to public
using ((get_current_user_id() = user_id))
with check ((get_current_user_id() = user_id));


create policy "Users can update their own profile"
on "public"."users"
as permissive
for update
to public
using ((get_current_user_id() = id));


create policy "Users can view all user profiles"
on "public"."users"
as permissive
for select
to public
using (true);


create policy "Anyone can view vendor announcements"
on "public"."vendor_announcements"
as permissive
for select
to public
using (true);


create policy "Vendors can manage their own announcements"
on "public"."vendor_announcements"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM vendors
  WHERE ((vendors.id = vendor_announcements.vendor_id) AND (vendors.user_id = get_current_user_id())))));


create policy "Vendors can manage their own feedback"
on "public"."vendor_feedback"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM vendors
  WHERE ((vendors.id = vendor_feedback.vendor_id) AND (vendors.user_id = get_current_user_id())))));


create policy "Anyone can view vendor hours"
on "public"."vendor_hours"
as permissive
for select
to public
using (true);


create policy "Vendors can manage their own hours"
on "public"."vendor_hours"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM vendors
  WHERE ((vendors.id = vendor_hours.vendor_id) AND (vendors.user_id = get_current_user_id())))));


create policy "Anyone can view live sessions"
on "public"."vendor_live_sessions"
as permissive
for select
to public
using (true);


create policy "Vendors can manage their own sessions"
on "public"."vendor_live_sessions"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM vendors
  WHERE ((vendors.id = vendor_live_sessions.vendor_id) AND (vendors.user_id = get_current_user_id())))));


create policy "Users can insert vendor reports"
on "public"."vendor_reports"
as permissive
for insert
to public
with check ((get_current_user_id() = reporter_id));


create policy "Users can view their own reports"
on "public"."vendor_reports"
as permissive
for select
to public
using ((get_current_user_id() = reporter_id));


create policy "Anyone can view vendor specials"
on "public"."vendor_specials"
as permissive
for select
to public
using (true);


create policy "Vendors can manage their own specials"
on "public"."vendor_specials"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM vendors
  WHERE ((vendors.id = vendor_specials.vendor_id) AND (vendors.user_id = get_current_user_id())))));


create policy "Anyone can view vendor static locations"
on "public"."vendor_static_locations"
as permissive
for select
to public
using (true);


create policy "Vendors can manage their own static locations"
on "public"."vendor_static_locations"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM vendors
  WHERE ((vendors.id = vendor_static_locations.vendor_id) AND (vendors.user_id = get_current_user_id())))));


create policy "Anyone can view vendor profiles"
on "public"."vendors"
as permissive
for select
to public
using (true);


create policy "Vendors can manage their own profile"
on "public"."vendors"
as permissive
for all
to public
using ((get_current_user_id() = user_id));


create policy "Vendors: owner can manage"
on "public"."vendors"
as permissive
for all
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_on_the_way_updated_at BEFORE UPDATE ON public.customer_on_the_way FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_platform_settings_update BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION handle_platform_settings_update();

CREATE TRIGGER trg_update_vendor_rating AFTER INSERT OR DELETE OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_vendor_rating_stats();

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


