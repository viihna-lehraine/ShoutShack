import { Fido2Lib } from 'fido2-lib';
import path from 'path';
import sops from '../../utils/sops';
import setupLogger from '../../config/logger';
import { execSync } from 'child_process';
let fido2 = null;
let secrets;
const logger = setupLogger();
function getDirectoryPath() {
	return path.resolve(process.cwd());
}
async function initializeFido2() {
	secrets = await sops.getSecrets({
		logger,
		execSync,
		getDirectoryPath
	});
	if (!secrets) {
		throw new Error('Secrets could not be loaded');
	}
	fido2 = new Fido2Lib({
		timeout: 60000,
		rpId: secrets.RP_ID,
		rpName: secrets.RP_NAME,
		challengeSize: secrets.FIDO_CHALLENGE_SIZE,
		cryptoParams: secrets.FIDO_CRYPTO_PARAMETERS,
		authenticatorRequireResidentKey:
			secrets.FIDO_AUTHENTICATOR_REQUIRE_RESIDENT_KEY,
		authenticatorUserVerification:
			secrets.FIDO_AUTHENTICATOR_USER_VERIFICATION
	});
}
async function ensureFido2Initialized() {
	if (!fido2) {
		await initializeFido2();
	}
}
async function generatePasskeyRegistrationOptions(user) {
	await ensureFido2Initialized();
	const passkeyRegistrationOptions = await fido2.attestationOptions();
	const registrationOptions = {
		...passkeyRegistrationOptions,
		user: {
			id: Buffer.from(user.id, 'utf-8'),
			name: user.email,
			displayName: user.username
		},
		pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
		timeout: 60000,
		attestation: 'direct',
		authenticatorSelection: {
			authenticatorAttachment: 'platform',
			requireResidentKey: true,
			userVerification: 'preferred'
		}
	};
	return registrationOptions;
}
async function verifyPasskeyRegistration(attestation, expectedChallenge) {
	await ensureFido2Initialized();
	secrets = await sops.getSecrets({
		logger,
		execSync,
		getDirectoryPath
	});
	const u2fAttestationExpectations = {
		challenge: expectedChallenge,
		origin: secrets.RP_ORIGIN,
		factor: 'either',
		rpId: secrets.RP_ID
	};
	const result = await fido2.attestationResult(
		attestation,
		u2fAttestationExpectations
	);
	return result;
}
async function generatePasskeyAuthenticationOptions(user) {
	await ensureFido2Initialized();
	const userCredentials = user.credential.map(credential => ({
		type: 'public-key',
		id: Buffer.from(credential.credentialId, 'base64').buffer
	}));
	const assertionOptions = await fido2.assertionOptions();
	const authenticationOptions = {
		...assertionOptions,
		allowCredentials: userCredentials,
		userVerification: 'required', // ensure this supports passwordless login
		timeout: 60000
	};
	return authenticationOptions;
}
async function verifyPasskeyAuthentication(
	assertion,
	expectedChallenge,
	publicKey,
	previousCounter,
	id
) {
	await ensureFido2Initialized();
	secrets = await sops.getSecrets({
		logger,
		execSync,
		getDirectoryPath
	});
	const assertionExpectations = {
		challenge: expectedChallenge,
		origin: secrets.RP_ORIGIN,
		factor: 'either',
		publicKey,
		prevCounter: previousCounter,
		userHandle: id
	};
	const result = await fido2.assertionResult(
		assertion,
		assertionExpectations
	);
	return result;
}
export default {
	generatePasskeyAuthenticationOptions,
	generatePasskeyRegistrationOptions,
	verifyPasskeyAuthentication,
	verifyPasskeyRegistration
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlkbzJVdGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL2F1dGgvZmlkbzJVdGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFHTixRQUFRLEVBUVIsTUFBTSxXQUFXLENBQUM7QUFDbkIsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sSUFBb0IsTUFBTSxrQkFBa0IsQ0FBQztBQUNwRCxPQUFPLFdBQVcsTUFBTSxxQkFBcUIsQ0FBQztBQUM5QyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRXpDLElBQUksS0FBSyxHQUFvQixJQUFJLENBQUM7QUFDbEMsSUFBSSxPQUFtQixDQUFDO0FBYXhCLE1BQU0sTUFBTSxHQUFHLFdBQVcsRUFBRSxDQUFDO0FBRTdCLFNBQVMsZ0JBQWdCO0lBQ3hCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBRUQsS0FBSyxVQUFVLGVBQWU7SUFDN0IsT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUMvQixNQUFNO1FBQ04sUUFBUTtRQUNSLGdCQUFnQjtLQUNoQixDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDZCxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUNELEtBQUssR0FBRyxJQUFJLFFBQVEsQ0FBQztRQUNwQixPQUFPLEVBQUUsS0FBSztRQUNkLElBQUksRUFBRSxPQUFPLENBQUMsS0FBSztRQUNuQixNQUFNLEVBQUUsT0FBTyxDQUFDLE9BQU87UUFDdkIsYUFBYSxFQUFFLE9BQU8sQ0FBQyxtQkFBbUI7UUFDMUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxzQkFBc0I7UUFDNUMsK0JBQStCLEVBQzlCLE9BQU8sQ0FBQyx1Q0FBdUM7UUFDaEQsNkJB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Q0FBQyxDQUFDO0lBRUgsTUFBTSxxQkFBcUIsR0FBNEI7UUFDdEQsU0FBUyxFQUFFLGlCQUFpQjtRQUM1QixNQUFNLEVBQUUsT0FBTyxDQUFDLFNBQW1CO1FBQ25DLE1BQU0sRUFBRSxRQUFrQjtRQUMxQixTQUFTO1FBQ1QsV0FBVyxFQUFFLGVBQWU7UUFDNUIsVUFBVSxFQUFFLEVBQUU7S0FDZCxDQUFDO0lBRUYsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLEtBQU0sQ0FBQyxlQUFlLENBQzNDLFNBQVMsRUFDVCxxQkFBcUIsQ0FDckIsQ0FBeUIsQ0FBQztJQUUzQixPQUFPLE1BQU0sQ0FBQztBQUNmLENBQUM7QUFFRCxlQUFlO0lBQ2Qsb0NBQW9DO0lBQ3BDLGtDQUFrQztJQUNsQywyQkFBMkI7SUFDM0IseUJBQXlCO0NBQ3pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHRFeHBlY3RlZEFzc2VydGlvblJlc3VsdCxcblx0RXhwZWN0ZWRBdHRlc3RhdGlvblJlc3VsdCxcblx0RmlkbzJMaWIsXG5cdFB1YmxpY0tleUNyZWRlbnRpYWxDcmVhdGlvbk9wdGlvbnMsXG5cdFB1YmxpY0tleUNyZWRlbnRpYWxEZXNjcmlwdG9yLFxuXHRQdWJsaWNLZXlDcmVkZW50aWFsUmVxdWVzdE9wdGlvbnMsXG5cdEZpZG8yQXR0ZXN0YXRpb25SZXN1bHQsXG5cdEZpZG8yQXNzZXJ0aW9uUmVzdWx0LFxuXHRBdHRlc3RhdGlvblJlc3VsdCxcblx0QXNzZXJ0aW9uUmVzdWx0XG59IGZyb20gJ2ZpZG8yLWxpYic7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBzb3BzLCB7IFNlY3JldHNNYXAgfSBmcm9tICcuLi8uLi91dGlscy9zb3BzJztcbmltcG9ydCBzZXR1cExvZ2dlciBmcm9tICcuLi8uLi9jb25maWcvbG9nZ2VyJztcbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5cbmxldCBmaWRvMjogRmlkbzJMaWIgfCBudWxsID0gbnVsbDtcbmxldCBzZWNyZXRzOiBTZWNyZXRzTWFwO1xuXG5pbnRlcmZhY2UgVXNlciB7XG5cdGlkOiBzdHJpbmc7XG5cdGVtYWlsOiBzdHJpbmc7XG5cdHVzZXJuYW1lOiBzdHJpbmc7XG5cdGNyZWRlbnRpYWw6IHtcblx0XHRjcmVkZW50aWFsSWQ6IHN0cmluZztcblx0fVtdO1xufVxuXG50eXBlIEZhY3RvciA9ICdmaXJzdCcgfCAnc2Vjb25kJyB8ICdlaXRoZXInO1xuXG5jb25zdCBsb2dnZXIgPSBzZXR1cExvZ2dlcigpO1xuXG5mdW5jdGlvbiBnZXREaXJlY3RvcnlQYXRoKCk6IHN0cmluZyB7XG5cdHJldHVybiBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRpYWxpemVGaWRvMigpOiBQcm9taXNlPHZvaWQ+IHtcblx0c2VjcmV0cyA9IGF3YWl0IHNvcHMuZ2V0U2VjcmV0cyh7XG5cdFx0bG9nZ2VyLFxuXHRcdGV4ZWNTeW5jLFxuXHRcdGdldERpcmVjdG9yeVBhdGhcblx0fSk7XG5cblx0aWYgKCFzZWNyZXRzKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdTZWNyZXRzIGNvdWxkIG5vdCBiZSBsb2FkZWQnKTtcblx0fVxuXHRmaWRvMiA9IG5ldyBGaWRvMkxpYih7XG5cdFx0dGltZW91dDogNjAwMDAsXG5cdFx0cnBJZDogc2VjcmV0cy5SUF9JRCxcblx0XHRycE5hbWU6IHNlY3JldHMuUlBfTkFNRSxcblx0XHRjaGFsbGVuZ2VTaXplOiBzZWNyZXRzLkZJRE9fQ0hBTExFTkdFX1NJWkUsXG5cdFx0Y3J5cHRvUGFyYW1zOiBzZWNyZXRzLkZJRE9fQ1JZUFRPX1BBUkFNRVRFUlMsXG5cdFx0YXV0aGVudGljYXRvclJlcXVpcmVSZXNpZGVudEtleTpcblx0XHRcdHNlY3JldHMuRklET19BVVRIRU5USUNBVE9SX1JFUVVJUkVfUkVTSURFTlRfS0VZLFxuXHRcdGF1dGhlbnRpY2F0b3JVc2VyVmVyaWZpY2F0aW9uOlxuXHRcdFx0c2VjcmV0cy5GSURPX0FVVEhFTlRJQ0FUT1JfVVNFUl9WRVJJRklDQVRJT05cblx0fSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUZpZG8ySW5pdGlhbGl6ZWQoKTogUHJvbWlzZTx2b2lkPiB7XG5cdGlmICghZmlkbzIpIHtcblx0XHRhd2FpdCBpbml0aWFsaXplRmlkbzIoKTtcblx0fVxufVxuXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVBhc3NrZXlSZWdpc3RyYXRpb25PcHRpb25zKFxuXHR1c2VyOiBVc2VyXG4pOiBQcm9taXNlPFB1YmxpY0tleUNyZWRlbnRpYWxDcmVhdGlvbk9wdGlvbnM+IHtcblx0YXdhaXQgZW5zdXJlRmlkbzJJbml0aWFsaXplZCgpO1xuXHRjb25zdCBwYXNza2V5UmVnaXN0cmF0aW9uT3B0aW9ucyA9IGF3YWl0IGZpZG8yIS5hdHRlc3RhdGlvbk9wdGlvbnMoKTtcblxuXHRjb25zdCByZWdpc3RyYXRpb25PcHRpb25zOiBQdWJsaWNLZXlDcmVkZW50aWFsQ3JlYXRpb25PcHRpb25zID0ge1xuXHRcdC4uLnBhc3NrZXlSZWdpc3RyYXRpb25PcHRpb25zLFxuXHRcdHVzZXI6IHtcblx0XHRcdGlkOiBCdWZmZXIuZnJvbSh1c2VyLmlkLCAndXRmLTgnKSxcblx0XHRcdG5hbWU6IHVzZXIuZW1haWwsXG5cdFx0XHRkaXNwbGF5TmFtZTogdXNlci51c2VybmFtZVxuXHRcdH0sXG5cdFx0cHViS2V5Q3JlZFBhcmFtczogW3sgdHlwZTogJ3B1YmxpYy1rZXknLCBhbGc6IC03IH1dLFxuXHRcdHRpbWVvdXQ6IDYwMDAwLFxuXHRcdGF0dGVzdGF0aW9uOiAnZGlyZWN0Jyxcblx0XHRhdXRoZW50aWNhdG9yU2VsZWN0aW9uOiB7XG5cdFx0XHRhdXRoZW50aWNhdG9yQXR0YWNobWVudDogJ3BsYXRmb3JtJyxcblx0XHRcdHJlcXVpcmVSZXNpZGVudEtleTogdHJ1ZSxcblx0XHRcdHVzZXJWZXJpZmljYXRpb246ICdwcmVmZXJyZWQnXG5cdFx0fVxuXHR9O1xuXHRyZXR1cm4gcmVnaXN0cmF0aW9uT3B0aW9ucztcbn1cblxuYXN5bmMgZnVuY3Rpb24gdmVyaWZ5UGFzc2tleVJlZ2lzdHJhdGlvbihcblx0YXR0ZXN0YXRpb246IEF0dGVzdGF0aW9uUmVzdWx0LFxuXHRleHBlY3RlZENoYWxsZW5nZTogc3RyaW5nXG4pOiBQcm9taXNlPEZpZG8yQXR0ZXN0YXRpb25SZXN1bHQ+IHtcblx0YXdhaXQgZW5zdXJlRmlkbzJJbml0aWFsaXplZCgpO1xuXHRzZWNyZXRzID0gYXdhaXQgc29wcy5nZXRTZWNyZXRzKHtcblx0XHRsb2dnZXIsXG5cdFx0ZXhlY1N5bmMsXG5cdFx0Z2V0RGlyZWN0b3J5UGF0aFxuXHR9KTtcblx0Y29uc3QgdTJmQXR0ZXN0YXRpb25FeHBlY3RhdGlvbnM6IEV4cGVjdGVkQXR0ZXN0YXRpb25SZXN1bHQgPSB7XG5cdFx0Y2hhbGxlbmdlOiBleHBlY3RlZENoYWxsZW5nZSxcblx0XHRvcmlnaW46IHNlY3JldHMuUlBfT1JJR0lOIGFzIHN0cmluZyxcblx0XHRmYWN0b3I6ICdlaXRoZXInIGFzIEZhY3Rvcixcblx0XHRycElkOiBzZWNyZXRzLlJQX0lEXG5cdH07XG5cblx0Y29uc3QgcmVzdWx0ID0gKGF3YWl0IGZpZG8yIS5hdHRlc3RhdGlvblJlc3VsdChcblx0XHRhdHRlc3RhdGlvbixcblx0XHR1MmZBdHRlc3RhdGlvbkV4cGVjdGF0aW9uc1xuXHQpKSBhcyBGaWRvMkF0dGVzdGF0aW9uUmVzdWx0O1xuXG5cdHJldHVybiByZXN1bHQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlUGFzc2tleUF1dGhlbnRpY2F0aW9uT3B0aW9ucyhcblx0dXNlcjogVXNlclxuKTogUHJvbWlzZTxQdWJsaWNLZXlDcmVkZW50aWFsUmVxdWVzdE9wdGlvbnM+IHtcblx0YXdhaXQgZW5zdXJlRmlkbzJJbml0aWFsaXplZCgpO1xuXG5cdGNvbnN0IHVzZXJDcmVkZW50aWFsczogUHVibGljS2V5Q3JlZGVudGlhbERlc2NyaXB0b3JbXSA9XG5cdFx0dXNlci5jcmVkZW50aWFsLm1hcChjcmVkZW50aWFsID0+ICh7XG5cdFx0XHR0eXBlOiAncHVibGljLWtleScgYXMgY29uc3QsXG5cdFx0XHRpZDogQnVmZmVyLmZyb20oY3JlZGVudGlhbC5jcmVkZW50aWFsSWQsICdiYXNlNjQnKS5idWZmZXJcblx0XHR9KSk7XG5cblx0Y29uc3QgYXNzZXJ0aW9uT3B0aW9ucyA9IGF3YWl0IGZpZG8yIS5hc3NlcnRpb25PcHRpb25zKCk7XG5cblx0Y29uc3QgYXV0aGVudGljYXRpb25PcHRpb25zOiBQdWJsaWNLZXlDcmVkZW50aWFsUmVxdWVzdE9wdGlvbnMgPSB7XG5cdFx0Li4uYXNzZXJ0aW9uT3B0aW9ucyxcblx0XHRhbGxvd0NyZWRlbnRpYWxzOiB1c2VyQ3JlZGVudGlhbHMsXG5cdFx0dXNlclZlcmlmaWNhdGlvbjogJ3JlcXVpcmVkJywgLy8gZW5zdXJlIHRoaXMgc3VwcG9ydHMgcGFzc3dvcmRsZXNzIGxvZ2luXG5cdFx0dGltZW91dDogNjAwMDBcblx0fTtcblxuXHRyZXR1cm4gYXV0aGVudGljYXRpb25PcHRpb25zO1xufVxuXG5hc3luYyBmdW5jdGlvbiB2ZXJpZnlQYXNza2V5QXV0aGVudGljYXRpb24oXG5cdGFzc2VydGlvbjogQXNzZXJ0aW9uUmVzdWx0LFxuXHRleHBlY3RlZENoYWxsZW5nZTogc3RyaW5nLFxuXHRwdWJsaWNLZXk6IHN0cmluZyxcblx0cHJldmlvdXNDb3VudGVyOiBudW1iZXIsXG5cdGlkOiBzdHJpbmdcbik6IFByb21pc2U8RmlkbzJBc3NlcnRpb25SZXN1bHQ+IHtcblx0YXdhaXQgZW5zdXJlRmlkbzJJbml0aWFsaXplZCgpO1xuXHRzZWNyZXRzID0gYXdhaXQgc29wcy5nZXRTZWNyZXRzKHtcblx0XHRsb2dnZXIsXG5cdFx0ZXhlY1N5bmMsXG5cdFx0Z2V0RGlyZWN0b3J5UGF0aFxuXHR9KTtcblxuXHRjb25zdCBhc3NlcnRpb25FeHBlY3RhdGlvbnM6IEV4cGVjdGVkQXNzZXJ0aW9uUmVzdWx0ID0ge1xuXHRcdGNoYWxsZW5nZTogZXhwZWN0ZWRDaGFsbGVuZ2UsXG5cdFx0b3JpZ2luOiBzZWNyZXRzLlJQX09SSUdJTiBhcyBzdHJpbmcsXG5cdFx0ZmFjdG9yOiAnZWl0aGVyJyBhcyBGYWN0b3IsXG5cdFx0cHVibGljS2V5LFxuXHRcdHByZXZDb3VudGVyOiBwcmV2aW91c0NvdW50ZXIsXG5cdFx0dXNlckhhbmRsZTogaWRcblx0fTtcblxuXHRjb25zdCByZXN1bHQgPSAoYXdhaXQgZmlkbzIhLmFzc2VydGlvblJlc3VsdChcblx0XHRhc3NlcnRpb24sXG5cdFx0YXNzZXJ0aW9uRXhwZWN0YXRpb25zXG5cdCkpIGFzIEZpZG8yQXNzZXJ0aW9uUmVzdWx0O1xuXG5cdHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcblx0Z2VuZXJhdGVQYXNza2V5QXV0aGVudGljYXRpb25PcHRpb25zLFxuXHRnZW5lcmF0ZVBhc3NrZXlSZWdpc3RyYXRpb25PcHRpb25zLFxuXHR2ZXJpZnlQYXNza2V5QXV0aGVudGljYXRpb24sXG5cdHZlcmlmeVBhc3NrZXlSZWdpc3RyYXRpb25cbn07XG4iXX0=