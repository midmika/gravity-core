select invoice_id
from invoices_credentials
where address = $1 and network = $2;