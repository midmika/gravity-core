update accounts
set invoice_id = $1
where id in (
    select id
    from accounts
    where invoice_id is null
    limit 1
)
returning id;