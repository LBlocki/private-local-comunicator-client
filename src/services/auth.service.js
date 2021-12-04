import axios from 'axios';

class AuthService {

    register(registrationData) {
        return axios.post('http://localhost:8080/api/rest/v1/auth/register', {
            username: registrationData.username,
            wrappedPrivateKey: registrationData.wrappedPrivateKey,
            exportedPublicKey: registrationData.exportedPublicKey,
            wrappedSymmetricKey: registrationData.wrappedSymmetricKey,
            ivForPrivateKey: registrationData.ivForPrivateKey,
            ivForSymmetricKey: registrationData.ivForSymmetricKey
        });
    }

    getIvForWrappedSymmetricKey(username) {
        return axios.get(`http://localhost:8080/api/rest/v1/auth/login/iv/${username}`);
    }
}

export default new AuthService();
