-- Supabase Schema for OmniDine

-- 1. Tenants (Businesses)
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  address TEXT,
  phone TEXT,
  currency TEXT DEFAULT '$',
  vat_rate NUMERIC DEFAULT 0,
  include_vat BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'UTC',
  theme_color TEXT DEFAULT '#0f172a',
  expense_categories TEXT[] DEFAULT '{"Inventory", "Utilities", "Salaries", "Other"}',
  menu_categories TEXT[] DEFAULT '{"Main", "Starter", "Beverage", "Dessert"}',
  customer_token_prefix TEXT DEFAULT 'ORD',
  next_customer_token INTEGER DEFAULT 1,
  customer_app_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  monthly_bill NUMERIC DEFAULT 500,
  billing_day INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  mobile TEXT,
  role TEXT NOT NULL,
  avatar TEXT,
  permissions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Menu Items
CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inventory Items
CREATE TABLE inventory_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  min_threshold NUMERIC NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Orders
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  token_number TEXT,
  table_number TEXT,
  items JSONB NOT NULL,
  status TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  note TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Transactions
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  order_id TEXT REFERENCES orders(id),
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Expenses
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Monthly Bills
CREATE TABLE monthly_bills (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  tenant_name TEXT NOT NULL,
  month TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Optional but recommended
-- For now, we'll keep it simple for the user to get started.
