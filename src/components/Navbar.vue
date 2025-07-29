<template>
  <nav class="navbar">
    <div class="navbar-content">
      <div class="navbar-brand">
        <router-link to="/" class="brand-link">
          <span class="brand-text">BD Tax Calculator</span>
        </router-link>
      </div>
      
      <div class="navbar-menu" :class="{ 'is-active': isMenuOpen }">
        <div class="navbar-nav">
          <router-link to="/" class="nav-item" @click="closeMenu">
            Calculator
          </router-link>
          <router-link to="/tax-guide" class="nav-item" @click="closeMenu">
            Tax Guide
          </router-link>
          <router-link to="/historical-2023" class="nav-item" @click="closeMenu">
            2023 Calculator
          </router-link>
        </div>
        
        <div class="navbar-actions">
          <a href="https://github.com/nadimtuhin/pathao-tax-calculator" target="_blank" class="action-link">
            GitHub
          </a>
        </div>
      </div>
      
      <button class="navbar-burger" :class="{ 'is-active': isMenuOpen }" @click="toggleMenu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Navbar',
  data() {
    return {
      isMenuOpen: false
    }
  },
  methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen
    },
    closeMenu() {
      this.isMenuOpen = false
    }
  }
}
</script>

<style scoped>
.navbar {
  background-color: #ffffff;
  border-bottom: 1px solid rgba(230, 230, 230, 1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  max-width: 1192px;
  margin: 0 auto;
  height: 57px;
}

.navbar-brand {
  flex-shrink: 0;
}

.brand-link {
  text-decoration: none;
  color: rgba(41, 41, 41, 1);
  font-weight: 400;
  font-size: 20px;
  transition: color 0.3s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.brand-link:hover {
  color: rgba(25, 25, 25, 1);
}

.brand-text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex: 1;
  justify-content: space-between;
  margin-left: 2rem;
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-item {
  text-decoration: none;
  color: rgba(117, 117, 117, 1);
  font-weight: 400;
  font-size: 14px;
  transition: color 0.3s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
}

.nav-item:hover {
  color: rgba(41, 41, 41, 1);
}

.nav-item.router-link-active {
  color: rgba(41, 41, 41, 1);
}

.nav-item.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 2px;
  background-color: rgba(41, 41, 41, 1);
}

.navbar-actions {
  display: flex;
  align-items: center;
}

.action-link {
  text-decoration: none;
  color: rgba(117, 117, 117, 1);
  font-weight: 400;
  font-size: 14px;
  padding: 8px 16px;
  border: 1px solid rgba(242, 242, 242, 1);
  border-radius: 99em;
  transition: all 0.3s ease;
  background-color: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.action-link:hover {
  color: rgba(41, 41, 41, 1);
  border-color: rgba(41, 41, 41, 1);
}

.navbar-burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.navbar-burger:hover {
  background-color: #f8f9fa;
}

.navbar-burger span {
  display: block;
  width: 20px;
  height: 2px;
  background-color: #495057;
  margin: 3px 0;
  transition: all 0.3s ease;
  border-radius: 1px;
}

.navbar-burger.is-active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.navbar-burger.is-active span:nth-child(2) {
  opacity: 0;
}

.navbar-burger.is-active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

@media (max-width: 768px) {
  .navbar-content {
    padding: 0 1rem;
    height: 60px;
  }
  
  .brand-text {
    display: none;
  }
  
  .navbar-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    margin: 0;
    padding: 1rem;
    transform: translateY(-10px);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }
  
  .navbar-menu.is-active {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }
  
  .navbar-nav {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .nav-item {
    padding: 12px 16px;
    justify-content: flex-start;
  }
  
  .navbar-actions {
    padding-top: 1rem;
    border-top: 1px solid #e9ecef;
  }
  
  .action-link {
    width: 100%;
    justify-content: center;
    padding: 12px 16px;
  }
  
  .navbar-burger {
    display: flex;
  }
}

@media (max-width: 480px) {
  .navbar-content {
    padding: 0 0.75rem;
  }
  
  .brand-link {
    font-size: 1.1rem;
  }
  
  .brand-icon {
    font-size: 1.3rem;
  }
}
</style>