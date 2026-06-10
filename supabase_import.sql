-- Create tables
CREATE TABLE IF NOT EXISTS public.parties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    city VARCHAR(100),
    balance NUMERIC(14,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employees (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(100),
    phone VARCHAR(50),
    cnic VARCHAR(20),
    address TEXT,
    joining_date DATE,
    salary NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accessories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    quantity NUMERIC(10,2) DEFAULT 0,
    unit VARCHAR(50),
    unit_price NUMERIC(12,2) DEFAULT 0,
    supplier_id INTEGER REFERENCES public.parties(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    party_id_owner INTEGER REFERENCES public.parties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.items (
    id SERIAL PRIMARY KEY,
    style_no VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(100),
    size VARCHAR(100),
    price NUMERIC(12,2) DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    party_id INTEGER REFERENCES public.parties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id SERIAL PRIMARY KEY,
    invoice_no VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    party_id INTEGER REFERENCES public.parties(id) ON DELETE SET NULL,
    issue_date DATE DEFAULT CURRENT_DATE NOT NULL,
    due_date DATE,
    subtotal NUMERIC(14,2) DEFAULT 0,
    discount NUMERIC(14,2) DEFAULT 0,
    tax NUMERIC(14,2) DEFAULT 0,
    total NUMERIC(14,2) DEFAULT 0,
    paid NUMERIC(14,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    shipment_type VARCHAR(20) DEFAULT 'Air',
    advance NUMERIC(14,2) DEFAULT 0,
    freight_charges NUMERIC(14,2) DEFAULT 0,
    amount_paid NUMERIC(14,2) DEFAULT 0,
    remaining NUMERIC(14,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 1,
    unit_price NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

CREATE TABLE IF NOT EXISTS public.payrolls (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    month VARCHAR(20) NOT NULL,
    basic_salary NUMERIC(12,2) DEFAULT 0,
    bonus NUMERIC(12,2) DEFAULT 0,
    overtime NUMERIC(12,2) DEFAULT 0,
    deductions NUMERIC(12,2) DEFAULT 0,
    net_salary NUMERIC(12,2) GENERATED ALWAYS AS (basic_salary + bonus + overtime - deductions) STORED,
    paid_on DATE,
    status VARCHAR(20) DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.party_accounts (
    id SERIAL PRIMARY KEY,
    party_id INTEGER NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
    account_name VARCHAR(200) NOT NULL,
    bank_name VARCHAR(200) NOT NULL,
    account_no VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.party_payments (
    id SERIAL PRIMARY KEY,
    party_id INTEGER NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES public.party_accounts(id) ON DELETE SET NULL,
    account_name VARCHAR(200),
    amount NUMERIC(14,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Insert data
INSERT INTO public.categories (id, name) VALUES
(1,'Fabric'),(2,'Unstitched Cloth'),(3,'Thread'),(4,'Button'),
(5,'Zipper'),(6,'Lining'),(7,'Elastic'),(8,'Other'),
(9,'rhinestone'),(10,'NEEDLES')
ON CONFLICT DO NOTHING;

INSERT INTO public.parties (id, name, type, contact_person, phone, email, city) VALUES
(4,'SAFA ISLAMIC STORE','Customer','SHAKEEB','03051281696','hassanriaz18049@gmail.com','UK'),
(7,'KARAM BOOKS','Customer','HAFIZ SAHAB',NULL,NULL,NULL)
ON CONFLICT DO NOTHING;

INSERT INTO public.employees (id, full_name, role, phone, cnic, address, joining_date, salary, status) VALUES
(1,'Aamir','Acting CEO','03151160349','11111-11111-1','','2026-01-15',60000.00,'Active'),
(3,'Akhtar','Mechanic','03051281696','42401-2236873-7','Karachi','2026-05-01',6000.00,'Active')
ON CONFLICT DO NOTHING;

INSERT INTO public.accessories (id, name, category, quantity, unit, unit_price, party_id_owner) VALUES
(9,'Fabric','Fabric',500.00,'kg',1200.00,4),
(10,'Thread','Thread',500.00,'rolls',200.00,4),
(11,'Button','Button',500.00,'box',250.00,4)
ON CONFLICT DO NOTHING;

INSERT INTO public.items (id, style_no, description, color, size, price, party_id) VALUES
(1,'001',NULL,'Red','S',1500.00,NULL),
(2,'002',NULL,'Brown','M',2000.00,NULL),
(3,'003',NULL,'B','L',2000.00,NULL),
(9,'001',NULL,'BLACK','SMALL',1200.00,4),
(11,'002',NULL,'WHITE','M',1300.00,4),
(12,'001',NULL,'BROWN','S',1200.00,4),
(13,'001','Jubba','green','M',1200.00,4)
ON CONFLICT DO NOTHING;

INSERT INTO public.invoices (id, invoice_no, type, party_id, issue_date, due_date, subtotal, discount, tax, total, paid, status, notes, shipment_type, advance, freight_charges, amount_paid, remaining) VALUES
(10,'010','Sale',4,'2026-09-01','2026-10-02',440000.00,0,0,340000.00,0,'Pending','','Air',150000.00,50000.00,0.00,340000.00),
(14,'012','Sale',4,'2026-06-09','2026-07-10',195000.00,0,0,200000.00,0,'Pending','','Air',20000.00,25000.00,0.00,200000.00),
(13,'011','Sale',4,'2026-06-03','2026-08-03',1850000.00,0,0,1050000.00,0,'Partial','','Air',900000.00,100000.00,100000.00,950000.00)
ON CONFLICT DO NOTHING;

INSERT INTO public.invoice_items (id, invoice_id, description, quantity, unit_price) VALUES
(18,10,'001 | Color: BROWN | Size: S',150.00,1200.00),
(19,10,'002 | Color: WHITE | Size: M',200.00,1300.00),
(20,13,'001 | Color: BROWN | Size: S',400.00,1200.00),
(21,13,'002 | Color: WHITE | Size: M',500.00,1300.00),
(22,13,'001 | Color: BLACK | Size: SMALL',600.00,1200.00),
(23,14,'002 | Color: WHITE | Size: M',150.00,1300.00)
ON CONFLICT DO NOTHING;

INSERT INTO public.payrolls (id, employee_id, month, basic_salary, bonus, overtime, deductions, status) VALUES
(2,1,'May 2026',60000.00,10000.00,0.00,0.00,'Pending'),
(3,3,'May 2026',6000.00,0.00,0.00,0.00,'Pending')
ON CONFLICT DO NOTHING;

INSERT INTO public.users (id, username, password, role) VALUES
(1,'admin','$2b$10$opZtBu/.u9FmD.pOECYGQuw8a7FIKIiZiRIBbIts5I.kz97JP9RF.','admin')
ON CONFLICT DO NOTHING;

INSERT INTO public.party_accounts (id, party_id, account_name, bank_name, account_no) VALUES
(1,4,'Hassan Riaz','HBL','12157901223603')
ON CONFLICT DO NOTHING;

INSERT INTO public.party_payments (id, party_id, account_id, account_name, amount, date) VALUES
(8,4,1,'Hassan Riaz — HBL',100000.00,'2026-09-18')
ON CONFLICT DO NOTHING;

-- Update sequences
SELECT setval('public.accessories_id_seq', 13);
SELECT setval('public.categories_id_seq', 10);
SELECT setval('public.employees_id_seq', 3);
SELECT setval('public.invoice_items_id_seq', 23);
SELECT setval('public.invoices_id_seq', 14);
SELECT setval('public.items_id_seq', 13);
SELECT setval('public.parties_id_seq', 7);
SELECT setval('public.party_accounts_id_seq', 1);
SELECT setval('public.party_payments_id_seq', 8);
SELECT setval('public.payrolls_id_seq', 3);
SELECT setval('public.users_id_seq', 1);