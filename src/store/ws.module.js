import SockJS from "sockjs-client";
import Stomp from "webstomp-client";
import cryptoService from "../services/crypto.service";

export const ws = {
    namespaced: true,
    state: {
        isConnected: false,
        roomMessagesList: [],
        initialDataReady: false
    },
    actions: {
        async initializeConnection({commit}, loginData) {
            return new Promise(async (resolve, reject) => {
                this.socket = new SockJS("http://localhost:8080/api/rest/v1/ws");
                this.stompClient = Stomp.over(this.socket);
                await this.stompClient.connect({username: loginData.username, password: loginData.password}, async () => {
                        await this.stompClient.subscribe("/app/chat.private.fetch.initial.data", async message => {
                            if (!sessionStorage.getItem("username")) {
                                const body = JSON.parse(message.body);
                                const keys = await cryptoService.prepareFetchedKeysForStorageAfterLogin(body, loginData.symmetricKey);
                                const encodedPrivateKey = keys.encodedPrivateKey;
                                const encodedPublicKey = keys.encodedPublicKey;
                                await commit('setConnected', {loginData, message, encodedPrivateKey, encodedPublicKey});
                                resolve();
                            } else {
                                await commit('setConnected', {loginData, message});
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

                        this.stompClient.subscribe(("/user/exchange/chat.private.messages.read"),  message => {
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
        roomMessages: (state) => (roomId) => {
            return state.roomMessagesList.find(roomMessages => roomMessages.room.id === roomId)?.messages;
        },
        getRoom: (state) => (roomId) => {
            return state.roomMessagesList.find(roomMessages => roomMessages.room.id === roomId)?.room;
        },
        idRoomDecrypted: (state) => (roomId) => {
            return state.roomMessagesList.find(roomMessages => roomMessages.room.id === roomId)?.decrypted;
        },
        roomList: state => state.roomMessagesList.map(roomMessages => roomMessages.room)
    },
    mutations: {
        async setConnected(state, {loginData, message, encodedPrivateKey, encodedPublicKey}) {
            return new Promise(async (resolve) => {

                const roomMessagesList = JSON.parse(message.body).roomMessagesList;
                const credentialsAlreadyProvided = sessionStorage.getItem("username");

                if (!credentialsAlreadyProvided) {
                    sessionStorage.setItem("username", loginData.username);
                    sessionStorage.setItem("privateKey", encodedPrivateKey);
                    sessionStorage.setItem("publicKey", encodedPublicKey);
                    sessionStorage.setItem("password", loginData.password);
                }

                state.isConnected = true;

                for (const roomMessages of roomMessagesList) {
                    for (const message of roomMessages.messages) {
                        for (const messageBody of message.messageBodies) {
                            messageBody.body = await cryptoService.decryptBase64TextUsingBase64PrivateKey(
                                messageBody.body, sessionStorage.getItem("privateKey"))
                        }
                    }
                    roomMessages.decrypted = true;
                }
                state.roomMessagesList = roomMessagesList
                    .sort((x, y) => new Date(x.creationDate) - new Date(y.creationDate));
                resolve();
            })
        },
        async receiveMessage(state, message) {
            return new Promise(async (resolve) => {
                const body = message.messageBodies[0];
                message.messageBodies = [
                    {
                        recipient: body.recipient,
                        body: await cryptoService.decryptBase64TextUsingBase64PrivateKey(body.body,
                            sessionStorage.getItem("privateKey"))
                    }
                ]
                state.roomMessagesList.find(rml => rml.room.id === message.roomId).messages.push(message);
                resolve();
            })

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
