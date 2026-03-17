-- SQL Schema for RestoFlow
-- Run this in your Supabase SQL Editor

-- UNCOMMENT THE LINES BELOW IF YOU WANT TO COMPLETELY RESET YOUR DATABASE
-- WARNING: THIS WILL DELETE ALL YOUR DATA!
DROP TABLE IF EXISTS monthly_bills CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo TEXT,
  currency TEXT DEFAULT 'USD',
  vat_rate NUMERIC DEFAULT 0,
  include_vat BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'UTC',
  theme_color TEXT DEFAULT '#0f172a',
  expense_categories TEXT[] DEFAULT '{}',
  menu_categories TEXT[] DEFAULT '{}',
  customer_token_prefix TEXT DEFAULT 'T',
  next_customer_token INTEGER DEFAULT 1,
  customer_app_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  monthly_bill NUMERIC DEFAULT 0,
  billing_day INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  mobile TEXT,
  role TEXT NOT NULL,
  avatar TEXT,
  permissions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  unit TEXT NOT NULL,
  min_threshold NUMERIC DEFAULT 0,
  supplier TEXT,
  price_per_unit NUMERIC DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  token_number TEXT NOT NULL,
  table_number TEXT,
  items JSONB NOT NULL,
  status TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  note TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES orders(id),
  amount NUMERIC NOT NULL,
  type TEXT, -- 'Income' or 'Expense'
  payment_method TEXT,
  items_summary TEXT,
  creator_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date TEXT,
  note TEXT,
  recorded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Monthly Bills Table
CREATE TABLE IF NOT EXISTS monthly_bills (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_name TEXT,
  month TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INSERT DEFAULT DATA FOR MOCK LOGIN COMPATIBILITY
INSERT INTO tenants (id, name, currency, theme_color, expense_categories, menu_categories, vat_rate, include_vat, timezone)
VALUES ('t1', 'OmniDine Bistro', '৳', '#0f172a', '{"Inventory", "Maintenance", "Utilities", "Salaries", "Marketing", "Other"}', '{"Main", "Starter", "Beverage", "Dessert"}', 10, true, 'EST')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, tenant_id, name, email, password, role, permissions, mobile)
VALUES ('u1', 't1', 'Raj Patel', 'owner@bistro.com', 'password', 'OWNER', '{"Dashboard", "POS", "Kitchen", "Menu", "Billing", "Transactions", "Expenses", "Reports", "Inventory", "Users", "Settings"}', '5550101')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_bills ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (Allow all for now for simplicity, can be hardened later)
DROP POLICY IF EXISTS "Allow all access to tenants" ON tenants;
CREATE POLICY "Allow all access to tenants" ON tenants FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to users" ON users;
CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to menu_items" ON menu_items;
CREATE POLICY "Allow all access to menu_items" ON menu_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to inventory_items" ON inventory_items;
CREATE POLICY "Allow all access to inventory_items" ON inventory_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to orders" ON orders;
CREATE POLICY "Allow all access to orders" ON orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to transactions" ON transactions;
CREATE POLICY "Allow all access to transactions" ON transactions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to expenses" ON expenses;
CREATE POLICY "Allow all access to expenses" ON expenses FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to monthly_bills" ON monthly_bills;
CREATE POLICY "Allow all access to monthly_bills" ON monthly_bills FOR ALL USING (true);
