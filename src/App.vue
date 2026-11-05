<template>
  <div id="tax-app">
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
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#tax-app {
  font-family: var(--font);
  color: var(--text);
  line-height: 1.5;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font);
  color: var(--text);
  line-height: 1.25;
  margin: 0;
}

p {
  font-family: var(--font);
  line-height: 1.55;
  color: var(--text);
  margin: 0;
}

a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  color: var(--accent-hover);
}
</style>
