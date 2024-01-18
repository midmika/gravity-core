select id, payer_id, account_id, value, status, created_at::bigint, expired_at::bigint
from invoices
where id = $1;