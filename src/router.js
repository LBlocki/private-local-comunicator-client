import {createRouter, createWebHistory} from "vue-router";
import Login from "./components/Login.vue";
import Register from "./components/Register.vue";
import Chat from "./components/Chat";
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
        path: "/chat",
        component: Chat,
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

    const isConnected = store.getters['ws/isConnected'];
    const hasCredentials = store.getters['ws/username'] && store.getters['ws/password'];

    if(!to.matched.some(record => record.meta.requiresAuth) && (isConnected || hasCredentials)) {
        next({
            path: '/chat'
        })
    } else if(to.matched.some(record => record.meta.requiresAuth) && !hasCredentials) {
        next({
            path: '/login'
        })
    } else {
        next();
    }

});

export default router;
