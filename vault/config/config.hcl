storage "file" {
  path					= "/vault/data"
}

listener "tcp" {
  address				= "127.0.0.1:8200"
  cluster_address		= "127.0.0.1:8201"
  tls_disable			= "0"
  tls_cert_file			= "/vault/tls/vault.crt"
  tls_key_file 			= "/vault/tls/vault.key"
  tls_client_ca_file	= "/vault/tls/rootCA.crt"
}

api_addr				= "https://127.0.0.1:8200"

disable_mlock			= true
ui						= true
