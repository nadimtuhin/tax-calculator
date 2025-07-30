<template>
  <div id="app">
    <Navbar />
    <main id="main-content" tabindex="-1">
      <router-view></router-view>
    </main>
    <StarModal />
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue'
import StarModal from './components/StarModal.vue'

export default {
  name: "App",
  components: {
    Navbar,
    StarModal
  }
};
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #ffffff;
  color: rgba(41, 41, 41, 1);
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: rgba(41, 41, 41, 1);
  line-height: 1.4;
}

.router-link-active {
  font-weight: 500;
}

/* Medium-style typography base */
h1, h2, h3, h4, h5, h6 {
  font-family: sohne, "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: rgba(41, 41, 41, 1);
  line-height: 1.22;
  margin: 0;
}

p {
  font-family: charter, Georgia, Cambria, "Times New Roman", Times, serif;
  line-height: 1.58;
  color: rgba(41, 41, 41, 1);
  margin: 0;
}

a {
  color: rgba(41, 41, 41, 1);
  text-decoration: none;
}

a:hover {
  color: rgba(25, 25, 25, 1);
}
</style>
