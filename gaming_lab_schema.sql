--
-- PostgreSQL database dump
--

-- Dumped from database version 14.13 (Ubuntu 14.13-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.13 (Ubuntu 14.13-0ubuntu0.22.04.1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: friends; Type: TABLE; Schema: public; Owner: mrmongol
--

CREATE TABLE public.friends (
    id integer NOT NULL,
    user_id integer,
    friend_id integer
);


ALTER TABLE public.friends OWNER TO mrmongol;

--
-- Name: friends_id_seq; Type: SEQUENCE; Schema: public; Owner: mrmongol
--

CREATE SEQUENCE public.friends_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.friends_id_seq OWNER TO mrmongol;

--
-- Name: friends_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mrmongol
--

ALTER SEQUENCE public.friends_id_seq OWNED BY public.friends.id;


--
-- Name: games; Type: TABLE; Schema: public; Owner: mrmongol
--

CREATE TABLE public.games (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    release_date date
);


ALTER TABLE public.games OWNER TO mrmongol;

--
-- Name: games_id_seq; Type: SEQUENCE; Schema: public; Owner: mrmongol
--

CREATE SEQUENCE public.games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.games_id_seq OWNER TO mrmongol;

--
-- Name: games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mrmongol
--

ALTER SEQUENCE public.games_id_seq OWNED BY public.games.id;


--
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: mrmongol
--

CREATE TABLE public.knex_migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


ALTER TABLE public.knex_migrations OWNER TO mrmongol;

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: mrmongol
--

CREATE SEQUENCE public.knex_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.knex_migrations_id_seq OWNER TO mrmongol;

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mrmongol
--

ALTER SEQUENCE public.knex_migrations_id_seq OWNED BY public.knex_migrations.id;


--
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: mrmongol
--

CREATE TABLE public.knex_migrations_lock (
    index integer NOT NULL,
    is_locked integer
);


ALTER TABLE public.knex_migrations_lock OWNER TO mrmongol;

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: mrmongol
--

CREATE SEQUENCE public.knex_migrations_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.knex_migrations_lock_index_seq OWNER TO mrmongol;

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mrmongol
--

ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNED BY public.knex_migrations_lock.index;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: mrmongol
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    user_id integer,
    game_name character varying(255) NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    game_id integer,
    profile_pic text DEFAULT 'https://placehold.co/50'::text,
    username text NOT NULL
);


ALTER TABLE public.posts OWNER TO mrmongol;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: mrmongol
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.posts_id_seq OWNER TO mrmongol;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mrmongol
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: replies; Type: TABLE; Schema: public; Owner: mrmongol
--

CREATE TABLE public.replies (
    id integer NOT NULL,
    post_id integer,
    username text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.replies OWNER TO mrmongol;

--
-- Name: replies_id_seq; Type: SEQUENCE; Schema: public; Owner: mrmongol
--

CREATE SEQUENCE public.replies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.replies_id_seq OWNER TO mrmongol;

--
-- Name: replies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mrmongol
--

ALTER SEQUENCE public.replies_id_seq OWNED BY public.replies.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: mrmongol
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    profile_pic character varying(255) DEFAULT NULL::character varying,
    banner character varying(255) DEFAULT NULL::character varying,
    bio text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    platforms jsonb DEFAULT '[]'::jsonb,
    genres jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.users OWNER TO mrmongol;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: mrmongol
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO mrmongol;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mrmongol
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: friends id; Type: DEFAULT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.friends ALTER COLUMN id SET DEFAULT nextval('public.friends_id_seq'::regclass);


--
-- Name: games id; Type: DEFAULT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.games ALTER COLUMN id SET DEFAULT nextval('public.games_id_seq'::regclass);


--
-- Name: knex_migrations id; Type: DEFAULT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.knex_migrations ALTER COLUMN id SET DEFAULT nextval('public.knex_migrations_id_seq'::regclass);


--
-- Name: knex_migrations_lock index; Type: DEFAULT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.knex_migrations_lock ALTER COLUMN index SET DEFAULT nextval('public.knex_migrations_lock_index_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: replies id; Type: DEFAULT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.replies ALTER COLUMN id SET DEFAULT nextval('public.replies_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: friends friends_pkey; Type: CONSTRAINT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_pkey PRIMARY KEY (id);


--
-- Name: friends friends_user_id_friend_id_unique; Type: CONSTRAINT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_user_id_friend_id_unique UNIQUE (user_id, friend_id);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: knex_migrations_lock knex_migrations_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);


--
-- Name: knex_migrations knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: replies replies_pkey; Type: CONSTRAINT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.replies
    ADD CONSTRAINT replies_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: friends friends_friend_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_friend_id_foreign FOREIGN KEY (friend_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friends friends_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: replies replies_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mrmongol
--

ALTER TABLE ONLY public.replies
    ADD CONSTRAINT replies_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

