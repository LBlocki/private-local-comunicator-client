
import AuthService from '../services/auth.service';

export const auth = {
    namespaced: true,
    actions: {
        register({commit}, user) {
            return AuthService.register(user).then(
                () => {
                    return Promise.resolve();
                },
                error => {
                    return Promise.reject(error);
                }
            );
        },
        getIvForWrappedSymmetricKey({commit}, username) {
            return AuthService.getIvForWrappedSymmetricKey(username).then(
                iv => {
                    return Promise.resolve(iv);
                },
                error => {
                    return Promise.reject(error);
                }
            );
        }
    },
};
