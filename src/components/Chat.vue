<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-xl-4 col-lg-4 col-md-4 col-sm-3 col-3 search-container">
        <div class="search-group">
          <div class="form-outline">
            <input type="search" id="form1" class="form-control" placeholder="Wyszukaj użytkownika"
                   aria-label="Search"/>
          </div>
        </div>
      </div>
      <div class="col-xl-8 col-lg-8 col-md-8 col-sm-9 col-9 chat-name-container">
        <span v-if="selectedRoom">To: <span class="person-name">Emily Russell</span></span>
      </div>
    </div>
    <div class="row list-row">
      <div class="col-xl-4 col-lg-4 col-md-4 col-sm-3 col-3 user-list-container">
        <ul class="m-0 p-0 person-list">
          <li class="person"
              v-bind:class="{ 'active-user': getCurrentSelectedRoom() === room}"
              @click="setNewSelectedRoom(room)"
              v-for="room in getRooms()" :key="room.id">
            <img src="https://www.bootdey.com/img/Content/avatar/avatar1.png" alt="Retail Admin">
            <span class="person-name">{{room.name}}</span>
          </li>
        </ul>
      </div>
      <div class="col-xl-8 col-lg-8 col-md-8 col-sm-9 col-9">
        <div v-if="selectedRoom" class="chat-container">
          <ul>
            <li class="chat-left">
              <div class="chat-avatar">
                <img src="https://www.bootdey.com/img/Content/avatar/avatar3.png" alt="Retail Admin">
                <div class="chat-name">Russell</div>
              </div>
              <div class="chat-text">Hello, I'm Russell.
                <br>How can I help you today?
              </div>
              <div class="chat-hour">08:55 <span class="fa fa-check-circle"></span></div>
            </li>
            <li class="chat-right">
              <div class="chat-hour">08:56 <span class="fa fa-check-circle"></span></div>
              <div class="chat-text">Hi, Russell
                <br> I need more information about Developer Plan.
              </div>
              <div class="chat-avatar">
                <img src="https://www.bootdey.com/img/Content/avatar/avatar3.png" alt="Retail Admin">
                <div class="chat-name">Sam</div>
              </div>
            </li>
          </ul>
        </div>
        <div v-if="!selectedRoom" class="no-room-text">
          <p>Wybierz pokój, aby wyświetlić wiadomości</p>
        </div>
        <div v-if="selectedRoom" class="form-group mt-3 mb-0 send-area">
          <textarea v-model="newMessage" class="form-control" rows="3" placeholder="Type your message here..."></textarea>
          <button @click="handleMessageSend" class="btn btn-secondary w-25 send-button">Wyślij</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: "ChatNew",
  data() {
    return {
      selectedRoom: null,
      messages: [],
      newMessage: ''
    }
  },
  created() {

    const isConnected = this.$store.getters['ws/isConnected'];
    const hasCredentials = this.$store.getters['ws/username'] && this.$store.getters['ws/password'];

    if(!isConnected && hasCredentials) {
      this.$store.dispatch('ws/initializeConnection', {
        username: this.$store.getters['ws/username'],
        password: this.$store.getters['ws/password']
      })
    }
  },
  methods: {
    getRooms() {
      return this.$store.getters['ws/rooms'];
    },
    setNewSelectedRoom(room) {
      this.selectedRoom = room;
      this.$store.dispatch('ws/fetchMessagesForRoom', room.id).then(() => {
        this.messages = this.$store.getters['ws/roomMessages'];
      })

    },
    getCurrentSelectedRoom() {
      return this.selectedRoom;
    },
    handleMessageSend() {
      if(this.newMessage && this.selectedRoom) {
        //todo
        this.newMessage = null;
      }
    }
  }
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
  font-size: .95rem;
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
  height: 80vh;
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
  font-size: .75rem;
  color: #999999;
  text-align: center;
}

.chat-text {
  padding: .4rem 1rem;
  border-radius: 4px;
  background: #ffffff;
  font-weight: 300;
  line-height: 150%;
  position: relative;
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
    display: none;
  }

  .person {
    justify-content: center;

  }

  .person-list:first-child {
    border-top: 1px solid #e6ecf3;
  }

  .person-name {
    font-weight: 500;
    font-size: .8rem;
  }

  .chat-name-container {
    font-weight: 500;
    font-size: .8rem;
    margin-left: auto;
  }

  .chat-container {
    height: 65vh;
  }

  .search-container {
    display: none;
  }

  .user-list-container {
    padding: 0;
  }

  li.chat-left, li.chat-right {
    flex-direction: column;
    margin-bottom: 30px;
  }

  .chat-avatar img {
    width: 32px;
    height: 32px;
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
    font-size: .8rem;
  }
}


</style>
