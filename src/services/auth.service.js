import api from './api.rest.service'

class AuthService {

    register(user) {
        return api.post('auth/register', {
            username: user.username,
            password: user.password
        });
    }

    login(user) {
        return api.post('auth/login', {
                username: user.username,
                password: user.password
            });
    }
}

export default new AuthService();
