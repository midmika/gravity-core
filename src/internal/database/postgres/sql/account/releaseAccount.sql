update accounts
set invoice_id = null
where invoice_id = $1;