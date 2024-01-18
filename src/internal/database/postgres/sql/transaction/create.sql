insert into transactions(invoice_id, address, network, hash, value, status)
values ($1, $2, $3, $4, $5, $6)
returning id;