import Vue from "vue";
import Vuex from "vuex";

import breakdown from "./breakdown";
import salaries from "./salaries";
import VuexLocalStorage from "./plugins/VuexLocalStorage";

Vue.use(Vuex);

const store = new Vuex.Store({
  plugins: [VuexLocalStorage],
  modules: { breakdown, salaries },
});

export default store;
