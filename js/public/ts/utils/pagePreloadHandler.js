"use strict";
const linkElement = document.querySelector('link[rel="preload"]');
if (linkElement) {
    linkElement.onload = () => {
        linkElement.rel = 'stylesheet';
    };
}
