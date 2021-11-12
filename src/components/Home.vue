<template>
  <div class="content" id="websocket">
    <div>&nbsp;</div>
    <div class="row">
      <div class="col">
        <button class="btn btn-sm btn-info" @click="connect">Create connection</button>
        <button class="btn btn-sm btn-success" @click="startTask">Start Task</button>
        <button class="btn btn-sm btn-danger" @click="stopTask">Stop Task</button>
        <button class="btn btn-sm btn-primary" @click="disconnect">Close connection</button>
      </div>
    </div>
    <div>&nbsp;</div>
    <div class="row">
      <div class="col">
        <ul class="list-group" style="height: 500px; overflow:scroll;">
          <li class="list-group-item d-flex justify-content-between align-items-center"
              v-for="(m,idx) in messages" :key="'m-'+idx">
            {{ m }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>

import SockJS from "sockjs-client";
import Stomp from "webstomp-client";

export default {
  name: "Home",
  data() {
    return {
      messages: []
    }
  },
  methods: {
    connect() {
      this.socket = new SockJS("http://localhost:8080/api/ws/connect");
      this.stompClient = Stomp.over(this.socket);
      this.stompClient.connect(
          {Authorization: this.$store.state.auth.authenticationToken},
          () => {
            this.handleMessageReceipt("Connected");
            this.stompClient.subscribe("/topic/messages", tick => {
              this.handleMessageReceipt(tick.body);
            });
          },
          error => {
            this.handleMessageReceipt("Not connected. Error:" + error.headers.message);
          }
      );
    },
    disconnect() {
      if (this.stompClient) {
        this.stompClient.disconnect();
      }
      this.handleMessageReceipt("Disconnected");
    },
    startTask() {
      if (this.stompClient) {
        this.stompClient.send("/ws/start", null, {Authorization: this.$store.state.auth.authenticationToken});
      } else {
        alert("Please connect first");
      }
    },
    stopTask() {
      if (this.stompClient) {
        this.stompClient.send("/ws/stop", null, {Authorization: this.$store.state.auth.authenticationToken});
      } else {
        alert("Please connect first");
      }
    },
    handleMessageReceipt(messageOutput) {
      this.messages.push(messageOutput);
    },
  },
};
</script>
