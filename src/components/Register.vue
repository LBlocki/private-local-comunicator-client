<template>
  <div class="col-md-12">
    <div class="card card-container">
      <Form @submit="handleRegister" :validation-schema="user">
        <div>
          <div class="form-group">
            <label for="username">Nazwa użytkownika</label>
            <Field name="username" type="text" id="username" class="form-control"/>
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
              Zarejestruj się
            </button>
          </div>
          <div class="form-group">
            <div v-if="message" class="alert alert-danger" role="alert">{{ message }}</div>
          </div>
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
  name: "Register",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  data() {
    const user = yup.object().shape({
      username: yup
          .string()
          .required("Nazwa użytkownika jest wymagana!")
          .min(3, "Nazwa użytkownika musi składać się co najmniej z 3 znaków!")
          .max(20, "Nazwa użytkownika musi składać się maksymalnie z 20 znaków!"),
      password: yup
          .string()
          .required("Hasło jest wymagane!")
          .min(6, "Hasło musi składać się co najmniej z 6 znaków!")
          .max(40, "Hasło musi składać się maksymalnie z 40 znaków!"),
    });

    return {
      loading: false,
      message: "",
      user,
    };
  },
  methods: {
    async handleRegister(user) {
      this.message = "";
      this.loading = true;

      try {
        //generacja pary RSA
        const cryptoKeyPair= await CryptoService.generateKeyPair();

        //generacja klucza symetrycznego:
        const symmetricCryptoKey = await CryptoService.deriveSymmetricCryptoKey(user.password, user.username);

        //generacja klucza wrappującego do hashu klucza symetrycznego
        const newSalt = await CryptoService.digest(user.username);
        const wrappingSymmetricCryptoKey = await CryptoService.deriveSymmetricCryptoKey(user.password, newSalt);

        //Wrappowanie klucza prywatnego za pomocą klucza symetrycznego - bezpieczne
        const wrappedPrivateKey = await CryptoService.wrapKey(cryptoKeyPair.privateKey, symmetricCryptoKey, "pkcs8");

        //wrappowanie klucza symetrycznego za pomocą klucza publicznego - bezpieczne
        const wrappedSymmetricKey = await CryptoService.wrapKey(symmetricCryptoKey, wrappingSymmetricCryptoKey, "raw");

        //export klucza publicznego
        const exportedPublicKey = await CryptoService.exportKey(cryptoKeyPair.publicKey, "spki");

        const registrationData = {
          username: user.username,
          wrappedPrivateKey: await CryptoService.convertKeyToBase64(wrappedPrivateKey.key),
          exportedPublicKey: await CryptoService.convertKeyToBase64(exportedPublicKey),
          wrappedSymmetricKey: await CryptoService.convertKeyToBase64(wrappedSymmetricKey.key),
          ivForPrivateKey: await CryptoService.convertKeyToBase64(wrappedPrivateKey.iv),
          ivForSymmetricKey: await CryptoService.convertKeyToBase64(wrappedSymmetricKey.iv)
        }

        await this.$store.dispatch("auth/register", registrationData);
        await this.$router.push("/login");

      } catch (error) {
        this.message = "Wystąpił problem. Spróbuj ponownie później";
        this.loading = false;
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
