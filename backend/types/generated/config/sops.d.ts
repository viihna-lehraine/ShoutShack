declare function decryptDataFiles(): Promise<{
    [key: string]: string;
}>;
declare function getSSLKeys(): Promise<{
    key: string;
    cert: string;
}>;
declare const _default: {
    decryptDataFiles: typeof decryptDataFiles;
    getSSLKeys: typeof getSSLKeys;
};
export default _default;
//# sourceMappingURL=sops.d.ts.map