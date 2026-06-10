--
-- PostgreSQL database dump
--

\restrict XM4o6q7ZWsB10Ndvy4Z3WnGPpgbIfUHHdcXgXqAwIT2kEZbrMAcNkPBc24ah3L3

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accessories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accessories (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    category character varying(100),
    quantity numeric(10,2) DEFAULT 0,
    unit character varying(50),
    unit_price numeric(12,2) DEFAULT 0,
    supplier_id integer,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    party_id_owner integer
);


--
-- Name: accessories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accessories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accessories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accessories_id_seq OWNED BY public.accessories.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    full_name character varying(200) NOT NULL,
    role character varying(100),
    phone character varying(50),
    cnic character varying(20),
    address text,
    joining_date date,
    salary numeric(12,2) DEFAULT 0,
    status character varying(30) DEFAULT 'Active'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    description character varying(255) NOT NULL,
    quantity numeric(10,2) DEFAULT 1,
    unit_price numeric(12,2) DEFAULT 0,
    total numeric(14,2) GENERATED ALWAYS AS ((quantity * unit_price)) STORED
);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoice_items_id_seq OWNED BY public.invoice_items.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_no character varying(50) NOT NULL,
    type character varying(20) NOT NULL,
    party_id integer,
    issue_date date DEFAULT CURRENT_DATE NOT NULL,
    due_date date,
    subtotal numeric(14,2) DEFAULT 0,
    discount numeric(14,2) DEFAULT 0,
    tax numeric(14,2) DEFAULT 0,
    total numeric(14,2) DEFAULT 0,
    paid numeric(14,2) DEFAULT 0,
    status character varying(30) DEFAULT 'Unpaid'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    shipment_type character varying(20) DEFAULT 'Air'::character varying,
    advance numeric(14,2) DEFAULT 0,
    freight_charges numeric(14,2) DEFAULT 0,
    amount_paid numeric(14,2) DEFAULT 0,
    remaining numeric(14,2) DEFAULT 0
);


--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id integer NOT NULL,
    style_no character varying(100) NOT NULL,
    description text,
    color character varying(100),
    size character varying(100),
    price numeric(12,2) DEFAULT 0,
    image_url character varying(500),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    party_id integer
);


--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: parties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parties (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    type character varying(50) NOT NULL,
    contact_person character varying(150),
    phone character varying(50),
    email character varying(150),
    address text,
    city character varying(100),
    balance numeric(14,2) DEFAULT 0,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: parties_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: parties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parties_id_seq OWNED BY public.parties.id;


--
-- Name: party_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.party_accounts (
    id integer NOT NULL,
    party_id integer NOT NULL,
    account_name character varying(200) NOT NULL,
    bank_name character varying(200) NOT NULL,
    account_no character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: party_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.party_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: party_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.party_accounts_id_seq OWNED BY public.party_accounts.id;


--
-- Name: party_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.party_payments (
    id integer NOT NULL,
    party_id integer NOT NULL,
    account_id integer,
    account_name character varying(200),
    amount numeric(14,2) NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: party_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.party_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: party_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.party_payments_id_seq OWNED BY public.party_payments.id;


--
-- Name: payrolls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payrolls (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    month character varying(20) NOT NULL,
    basic_salary numeric(12,2) DEFAULT 0,
    bonus numeric(12,2) DEFAULT 0,
    overtime numeric(12,2) DEFAULT 0,
    deductions numeric(12,2) DEFAULT 0,
    net_salary numeric(12,2) GENERATED ALWAYS AS ((((basic_salary + bonus) + overtime) - deductions)) STORED,
    paid_on date,
    status character varying(20) DEFAULT 'Pending'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: payrolls_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payrolls_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payrolls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payrolls_id_seq OWNED BY public.payrolls.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'staff'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: accessories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessories ALTER COLUMN id SET DEFAULT nextval('public.accessories_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: invoice_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items ALTER COLUMN id SET DEFAULT nextval('public.invoice_items_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: parties id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parties ALTER COLUMN id SET DEFAULT nextval('public.parties_id_seq'::regclass);


--
-- Name: party_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.party_accounts ALTER COLUMN id SET DEFAULT nextval('public.party_accounts_id_seq'::regclass);


--
-- Name: party_payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.party_payments ALTER COLUMN id SET DEFAULT nextval('public.party_payments_id_seq'::regclass);


--
-- Name: payrolls id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls ALTER COLUMN id SET DEFAULT nextval('public.payrolls_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: accessories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accessories (id, name, category, quantity, unit, unit_price, supplier_id, notes, created_at, updated_at, party_id_owner) FROM stdin;
9	Fabric	Fabric	500.00	kg	1200.00	\N		2026-06-04 17:51:15.336966	2026-06-04 17:51:15.336966	4
10	Thread	Thread	500.00	rolls	200.00	\N		2026-06-04 17:51:36.737064	2026-06-04 17:51:36.737064	4
11	Button	Button	500.00	box	250.00	\N		2026-06-04 17:53:13.986565	2026-06-04 17:53:13.986565	4
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, created_at) FROM stdin;
1	Fabric	2026-06-04 16:24:19.298827
2	Unstitched Cloth	2026-06-04 16:24:19.298827
3	Thread	2026-06-04 16:24:19.298827
4	Button	2026-06-04 16:24:19.298827
5	Zipper	2026-06-04 16:24:19.298827
6	Lining	2026-06-04 16:24:19.298827
7	Elastic	2026-06-04 16:24:19.298827
8	Other	2026-06-04 16:24:19.298827
9	rhinestone	2026-06-04 17:29:42.027568
10	NEEDLES	2026-06-05 01:41:24.015999
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, full_name, role, phone, cnic, address, joining_date, salary, status, created_at, updated_at) FROM stdin;
1	Aamir	Acting CEO	03151160349	11111-11111-1		2026-01-15	60000.00	Active	2026-06-03 18:55:13.386106	2026-06-03 18:55:13.386106
3	Akhtar	Mechanic	03051281696	42401-2236873-7	Karachi	2026-05-01	6000.00	Active	2026-06-04 02:38:58.362573	2026-06-04 02:38:58.362573
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoice_items (id, invoice_id, description, quantity, unit_price) FROM stdin;
18	10	001 | Color: BROWN | Size: S	150.00	1200.00
19	10	002 | Color: WHITE | Size: M	200.00	1300.00
20	13	001 | Color: BROWN | Size: S	400.00	1200.00
21	13	002 | Color: WHITE | Size: M	500.00	1300.00
22	13	001 | Color: BLACK | Size: SMALL	600.00	1200.00
23	14	002 | Color: WHITE | Size: M	150.00	1300.00
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, invoice_no, type, party_id, issue_date, due_date, subtotal, discount, tax, total, paid, status, notes, created_at, updated_at, shipment_type, advance, freight_charges, amount_paid, remaining) FROM stdin;
10	010	Sale	4	2026-09-01	2026-10-02	440000.00	0.00	0.00	340000.00	0.00	Pending		2026-06-07 03:13:31.357305	2026-06-09 22:05:26.476915	Air	150000.00	50000.00	0.00	340000.00
14	012	Sale	4	2026-06-09	2026-07-10	195000.00	0.00	0.00	200000.00	0.00	Pending		2026-06-09 23:06:07.594742	2026-06-09 23:06:07.594742	Air	20000.00	25000.00	0.00	200000.00
13	011	Sale	4	2026-06-03	2026-08-03	1850000.00	0.00	0.00	1050000.00	0.00	Partial		2026-06-07 03:19:26.500312	2026-06-10 05:10:50.158945	Air	900000.00	100000.00	100000.00	950000.00
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.items (id, style_no, description, color, size, price, image_url, created_at, updated_at, party_id) FROM stdin;
1	001		Red	S	1500.00		2026-06-03 19:54:56.216	2026-06-03 19:54:56.216	\N
2	002		Brown	M	2000.00		2026-06-03 19:55:11.15127	2026-06-03 19:55:11.15127	\N
3	003		B	L	2000.00	https://althaqafah.com.pk/products/simple-black-kaftan-style-abaya?srsltid=AfmBOopkZmnl_lq5ZBLt3iJzkeJyvS2K-BmnWFGbqwqlpKqYCqsXpTqm	2026-06-03 20:38:18.268049	2026-06-03 20:38:18.268049	\N
9	001		BLACK	SMALL	1200.00		2026-06-07 02:11:05.83932	2026-06-07 02:11:05.83932	4
11	002		WHITE	M	1300.00		2026-06-07 02:12:12.396462	2026-06-07 02:12:17.505312	4
12	001		BROWN	S	1200.00		2026-06-07 02:12:48.183713	2026-06-07 02:12:48.183713	4
13	001	Jubba	green	M	1200.00		2026-06-09 22:51:37.460861	2026-06-09 22:51:37.460861	4
\.


--
-- Data for Name: parties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parties (id, name, type, contact_person, phone, email, address, city, balance, notes, created_at, updated_at) FROM stdin;
4	SAFA ISLAMIC STORE	Customer	SHAKEEB	03051281696	hassanriaz18049@gmail.com		UK	0.00		2026-06-04 15:58:16.645448	2026-06-04 17:58:46.37426
7	KARAM BOOKS	Customer	HAFIZ SAHAB					0.00		2026-06-07 02:10:46.766453	2026-06-07 17:52:57.27762
\.


--
-- Data for Name: party_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.party_accounts (id, party_id, account_name, bank_name, account_no, created_at) FROM stdin;
1	4	Hassan Riaz	HBL	12157901223603	2026-06-09 22:03:49.681822
\.


--
-- Data for Name: party_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.party_payments (id, party_id, account_id, account_name, amount, date, notes, created_at) FROM stdin;
8	4	1	Hassan Riaz — HBL	100000.00	2026-09-18		2026-06-10 05:10:50.113108
\.


--
-- Data for Name: payrolls; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payrolls (id, employee_id, month, basic_salary, bonus, overtime, deductions, paid_on, status, notes, created_at) FROM stdin;
2	1	May 2026	60000.00	10000.00	0.00	0.00	\N	\N		2026-06-03 18:57:44.04586
3	3	May 2026	6000.00	0.00	0.00	0.00	\N	\N		2026-06-04 02:40:16.352841
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password, role, created_at) FROM stdin;
1	admin	$2b$10$opZtBu/.u9FmD.pOECYGQuw8a7FIKIiZiRIBbIts5I.kz97JP9RF.	admin	2026-05-31 17:42:50.787129
\.


--
-- Name: accessories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accessories_id_seq', 13, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 10, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employees_id_seq', 3, true);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoice_items_id_seq', 23, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoices_id_seq', 14, true);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.items_id_seq', 13, true);


--
-- Name: parties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.parties_id_seq', 7, true);


--
-- Name: party_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.party_accounts_id_seq', 1, true);


--
-- Name: party_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.party_payments_id_seq', 8, true);


--
-- Name: payrolls_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payrolls_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: accessories accessories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessories
    ADD CONSTRAINT accessories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_no_key UNIQUE (invoice_no);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: parties parties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parties
    ADD CONSTRAINT parties_pkey PRIMARY KEY (id);


--
-- Name: party_accounts party_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.party_accounts
    ADD CONSTRAINT party_accounts_pkey PRIMARY KEY (id);


--
-- Name: party_payments party_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.party_payments
    ADD CONSTRAINT party_payments_pkey PRIMARY KEY (id);


--
-- Name: payrolls payrolls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_accessories_cat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accessories_cat ON public.accessories USING btree (category);


--
-- Name: idx_invoices_party; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_party ON public.invoices USING btree (party_id);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- Name: idx_invoices_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_type ON public.invoices USING btree (type);


--
-- Name: idx_items_style_no; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_style_no ON public.items USING btree (style_no);


--
-- Name: idx_parties_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_parties_type ON public.parties USING btree (type);


--
-- Name: idx_party_accounts_party; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_party_accounts_party ON public.party_accounts USING btree (party_id);


--
-- Name: idx_party_payments_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_party_payments_date ON public.party_payments USING btree (date);


--
-- Name: idx_party_payments_party; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_party_payments_party ON public.party_payments USING btree (party_id);


--
-- Name: idx_payrolls_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payrolls_employee ON public.payrolls USING btree (employee_id);


--
-- Name: idx_payrolls_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payrolls_month ON public.payrolls USING btree (month);


--
-- Name: accessories accessories_party_id_owner_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessories
    ADD CONSTRAINT accessories_party_id_owner_fkey FOREIGN KEY (party_id_owner) REFERENCES public.parties(id) ON DELETE CASCADE;


--
-- Name: accessories accessories_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessories
    ADD CONSTRAINT accessories_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.parties(id) ON DELETE SET NULL;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_party_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE SET NULL;


--
-- Name: items items_party_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE CASCADE;


--
-- Name: party_accounts party_accounts_party_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.party_accounts
    ADD CONSTRAINT party_accounts_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE CASCADE;


--
-- Name: party_payments party_payments_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.party_payments
    ADD CONSTRAINT party_payments_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.party_accounts(id) ON DELETE SET NULL;


--
-- Name: party_payments party_payments_party_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.party_payments
    ADD CONSTRAINT party_payments_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE CASCADE;


--
-- Name: payrolls payrolls_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict XM4o6q7ZWsB10Ndvy4Z3WnGPpgbIfUHHdcXgXqAwIT2kEZbrMAcNkPBc24ah3L3

