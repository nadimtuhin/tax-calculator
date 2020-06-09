import Vue from "vue";

import App from "./App.vue";
import store from "./store";

Vue.config.productionTip = false;

console.log(store);

new Vue({
  store: store,
  render: h => h(App)
}).$mount("#app");
