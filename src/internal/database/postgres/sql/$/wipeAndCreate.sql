drop table if exists accounts cascade;
drop table if exists invoices cascade;
drop table if exists invoices_credentials cascade;
drop table if exists invoice_logs cascade;
drop table if exists transactions cascade;
drop table if exists transaction_logs cascade;
drop table if exists networks cascade;

create table accounts(
    id serial primary key,
    invoice_id text
);

create table invoices(
    id text unique primary key,
    account_id int not null references accounts(id),
    payer_id text not null,
    value float not null,
    status text not null,
    created_at bigint default (extract(epoch from now()) * 1000),
    expired_at bigint default (extract(epoch from now()) * 1000 + 216000000) -- + 1hour
);

create table invoices_credentials(
    invoice_id text references invoices(id),
    address text not null,
    network text not null
);

create table invoice_logs(
    id serial primary key,
    invoice_id text references invoices(id),
    type text not null,
    json json,
    timestamp bigint default (extract(epoch from now()) * 1000)
);

create table transactions(
    id text unique primary key default gen_random_uuid(),
    invoice_id text not null references invoices(id),
    address text not null,
    network text not null,
    hash text not null,
    value text not null,
    status text not null,
    created_at bigint default (extract(epoch from now()) * 1000)
);

create table transaction_logs(
    id serial primary key,
    transaction_id text references transactions(id),
    type text not null,
    json json,
    timestamp bigint default (extract(epoch from now()) * 1000)
);

create table networks(
    name text unique not null primary key,
    type text not null,
    is_active bool not null default false,
    endpoint text not null,
    contract_address text not null,
    confirmation_count integer not null
);