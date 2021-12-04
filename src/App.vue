<template>
  <div id="app">
    <nav class="navbar navbar-expand app-navbar">
      <a href="/chat" class="navbar-brand">Prywatny komunikator</a>
      <div v-if="!isConnected" class="navbar-nav ml-auto">
        <li class="nav-item">
          <router-link to="/register" class="nav-link">
            <font-awesome-icon icon="user-plus"/>
            Rejestracja
          </router-link>
        </li>
        <li v-if="!isConnected" class="nav-item">
          <router-link to="/login" class="nav-link">
            <font-awesome-icon icon="sign-in-alt"/>
            Logowanie
          </router-link>
        </li>
      </div>
      <div v-if="isConnected" class="navbar-nav ml-auto">
        <li class="nav-item">
          <a class="nav-link sign-out" @click="logOut">
            <font-awesome-icon icon="sign-out-alt"/>
            Wyloguj się
          </a>
        </li>
      </div>
    </nav>
    <router-view class="view"/>
  </div>
</template>

<script>

export default {
  computed: {
    isConnected() {
      return this.$store.getters['ws/isConnected'];
    }
  },
  methods: {
    logOut() {
      this.$store.dispatch('ws/disconnect').then(() => this.$router.push('/login'));
    }
  },
  created() {
  }
};
</script>

<style scoped>

.app-navbar {
  height: 65px;
  border-bottom: 1px solid #e6ecf3;;
}

.sign-out {
  cursor: pointer;
}

#app {
  height:100vh;
  display:flex;
  flex-direction:column;
  margin: 0;
  width: 100%;
  background: #f4f5fb;
}

</style>

