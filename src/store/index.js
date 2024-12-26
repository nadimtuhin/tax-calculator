import Vue from "vue";
import Vuex from "vuex";
import createPersistedState from "vuex-persistedstate";

import salaries from "./salaries";
import personalInfo from "./personalInfo";

Vue.use(Vuex);

const appVersion = '0.11';

const store = new Vuex.Store({
  plugins: [
    createPersistedState({
      key: appVersion
    })
  ],
  modules: {
    salaries,
    personalInfo
  }
});

export default store;
