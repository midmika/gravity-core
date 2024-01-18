select name, type, endpoint, contract_address, confirmation_count, is_active
from networks
where is_active = $1;