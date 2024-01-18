update invoices
set expired_at = 0
where id = $1;