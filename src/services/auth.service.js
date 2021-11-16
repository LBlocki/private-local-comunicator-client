import axios from 'axios';

class AuthService {

    register(user) {
        return axios.post('http://localhost:8080/api/rest/v1/auth/register', {
            username: user.username,
            password: user.password
        });
    }
}

export default new AuthService();
