import AuthService from '../services/auth.service';
import axios from "axios";

export const auth = {
    namespaced: true,
    state: {
        authenticationToken: localStorage.getItem('authenticationToken')
    },
    actions: {
        login({commit}, user) {
            return AuthService.login(user).then(
                response => {
                    commit('loginSuccess', response.data.authenticationToken);
                    axios.defaults.headers.common['Authorization'] = response.data.authenticationToken;
                    localStorage.setItem('authenticationToken', JSON.stringify(response.data.authenticationToken));
                    return Promise.resolve(response);
                },
                error => {
                    commit('loginFailure');
                    localStorage.removeItem('authenticationToken');
                    return Promise.reject(error);
                }
            );
        },
        logout({commit}) {
            return new Promise(() => {
                commit('logout');
                localStorage.removeItem('authenticationToken');
                delete axios.defaults.headers.common['Authorization'];
                return Promise.resolve();
            })
        },
        register({commit}, user) {
            return AuthService.register(user).then(
                () => {
                    commit('registerSuccess');
                    return Promise.resolve();
                },
                error => {
                    commit('registerFailure');
                    return Promise.reject(error);
                }
            );
        }
    },
    mutations: {
        loginSuccess(state, authenticationToken) {
            state.authenticationToken = authenticationToken;
        },
        loginFailure(state) {
            state.authenticationToken = '';
        },
        logout(state) {
            state.authenticationToken = '';
        },
        registerSuccess(state) {
            state.authenticationToken = '';
        },
        registerFailure(state) {
            state.authenticationToken = '';
        }
    },
    getters : {
        isLoggedIn: state => !!state.authenticationToken,
    }
};
