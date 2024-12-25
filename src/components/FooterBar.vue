<template>
  <footer class="footer">
    <div class="container py-4">
      <div class="row">
        <div class="col-12">
          <div class="references-section">
            <h6 class="section-title">External Links</h6>
            <div class="reference-links">
              <a
                href="https://nbr.gov.bd/uploads/publications/%E0%A6%86%E0%A7%9F%E0%A6%95%E0%A6%B0_%E0%A6%A8%E0%A6%BF%E0%A6%B0%E0%A7%8D%E0%A6%A6%E0%A7%87%E0%A6%B6%E0%A6%BF%E0%A6%95%E0%A6%BE_%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%AA-%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%AB.pdf"
                target="_blank"
                rel="noopener noreferrer"
                class="reference-link"
              >
                <i class="bi bi-file-pdf"></i>
                NBR Guide 2024-25
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="row separator"></div>

      <div class="row g-4 align-items-center">
        <div class="col-lg-4">
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
        <div class="col-lg-5">
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
            <div class="social-links">
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
  background-color: #1a1a1a;
  border-top: 1px solid #2d2d2d;
  padding: 3rem 0 2rem;
  color: #fff;
}

.row.separator {
  position: relative;
  margin: 2.5rem 0;
}

.row.separator::before {
  content: '';
  position: absolute;
  top: 0;
  left: 1rem;
  right: 1rem;
  height: 1px;
  background: linear-gradient(to right,
    rgba(72, 52, 212, 0.1),
    rgba(72, 52, 212, 0.3),
    rgba(72, 52, 212, 0.1)
  );
}

.brand-section {
  color: #fff;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  color: #fff;
}

.logo i {
  color: #4834d4;
}

.description {
  color: #a0a0a0;
  font-size: 1rem;
  line-height: 1.5;
}

.calculators-section {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.calc-link {
  color: #a0a0a0;
  text-decoration: none;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  border: 1px solid #2d2d2d;
}

.calc-link:hover {
  color: #fff;
  border-color: #4834d4;
  background-color: rgba(72, 52, 212, 0.1);
}

.router-link-exact-active {
  color: #fff !important;
  background-color: #4834d4;
  border-color: #4834d4;
  font-weight: 500;
}

.section-title {
  color: #fff;
  margin-bottom: 1.25rem;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.reference-links {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reference-link {
  color: #a0a0a0;
  text-decoration: none;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  padding: 0.5rem;
  border-radius: 6px;
  max-width: fit-content;
}

.reference-link:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.05);
}

.reference-link i {
  font-size: 1.25rem;
  color: #4834d4;
}

.social-section {
  display: flex;
  justify-content: flex-end;
}

.social-links {
  display: flex;
  gap: 1.25rem;
}

.social-links a {
  color: #a0a0a0;
  font-size: 1.5rem;
  transition: color 0.2s;
}

.social-links a:hover {
  color: #fff;
}

.copyright {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #2d2d2d;
  color: #a0a0a0;
  font-size: 0.95rem;
}

@media (max-width: 991.98px) {
  .footer {
    padding: 2rem 0 1.5rem;
  }

  .brand-section {
    text-align: center;
    margin-bottom: 1rem;
  }

  .logo {
    justify-content: center;
  }

  .calculators-section {
    justify-content: center;
    margin-bottom: 1rem;
  }

  .social-section {
    justify-content: center;
  }

  .references-section {
    text-align: center;
  }

  .reference-links {
    align-items: center;
  }

  .copyright {
    margin-top: 2rem;
    padding-top: 1.5rem;
  }
}
</style>
