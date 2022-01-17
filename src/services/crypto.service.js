class CryptoService {

    async prepareFetchedKeysForStorageAfterLogin(messageBody, symmetricKey) {
        const wrappedBinaryPrivateKey = await this.convertBase64ToArrayBuffer(messageBody.wrappedPrivateKey);
        const binaryIvForPrivateKey = await this.convertBase64ToArrayBuffer(messageBody.ivForPrivateKey);
        const privateKey = await this.unwrapKey(wrappedBinaryPrivateKey, symmetricKey,
            "pkcs8", binaryIvForPrivateKey);
        const rawPrivateKey = await this.exportKey(privateKey, "pkcs8");

        const encodedPrivateKey = await this.convertToBase64(rawPrivateKey);
        const encodedPublicKey = messageBody.exportedPublicKey;

        return {encodedPrivateKey, encodedPublicKey}
    }

    async encryptWithBase64PublicKeyAndConvertToBase64(plainText, base64PublicKey) {
        const encoder = new TextEncoder();
        const arrayBufferPublicKey = await this.convertBase64ToArrayBuffer(base64PublicKey);
        const publicKey = await this.importKey(arrayBufferPublicKey, "spki", "encrypt");
        const encryptedMessage = await window.crypto.subtle.encrypt({"name": "RSA-OAEP"},
            publicKey, encoder.encode(plainText));
        return await this.convertToBase64(encryptedMessage);
    }

    async decryptBase64TextUsingBase64PrivateKey(base64Text, base64PrivateKey) {
        const arrayBufferPrivateKey = await this.convertBase64ToArrayBuffer(base64PrivateKey);
        const privateKey = await this.importKey(arrayBufferPrivateKey, "pkcs8", "decrypt");
        const arrayBufferData = await this.convertBase64ToArrayBuffer(base64Text);
        const decryptedArray = await window.crypto.subtle.decrypt({"name": "RSA-OAEP"},
            privateKey, arrayBufferData);

        return new TextDecoder().decode(decryptedArray);
    }

    async generateKeysForRegistrationPhase(username, password) {

        //generacja pary RSA
        const cryptoKeyPair = await this.generateKeyPair();

        //generacja klucza symetrycznego:
        const symmetricCryptoKey = await this.deriveSymmetricCryptoKey(password, username);

        //generacja klucza wrappującego do hashu klucza symetrycznego
        const newSalt = await this.digest(username);
        const wrappingSymmetricCryptoKey = await this.deriveSymmetricCryptoKey(password, newSalt);

        //Wrappowanie klucza prywatnego
        const wrappedPrivateKey = await this.wrapKey(cryptoKeyPair.privateKey, symmetricCryptoKey, "pkcs8");

        //wrappowanie klucza symetrycznego
        const wrappedSymmetricKey = await this.wrapKey(symmetricCryptoKey, wrappingSymmetricCryptoKey, "raw");

        //export klucza publicznego
        const exportedPublicKey = await this.exportKey(cryptoKeyPair.publicKey, "spki");

        return {
            username: username,
            wrappedPrivateKey: await this.convertToBase64(wrappedPrivateKey.key),
            exportedPublicKey: await this.convertToBase64(exportedPublicKey),
            wrappedSymmetricKey: await this.convertToBase64(wrappedSymmetricKey.key),
            ivForPrivateKey: await this.convertToBase64(wrappedPrivateKey.iv),
            ivForSymmetricKey: await this.convertToBase64(wrappedSymmetricKey.iv)
        }

    }

    async generateKeysForLoginPhase(username, password, iv) {
        const symmetricCryptoKey = await this.deriveSymmetricCryptoKey(password, username);
        const newSalt = await this.digest(username);
        const arrayBufferIv = await this.convertBase64ToArrayBuffer(iv);
        const wrappingSymmetricCryptoKey = await this.deriveSymmetricCryptoKey(password, newSalt);
        const wrappedSymmetricKey = await this.wrapKeyUsingPredefinedIV(symmetricCryptoKey,
            wrappingSymmetricCryptoKey, "raw", arrayBufferIv);

        return {
            username: username,
            password: await this.convertToBase64(wrappedSymmetricKey.key),
            symmetricKey: symmetricCryptoKey
        }
    }

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

    async convertToBase64(arrayBuffer) {
        return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    }

    async convertBase64ToArrayBuffer(base64Data) {
        const rawString = atob(base64Data);
        const array = new Uint8Array(rawString.length);

        for (let i = 0; i < rawString.length; i++) {
            array[i] = rawString.charCodeAt(i);
        }
        return array;
    }
}

export default new CryptoService();
