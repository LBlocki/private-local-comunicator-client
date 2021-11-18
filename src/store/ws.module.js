import SockJS from "sockjs-client";
import Stomp from "webstomp-client";

export const ws = {
    namespaced: true,
    state: {
        isConnected: false,
        roomMessagesList: []
    },
    actions: {
        initializeConnection({commit}, user) {
            return new Promise((resolve, reject) => {
                this.socket = new SockJS("http://localhost:8080/api/rest/v1/ws");
                this.stompClient = Stomp.over(this.socket);
                this.stompClient.connect({username: user.username, password: user.password},
                    () => {
                        this.stompClient.subscribe("/app/chat.private.fetch.room.messages.list", message => {
                            const roomMessagesList = JSON.parse(message.body);
                            commit('setConnected', {user, roomMessagesList});
                            resolve();
                        });

                        this.stompClient.subscribe(("/user/exchange/chat.message"), message => {
                            const parsedMessage = JSON.parse(message.body);
                            commit('receiveMessage', parsedMessage);
                        });

                        this.stompClient.subscribe(("/user/exchange/chat.room"), message => {
                            const room = JSON.parse(message.body);
                            commit('receiveRoom', room);
                        });

                        this.stompClient.subscribe(("/user/exchange/chat.private.messages.read"), message => {
                            const roomId = JSON.parse(message.body);
                            commit('messagesRead', roomId);
                        })

                    },
                    (error) => {
                        commit('setDisconnected');
                        reject(error);
                    }
                );
            })
        },
        sendMessage({commit}, {message, recipient}) {
            const jsonMessage = JSON.stringify(message);
            return new Promise((resolve) => {
                this.stompClient.send("/app/chat.private." + recipient, jsonMessage);
                resolve();
            })
        },
        setMessagesAsRead({commit}, roomId) {
            return new Promise((resolve) => {
                this.stompClient.send("/app/chat.private.set.messages.read." + roomId);
                resolve();
            })
        },
        disconnect({commit}) {
            return new Promise((resolve) => {
                this.stompClient.disconnect(() => {
                    commit('setDisconnected');
                    resolve();
                });
            })
        },
        clearCredentials({commit}) {
            return new Promise((resolve) => {
                commit('setDisconnected');
                resolve();
            });
        }
    },
    getters: {
        username: () => sessionStorage.getItem("username"),
        password: () => sessionStorage.getItem("password"),
        isConnected: state => !!state.isConnected,
        roomMessagesList: state => state.roomMessagesList
    },
    mutations: {
        setConnected(state, {user, roomMessagesList}) {
            state.isConnected = true;
            state.roomMessagesList = roomMessagesList;
            sessionStorage.setItem("username", user.username);
            sessionStorage.setItem("password", user.password);
        },
        receiveMessage(state, message) {
            state.roomMessagesList.find(rml => rml.room.id === message.roomId).messages.push(message);
        },
        receiveRoom(state, room) {
            state.roomMessagesList.push({
                room: room,
                messages: []
            });
        },
        messagesRead(state, roomId) {
            const messages = state.roomMessagesList.find(rm => rm.room.id === roomId).messages
                .filter(message => message.creatorUsername !== sessionStorage.getItem("username"));

            const myMessages = messages.filter(message => message.creatorUsername === sessionStorage.getItem("username"));
            const recipientMessages = messages.filter(message => message.creatorUsername !== sessionStorage.getItem("username"))
                .map(message => {
                    message.readByRecipient = true;
                    return message;
                });

            state.roomMessagesList.find(rm => rm.room.id === roomId).messages = myMessages.concat(recipientMessages);

        },
        setDisconnected(state) {
            state.isConnected = false;
            state.roomMessagesList = [];
            sessionStorage.removeItem("username");
            sessionStorage.removeItem("password");
        },
    },
};
