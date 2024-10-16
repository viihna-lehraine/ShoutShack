# Read system health check
path "sys/health" {
  capabilities = ["read"]
}

# Allow the user to read secrets in the kv store at the "secret/" path
path "secret/data/*" {
  capabilities = ["read", "list"]
}

# Allow the user to write and update secrets at the "secret/" path
path "secret/data/*" {
  capabilities = ["create", "update"]
}

# Allow the user to lookup their own token details
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
