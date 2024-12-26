<template>
  <div class="contact-page">
    <div class="page-header">
      <span class="pre-title">{{ $t('contact.preTitle') }}</span>
      <h1>{{ $t('contact.title') }}</h1>
      <p class="subtitle">{{ $t('contact.subtitle') }}</p>
    </div>

    <div class="contact-container">
      <div class="contact-info">
        <div class="info-card">
          <span class="section-label">{{ $t('contact.info.title') }}</span>
          <h2>{{ $t('contact.info.subtitle') }}</h2>
          <p class="info-subtitle">{{ $t('contact.info.description') }}</p>

          <div class="contact-methods">
            <div class="contact-method">
              <div class="icon">📧</div>
              <div class="details">
                <h3>{{ $t('contact.info.email') }}</h3>
                <a :href="`mailto:${contactInfo.email}`">{{ contactInfo.email }}</a>
              </div>
            </div>
            <div class="contact-method">
              <div class="icon">📞</div>
              <div class="details">
                <h3>{{ $t('contact.info.phone') }}</h3>
                <a :href="`tel:${contactInfo.phone}`">{{ contactInfo.phone }}</a>
              </div>
            </div>
            <div class="contact-method">
              <div class="icon">⏰</div>
              <div class="details">
                <h3>{{ $t('contact.info.hours.title') }}</h3>
                <p>{{ contactInfo.businessHours.days }}: {{ contactInfo.businessHours.time }}</p>
                <span class="timezone">{{ contactInfo.businessHours.timezone }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="contact-form">
        <div class="form-card">
          <span class="section-label">{{ $t('contact.form.title') }}</span>
          <h2>{{ $t('contact.form.subtitle') }}</h2>
          <p class="form-subtitle">{{ $t('contact.form.description') }}</p>

          <form @submit.prevent="submitForm">
            <div v-for="(field, key) in formFields" :key="key" class="form-group">
              <label :for="key">
                {{ field.label }}
                <span v-if="field.required" class="required">*</span>
              </label>
              <template v-if="field.type === 'textarea'">
                <textarea
                  :id="key"
                  v-model="formData[key]"
                  :placeholder="field.placeholder"
                  :required="field.required"
                  rows="4"
                ></textarea>
              </template>
              <template v-else>
                <input
                  :type="field.type"
                  :id="key"
                  v-model="formData[key]"
                  :placeholder="field.placeholder"
                  :required="field.required"
                >
              </template>
            </div>

            <button type="submit">
              Send Message
              <span class="button-icon">→</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { contactInfo, formFields } from '../config/contact'

export default {
  name: 'Contact',
  data() {
    return {
      contactInfo,
      formFields,
      formData: {
        name: '',
        email: '',
        phone: '',
        message: ''
      }
    }
  },
  methods: {
    submitForm() {
      console.log('Form submitted:', this.formData)
      this.formData = {
        name: '',
        email: '',
        phone: '',
        message: ''
      }
      alert('Thank you for your message. We will get back to you soon!')
    }
  }
}
</script>

<style scoped>
.contact-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
  color: #2c3e50;
}

.page-header {
  text-align: center;
  margin-bottom: 60px;
}

.pre-title {
  display: block;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #42b983;
  margin-bottom: 16px;
}

.page-header h1 {
  font-size: 3rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 16px;
  line-height: 1.2;
}

.subtitle {
  font-size: 1.25rem;
  color: #4a5568;
  margin: 0;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.contact-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
  margin-top: 40px;
}

@media (min-width: 768px) {
  .contact-container {
    grid-template-columns: 1fr 1.5fr;
  }
}

.info-card, .form-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),
              0 10px 15px rgba(0, 0, 0, 0.1);
}

.section-label {
  display: inline-block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #42b983;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 16px;
}

.info-card h2, .form-card h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 12px;
  line-height: 1.3;
}

.info-subtitle, .form-subtitle {
  color: #4a5568;
  font-size: 1.1rem;
  margin-bottom: 32px;
  line-height: 1.6;
}

.contact-methods {
  margin-top: 40px;
}

.contact-method {
  display: flex;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid #e2e8f0;
}


.contact-method .details {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
  width: 100%;
}

.icon {
  font-size: 28px;
  margin-right: 20px;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.details h3 {
  margin: 0 0 8px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.details p, .details a {
  margin: 0;
  color: #4a5568;
  text-decoration: none;
  font-size: 1.1rem;
  line-height: 1.6;
}

.timezone {
  display: block;
  font-size: 0.875rem;
  color: #718096;
  margin-top: 4px;
}

.details a:hover {
  color: #42b983;
}

.form-group {
  margin-bottom: 24px;
  position: relative;
}

label {
  display: inline-flex;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
  color: #1a202c;
  font-size: 0.95rem;
}

.required {
  color: #e53e3e;
  margin-left: 4px;
  font-size: 1.1rem;
  line-height: 1;
}

input, textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  color: #1a202c;
  background: #f8fafc;
}

input::placeholder, textarea::placeholder {
  color: #a0aec0;
  font-size: 0.95rem;
}

input:hover, textarea:hover {
  border-color: #cbd5e0;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
  background: white;
}

button {
  background-color: #42b983;
  color: white;
  padding: 16px 32px;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 32px;
}

.button-icon {
  margin-left: 12px;
  transition: transform 0.3s ease;
}

button:hover {
  background-color: #3aa876;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.2);
}

button:hover .button-icon {
}

button:active {
}

@media (max-width: 640px) {
  .page-header h1 {
    font-size: 2.5rem;
  }

  .info-card, .form-card {
    padding: 30px;
  }

  .contact-method {
    margin-bottom: 24px;
    padding-bottom: 24px;
  }
}
</style>
