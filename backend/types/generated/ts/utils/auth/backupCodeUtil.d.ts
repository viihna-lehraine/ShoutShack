interface BackupCode {
	code: string;
	used: boolean;
}
declare function generateBackupCodes(id: string): Promise<string[]>;
declare function verifyBackupCode(
	id: string,
	inputCode: string
): Promise<boolean>;
declare function saveBackupCodesToDatabase(
	id: string,
	backupCodes: BackupCode[]
): Promise<void>;
declare function getBackupCodesFromDatabase(
	id: string
): Promise<BackupCode[] | undefined>;
export {
	generateBackupCodes,
	getBackupCodesFromDatabase,
	saveBackupCodesToDatabase,
	verifyBackupCode
};
//# sourceMappingURL=backupCodeUtil.d.ts.map
