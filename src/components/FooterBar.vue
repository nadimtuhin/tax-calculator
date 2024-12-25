<template>
  <footer class="footer">
    <div class="container py-4">
      <div class="row g-4 align-items-center">
        <div class="col-lg-5">
          <div class="brand-section">
            <div class="logo mb-2">
              <i class="bi bi-bank2"></i>
              <span>Bangladesh Tax Calculator</span>
            </div>
            <p class="description mb-0">
              Simple and accurate income tax calculator for Bangladesh
            </p>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="calculators-section">
            <router-link
              to="/"
              class="calc-link"
            >
              <span>2023-24</span>
            </router-link>
            <router-link
              to="/tax-2023"
              class="calc-link"
            >2022-23</router-link>
            <router-link
              to="/tax-2022"
              class="calc-link"
            >2021-22</router-link>
          </div>
        </div>
        <div class="col-lg-3">
          <div class="social-section">
            <a href="https://github.com/nadimtuhin/tax-calculator" target="_blank" rel="noopener noreferrer">
              <i class="bi bi-github"></i>
            </a>
            <a href="https://twitter.com/nadimtuhin" target="_blank" rel="noopener noreferrer">
              <i class="bi bi-twitter"></i>
            </a>
            <a href="https://www.linkedin.com/in/nadimtuhin" target="_blank" rel="noopener noreferrer">
              <i class="bi bi-linkedin"></i>
            </a>
          </div>
        </div>
      </div>
      <div class="copyright text-center">
        <small>© {{ currentYear }} All rights reserved</small>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: "FooterBar",
  computed: {
    currentYear() {
      return new Date().getFullYear();
    }
  }
};
</script>

<style scoped>
.footer {
  background-color: #f8f9fa;
  border-top: 1px solid #eee;
  padding: 1rem 0;
}

.brand-section {
  color: #2d3436;
}

.logo {
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.description {
  color: #636e72;
  font-size: 0.95rem;
}

.calculators-section {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
}

.calc-link {
  color: #636e72;
  text-decoration: none;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.calc-link:hover {
  color: #2d3436;
  background-color: rgba(0, 0, 0, 0.05);
}

.router-link-exact-active {
  color: #4834d4 !important;
  background-color: rgba(72, 52, 212, 0.1);
  font-weight: 500;
}

.calc-link .current {
  background: #4834d4;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: normal;
}

.social-section {
  display: flex;
  gap: 1.25rem;
  justify-content: flex-end;
}

.social-section a {
  color: #636e72;
  font-size: 1.25rem;
  transition: color 0.2s;
}

.social-section a:hover {
  color: #2d3436;
}

.copyright {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
  color: #636e72;
}

@media (max-width: 991.98px) {
  .brand-section {
    text-align: center;
  }

  .logo {
    justify-content: center;
  }

  .social-section {
    justify-content: center;
    margin-top: 1rem;
  }
}
</style>
