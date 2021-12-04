import SockJS from "sockjs-client";
import Stomp from "webstomp-client";
import cryptoService from "../services/crypto.service";

export const ws = {
    namespaced: true,
    state: {
        isConnected: false,
        roomMessagesList: [],
    },
    actions: {
        initializeConnection({commit}, loginData) {
            return new Promise(async (resolve, reject) => {
                this.socket = new SockJS("http://localhost:8080/api/rest/v1/ws");
                this.stompClient = Stomp.over(this.socket);
                await this.stompClient.connect({
                        username: loginData.username,
                        password: loginData.password
                    }, async () => {

                        await this.stompClient.subscribe("/app/chat.private.fetch.initial.data", async message => {
                            if (!sessionStorage.getItem("username")) {
                                const body = JSON.parse(message.body);
                                const wrappedBinaryPrivateKey = await cryptoService.convertBase64ToKey(body.wrappedPrivateKey);
                                const binaryIvForPrivateKey = await cryptoService.convertBase64ToKey(body.ivForPrivateKey);
                                const privateKey = await cryptoService.unwrapKey(
                                    wrappedBinaryPrivateKey, loginData.symmetricKey, "pkcs8", binaryIvForPrivateKey);
                                const rawPrivateKey = await cryptoService.exportKey(privateKey, "pkcs8");

                                const encodedPrivateKey = await cryptoService.convertKeyToBase64(rawPrivateKey);
                                const encodedPublicKey = body.exportedPublicKey;

                                commit('setConnected', {loginData, message, encodedPrivateKey, encodedPublicKey});
                                resolve();
                            } else {
                                commit('setConnected', {loginData, message});
                                resolve();
                            }
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
        setConnected(state, {loginData, message, encodedPrivateKey, encodedPublicKey}) {
            return new Promise(async (resolve) => {
                const roomMessagesList = JSON.parse(message.body).roomMessagesList;

                if (!(sessionStorage.getItem("username"))) {
                    sessionStorage.setItem("username", loginData.username);
                    sessionStorage.setItem("privateKey", encodedPrivateKey);
                    sessionStorage.setItem("publicKey", encodedPublicKey);
                    sessionStorage.setItem("password", loginData.password);
                }

                state.isConnected = true;
                state.roomMessagesList = roomMessagesList.sort((x, y) => new Date(x.creationDate) - new Date(y.creationDate));
                resolve();
            })
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
            const username = sessionStorage.getItem("username");
            const room = state.roomMessagesList.find(rm => rm.room.id === roomId);
            const readRecipientMessages = room.messages.filter(message => message.creatorUsername !== username)
                .map(message => {
                    message.readByRecipient = true;
                    return message;
                });
            const myMessages = room.messages.filter(message => message.creatorUsername === username);
            const combinedMessages = myMessages.concat(readRecipientMessages);

            state.roomMessagesList.find(rm => rm.room.id === roomId).messages =
                combinedMessages.sort((x, y) => new Date(x.creationDate) - new Date(y.creationDate));
        },
        setDisconnected(state) {
            state.isConnected = false;
            state.roomMessagesList = [];
            sessionStorage.clear();
        },
    },
};
