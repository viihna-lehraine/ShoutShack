import { HelmetOptions } from "helmet";
export declare const contentSecurityPolicyOptions: {
    directives: {
        connectSrc: string[];
        defaultSrc: string[];
        fontSrc: string[];
        frameAncestors: string[];
        imgSrc: string[];
        objectSrc: string[];
        scriptSrc: string[];
        styleSrc: string[];
        upgradeInsecureRequests: never[];
    };
    reportOnly: boolean;
};
export declare const helmetOptions: HelmetOptions;
export declare const permissionsPolicyOptions: {
    accelerometer: string[];
    ambientLightSensor: string[];
    autoplay: string[];
    camera: string[];
    documentDomain: string[];
    documentWrite: string[];
    fonts: string[];
    fullscreen: string[];
    geolocation: string[];
    gyroscope: string[];
    magnetometer: string[];
    microphone: string[];
    midi: string[];
    modals: string[];
    notifications: string[];
    payment: string[];
    push: string[];
    syncXhr: string[];
    vr: string[];
};
//# sourceMappingURL=securityOptions.d.ts.map