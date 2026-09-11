create extension if not exists "uuid-ossp";

create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  business_number text unique,
  ceo_name text,
  address text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  business_number text unique,
  ceo_name text,
  address text,
  email text,
  phone text,
  manager_name text,
  manager_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type transaction_type as enum ('sale', 'purchase');
create type payment_status as enum ('unpaid', 'partial', 'paid', 'overdue', 'cancelled');
create type document_status as enum ('draft', 'issued', 'confirmed', 'cancelled');

create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete set null,
  type transaction_type not null,
  transaction_date date not null,
  title text not null,
  description text,
  supply_amount bigint not null default 0,
  vat_amount bigint not null default 0,
  total_amount bigint not null default 0,
  payment_status payment_status not null default 'unpaid',
  document_status document_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tax_invoices (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid references transactions(id) on delete cascade,
  approval_number text unique,
  issue_date date,
  supplier_name text,
  supplier_business_number text,
  buyer_name text,
  buyer_business_number text,
  supply_amount bigint not null default 0,
  vat_amount bigint not null default 0,
  total_amount bigint not null default 0,
  original_file_url text,
  extraction_confidence numeric(5,2),
  created_at timestamptz not null default now()
);

create type generated_document_type as enum ('quote', 'statement', 'contract', 'receipt', 'other');

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid references transactions(id) on delete cascade,
  type generated_document_type not null,
  title text not null,
  file_url text,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid references transactions(id) on delete cascade,
  payment_date date not null,
  amount bigint not null,
  method text,
  memo text,
  created_at timestamptz not null default now()
);

create index if not exists idx_clients_business_number on clients(business_number);
create index if not exists idx_transactions_client_id on transactions(client_id);
create index if not exists idx_transactions_date on transactions(transaction_date desc);
create index if not exists idx_tax_invoices_approval_number on tax_invoices(approval_number);
