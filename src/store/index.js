import Vue from "vue";
import Vuex from "vuex";

import breakdown from "./breakdown";
import salaries from "./salaries";

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: { breakdown, salaries },
});

export default store;
