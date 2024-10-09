# pki-policy.hcl
path "pki/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo", "patch"]
}

path "pki/config/*" {
  capabilities = ["create", "read", "update"]
}

path "pki/root/*" {
  capabilities = ["create", "read", "update"]
}

path "pki_int/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

path "pki_int/intermediate/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "pki_int/roles/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "sys/mounts/*" {
  capabilities = [ "create", "read", "update", "delete", "list" ]
}

path "sys/mounts" {
  capabilities = [ "read", "list" ]
}

