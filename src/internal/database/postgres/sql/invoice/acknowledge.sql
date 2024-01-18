update invoices
set status = $3
where id = $1 and status = $2;