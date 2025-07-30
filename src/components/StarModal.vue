<template>
  <div>
    <!-- Debug info -->
    <div v-if="debugMode" style="position: fixed; top: 10px; right: 10px; background: red; color: white; padding: 10px; z-index: 9999;">
      Debug: showModal = {{ showModal }}
      <br>
      <button @click="forceShow" style="margin-top: 5px; padding: 5px; background: white; color: black; border: none; cursor: pointer;">
        Show Modal
      </button>
      <button @click="clearModalData" style="margin-top: 5px; margin-left: 5px; padding: 5px; background: white; color: black; border: none; cursor: pointer;">
        Clear Data
      </button>
    </div>
    
    <div v-show="showModal" class="star-modal-overlay" @click="closeModal">
      <div class="star-modal" @click.stop>
      <button class="close-btn" @click="closeModal">&times;</button>
      
      <div class="modal-content">
        <div class="star-icon">⭐</div>
        <h2>Enjoying the Bangladesh Tax Calculator?</h2>
        <p>
          If this tool has been helpful for calculating your taxes, 
          please consider giving us a star on GitHub! 
        </p>
        <p class="sub-text">
          Your support helps us improve and reach more people who need this tool.
        </p>
        
        <div class="modal-actions">
          <a 
            href="https://github.com/nadimtuhin/tax-calculator" 
            target="_blank" 
            rel="noopener noreferrer"
            class="star-btn"
            @click="handleStarClick"
          >
            <svg class="github-icon" viewBox="0 0 16 16" width="16" height="16">
              <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            Star on GitHub
          </a>
          
          <button class="later-btn" @click="remindLater">
            Maybe Later
          </button>
          
          <button class="never-btn" @click="neverShow">
            Don't Show Again
          </button>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StarModal',
  data() {
    return {
      showModal: false,
      debugMode: false
    }
  },
  mounted() {
    this.checkIfShouldShow()
    document.addEventListener('keydown', this.handleKeydown)
    // Make the forceShow method globally accessible for debugging
    window.showStarModal = this.forceShow
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown)
    // Clean up global reference
    if (window.showStarModal === this.forceShow) {
      delete window.showStarModal
    }
  },
  methods: {
    // Method for testing - can be called from browser console
    forceShow() {
      this.showModal = true
    },
    
    // Clear all localStorage for testing
    clearModalData() {
      localStorage.removeItem('tax-calculator-visited')
      localStorage.removeItem('tax-calculator-never-star')
      localStorage.removeItem('tax-calculator-star-reminded')
      localStorage.removeItem('tax-calculator-starred')
    },
    
    checkIfShouldShow() {
      try {
        const hasVisited = localStorage.getItem('tax-calculator-visited')
        const neverShow = localStorage.getItem('tax-calculator-never-star')
        const lastReminded = localStorage.getItem('tax-calculator-star-reminded')
        const hasStarred = localStorage.getItem('tax-calculator-starred')
        
        // Don't show if user chose "never show again" or already starred
        if (neverShow === 'true' || hasStarred === 'true') {
          return
        }
        
        // Show if first visit
        if (!hasVisited) {
          // Reduced delay for better UX
          setTimeout(() => {
            this.showModal = true
          }, 1500)
          localStorage.setItem('tax-calculator-visited', 'true')
          return
        }
        
        // Show again after 7 days if they clicked "maybe later"
        if (lastReminded) {
          const reminderDate = new Date(lastReminded)
          const now = new Date()
          const daysDiff = Math.floor((now - reminderDate) / (1000 * 60 * 60 * 24))
          
          if (daysDiff >= 7) {
            setTimeout(() => {
              this.showModal = true
            }, 1000)
          }
        }
      } catch (error) {
        // Handle localStorage errors (private browsing, etc.)
        console.warn('StarModal: localStorage not available')
      }
    },
    
    closeModal() {
      this.showModal = false
    },
    
    handleKeydown(event) {
      if (event.key === 'Escape' && this.showModal) {
        this.closeModal()
      }
    },
    
    handleStarClick() {
      // User clicked star, don't show again
      localStorage.setItem('tax-calculator-starred', 'true')
      localStorage.removeItem('tax-calculator-star-reminded')
      this.closeModal()
    },
    
    remindLater() {
      // Set reminder for 7 days from now
      localStorage.setItem('tax-calculator-star-reminded', new Date().toISOString())
      this.closeModal()
    },
    
    neverShow() {
      // User doesn't want to see this again
      localStorage.setItem('tax-calculator-never-star', 'true')
      localStorage.removeItem('tax-calculator-star-reminded')
      this.closeModal()
    }
  }
}
</script>

<style scoped>
.star-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.star-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 480px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: modalSlideIn 0.3s ease-out;
  color: #2c3e50;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.star-modal * {
  color: inherit;
  font-family: inherit;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover,
.close-btn:focus {
  background-color: #f5f5f5;
  color: #333;
  outline: none;
}

.close-btn:focus {
  box-shadow: 0 0 0 2px #007bff;
}

.modal-content {
  padding: 40px 30px 30px;
  text-align: center;
}

.star-icon {
  font-size: 48px;
  margin-bottom: 20px;
  animation: starPulse 4s infinite;
}

@keyframes starPulse {
  0%, 95% { transform: scale(1); }
  97.5% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.modal-content h2 {
  color: #2c3e50;
  margin-bottom: 16px;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.modal-content p {
  color: #2d3748;
  line-height: 1.6;
  margin-bottom: 12px;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.sub-text {
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 25px;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.star-btn {
  background: linear-gradient(135deg, #24292e 0%, #2f363d 100%);
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  font-size: 16px;
  min-width: 160px;
  justify-content: center;
}

.star-btn:hover,
.star-btn:focus {
  background: linear-gradient(135deg, #2f363d 0%, #24292e 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(36, 41, 46, 0.3);
  color: white;
  outline: none;
}

.star-btn:focus {
  box-shadow: 0 0 0 2px #007bff, 0 4px 12px rgba(36, 41, 46, 0.3);
}

.star-btn *,
.star-btn:hover *,
.star-btn:focus * {
  color: white;
}

.github-icon {
  width: 18px;
  height: 18px;
}

.later-btn {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #495057;
  padding: 12px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  min-width: 120px;
}

.never-btn {
  background: none;
  border: none;
  color: #6c757d;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
  min-width: 100px;
  text-decoration: underline;
}

.later-btn:hover,
.later-btn:focus {
  background-color: #ffffff;
  border-color: #007bff;
  color: #007bff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.never-btn:hover,
.never-btn:focus {
  color: #495057;
  text-decoration: none;
  background-color: #f8f9fa;
  outline: none;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .star-modal {
    margin: 20px;
    width: calc(100% - 40px);
  }
  
  .modal-content {
    padding: 30px 20px 25px;
  }
  
  .modal-content h2 {
    font-size: 20px;
  }
  
  .modal-content p {
    font-size: 15px;
  }
  
  .star-btn {
    font-size: 15px;
    padding: 14px 24px;
    min-width: 180px;
  }
  
  .later-btn {
    padding: 14px 24px;
    font-size: 14px;
    min-width: 140px;
  }
  
  .never-btn {
    padding: 12px 20px;
    font-size: 13px;
    min-width: 120px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .star-modal {
    background: #212529;
    color: #e9ecef;
  }
  
  .modal-content h2 {
    color: #2c3e50;
  }
  
  .modal-content p {
    color: #2d3748;
  }
  
  .sub-text {
    color: #4a5568;
  }
  
  .close-btn {
    color: #adb5bd;
  }
  
  .close-btn:hover,
  .close-btn:focus {
    background-color: #343a40;
    color: #f8f9fa;
  }
  
  .later-btn {
    background: #343a40;
    border-color: #495057;
    color: #e9ecef;
  }
  
  .later-btn:hover,
  .later-btn:focus {
    background-color: #495057;
    border-color: #6f42c1;
    color: #fff;
    box-shadow: 0 0 0 2px rgba(111, 66, 193, 0.25);
  }
  
  .never-btn {
    color: #adb5bd;
  }
  
  .never-btn:hover,
  .never-btn:focus {
    background-color: #343a40;
    color: #e9ecef;
  }
}
</style>