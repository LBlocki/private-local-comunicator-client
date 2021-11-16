import SockJS from "sockjs-client";
import Stomp from "webstomp-client";
const util = require('util');

export const ws = {
    namespaced: true,
    state: {
        isConnected: false,
        rooms: [],
        roomMessages: []
    },
    actions: {
        initializeConnection({commit}, user) {
            return new Promise((resolve, reject) => {
                this.socket = new SockJS("http://localhost:8080/api/rest/v1/ws");
                this.stompClient = Stomp.over(this.socket);
                this.stompClient.connect({username: user.username, password: user.password},
                    () => {
                        this.stompClient.subscribe("/app/chat.private.fetch.rooms", message => {
                            const rooms = JSON.parse(message.body);
                            commit('setConnected', {user, rooms});
                            resolve();
                        });
                    },
                    (error) => {
                        commit('setDisconnected');
                        reject(error);
                    }
                );
            })
        },
        fetchMessagesForRoom({commit}, roomId) {
            return new Promise((resolve) => {
                this.stompClient.subscribe("/app/chat.private.fetch.messages.for." + roomId, message => {
                    commit('setRoomsMessages', JSON.parse(message.body));
                    resolve();
                });
            })
        },
        disconnect({commit}) {
            return new Promise((resolve) => {
                this.stompClient.disconnect(() => {
                    commit('setDisconnected');
                    resolve()
                });
            })
        }
    },
    getters: {
        username: () => sessionStorage.getItem("username"),
        password: () => sessionStorage.getItem("password"),
        isConnected: state => !!state.isConnected,
        rooms: state => state.rooms,
        roomMessages: state => state.roomMessages
    },
    mutations: {
        setConnected(state, {user, rooms}) {
            state.isConnected = true;
            console.log(rooms);
            state.rooms = rooms;
            sessionStorage.setItem("username", user.username);
            sessionStorage.setItem("password", user.password);
        },
        setRoomsMessages(state, messages) {
          state.roomMessages = messages;
        },
        setDisconnected(state) {
            state.isConnected = false;
            state.rooms = [];
            state.roomMessages = [];
            sessionStorage.removeItem("username");
            sessionStorage.removeItem("password");
        },
    },
};
