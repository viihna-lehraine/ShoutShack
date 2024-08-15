import yub from 'yub';
import getSecrets from '../../config/secrets.js';

const secrets = await getSecrets();
let yubClient;

(async () => {
	yubClient = yub.init(secrets.YUBICO_CLIENT_ID, secrets.YUBICO_SECRET_KEY);
})();

// for validating a Yubico OTP
async function validateYubicoOTP(otp) {
	return new Promise((resolve, reject) => {
		yubClient.verify(otp, (err, data) => {
			if (err) {
				return reject(err);
			}

			if (data && data.status === 'OK') {
				resolve(true);
			} else {
				resolve(false);
			}
		});
	});
}

// generatesd OTP configruation options
function generateYubicoOtpOptions() {
	return {
		clientId: secrets.YUBICO_CLIENT_ID,
		apiKey: secrets.YUBICO_SECRET_KEY,
		apiUrl: secrets.YUBICO_API_URL,
	};
}

export { generateYubicoOtpOptions, validateYubicoOTP };
