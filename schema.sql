-- Windows Estimate Pro Database Schema
-- Run this in Railway PostgreSQL to create tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  company_address TEXT,
  company_phone VARCHAR(50),
  company_email VARCHAR(255),
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  unit VARCHAR(50) DEFAULT 'ea',
  unit_price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Estimates table
CREATE TABLE IF NOT EXISTS estimates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  estimate_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  job_status VARCHAR(50) DEFAULT 'quote',
  job_address TEXT,
  job_city VARCHAR(100),
  job_state VARCHAR(50),
  job_zip VARCHAR(20),
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2),
  tax_amount DECIMAL(10, 2),
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  valid_until TIMESTAMP WITH TIME ZONE,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  paid_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Estimate Line Items table
CREATE TABLE IF NOT EXISTS estimate_line_items (
  id SERIAL PRIMARY KEY,
  estimate_id INTEGER NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'ea',
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_user_id ON estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_customer_id ON estimates(customer_id);
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_estimate_id ON estimate_line_items(estimate_id);
