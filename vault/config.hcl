# Backend storage configuration
storage "file" {
  path = "./data"
}

listener "tcp" {
	address			= "127.0.0.1:8200"
	tls_disable		= 0
	tls_cert_file	= "./tls/vault_tls.crt"
	tls_key_file	= "./tls/vault_tls.key"
}

# Enable API
api_addr = "https://127.0.0.1:8200"

# Enable UI
ui = true

# Enable audit logging (optional)
audit "file" {
	path = "./audit.log"
} 

# Cluster configuration
#cluster_addr = "https://127.0.0.1:8201"
