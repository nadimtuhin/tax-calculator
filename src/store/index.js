import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";

import salaries from "./salaries";

const appVersion = '0.9';

const store = createStore({
  plugins: [createPersistedState({ key: appVersion })],
  modules: { salaries },
});

export default store;
