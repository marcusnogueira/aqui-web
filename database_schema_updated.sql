--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: feedback_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.feedback_type_enum AS ENUM (
    'BUG',
    'FEATURE',
    'GENERAL'
);


--
-- Name: notification_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type_enum AS ENUM (
    'new_vendor_signup',
    'vendor_report',
    'review_report',
    'system_alert'
);


--
-- Name: priority_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.priority_enum AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: vendor_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vendor_status_enum AS ENUM (
    'pending',
    'approved',
    'active',
    'inactive',
    'rejected',
    'suspended'
);


--
-- Name: clear_current_user_context(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clear_current_user_context() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', true);
    PERFORM set_config('app.current_role', '', true);
END;
$$;


--
-- Name: FUNCTION clear_current_user_context(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.clear_current_user_context() IS 'Clears user context - called at end of API requests';


--
-- Name: get_current_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_user_id() RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION get_current_user_id(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_current_user_id() IS 'NextAuth replacement for auth.uid() - gets current user ID from session context';


--
-- Name: handle_platform_settings_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_platform_settings_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


--
-- Name: is_current_user_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_current_user_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION is_current_user_admin(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_current_user_admin() IS 'Helper function to check if current user has admin privileges';


--
-- Name: is_service_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_service_role() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION is_service_role(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_service_role() IS 'NextAuth replacement for auth.role() = service_role - checks if request is from service role';


--
-- Name: set_current_user_context(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_current_user_context(user_id uuid, role_name text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION set_current_user_context(user_id uuid, role_name text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.set_current_user_context(user_id uuid, role_name text) IS 'Sets user context for RLS policies - called by API routes';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_vendor_rating_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_vendor_rating_stats() RETURNS trigger
    LANGUAGE plpgsql
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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    provider_account_id text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at bigint,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: analytics_exports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_exports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid,
    vendor_id uuid,
    export_type text,
    created_at timestamp without time zone DEFAULT now(),
    status text DEFAULT 'pending'::text,
    download_url text,
    CONSTRAINT analytics_exports_export_type_check CHECK ((export_type = ANY (ARRAY['vendor'::text, 'platform'::text])))
);


--
-- Name: business_subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_subcategories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    business_type_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: business_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: customer_on_the_way; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_on_the_way (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid,
    user_id uuid,
    clicked_at timestamp without time zone DEFAULT now(),
    customer_latitude double precision,
    customer_longitude double precision
);


--
-- Name: customer_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id uuid,
    vendor_id uuid,
    issue text,
    created_at timestamp without time zone DEFAULT now(),
    resolved boolean DEFAULT false,
    resolution_notes text
);


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: vendor_live_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_live_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone,
    was_scheduled_duration integer,
    estimated_customers integer DEFAULT 0,
    latitude double precision,
    longitude double precision,
    address text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    auto_end_time timestamp without time zone,
    ended_by text DEFAULT 'vendor'::text,
    CONSTRAINT vendor_live_sessions_ended_by_check CHECK ((ended_by = ANY (ARRAY['vendor'::text, 'timer'::text])))
);


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    business_name text NOT NULL,
    description text,
    business_type text,
    subcategory text,
    tags text[],
    profile_image_url text,
    banner_image_url text[],
    contact_email text,
    phone text,
    address text,
    approved_by uuid,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    average_rating numeric DEFAULT 0,
    total_reviews integer DEFAULT 0,
    admin_notes text,
    latitude double precision,
    longitude double precision,
    city text,
    status public.vendor_status_enum DEFAULT 'pending'::public.vendor_status_enum,
    rejection_reason text,
    subcategory__other text
);


--
-- Name: live_vendors_with_sessions; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.live_vendors_with_sessions AS
 SELECT v.id,
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
   FROM (public.vendors v
     JOIN public.vendor_live_sessions vls ON ((v.id = vls.vendor_id)))
  WHERE ((v.status = 'active'::public.vendor_status_enum) AND (vls.is_active = true));


--
-- Name: moderation_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moderation_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid,
    vendor_id uuid,
    action text,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    priority public.priority_enum
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipient_id uuid,
    type public.notification_type_enum NOT NULL,
    message text NOT NULL,
    link text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_settings (
    id boolean DEFAULT true NOT NULL,
    allow_auto_vendor_approval boolean DEFAULT false,
    maintenance_mode boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now(),
    require_vendor_approval boolean DEFAULT false NOT NULL
);


--
-- Name: review_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    review_id uuid,
    vendor_id uuid,
    reason text,
    created_at timestamp without time zone DEFAULT now(),
    resolved boolean DEFAULT false
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid,
    user_id uuid,
    rating integer,
    review text,
    created_at timestamp without time zone DEFAULT now(),
    edited_at timestamp without time zone,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: search_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    search_query text,
    filters jsonb,
    location public.geography(Point,4326),
    searched_at timestamp without time zone DEFAULT now(),
    vendor_clicked uuid
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_token text NOT NULL,
    user_id uuid NOT NULL,
    expires timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    is_vendor boolean DEFAULT false,
    is_admin boolean DEFAULT false,
    active_role text DEFAULT 'customer'::text,
    created_at timestamp without time zone DEFAULT now(),
    email text,
    phone text,
    preferred_language text,
    updated_at timestamp with time zone DEFAULT now(),
    external_id uuid,
    "emailVerified" timestamp without time zone,
    name text,
    image text,
    password_hash text,
    CONSTRAINT chk_users_active_role CHECK ((active_role = ANY (ARRAY['customer'::text, 'vendor'::text, 'admin'::text]))),
    CONSTRAINT users_active_role_check CHECK ((active_role = ANY (ARRAY['customer'::text, 'vendor'::text])))
);


--
-- Name: vendor_announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid,
    message text,
    image_url text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: vendor_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid,
    message text,
    status text DEFAULT 'pending'::text,
    created_at timestamp without time zone DEFAULT now(),
    feedback_type public.feedback_type_enum,
    priority public.priority_enum,
    CONSTRAINT chk_vendor_feedback_status CHECK ((status = ANY (ARRAY['pending'::text, 'resolved'::text]))),
    CONSTRAINT vendor_feedback_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'resolved'::text, 'dismissed'::text])))
);


--
-- Name: vendor_hours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_hours (
    id integer NOT NULL,
    vendor_id uuid,
    weekday integer,
    open_time time without time zone,
    close_time time without time zone,
    CONSTRAINT vendor_hours_weekday_check CHECK (((weekday >= 0) AND (weekday <= 6)))
);


--
-- Name: vendor_hours_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vendor_hours_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vendor_hours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vendor_hours_id_seq OWNED BY public.vendor_hours.id;


--
-- Name: vendor_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    reporter_id uuid NOT NULL,
    reason text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    resolved boolean DEFAULT false,
    resolution_notes text
);


--
-- Name: vendor_specials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_specials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid,
    title text,
    description text,
    image_url text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: vendor_static_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_static_locations (
    id integer NOT NULL,
    vendor_id uuid,
    address text,
    latitude double precision,
    longitude double precision
);


--
-- Name: vendor_static_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vendor_static_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vendor_static_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vendor_static_locations_id_seq OWNED BY public.vendor_static_locations.id;


--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: vendor_hours id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_hours ALTER COLUMN id SET DEFAULT nextval('public.vendor_hours_id_seq'::regclass);


--
-- Name: vendor_static_locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_static_locations ALTER COLUMN id SET DEFAULT nextval('public.vendor_static_locations_id_seq'::regclass);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts (id, user_id, type, provider, provider_account_id, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, created_at) FROM stdin;
\.


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_users (id, email, username, password_hash, created_at, updated_at) FROM stdin;
c05f2be2-2862-46af-a09c-79cb18f98314	mrn@get-aqui.com	mrn	$2b$12$o0xwkfA5v6heOvj7Jyz3jOz6RG.bknmn6WG0Ny.t6w1Rz4n/J5tCO	2025-07-07 22:05:48+00	2025-07-07 22:05:59.857308+00
280a264f-0ae8-460b-91c4-75ee69324cb9	admin@test.com	testadmin	$2b$12$G88q700ZssaGfgfBSvkdlefsaQZqjtobjpTLl66jNN6Yo0K5WpA7e	2025-07-07 23:18:09.286974+00	2025-07-07 23:18:09.286974+00
6f2fd6f5-c2d1-4c1a-982a-20a05de5fb6a	jacob.martin@get-aqui.com	jmsf	$2b$10$kx0an.Eh.V9RZu2jsz2KLOigWmW7CSuCEGF43vNvdF8jtwT8QeXXG\n	2025-07-08 05:07:26+00	2025-07-08 05:07:28+00
\.


--
-- Data for Name: analytics_exports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.analytics_exports (id, admin_id, vendor_id, export_type, created_at, status, download_url) FROM stdin;
\.


--
-- Data for Name: business_subcategories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.business_subcategories (id, name, business_type_id, created_at) FROM stdin;
8a8743af-4039-40a9-9850-3e09bd4f704d	Other	ef3898db-c78f-4f90-9250-a6e2b7994942	2025-07-12 04:21:35.192451+00
ce0c93cc-7fe3-4690-b137-7edb8b110c61	Indie Publishers	fb3c8a8b-b856-4c8f-abd7-3b66cde06353	2025-07-12 04:21:35.192451+00
1757d6ad-29b6-449e-b3aa-8c8d868ae18b	Used-book Carts	fb3c8a8b-b856-4c8f-abd7-3b66cde06353	2025-07-12 04:21:35.192451+00
b4e46e0e-4d1f-45ca-910e-f42c5d721dd5	Comics	fb3c8a8b-b856-4c8f-abd7-3b66cde06353	2025-07-12 04:21:35.192451+00
974ad346-0ae4-43c8-9480-046953933338	Manga	fb3c8a8b-b856-4c8f-abd7-3b66cde06353	2025-07-12 04:21:35.192451+00
665f379e-1a92-4aee-991f-137e108bfeb9	Other	fb3c8a8b-b856-4c8f-abd7-3b66cde06353	2025-07-12 04:21:35.192451+00
b54dad23-b5ca-46e9-afbc-255d936737de	Candles	1c7abc44-033e-48cd-9d12-cdcad5ad1b19	2025-07-12 04:21:35.192451+00
f2b57202-7758-4499-a7cc-163ffc69f91a	Soaps	1c7abc44-033e-48cd-9d12-cdcad5ad1b19	2025-07-12 04:21:35.192451+00
619215f8-1c1b-4482-9c31-c59fc4d5d44c	Pottery	1c7abc44-033e-48cd-9d12-cdcad5ad1b19	2025-07-12 04:21:35.192451+00
fcf27326-7bbf-479f-a9d9-d6a05528cc39	Up-cycled Decor	1c7abc44-033e-48cd-9d12-cdcad5ad1b19	2025-07-12 04:21:35.192451+00
5b2f1a62-d19b-47c7-82fb-2b81bbf54422	Other	1c7abc44-033e-48cd-9d12-cdcad5ad1b19	2025-07-12 04:21:35.192451+00
6cf7d9a2-1ecf-42ca-9ff3-53d750774962	Street Eats	64f46982-c88b-4f63-857c-d069be22aa37	2025-07-12 04:21:35.192451+00
da2166a6-0130-4ef5-9af6-403db3fcc0dd	Dessert Carts	64f46982-c88b-4f63-857c-d069be22aa37	2025-07-12 04:21:35.192451+00
21b1cab1-4cf1-4cbd-9810-d017ad0491a5	Drink Pop-ups	64f46982-c88b-4f63-857c-d069be22aa37	2025-07-12 04:21:35.192451+00
f950a4be-21ce-47f0-b318-0862c1b92067	Other	64f46982-c88b-4f63-857c-d069be22aa37	2025-07-12 04:21:35.192451+00
2d183d7a-b958-4683-81b5-673b4eb87906	Succulent Carts	49663acc-519b-40a8-a403-a35cfc9cba30	2025-07-12 04:21:35.192451+00
c298d68b-f004-4dc7-a078-68ad2c45a03c	Bouquet Bikes	49663acc-519b-40a8-a403-a35cfc9cba30	2025-07-12 04:21:35.192451+00
cc6a9c9b-2e07-403b-bcf1-7ab15a55dc00	Plant-care Pop-ups	49663acc-519b-40a8-a403-a35cfc9cba30	2025-07-12 04:21:35.192451+00
fab6b149-7f4a-4221-8b30-f6bf0156eb97	Other	49663acc-519b-40a8-a403-a35cfc9cba30	2025-07-12 04:21:35.192451+00
ccd9ef66-cabd-437d-a658-6388842a1f1c	Second-hand Clothes	f7905d45-57f9-46d1-935b-c92ce1f849fc	2025-07-12 04:21:35.192451+00
f12033ee-5ab0-4de2-a0d9-97a5f5fffe6e	Sneakers	f7905d45-57f9-46d1-935b-c92ce1f849fc	2025-07-12 04:21:35.192451+00
ce27315a-fa8c-441d-8ed8-6e54712c95bc	Accessories	f7905d45-57f9-46d1-935b-c92ce1f849fc	2025-07-12 04:21:35.192451+00
44f3e261-9815-42bf-828a-987ee553bae5	Other	f7905d45-57f9-46d1-935b-c92ce1f849fc	2025-07-12 04:21:35.192451+00
641f6a99-7b25-48e5-9454-58582775713a	Quick Tune-ups	15e0454f-1e53-417c-9429-b05d507feecf	2025-07-12 04:21:35.192451+00
ee800334-289c-48af-b252-a02dbcbe1de0	Phone-screen Fixes	15e0454f-1e53-417c-9429-b05d507feecf	2025-07-12 04:21:35.192451+00
22f13753-1bea-4d89-b310-4c1e7cd21103	Battery Swaps	15e0454f-1e53-417c-9429-b05d507feecf	2025-07-12 04:21:35.192451+00
f7fe36ba-5c74-44ea-b73d-565b4554c88d	Other	15e0454f-1e53-417c-9429-b05d507feecf	2025-07-12 04:21:35.192451+00
fa2b0b85-2f1a-4f54-9920-b3d3ff434e7c	Illustrators	5b5e8fd7-d97f-41a9-88eb-c6ee3b9bc3cc	2025-07-12 04:21:35.192451+00
cf2f471c-5485-41b7-9c24-d3141681f76f	Postcards	5b5e8fd7-d97f-41a9-88eb-c6ee3b9bc3cc	2025-07-12 04:21:35.192451+00
4bbf34dc-b7e9-4252-8c57-1ee9bfc657be	Decals	5b5e8fd7-d97f-41a9-88eb-c6ee3b9bc3cc	2025-07-12 04:21:35.192451+00
22193bfa-6c94-4125-8a80-c66931999619	Other	5b5e8fd7-d97f-41a9-88eb-c6ee3b9bc3cc	2025-07-12 04:21:35.192451+00
de29f33a-eed8-423b-af45-92cec94276d5	Graphic Tees	2232acf6-7012-4a61-b7b1-4c0034bd7607	2025-07-12 04:21:35.192451+00
3ab88b52-02e5-4f24-8b03-935636d304be	Hats	2232acf6-7012-4a61-b7b1-4c0034bd7607	2025-07-12 04:21:35.192451+00
9f1b186d-c9b0-4f8f-b448-66077401d4a3	On-site Custom Gear	2232acf6-7012-4a61-b7b1-4c0034bd7607	2025-07-12 04:21:35.192451+00
125d32b2-2c3f-4b18-a5f0-1bac74cf66bd	Other	2232acf6-7012-4a61-b7b1-4c0034bd7607	2025-07-12 04:21:35.192451+00
6853acf3-7876-4b07-ab35-a3e67c60f0c3	Street Barber	42789c52-752b-432c-8916-0d5c8b7c9b30	2025-07-12 04:21:35.192451+00
e481a0ff-ae16-4ba1-b495-06dcd11e2c48	Nail-art Booth	42789c52-752b-432c-8916-0d5c8b7c9b30	2025-07-12 04:21:35.192451+00
9878a659-ab39-40a3-bc59-db72f3ad58e7	Mini Spa	42789c52-752b-432c-8916-0d5c8b7c9b30	2025-07-12 04:21:35.192451+00
125b9fe6-9ca0-49d7-89bf-e047e7e93ec5	Other	42789c52-752b-432c-8916-0d5c8b7c9b30	2025-07-12 04:21:35.192451+00
d0a01fb3-dffe-430f-83bf-bec81d78fdf0	Artisan Leatherwork	fe97fdcc-a988-4f56-874c-e9827770b7a9	2025-07-12 04:21:35.192451+00
6319a641-b318-448d-8cb1-246eec8918c0	Beadwork	fe97fdcc-a988-4f56-874c-e9827770b7a9	2025-07-12 04:21:35.192451+00
afa5dbd0-ac7f-4a31-bb19-b4765bbdd207	Metalwork	fe97fdcc-a988-4f56-874c-e9827770b7a9	2025-07-12 04:21:35.192451+00
729dbba4-d0ba-454f-93a6-a8dd82eb0685	Other	fe97fdcc-a988-4f56-874c-e9827770b7a9	2025-07-12 04:21:35.192451+00
344f6ef5-7578-4c48-917b-976c7bc2f9b1	Record-crate Sellers	b2821766-f4bf-407c-a166-e019f53ed9f0	2025-07-12 04:21:35.192451+00
3a3efafe-d26e-4700-ab52-ee46f35f96e3	DJ Pop-ups	b2821766-f4bf-407c-a166-e019f53ed9f0	2025-07-12 04:21:35.192451+00
007d5a1e-cdea-44f2-8874-e8e04bc52f22	Other	b2821766-f4bf-407c-a166-e019f53ed9f0	2025-07-12 04:21:35.192451+00
\.


--
-- Data for Name: business_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.business_types (id, name, created_at) FROM stdin;
ef3898db-c78f-4f90-9250-a6e2b7994942	Other	2025-07-12 04:21:35.192451+00
fb3c8a8b-b856-4c8f-abd7-3b66cde06353	Books & Zines	2025-07-12 04:21:35.192451+00
1c7abc44-033e-48cd-9d12-cdcad5ad1b19	Home & Décor	2025-07-12 04:21:35.192451+00
64f46982-c88b-4f63-857c-d069be22aa37	Food & Beverage	2025-07-12 04:21:35.192451+00
49663acc-519b-40a8-a403-a35cfc9cba30	Plants & Flowers	2025-07-12 04:21:35.192451+00
f7905d45-57f9-46d1-935b-c92ce1f849fc	Vintage & Thrift	2025-07-12 04:21:35.192451+00
15e0454f-1e53-417c-9429-b05d507feecf	Bike & Device Repair	2025-07-12 04:21:35.192451+00
5b5e8fd7-d97f-41a9-88eb-c6ee3b9bc3cc	Art Prints & Stickers	2025-07-12 04:21:35.192451+00
2232acf6-7012-4a61-b7b1-4c0034bd7607	Festival Merch & Apparel	2025-07-12 04:21:35.192451+00
42789c52-752b-432c-8916-0d5c8b7c9b30	Health & Beauty Services	2025-07-12 04:21:35.192451+00
fe97fdcc-a988-4f56-874c-e9827770b7a9	Handmade Crafts & Jewelry	2025-07-12 04:21:35.192451+00
b2821766-f4bf-407c-a166-e019f53ed9f0	Vintage Vinyl & Cassettes	2025-07-12 04:21:35.192451+00
\.


--
-- Data for Name: customer_on_the_way; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_on_the_way (id, vendor_id, user_id, clicked_at, customer_latitude, customer_longitude) FROM stdin;
\.


--
-- Data for Name: customer_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_reports (id, reporter_id, vendor_id, issue, created_at, resolved, resolution_notes) FROM stdin;
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.favorites (id, customer_id, vendor_id, created_at) FROM stdin;
\.


--
-- Data for Name: moderation_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.moderation_logs (id, admin_id, vendor_id, action, notes, created_at, priority) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, recipient_id, type, message, link, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: platform_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.platform_settings (id, allow_auto_vendor_approval, maintenance_mode, updated_at, require_vendor_approval) FROM stdin;
t	f	f	2025-07-22 00:42:45.017759	f
\.


--
-- Data for Name: review_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.review_reports (id, review_id, vendor_id, reason, created_at, resolved) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, vendor_id, user_id, rating, review, created_at, edited_at) FROM stdin;
\.


--
-- Data for Name: search_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.search_logs (id, user_id, search_query, filters, location, searched_at, vendor_clicked) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, session_token, user_id, expires, created_at) FROM stdin;
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, full_name, avatar_url, is_vendor, is_admin, active_role, created_at, email, phone, preferred_language, updated_at, external_id, "emailVerified", name, image, password_hash) FROM stdin;
76d54bd8-5a4f-4b53-afd0-cf3b243f9802	Marcus	\N	f	f	customer	2025-07-21 20:04:27.450361	marcus.nogueira1@gmail.com	\N	\N	2025-07-21 20:04:27.450361+00	\N	\N	\N	\N	\N
c2e65e0d-3b43-440e-bad8-f967ac5fa8da	K DB	\N	f	f	customer	2025-07-21 20:04:42.081327	mnspam2018@gmail.com	\N	\N	2025-07-21 20:04:42.081327+00	\N	\N	\N	\N	\N
dffa4689-e4d4-4393-a6aa-29ba010b660e	dwad	\N	f	f	customer	2025-07-21 22:53:52.202317	dwad@gmail.com	\N	\N	2025-07-21 22:53:52.202317+00	\N	\N	\N	\N	$2b$12$bJT2OT/aLHoh/phSgtrl5unQeLau7okGZQp2Ejm5qUuL2Da6iTriy
72571d42-29e2-4c34-8410-e20b85800230	Aqui	\N	f	f	customer	2025-07-21 22:18:45.435127	aquiensf@gmail.com	\N	\N	2025-07-21 22:18:45.435127+00	\N	\N	\N	\N	\N
1913954c-555e-49c4-a461-f60aac5a5ccc	2	\N	f	f	customer	2025-07-21 22:28:40.573248	2@gmail.com	\N	\N	2025-07-21 22:28:40.573248+00	\N	\N	\N	\N	$2b$12$Wabx17nhS3RCyJRembcEyuCrTtewy6WHCkOtvnRigf2Zn7BTw0Haa
07520590-9869-4bd3-b88d-aec48f2648c0	dwadw	\N	f	f	customer	2025-07-21 22:46:29.427063	dwadw@gmail.com	\N	\N	2025-07-21 22:46:29.427063+00	\N	\N	\N	\N	$2b$12$2v/r5x..EhmltY8R9qbIMOraZmfTBOXjSbPx./UCMz8ZUkQhUbhwG
\.


--
-- Data for Name: vendor_announcements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_announcements (id, vendor_id, message, image_url, created_at) FROM stdin;
\.


--
-- Data for Name: vendor_feedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_feedback (id, vendor_id, message, status, created_at, feedback_type, priority) FROM stdin;
\.


--
-- Data for Name: vendor_hours; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_hours (id, vendor_id, weekday, open_time, close_time) FROM stdin;
\.


--
-- Data for Name: vendor_live_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_live_sessions (id, vendor_id, start_time, end_time, was_scheduled_duration, estimated_customers, latitude, longitude, address, is_active, created_at, auto_end_time, ended_by) FROM stdin;
\.


--
-- Data for Name: vendor_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_reports (id, vendor_id, reporter_id, reason, created_at, resolved, resolution_notes) FROM stdin;
\.


--
-- Data for Name: vendor_specials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_specials (id, vendor_id, title, description, image_url, created_at) FROM stdin;
\.


--
-- Data for Name: vendor_static_locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendor_static_locations (id, vendor_id, address, latitude, longitude) FROM stdin;
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendors (id, user_id, business_name, description, business_type, subcategory, tags, profile_image_url, banner_image_url, contact_email, phone, address, approved_by, approved_at, created_at, updated_at, average_rating, total_reviews, admin_notes, latitude, longitude, city, status, rejection_reason, subcategory__other) FROM stdin;
\.


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verification_tokens (identifier, token, expires, created_at) FROM stdin;
\.


--
-- Name: vendor_hours_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vendor_hours_id_seq', 1, false);


--
-- Name: vendor_static_locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vendor_static_locations_id_seq', 1, false);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_key UNIQUE (email);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_username_key UNIQUE (username);


--
-- Name: analytics_exports analytics_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_exports
    ADD CONSTRAINT analytics_exports_pkey PRIMARY KEY (id);


--
-- Name: business_subcategories business_subcategories_name_business_type_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_subcategories
    ADD CONSTRAINT business_subcategories_name_business_type_id_key UNIQUE (name, business_type_id);


--
-- Name: business_subcategories business_subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_subcategories
    ADD CONSTRAINT business_subcategories_pkey PRIMARY KEY (id);


--
-- Name: business_types business_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_types
    ADD CONSTRAINT business_types_name_key UNIQUE (name);


--
-- Name: business_types business_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_types
    ADD CONSTRAINT business_types_pkey PRIMARY KEY (id);


--
-- Name: customer_on_the_way customer_on_the_way_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_on_the_way
    ADD CONSTRAINT customer_on_the_way_pkey PRIMARY KEY (id);


--
-- Name: customer_reports customer_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_reports
    ADD CONSTRAINT customer_reports_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_customer_id_vendor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_customer_id_vendor_id_key UNIQUE (customer_id, vendor_id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: moderation_logs moderation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_logs
    ADD CONSTRAINT moderation_logs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- Name: review_reports review_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reports
    ADD CONSTRAINT review_reports_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: search_logs search_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_logs
    ADD CONSTRAINT search_logs_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_session_token_key UNIQUE (session_token);


--
-- Name: users users_external_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_external_id_key UNIQUE (external_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vendor_announcements vendor_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_announcements
    ADD CONSTRAINT vendor_announcements_pkey PRIMARY KEY (id);


--
-- Name: vendor_feedback vendor_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_feedback
    ADD CONSTRAINT vendor_feedback_pkey PRIMARY KEY (id);


--
-- Name: vendor_hours vendor_hours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_hours
    ADD CONSTRAINT vendor_hours_pkey PRIMARY KEY (id);


--
-- Name: vendor_live_sessions vendor_live_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_live_sessions
    ADD CONSTRAINT vendor_live_sessions_pkey PRIMARY KEY (id);


--
-- Name: vendor_reports vendor_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_reports
    ADD CONSTRAINT vendor_reports_pkey PRIMARY KEY (id);


--
-- Name: vendor_specials vendor_specials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_specials
    ADD CONSTRAINT vendor_specials_pkey PRIMARY KEY (id);


--
-- Name: vendor_static_locations vendor_static_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_static_locations
    ADD CONSTRAINT vendor_static_locations_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_business_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_business_name_unique UNIQUE (business_name);


--
-- Name: vendors vendors_contact_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_contact_email_unique UNIQUE (contact_email);


--
-- Name: vendors vendors_pkey1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey1 PRIMARY KEY (id);


--
-- Name: verification_tokens verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token);


--
-- Name: accounts_provider_provider_account_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX accounts_provider_provider_account_id_key ON public.accounts USING btree (provider, provider_account_id);


--
-- Name: idx_admin_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_users_email ON public.admin_users USING btree (email);


--
-- Name: idx_admin_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_users_username ON public.admin_users USING btree (username);


--
-- Name: idx_analytics_exports_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_exports_admin_id ON public.analytics_exports USING btree (admin_id);


--
-- Name: idx_analytics_exports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_exports_status ON public.analytics_exports USING btree (status);


--
-- Name: idx_customer_on_the_way_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_on_the_way_user_id ON public.customer_on_the_way USING btree (user_id);


--
-- Name: idx_customer_on_the_way_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_on_the_way_vendor_id ON public.customer_on_the_way USING btree (vendor_id);


--
-- Name: idx_customer_reports_reporter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_reports_reporter_id ON public.customer_reports USING btree (reporter_id);


--
-- Name: idx_customer_reports_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_reports_vendor_id ON public.customer_reports USING btree (vendor_id);


--
-- Name: idx_favorites_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorites_customer_id ON public.favorites USING btree (customer_id);


--
-- Name: idx_favorites_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorites_vendor_id ON public.favorites USING btree (vendor_id);


--
-- Name: idx_moderation_logs_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moderation_logs_priority ON public.moderation_logs USING btree (priority);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_recipient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_recipient_id ON public.notifications USING btree (recipient_id);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_reviews_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_created_at ON public.reviews USING btree (created_at);


--
-- Name: idx_reviews_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_rating ON public.reviews USING btree (rating);


--
-- Name: idx_reviews_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_user_id ON public.reviews USING btree (user_id);


--
-- Name: idx_reviews_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_vendor_id ON public.reviews USING btree (vendor_id);


--
-- Name: idx_vendor_announcements_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_announcements_created_at ON public.vendor_announcements USING btree (created_at);


--
-- Name: idx_vendor_announcements_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_announcements_vendor_id ON public.vendor_announcements USING btree (vendor_id);


--
-- Name: idx_vendor_feedback_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_feedback_priority ON public.vendor_feedback USING btree (priority);


--
-- Name: idx_vendor_live_sessions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_live_sessions_active ON public.vendor_live_sessions USING btree (vendor_id, is_active);


--
-- Name: idx_vendor_live_sessions_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_live_sessions_vendor_id ON public.vendor_live_sessions USING btree (vendor_id);


--
-- Name: idx_vendor_reports_reporter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_reports_reporter_id ON public.vendor_reports USING btree (reporter_id);


--
-- Name: idx_vendor_reports_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_reports_vendor_id ON public.vendor_reports USING btree (vendor_id);


--
-- Name: idx_vendor_specials_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_specials_created_at ON public.vendor_specials USING btree (created_at);


--
-- Name: idx_vendor_specials_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_specials_vendor_id ON public.vendor_specials USING btree (vendor_id);


--
-- Name: idx_vendor_static_locations_coordinates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_static_locations_coordinates ON public.vendor_static_locations USING btree (latitude, longitude);


--
-- Name: idx_vendor_static_locations_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_static_locations_vendor_id ON public.vendor_static_locations USING btree (vendor_id);


--
-- Name: idx_vendors_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendors_status ON public.vendors USING btree (status);


--
-- Name: uniq_live_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_live_active ON public.vendor_live_sessions USING btree (vendor_id) WHERE is_active;


--
-- Name: platform_settings on_platform_settings_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_platform_settings_update BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.handle_platform_settings_update();


--
-- Name: reviews trg_update_vendor_rating; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_vendor_rating AFTER INSERT OR DELETE OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_vendor_rating_stats();


--
-- Name: users trg_users_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_users update_admin_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: customer_on_the_way update_customer_on_the_way_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_customer_on_the_way_updated_at BEFORE UPDATE ON public.customer_on_the_way FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: accounts accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: analytics_exports analytics_exports_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_exports
    ADD CONSTRAINT analytics_exports_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: business_subcategories business_subcategories_business_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_subcategories
    ADD CONSTRAINT business_subcategories_business_type_id_fkey FOREIGN KEY (business_type_id) REFERENCES public.business_types(id) ON DELETE CASCADE;


--
-- Name: customer_on_the_way customer_on_the_way_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_on_the_way
    ADD CONSTRAINT customer_on_the_way_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: customer_on_the_way customer_on_the_way_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_on_the_way
    ADD CONSTRAINT customer_on_the_way_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: customer_reports customer_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_reports
    ADD CONSTRAINT customer_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id);


--
-- Name: customer_reports customer_reports_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_reports
    ADD CONSTRAINT customer_reports_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendor_static_locations fk_static_vendor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_static_locations
    ADD CONSTRAINT fk_static_vendor FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: moderation_logs moderation_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_logs
    ADD CONSTRAINT moderation_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: moderation_logs moderation_logs_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_logs
    ADD CONSTRAINT moderation_logs_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.admin_users(id) ON DELETE CASCADE;


--
-- Name: review_reports review_reports_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reports
    ADD CONSTRAINT review_reports_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: review_reports review_reports_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reports
    ADD CONSTRAINT review_reports_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: search_logs search_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_logs
    ADD CONSTRAINT search_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: search_logs search_logs_vendor_clicked_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_logs
    ADD CONSTRAINT search_logs_vendor_clicked_fkey FOREIGN KEY (vendor_clicked) REFERENCES public.vendors(id) ON DELETE SET NULL;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: vendor_announcements vendor_announcements_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_announcements
    ADD CONSTRAINT vendor_announcements_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendor_feedback vendor_feedback_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_feedback
    ADD CONSTRAINT vendor_feedback_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendor_hours vendor_hours_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_hours
    ADD CONSTRAINT vendor_hours_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendor_live_sessions vendor_live_sessions_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_live_sessions
    ADD CONSTRAINT vendor_live_sessions_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendor_reports vendor_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_reports
    ADD CONSTRAINT vendor_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: vendor_reports vendor_reports_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_reports
    ADD CONSTRAINT vendor_reports_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendor_specials vendor_specials_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_specials
    ADD CONSTRAINT vendor_specials_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendor_static_locations vendor_static_locations_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_static_locations
    ADD CONSTRAINT vendor_static_locations_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendors vendors_approved_by_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_approved_by_fkey1 FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: vendors vendors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: admin_users Admin users are only accessible by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users are only accessible by service role" ON public.admin_users USING (public.is_service_role());


--
-- Name: business_subcategories Admins can manage business subcategories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage business subcategories" ON public.business_subcategories USING ((auth.role() = 'service_role'::text));


--
-- Name: business_types Admins can manage business types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage business types" ON public.business_types USING ((auth.role() = 'service_role'::text));


--
-- Name: notifications Admins can mark their own notifications as read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can mark their own notifications as read" ON public.notifications FOR UPDATE USING ((recipient_id = auth.uid()));


--
-- Name: notifications Admins can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view their own notifications" ON public.notifications FOR SELECT USING ((recipient_id = auth.uid()));


--
-- Name: verification_tokens Allow verification token access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow verification token access" ON public.verification_tokens TO service_role USING (true);


--
-- Name: verification_tokens Allow verification token insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow verification token insert" ON public.verification_tokens FOR INSERT WITH CHECK (true);


--
-- Name: analytics_exports Analytics exports are only accessible by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Analytics exports are only accessible by service role" ON public.analytics_exports USING (public.is_service_role());


--
-- Name: vendor_live_sessions Anyone can view live sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view live sessions" ON public.vendor_live_sessions FOR SELECT USING (true);


--
-- Name: vendor_announcements Anyone can view vendor announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view vendor announcements" ON public.vendor_announcements FOR SELECT USING (true);


--
-- Name: vendor_hours Anyone can view vendor hours; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view vendor hours" ON public.vendor_hours FOR SELECT USING (true);


--
-- Name: vendors Anyone can view vendor profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view vendor profiles" ON public.vendors FOR SELECT USING (true);


--
-- Name: vendor_specials Anyone can view vendor specials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view vendor specials" ON public.vendor_specials FOR SELECT USING (true);


--
-- Name: vendor_static_locations Anyone can view vendor static locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view vendor static locations" ON public.vendor_static_locations FOR SELECT USING (true);


--
-- Name: moderation_logs Moderation logs are only accessible by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderation logs are only accessible by service role" ON public.moderation_logs USING (public.is_service_role());


--
-- Name: notifications Notifications are only accessible by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Notifications are only accessible by service role" ON public.notifications USING (public.is_service_role());


--
-- Name: platform_settings Platform settings are only accessible by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Platform settings are only accessible by service role" ON public.platform_settings USING (public.is_service_role());


--
-- Name: business_subcategories Public can view business subcategories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view business subcategories" ON public.business_subcategories FOR SELECT USING (true);


--
-- Name: business_types Public can view business types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view business types" ON public.business_types FOR SELECT USING (true);


--
-- Name: review_reports Review reports are only accessible by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Review reports are only accessible by service role" ON public.review_reports USING (public.is_service_role());


--
-- Name: notifications Service role has full access to notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role has full access to notifications" ON public.notifications USING ((auth.role() = 'service_role'::text));


--
-- Name: favorites Users can delete their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING ((public.get_current_user_id() = customer_id));


--
-- Name: reviews Users can delete their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING ((public.get_current_user_id() = user_id));


--
-- Name: customer_reports Users can insert customer reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert customer reports" ON public.customer_reports FOR INSERT WITH CHECK ((public.get_current_user_id() = reporter_id));


--
-- Name: favorites Users can insert their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own favorites" ON public.favorites FOR INSERT WITH CHECK ((public.get_current_user_id() = customer_id));


--
-- Name: reviews Users can insert their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own reviews" ON public.reviews FOR INSERT WITH CHECK ((public.get_current_user_id() = user_id));


--
-- Name: vendor_reports Users can insert vendor reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert vendor reports" ON public.vendor_reports FOR INSERT WITH CHECK ((public.get_current_user_id() = reporter_id));


--
-- Name: accounts Users can manage their own accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own accounts" ON public.accounts USING ((public.get_current_user_id() = user_id)) WITH CHECK ((public.get_current_user_id() = user_id));


--
-- Name: search_logs Users can manage their own search logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own search logs" ON public.search_logs USING ((public.get_current_user_id() = user_id)) WITH CHECK ((public.get_current_user_id() = user_id));


--
-- Name: sessions Users can manage their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own sessions" ON public.sessions USING ((public.get_current_user_id() = user_id)) WITH CHECK ((public.get_current_user_id() = user_id));


--
-- Name: customer_on_the_way Users can manage their own tracking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own tracking" ON public.customer_on_the_way USING ((public.get_current_user_id() = user_id)) WITH CHECK ((public.get_current_user_id() = user_id));


--
-- Name: users Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING ((public.get_current_user_id() = id));


--
-- Name: reviews Users can update their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING ((public.get_current_user_id() = user_id));


--
-- Name: reviews Users can view all reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all reviews" ON public.reviews FOR SELECT USING (true);


--
-- Name: users Users can view all user profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all user profiles" ON public.users FOR SELECT USING (true);


--
-- Name: customer_reports Users can view their own customer reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own customer reports" ON public.customer_reports FOR SELECT USING ((public.get_current_user_id() = reporter_id));


--
-- Name: favorites Users can view their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING ((public.get_current_user_id() = customer_id));


--
-- Name: vendor_reports Users can view their own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own reports" ON public.vendor_reports FOR SELECT USING ((public.get_current_user_id() = reporter_id));


--
-- Name: vendor_announcements Vendors can manage their own announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can manage their own announcements" ON public.vendor_announcements USING ((EXISTS ( SELECT 1
   FROM public.vendors
  WHERE ((vendors.id = vendor_announcements.vendor_id) AND (vendors.user_id = public.get_current_user_id())))));


--
-- Name: vendor_feedback Vendors can manage their own feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can manage their own feedback" ON public.vendor_feedback USING ((EXISTS ( SELECT 1
   FROM public.vendors
  WHERE ((vendors.id = vendor_feedback.vendor_id) AND (vendors.user_id = public.get_current_user_id())))));


--
-- Name: vendor_hours Vendors can manage their own hours; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can manage their own hours" ON public.vendor_hours USING ((EXISTS ( SELECT 1
   FROM public.vendors
  WHERE ((vendors.id = vendor_hours.vendor_id) AND (vendors.user_id = public.get_current_user_id())))));


--
-- Name: vendors Vendors can manage their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can manage their own profile" ON public.vendors USING ((public.get_current_user_id() = user_id));


--
-- Name: vendor_live_sessions Vendors can manage their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can manage their own sessions" ON public.vendor_live_sessions USING ((EXISTS ( SELECT 1
   FROM public.vendors
  WHERE ((vendors.id = vendor_live_sessions.vendor_id) AND (vendors.user_id = public.get_current_user_id())))));


--
-- Name: vendor_specials Vendors can manage their own specials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can manage their own specials" ON public.vendor_specials USING ((EXISTS ( SELECT 1
   FROM public.vendors
  WHERE ((vendors.id = vendor_specials.vendor_id) AND (vendors.user_id = public.get_current_user_id())))));


--
-- Name: vendor_static_locations Vendors can manage their own static locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can manage their own static locations" ON public.vendor_static_locations USING ((EXISTS ( SELECT 1
   FROM public.vendors
  WHERE ((vendors.id = vendor_static_locations.vendor_id) AND (vendors.user_id = public.get_current_user_id())))));


--
-- Name: vendors Vendors: owner can manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors: owner can manage" ON public.vendors USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

--
-- Name: analytics_exports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics_exports ENABLE ROW LEVEL SECURITY;

--
-- Name: business_subcategories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_subcategories ENABLE ROW LEVEL SECURITY;

--
-- Name: business_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_types ENABLE ROW LEVEL SECURITY;

--
-- Name: customer_on_the_way; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_on_the_way ENABLE ROW LEVEL SECURITY;

--
-- Name: customer_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: favorites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: vendor_announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: vendor_live_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_live_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: vendor_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: vendor_specials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_specials ENABLE ROW LEVEL SECURITY;

--
-- Name: vendor_static_locations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_static_locations ENABLE ROW LEVEL SECURITY;

--
-- Name: vendors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

--
-- Name: verification_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

