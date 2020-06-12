import Vue from "vue";
import Vuex from "vuex";
import createPersistedState from "vuex-persistedstate";

import salaries from "./salaries";

Vue.use(Vuex);

const appVersion = '0.6';

const store = new Vuex.Store({
  plugins: [createPersistedState({ key: appVersion })],
  modules: { salaries },
});

export default store;
