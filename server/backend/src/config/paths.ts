import path from 'path';

const BASE_DIR = path.resolve();

export const pathConfig = {
	IP_BLACKLIST_FILE_PATH: path.join(
		BASE_DIR,
		'../../data/ip-lists/projectIpBlacklist.json.gpg'
	),
	MALICIOUS_IPS_LIST_FILE_PATH: path.join(
		BASE_DIR,
		'../../data/ip-lists/maliciousIps.json.gpg'
	),
	MULTER_STORAGE_DIR: path.join(BASE_DIR, '../../client/storage/'),
	MULTER_UPLOAD_DIR: path.join(BASE_DIR, '../../client/uploads/'),
	RP_ICON: path.join(BASE_DIR, 'PATH/TO/ICON.png'),
	SECRETS_FILE_PATH_1: path.join(
		BASE_DIR,
		'../../data/ip-lists/vpnIpLists.json.gpg'
	),
	STATIC_ROOT_PATH: path.join(BASE_DIR, '../../../public/'),
	TEMP_DIR: path.join(BASE_DIR, '../../data/temp/'),
	TLS_KEY_PATH_1: path.join(
		BASE_DIR,
		'../../config/tls/guestbook_key_1.pem.gpg'
	),
	TLS_CERT_PATH_1: path.join(
		BASE_DIR,
		'../../config/tls/guestbook_cert_1.pem.gpg'
	),
	TOKEN_EXPIRY_LIST_PATH: path.join(
		BASE_DIR,
		'../../data/lists/token-expiry-list.json'
	),
	TOKEN_REVOKED_LIST_PATH: path.join(
		BASE_DIR,
		'../../data/lists/token-revocation-list.json'
	),
	TOR_EXIT_RELAYS_FILE_PATH: path.join(
		BASE_DIR,
		'../../data/ip-lists/torExitRelays.json.gpg'
	),
	VPN_IP_RANGE_LIST_FILE_PATH: path.join(
		BASE_DIR,
		'../../data/ip-lists/vpnIpLists.json.gpg'
	)
};

export const urlConfig = {
	BASE_URL: 'https://localhost:',
	RP_ID: 'https://localhost:3000',
	RP_ORIGIN: 'https://localhost:3000',
	YUBICO_API_URL: 'https://api.yubico.com/wsapi/2.0/verify'
};
