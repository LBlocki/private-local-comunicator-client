<template>
  <div class="container-fluid" v-if="isConnected()">
    <div class="row">
      <div class="col-xl-4 col-lg-4 col-md-4 col-sm-3 search-container"
           v-bind:class="{'no-show': isRoomSelected()}">
        <div class="search-group">
          <div class="form-outline">
            <input type="search" id="form1" v-model="searchedUsername" class="form-control" placeholder="Wyszukaj użytkownika" aria-label="Search"/>
          </div>
        </div>
      </div>
      <div class="col-xl-8 col-lg-8 col-md-8 col-sm-9 chat-name-container" v-if="isRoomSelected()">
        <font-awesome-icon @click="setNewSelectedRoomId(undefined)" class="back-icon" icon="arrow-left"/>
        <span class="person-name" v-if="isRoomSelected()">Rozmówca: <span>{{ getCurrentSelectedRoomName() }}</span></span>
      </div>
    </div>
    <div class="row list-row" >
      <div class="col-xl-4 col-lg-4 col-md-4 col-sm-3 user-list-container" v-bind:class="{'no-show': isRoomSelected()}">
        <ul class="m-0 p-0 person-list">
          <li class="person"
              v-bind:class="{ 'active-user': isCurrentSelectedRoom(room.id)}"
              @click="setNewSelectedRoomId(room.id)"
              v-for="room in getRoomList()" :key="room.id">
            <img src="https://www.bootdey.com/img/Content/avatar/avatar1.png" alt="Retail Admin">
            <div class="d-flex flex-column">
              <span class="person-name">{{ getRoomName(room) }}</span>
              <span v-if="isNewMessageForRoom(room.id)">Masz nową wiadomość</span>
            </div>
          </li>
        </ul>
      </div>
      <div class="col-xl-8 col-lg-8 col-md-8 col-sm-9 position-relative" v-if="isRoomSelected()">
        <div class="chat-container">
          <ul>
            <li v-for="message in messages" v-bind:class="{ 'chat-left': isUserMessageCreator(message), 'chat-right': !isUserMessageCreator(message)}">
              <div class="chat-avatar" v-if="isUserMessageCreator(message)">
                <img src="../assets/other_profile.png" alt="Profile img">
                <div class="chat-name">{{ getUserUsername() }}</div>
              </div>
              <div class="chat-text chat-creator" v-if="isUserMessageCreator(message)">{{ getMessageBody(message) }}
              </div>
              <div class="chat-hour" v-if="isUserMessageCreator(message)">
                {{ getFormattedDate(message.creationDate) }}<span
                  class="fa fa-check-circle"></span></div>
              <div class="chat-hour" v-if="!isUserMessageCreator(message)">
                {{ getFormattedDate(message.creationDate) }}<span
                  class="fa fa-check-circle"></span></div>
              <div class="chat-text chat-non-creator" v-if="!isUserMessageCreator(message)">
                {{ getMessageBody(message) }}
              </div>
              <div class="chat-avatar" v-if="!isUserMessageCreator(message)">
                <img src="../assets/profile.png" alt="Profile img">
                <div class="chat-name">{{ message.creatorUsername }}</div>
              </div>
            </li>
          </ul>
        </div>
        <div v-if="!isRoomSelected()" class="no-room-text">
          <p>Wybierz pokój, aby wyświetlić wiadomości</p>
        </div>
        <div v-if="isRoomSelected()" class="form-group mt-3 mb-0 send-area">
          <textarea v-model="newMessageBody" class="form-control" rows="3"
                    placeholder="Zacznij pisać..."></textarea>
          <button @click="handleMessageSend" :disabled="sending || !newMessageBody"
                  class="btn btn-secondary w-25 send-button">Wyślij
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import cryptoService from "../services/crypto.service";

export default {
  name: "ChatNew",
  data() {
    return {
      selectedRoomId: undefined,
      newMessageBody: undefined,
      roomSelectionState: true,
      searchedUsername: undefined,
      messages: [],
      sending: false,
    }
  },
  created() {

    const isConnected = this.$store.getters['ws/isConnected'];
    const username = this.$store.getters['ws/username'];
    const password = this.$store.getters['ws/password'];
    const hasCredentials = username && password;

    if (!isConnected && hasCredentials) {
      this.$store.dispatch('ws/initializeConnection', {username: username, password: password}).then(
          () => {
            const id = parseInt(this.$router.currentRoute.value.query.id);
            console.log(id);
            if (id) {
              this.setNewSelectedRoomId(id);
            }
          })
    }
  },
  methods: {
    isConnected() {
      return this.$store.getters['ws/isConnected'];
    },
    isRoomSelected() {
      return this.selectedRoomId !== undefined;
    },
    getCurrentSelectedRoomName() {
      const room = this.$store.getters['ws/getRoom'](this.selectedRoomId);
      return this.getRoomName(room);
    },
    isCurrentSelectedRoom(roomId) {
      return this.selectedRoomId === roomId;
    },
    setNewSelectedRoomId(roomId) {
      if(roomId === undefined) {
        this.selectedRoomId = undefined;
        this.$router.push({path: '/chat'});
      } else {
        this.selectedRoomId = roomId;
        if (this.isNewMessageForRoom(roomId)) {
          this.$store.dispatch('ws/setMessagesAsRead', roomId);
        }
        this.messages = this.$store.getters['ws/roomMessages'](this.selectedRoomId);
        this.$router.push({path: '/chat', query: {id: roomId}});
      }
    },
    getRoomList() {
      return this.$store.getters['ws/roomList']
          .filter(room => {
            if (this.searchedUsername) {
              const username = room.users.filter(user => user.username !== this.getUserUsername())[0].username;
              return username.includes(this.searchedUsername);
            }
            return true;
          });
    },
    getMessageBody(message) {
      return message?.messageBodies[0]?.body;
    },
    getRoomName(room) {
      return room?.users?.filter(user => user.username !== this.getUserUsername())[0]?.username;
    },
    getFormattedDate(stringDate) {
      const date = new Date(stringDate);
      const hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
      const minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
      return date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear() + " " + hours + ":" + minutes;
    },
    isUserMessageCreator(message) {
      return message.creatorUsername === this.getUserUsername();
    },
    getCurrentSelectedRoomId() {
      return this.selectedRoomId;
    },
    handleMessageSend() {
      if (!this.sending && this.newMessageBody) {
        this.sending = true;
        const room = this.$store.getters['ws/getRoom'](this.selectedRoomId);
        this.encodeMessageBodiesForUsers(this.newMessageBody, room.users).then(bodies => {
          const recipient = room.users.filter(user => user.username !== this.getUserUsername())[0].username;
          const message = {
            id: undefined,
            creatorUsername: this.getUserUsername(),
            roomId: room.id,
            messageBodies: bodies,
            creationDate: new Date()
          };

          this.$store.dispatch('ws/sendMessage', {message, recipient}).then(
              () => {
                this.newMessageBody = '';
                this.sending = false;
              },
              () => this.sending = false);
        });
      }
    },
    async encodeMessageBodiesForUsers(message, users) {
      return new Promise(async (resolve, reject) => {
        try {
          const bodies = await Promise.all(users.map(async user => {
            return {
              recipient: user.username,
              body: await cryptoService.encryptWithBase64PublicKeyAndConvertToBase64(message, user.encodedPublicKey)
            };
          }));
          resolve(bodies);
        } catch (error) {
          reject(error);
        }
      });
    },
    getUserUsername() {
      return this.$store.getters['ws/username'];
    },
    isNewMessageForRoom(roomId) {
      const messages = this.$store.getters['ws/roomMessages'](this.selectedRoomId);
      const myMessages = messages ? messages.filter(message => message.creatorUsername !== this.getUserUsername()) : [];

      if (myMessages && myMessages.length > 0) {
        const isRead = myMessages[myMessages.length - 1].readByRecipient;
        if (this.selectedRoomId && this.selectedRoomId === roomId && !isRead) {
          this.$store.dispatch('ws/setMessagesAsRead', roomId);
        }
        return !isRead;
      }
      return false;
    },
  },
};

</script>

<style scoped>

.container-fluid {
  height: 100%;
}

.list-row {
  height: calc(100% - 74px);
}

.search-container {
  border-right: 1px solid #e6ecf3;
  padding: 1rem 0;
}

.user-list-container {
  padding: 1rem 0;
  border-right: 1px solid #e6ecf3;
}

.person {
  display: flex;
  align-items: center;
  padding: 10px 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f4f8;
}

.person img {
  width: 50px;
  height: 50px;
  border-radius: 50px;
  margin-right: 10px;
}

.back-icon {
  margin-right: 20px;
  font-size: 1.3rem;
  cursor: pointer;
}

.person:hover {
  background-color: #ffffff;
  background-image: linear-gradient(right, #e9eff5, #ffffff);
}

.person.active-user {
  background-color: #ffffff;
  background-image: linear-gradient(right, #f7f9fb, #ffffff);
}

.person-name {
  font-weight: 600;
  font-size: 1rem;
}

.no-room-text {
  font-weight: 300;
  font-size: 2.95rem;
  display: flex;
  height: 500px;
  justify-content: center;
  align-items: center;
}

.search-group {
  padding-left: 1rem;
  padding-right: 1rem;
}

.chat-container {
  overflow-y: auto;
  height: calc(100% - 120px);
  max-height: 80vh;
  overflow-x: hidden;
  display: flex;
  flex-direction: column-reverse;
  padding: 1rem;
}

.chat-name-container {
  width: 100%;
  min-height: 64px;
  line-height: 64px;
  border-bottom: 1px solid #e6ecf3;
  border-radius: 0 3px 0 0;
}

.chat-left, .chat-right {
  display: flex;
  flex: 1;
  flex-direction: row;
  margin-bottom: 40px;
}

.chat-right {
  justify-content: flex-end;
}

li.chat-right > .chat-avatar {
  margin-left: 20px;
  margin-right: 0;
}

.chat-avatar {
  margin-right: 20px;
}

.chat-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 30px;
}

.chat-name {
  font-size: 1.1rem;
  color: #999999;
  text-align: center;
}

.chat-creator {
  background: #ffffff;
}

.chat-non-creator {
  background: #ffffff;
}

.chat-text {
  align-self: center;
  padding: .4rem 1rem;
  border-radius: 4px;
  font-weight: 300;
  line-height: 150%;
  position: relative;
  word-wrap: break-word;
  max-width: 40%;
}

.chat-text:before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  top: 10px;
  left: -20px;
  border: 10px solid;
  border-color: transparent #ffffff transparent transparent;
}

li.chat-right > .chat-text {
  text-align: right;
}

li.chat-right > .chat-text:before {
  right: -20px;
  border-color: transparent transparent transparent #ffffff;
  left: inherit;
}

.chat-hour {
  padding: 0;
  font-size: .75rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin: 0 0 0 15px;
}

li .chat-hour > span {
  font-size: 16px;
  color: #9ec94a;
}

li.chat-right > .chat-hour {
  margin: 0 15px 0 0;
}

ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
}

.send-area {
  display: flex;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 15px;
}

.send-button {
  margin-left: 10px;
}

@media (max-width: 767px) {

  .no-room-text {
    font-weight: 300;
    font-size: 1.95rem;
    height: 300px;
  }

  .person img {
    width: 40px;
    height: 40px;
  }

  .person {
    justify-content: left;

  }

  .person-list:first-child {
    border-top: 1px solid #e6ecf3;
  }

  .person-name {
    font-weight: 500;
    font-size: 1rem;
  }

  .chat-right .chat-text {
    align-self: flex-end;
  }

  .chat-left .chat-text {
    align-self: flex-start;
  }

  .chat-left .chat-avatar img {
    margin-right: 10px;
  }

  .chat-right .chat-avatar img {
    margin-left: 10px;
  }

  .chat-right .chat-hour {
    display: none;
  }

  .chat-left .chat-hour {
    display: none;
  }

  .chat-name-container {
    font-weight: 500;
    font-size: .8rem;
    margin-left: auto;
  }

  .user-list-container {
    padding: 0;
  }

  .chat-left, .chat-right {
    flex-direction: column;
    margin-bottom: 30px;
  }

  .chat-avatar img {
    width: 40px;
    height: 40px;
  }

  li.chat-left .chat-avatar {
    margin: 0 0 5px 0;
    display: flex;
    align-items: center;
  }

  li.chat-left .chat-hour {
    justify-content: flex-end;
  }

  i.chat-left .chat-name {
    margin-left: 5px;
  }

  li.chat-right .chat-avatar {
    order: -1;
    margin: 0 0 5px 0;
    align-items: center;
    display: flex;
    justify-content: right;
    flex-direction: row-reverse;
  }

  li.chat-right .chat-hour {
    justify-content: flex-start;
    order: 2;
  }

  li.chat-right .chat-name {
    margin-right: 5px;
  }

  li .chat-text {
    font-size: 1rem;
    max-width: 70%;
  }
}

@media (max-width: 576px) {
  .no-room-text {
    display: none;
  }

  .no-show {
    display: none;
  }
}

</style>
