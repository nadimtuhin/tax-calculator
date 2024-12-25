import Vue from "vue";
import Vuex from "vuex";
import createPersistedState from "vuex-persistedstate";

import salaries from "./salaries";

Vue.use(Vuex);

const appVersion = '0.7';

const store = new Vuex.Store({
  plugins: [createPersistedState({ key: appVersion })],
  modules: { salaries },
  state: {
    personalInfo: {
      age: 30,
      gender: 'male',
      isDisabled: false,
      isFreedomFighter: false
    }
  },
  mutations: {
    setPersonalInfo(state, personalInfo) {
      state.personalInfo = personalInfo;
    }
  },
});

export default store;
