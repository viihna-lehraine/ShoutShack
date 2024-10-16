exit_after_auth			= false
pid__file				= "/var/run/vault-agent.pid"

auto_auth {
	method "token" {
		config = {
			token 		= "TOKEN"
		}
	}

	sink "file" {
		config = {
			path 		= "/PATH/TO/VAULT-TOKEN-FILE"
		}
	}
}

cache {
	use_auto_auth_token = true
}

listener "tcp" {
	address				= "127.0.0.1:8201"
	tls_disable			= false
}

vault {
	address				= "https://127.0.0.1:8200"
}
