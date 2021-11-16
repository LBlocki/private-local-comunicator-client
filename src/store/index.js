import {createStore} from "vuex";
import {ws} from "./ws.module";
import {auth} from "./auth.module";

const store = createStore({
    modules: {
        auth,
        ws
    },
});

export default store;
