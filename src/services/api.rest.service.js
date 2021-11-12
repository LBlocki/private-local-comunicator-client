import axios from 'axios';

export default axios.create({
    baseURL: `http://localhost:8080/api/rest/v1/`,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
});

axios.interceptors.response.use(
    (response) => {
        if (response.status === 200 || response.status === 201) {
            return Promise.resolve(response);
        }
        return Promise.reject(response);
    },
    error => {
        if (error.status === 401 && this.$store.auth.getters.isLoggedIn()) {
            this.$store.dispatch('auth/logout').then(() =>
                this.$router.replace({
                    path: "/login",
                    query: {
                        redirect: this.$router.fullPath
                    }
                }));
        }
        return Promise.reject(error);
    });

