--
-- PostgreSQL database dump
--

\restrict jpVzCmbEodPtdR19DauRoCti8YA4hFka8csNbVNVw9ZeOXBaRw3QhFVp1bw8XeU

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

--
-- Data for Name: parties; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.parties VALUES (9, 'AKEEL BHAI CARGO', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 21:37:36.266155', '2026-06-10 21:37:36.266155');
INSERT INTO public.parties VALUES (10, 'ASIF CHAIN ', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 22:38:45.357666', '2026-06-10 22:38:45.357666');
INSERT INTO public.parties VALUES (11, 'IKRAM BHAI FABRICS', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 22:39:00.030963', '2026-06-10 22:39:00.030963');
INSERT INTO public.parties VALUES (12, 'ALLAUDDIN FABRICS', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 22:39:10.687222', '2026-06-10 22:39:10.687222');
INSERT INTO public.parties VALUES (13, 'JS FABRICS', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 22:39:20.316169', '2026-06-10 22:39:20.316169');
INSERT INTO public.parties VALUES (14, 'SHAHZAD CTN', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 22:39:55.47447', '2026-06-10 22:39:55.47447');
INSERT INTO public.parties VALUES (15, 'SAMMA TRADERS ', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 22:40:04.567225', '2026-06-10 22:40:04.567225');
INSERT INTO public.parties VALUES (16, 'BILAL BHAI FABRICS ', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 22:40:13.581642', '2026-06-10 22:40:13.581642');
INSERT INTO public.parties VALUES (17, 'SALMAN FABRICS', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 22:40:34.36744', '2026-06-10 22:40:34.36744');
INSERT INTO public.parties VALUES (18, 'ABAYA FABRICS', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 22:40:55.839311', '2026-06-10 22:40:55.839311');
INSERT INTO public.parties VALUES (19, 'MUBEEN FABRICS NIDA', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 22:41:10.980166', '2026-06-10 22:41:10.980166');
INSERT INTO public.parties VALUES (20, 'TILLA KHAN FABRICS', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 22:41:26.32827', '2026-06-10 22:41:26.32827');
INSERT INTO public.parties VALUES (21, 'WAQAS QAZZA', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 22:41:36.03556', '2026-06-10 22:41:36.03556');
INSERT INTO public.parties VALUES (22, 'MUBEEN FABRICS ABAYA', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 22:42:22.382451', '2026-06-10 22:42:22.382451');
INSERT INTO public.parties VALUES (23, 'SHAHID FABRICS JERSEY', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 22:44:42.774129', '2026-06-10 22:44:42.774129');
INSERT INTO public.parties VALUES (4, 'SAFA ISLAMIC STORE', 'Customer', 'SHAKEEB', '', '', '', 'UK', 0.00, '', '2026-06-04 15:58:16.645448', '2026-06-12 14:23:27.60975');
INSERT INTO public.parties VALUES (7, 'KARAM BOOKS', 'Customer', 'HAFIZ SAHAB', '', '', '', 'UK', 0.00, '', '2026-06-07 02:10:46.766453', '2026-06-12 14:24:04.69062');
INSERT INTO public.parties VALUES (25, 'AL EMARA ', 'Customer', '', '', '', '', '', 0.00, '', '2026-06-13 16:11:06.831573', '2026-06-13 16:11:06.831573');
INSERT INTO public.parties VALUES (24, 'SHAH FABRICS', 'Supplier', '', '', '', '', '', 0.00, '', '2026-06-10 22:44:50.718931', '2026-06-20 01:10:17.487453');


--
-- Data for Name: accessories; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.categories VALUES (1, 'Fabric', '2026-06-04 16:24:19.298827');
INSERT INTO public.categories VALUES (2, 'Unstitched Cloth', '2026-06-04 16:24:19.298827');
INSERT INTO public.categories VALUES (3, 'Thread', '2026-06-04 16:24:19.298827');
INSERT INTO public.categories VALUES (4, 'Button', '2026-06-04 16:24:19.298827');
INSERT INTO public.categories VALUES (5, 'Zipper', '2026-06-04 16:24:19.298827');
INSERT INTO public.categories VALUES (6, 'Lining', '2026-06-04 16:24:19.298827');
INSERT INTO public.categories VALUES (7, 'Elastic', '2026-06-04 16:24:19.298827');
INSERT INTO public.categories VALUES (8, 'Other', '2026-06-04 16:24:19.298827');
INSERT INTO public.categories VALUES (9, 'rhinestone', '2026-06-04 17:29:42.027568');
INSERT INTO public.categories VALUES (10, 'NEEDLES', '2026-06-05 01:41:24.015999');


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.employees VALUES (6, 'Hassan', 'tailor', '', '', '', '2026-06-18', 0.00, 'Active', '2026-06-18 23:21:40.936541', '2026-06-18 23:21:40.936541', 'Contract', 0.00, 0.00, 0.00);


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.items VALUES (16, 'ASM-265', 'Mens Jubba', NULL, NULL, 0.00, '', '2026-06-18 23:38:35.883878', '2026-06-18 23:42:23.953739', 4, 0.00, '{White/g,Pink/g}', '{S,M,L,XL,XXL,50,52(S)}', '[{"id": "1", "label": "Fabric", "amount": "150"}, {"id": "2", "label": "Thread & Accessories", "amount": "200"}, {"id": "3", "label": "Buttons / Zippers", "amount": "250"}, {"id": "4", "label": "Labour", "amount": "140"}, {"id": "5", "label": "Packaging", "amount": "60"}]', 400.00, 1200.00, 800.00);
INSERT INTO public.items VALUES (17, 'ASM-264', 'Mens Jubba', NULL, NULL, 0.00, '', '2026-06-18 23:43:07.38384', '2026-06-18 23:43:07.38384', 4, 0.00, '{Black,GREY}', '{S,M,XXL,XL,L}', '[]', 0.00, 0.00, 0.00);
INSERT INTO public.items VALUES (18, 'ASM-265', 'Mens Jubba', NULL, NULL, 0.00, '', '2026-06-18 23:45:18.375467', '2026-06-18 23:45:18.375467', 7, 0.00, '{}', '{}', '[]', 0.00, 0.00, 0.00);


--
-- Data for Name: party_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.party_accounts VALUES (1, 4, 'Hassan Riaz', 'HBL', '12157901223603', '2026-06-09 22:03:49.681822');
INSERT INTO public.party_accounts VALUES (2, 9, 'UMER', 'HBL', '151515151515151515', '2026-06-10 21:47:05.370718');
INSERT INTO public.party_accounts VALUES (3, 4, 'Umer ', 'UBL', '213161515151616', '2026-06-20 01:21:36.061508');
INSERT INTO public.party_accounts VALUES (4, 4, 'Umair', 'Askari', '564616161621', '2026-06-20 01:23:10.810318');


--
-- Data for Name: party_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.party_payments VALUES (11, 4, 4, 'Umair — Askari', 100000.00, '2026-06-20', 'Jubba', '2026-06-20 01:23:43.447313');


--
-- Data for Name: payrolls; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.payrolls VALUES (7, 6, '6', 0.00, 0.00, 0.00, 0.00, DEFAULT, NULL, 'Paid', '', '2026-06-18 23:43:40.377098', 'Weekly', NULL, NULL, 30.00, 0.00, 0.00, 'Hassan', 2026, 3550.00, 3550.00, 1100.00, '[{"color": "", "total": 2250, "pieces": "15", "item_id": 17, "style_no": "ASM-264", "party_name": "SAFA ISLAMIC STORE", "description": "Mens Jubba", "labour_price": "150"}, {"color": "", "total": 2400, "pieces": "15", "item_id": 16, "style_no": "ASM-265", "party_name": "SAFA ISLAMIC STORE", "description": "Mens Jubba", "labour_price": "160"}]');
INSERT INTO public.payrolls VALUES (8, 6, '6', 0.00, 0.00, 0.00, 0.00, DEFAULT, NULL, 'Paid', '', '2026-06-20 00:52:45.660656', 'Weekly', '2026-06-20', '2026-06-27', 30.00, 0.00, 0.00, 'Hassan', 2026, 4650.00, 4650.00, 0.00, '[{"color": "", "total": 2250, "pieces": "15", "item_id": 18, "style_no": "ASM-265", "party_name": "KARAM BOOKS", "description": "Mens Jubba", "labour_price": "150"}, {"color": "", "total": 2400, "pieces": "15", "item_id": 17, "style_no": "ASM-264", "party_name": "SAFA ISLAMIC STORE", "description": "Mens Jubba", "labour_price": "160"}]');
INSERT INTO public.payrolls VALUES (9, 6, '6', 0.00, 0.00, 0.00, 0.00, DEFAULT, NULL, 'Paid', '', '2026-06-20 00:58:19.377103', 'Weekly', '2026-06-20', '2026-06-27', 310.00, 0.00, 0.00, 'Hassan', 2026, 45200.00, 45200.00, 6000.00, '[{"color": "", "total": 24000, "pieces": "150", "item_id": 18, "style_no": "ASM-265", "party_name": "KARAM BOOKS", "description": "Mens Jubba", "labour_price": "160"}, {"color": "", "total": 27200, "pieces": "160", "item_id": 17, "style_no": "ASM-264", "party_name": "SAFA ISLAMIC STORE", "description": "Mens Jubba", "labour_price": "170"}]');


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.purchase_orders VALUES (2, 'AL-001', '2026-05-25', 25, 'MOROCCON', '', 'Pending', '', 1793, '2026-06-13 16:38:52.795427', '2026-06-19 19:12:15.312355');
INSERT INTO public.purchase_orders VALUES (3, '001', '2026-06-18', 7, 'armani', '', 'Pending', '', 928, '2026-06-19 19:19:15.241816', '2026-06-20 01:42:27.099064');


--
-- Data for Name: po_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.po_items VALUES (33, 2, 'AL-E', '', 'PINK', '{"50": {"General": 100}, "52": {"General": 64}, "54": {"General": 87}, "56": {"General": 56}, "58": {"General": 72}, "60": {"General": 100}}', 479, '2026-06-19 19:12:15.373929');
INSERT INTO public.po_items VALUES (34, 2, 'AL-E', '-', 'BEIGE', '{"50": {"General": 60}, "52": {"General": 100}, "54": {"General": 90}, "56": {"General": 52}, "58": {"General": 92}}', 394, '2026-06-19 19:12:15.379285');
INSERT INTO public.po_items VALUES (35, 2, 'AL-E', '', 'PISTA', '{"50": {"General": 60}, "52": {"General": 72}, "54": {"General": 100}, "56": {"General": 91}, "58": {"General": 40}, "60": {"General": 94}}', 457, '2026-06-19 19:12:15.381618');
INSERT INTO public.po_items VALUES (36, 2, 'AL-E', '-', 'GREY', '{"50": {"General": 32}, "52": {"General": 72}, "54": {"General": 100}, "56": {"General": 97}, "58": {"General": 62}, "60": {"General": 100}}', 463, '2026-06-19 19:12:15.383812');
INSERT INTO public.po_items VALUES (38, 3, 'ASM-265', '', '', '{"50": {"L": 25, "M": 0, "S": 1, "XXL": 2}, "52": {"L": 6, "S": 25, "XL": 5, "XXL": 656}, "54": {"L": 66, "M": 62, "S": 66, "XL": 6, "XXL": 2, "General": 6}}', 928, '2026-06-20 01:42:27.116179');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES (1, 'admin', '$2b$10$2tkgtWN5U7BvZKKAZ1erF.H/CsnwPz7ajjx.XSOH0xGBnoe1oTAxm', 'admin', '2026-05-31 17:42:50.787129');


--
-- Name: accessories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accessories_id_seq', 19, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 10, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 6, true);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_items_id_seq', 24, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 20, true);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.items_id_seq', 18, true);


--
-- Name: parties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.parties_id_seq', 25, true);


--
-- Name: party_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.party_accounts_id_seq', 4, true);


--
-- Name: party_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.party_payments_id_seq', 11, true);


--
-- Name: payrolls_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payrolls_id_seq', 9, true);


--
-- Name: po_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.po_items_id_seq', 38, true);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- PostgreSQL database dump complete
--

\unrestrict jpVzCmbEodPtdR19DauRoCti8YA4hFka8csNbVNVw9ZeOXBaRw3QhFVp1bw8XeU

