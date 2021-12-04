<template>
  <div class="col-md-12">
    <div class="card card-container">
      <Form @submit="handleLogin" :validation-schema="user">
        <div class="form-group">
          <label for="username">Nazwa użytkownika</label>
          <Field name="username" id="username" type="text" class="form-control"/>
          <ErrorMessage name="username" class="error-feedback"/>
        </div>
        <div class="form-group">
          <label for="password">Hasło</label>
          <Field name="password" type="password" id="password" class="form-control"/>
          <ErrorMessage name="password" class="error-feedback"/>
        </div>
        <div class="form-group">
          <button class="btn btn-primary btn-block" :disabled="loading">
            <span v-show="loading" class="spinner-border spinner-border-sm"></span>
            <span>Zaloguj</span>
          </button>
        </div>
        <div class="form-group">
          <div v-if="message" class="alert alert-danger" role="alert">{{ message }}</div>
        </div>
      </Form>
    </div>
  </div>
</template>

<script>

import {Form, Field, ErrorMessage} from "vee-validate";
import * as yup from "yup";
import CryptoService from "../services/crypto.service";

export default {
  name: "Login",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  data() {
    const user = yup.object().shape({
      username: yup.string().required("Nazwa użytkownika jest wymagana!"),
      password: yup.string().required("Hasło jest wymagane!"),
    });

    return {
      loading: false,
      message: "",
      user,
    };
  },
  methods: {
    async handleLogin(user) {
      this.loading = true;
      this.message = "";

      try {
        const iv = (await this.$store.dispatch('auth/getIvForWrappedSymmetricKey', user.username)).data;
        const symmetricCryptoKey = await CryptoService.deriveSymmetricCryptoKey(user.password, user.username);
        const newSalt = await CryptoService.digest(user.username);
        const arrayBufferIv = await CryptoService.convertBase64ToKey(iv);
        const wrappingSymmetricCryptoKey = await CryptoService.deriveSymmetricCryptoKey(user.password, newSalt);
        const wrappedSymmetricKey = await CryptoService.wrapKeyUsingPredefinedIV(symmetricCryptoKey,
            wrappingSymmetricCryptoKey, "raw", arrayBufferIv);

        const loginData = {
          username: user.username,
          password: await CryptoService.convertKeyToBase64(wrappedSymmetricKey.key),
          symmetricKey: symmetricCryptoKey
        }

        this.$store.dispatch('ws/initializeConnection', loginData).then(
            () => {
              console.log('routing');
              this.$router.push('/chat');
            },
            () => {
              this.loading = false;
              this.message = "Nieprawidłowa nazwa użytkownika lub hasło";
            }
        );
      } catch (error) {
        this.loading = false;
        this.message = "Nieprawidłowa nazwa użytkownika lub hasło";
        throw error;
      }
    },
  },
};
</script>

<style scoped>

label {
  display: block;
  margin-top: 10px;
}

.card-container.card {
  max-width: 350px !important;
  padding: 40px 40px;
}

.card {
  background-color: #f7f7f7;
  padding: 20px 25px 30px;
  margin: 0 auto 25px;
  margin-top: 50px;
  -moz-border-radius: 2px;
  -webkit-border-radius: 2px;
  border-radius: 2px;
  -moz-box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.3);
  -webkit-box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.3);
  box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.3);
}

.error-feedback {
  color: red;
}

</style>
