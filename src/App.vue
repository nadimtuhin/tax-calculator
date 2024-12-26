<template>
  <div id="app" class="d-flex flex-column min-vh-100">
    <NavigationBar />
    <main class="flex-grow-1">
      <router-view></router-view>
    </main>
    <FooterBar />
  </div>
</template>

<script>
import NavigationBar from './components/NavigationBar.vue';
import FooterBar from './components/FooterBar.vue';

export default {
  name: "App",
  components: {
    NavigationBar,
    FooterBar
  },
  created() {
    // Add Bootstrap Icons CSS
    const link = document.createElement('link');
    link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f8f9fa;
}

/* Global styles */
h1, h2, h3, h4, h5, h6 {
  margin-bottom: 1rem;
  font-weight: 600;
  color: #1a202c;
}

.card {
  border: none;
  box-shadow: 0 4px 6px rgba(0,0,0,0.07);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: 0 6px 12px rgba(0,0,0,0.1);
}

.form-control, .form-select {
  border: 1px solid #e2e8f0;
  padding: 0.625rem 1rem;
}

.form-control:focus, .form-select:focus {
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
}

.btn {
  font-weight: 500;
  padding: 0.5rem 1.25rem;
  transition: all 0.2s ease;
}

.btn:hover {
}
</style>
