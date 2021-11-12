<template>
  <div id="app">
    <nav class="navbar navbar-expand navbar-dark bg-dark">

      <a href="/" class="navbar-brand">Prywatny komunikator</a>

      <div class="navbar-nav mr-auto">
        <li class="nav-item">
          <router-link v-if="isLoggedIn" to="/" class="nav-link">{{ 'Witaj ponownie' }}</router-link>
        </li>
      </div>

      <div v-if="!isLoggedIn" class="navbar-nav ml-auto">
        <li class="nav-item">
          <router-link to="/register" class="nav-link">
            <font-awesome-icon icon="user-plus"/> Rejestracja
          </router-link>
        </li>

        <li v-if="!isLoggedIn" class="nav-item">
          <router-link to="/login" class="nav-link">
            <font-awesome-icon icon="sign-in-alt"/> Logowanie
          </router-link>
        </li>
      </div>

      <div v-if="isLoggedIn" class="navbar-nav ml-auto">
        <li class="nav-item">
          <a class="nav-link" @click="logOut">
            <font-awesome-icon icon="sign-out-alt" /> Wyloguj się
          </a>
        </li>
      </div>
    </nav>

    <div class="container mt-5">
      <router-view />
    </div>
  </div>
</template>

<script>

export default {
  computed: {
    isLoggedIn() {
      return this.$store.getters['auth/isLoggedIn'];
    }
  },
  methods: {
    logOut() {
      this.$store.dispatch('auth/logout');
      this.$router.push('/login');
    }
  },
  created() {
  }
};
</script>
