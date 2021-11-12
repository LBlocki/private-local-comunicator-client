import {createRouter, createWebHistory} from "vue-router";
import Login from "./components/Login.vue";
import Register from "./components/Register.vue";
import Home from "./components/Home";
import store from "./store/index"

const routes = [
    {
        path: "/login",
        component: Login,
        meta: {
            requiresAuth: false
        },
    },
    {
        path: "/register",
        component: Register,
        meta: {
            requiresAuth: false
        },
    },
    {
        path: "/home",
        component: Home,
        meta: {
            requiresAuth: true
        },
    },
    {
        path: "/",
        redirect: "/login"
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const loggedIn = store.getters['auth/isLoggedIn'];
    console.log(to.matched.some(record => !record.meta.requiresAuth));
    console.log(loggedIn);
    if (to.matched.some(record => record.meta.requiresAuth) && !loggedIn) {
        next({
            path: '/login'
        });
    } else if (to.matched.some(record => !record.meta.requiresAuth) && loggedIn) {
        next({
            path: '/home'
        });
    }
    next();

});

export default router;
