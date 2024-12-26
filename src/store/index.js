import Vue from "vue";
import Vuex from "vuex";
import createPersistedState from "vuex-persistedstate";

import salaries from "./salaries";
import personalInfo from "./personalInfo";
import investments from "./investments";

Vue.use(Vuex);

const appVersion = '0.13';

const store = new Vuex.Store({
  plugins: [
    createPersistedState({
      key: appVersion
    })
  ],
  modules: {
    salaries,
    personalInfo,
    investments
  }
});

export default store;
