declare function getSecrets(): Promise<any>;
declare function decryptDataFiles(): Promise<{
    [key: string]: string;
}>;
declare function getSSLKeys(): Promise<{
    key: string;
    cert: string;
}>;
declare const _default: {
    decryptDataFiles: typeof decryptDataFiles;
    getSecrets: typeof getSecrets;
    getSSLKeys: typeof getSSLKeys;
};
export default _default;
//# sourceMappingURL=sops.d.ts.map