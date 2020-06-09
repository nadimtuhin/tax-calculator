import Vue from "vue";
import Vuex from "vuex";

import breakdown from "./breakdown";

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: { breakdown },
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++;
    }
  }
});

export default store;
