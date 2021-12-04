class CryptoService {

    async deriveSymmetricCryptoKey(input, salt) {
        const encoder = new TextEncoder();
        return window.crypto.subtle.importKey(
            "raw",
            encoder.encode(input),
            {name: "PBKDF2"},
            false,
            ["deriveBits", "deriveKey"]
        ).then(keyMaterial => {
            return window.crypto.subtle.deriveKey(
                {
                    "name": "PBKDF2",
                    "salt": encoder.encode(salt),
                    "iterations": 20000,
                    "hash": "SHA-256"
                },
                keyMaterial,
                {"name": "AES-GCM", "length": 256},
                true,
                ["wrapKey", "unwrapKey"]);
        });
    }

    async digest(data) {
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(data);
        return window.crypto.subtle.digest('SHA-256', encodedData);
    }

    async generateKeyPair() {
        return window.crypto.subtle.generateKey({
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: {name: "SHA-256"},
            },
            true,
            ["encrypt", "decrypt"]);
    }

    async exportKey(key, format) {
        return window.crypto.subtle.exportKey(format, key);
    }

    async importKey(key, format, usage) {
        return window.crypto.subtle.importKey(
            format,
            key,
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
                publicExponent: new Uint8Array([1, 0, 1])
            },
            false,
            [usage]
        );
    }

    async wrapKey(keyToWrap, wrappingKey, format) {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const wrappedKey = await window.crypto.subtle.wrapKey(
            format,
            keyToWrap,
            wrappingKey,
            {"name": "AES-GCM", "iv": iv}
        );
        return {key: wrappedKey, iv: iv};
    }

    async wrapKeyUsingPredefinedIV(keyToWrap, wrappingKey, format, iv) {
        const wrappedKey = await window.crypto.subtle.wrapKey(
            format,
            keyToWrap,
            wrappingKey,
            {"name": "AES-GCM", "iv": iv}
        );
        return {key: wrappedKey, iv: iv};
    }

    async unwrapKey(keyToUnwrap, wrappingKey, format, iv) {
        return window.crypto.subtle.unwrapKey(
            format,
            keyToUnwrap,
            wrappingKey,
            {"name": "AES-GCM", "iv": iv},
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
                publicExponent: new Uint8Array([1, 0, 1])
            },
            true,
            ["decrypt"]
        );
    }

    async convertKeyToBase64(key) {
        return btoa(String.fromCharCode(...new Uint8Array(key)));
    }

    async convertBase64ToKey(text) {
        const rawString = atob(text);
        const array = new Uint8Array(rawString.length);

        for (let i = 0; i < rawString.length; i++) {
            array[i] = rawString.charCodeAt(i);
        }
        return array;
    }
}

export default new CryptoService();
