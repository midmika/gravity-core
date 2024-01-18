update invoices
set status = $2
where id = $1
returning id;