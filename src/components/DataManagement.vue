<template>
  <div class="data-management">
    <!-- Data Management Modal -->
    <div class="modal fade" :class="{ 'show': show }" tabindex="-1" :style="{ display: show ? 'block' : 'none' }">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title text-dark">{{ $t('nav.dataManagement') }}</h5>
            <button type="button" class="btn-close" @click="closeModal">
              <i class="bi bi-x"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="d-grid gap-3">
              <button class="btn btn-primary w-100 d-flex align-items-center justify-content-center" @click="exportData" style="margin-bottom: 5px;">
                <i class="bi bi-download me-2"></i>
                {{ $t('actions.export') }}
              </button>
              <button class="btn btn-info text-white w-100 d-flex align-items-center justify-content-center" @click="triggerFileInput" style="margin-bottom: 5px;">
                <i class="bi bi-upload me-2"></i>
                {{ $t('actions.import') }}
              </button>
              <button class="btn btn-danger w-100 d-flex align-items-center justify-content-center" @click="confirmReset" style="margin-bottom: 5px;">
                <i class="bi bi-trash me-2"></i>
                {{ $t('actions.reset') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade" :class="{ 'show': show }" v-if="show"></div>
    <input type="file" ref="fileInput" @change="importData" accept=".json" style="display: none;">
  </div>
</template>

<script>
export default {
  name: "DataManagement",
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleEscape);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleEscape);
  },
  methods: {
    handleEscape(event) {
      if (event.key === 'Escape' && this.show) {
        this.closeModal();
      }
    },
    closeModal() {
      this.$emit('update:show', false);
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
      this.closeModal();
    },
    exportData() {
      const data = {
        salaries: this.$store.state.salaries.months,
        investments: this.$store.state.investments,
        bonuses: this.$store.state.salaries.bonuses,
        otherIncomes: this.$store.state.salaries.otherIncomes,
        personalInfo: this.$store.state.personalInfo,
      };
      const fileName = 'salary-investment-data-'+this.$store.state.personalInfo.fiscalYear+'-'+new Date().getTime()+'.json';
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      this.closeModal();
    },
    confirmReset() {
      if (confirm(this.$t('messages.confirmReset'))) {
        this.resetData();
      }
    },
    resetData() {
      this.$store.commit('salaries/resetSalaries');
      this.$store.commit('salaries/resetBonuses');
      this.$store.commit('salaries/resetOtherIncomes');
      this.$store.commit('investments/resetInvestments');
      this.$store.commit('personalInfo/resetPersonalInfo');
      alert(this.$t('messages.dataReset'));
      this.closeModal();
    },
    importData(event) {
      const file = event.target.files[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        if (data.salaries) {
          this.$store.commit('salaries/loadSalaries', data.salaries);
        }
        if (data.investments) {
          this.$store.commit('investments/loadInvestments', data.investments);
        }
        if (data.bonuses) {
          this.$store.commit('salaries/loadBonuses', data.bonuses);
        }
        if (data.otherIncomes) {
          this.$store.commit('salaries/loadOtherIncomes', data.otherIncomes);
        }
        if (data.personalInfo) {
          this.$store.commit('personalInfo/setPersonalInfo', data.personalInfo);
        }
        alert(this.$t('messages.importSuccess'));
      };
      reader.readAsText(file);
    }
  }
};
</script>

<style scoped>
/* Modal Styles */
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.modal-header {
  background: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.modal-body {
  padding: 1.5rem;
}

.modal-header .modal-title {
  font-weight: 600;
  color: #2c3e50;
}

.btn-close {
  opacity: 0.5;
  transition: all 0.2s ease;
}

.btn-close:hover {
  opacity: 1;
}

/* Modal Action Buttons */
.modal-body .btn {
  padding: 1rem 1.5rem;
  font-weight: 500;
  border-radius: 12px;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.9rem;
}

.modal-body .btn:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.modal-body .btn-primary {
  background: linear-gradient(135deg, #4a90e2 0%, #2c3e94 100%);
  border: none;
}

.modal-body .btn-info {
  background: linear-gradient(135deg, #17a2b8 0%, #0f6674 100%);
  border: none;
}

.modal-body .btn-danger {
  background: linear-gradient(135deg, #dc3545 0%, #b21f2d 100%);
  border: none;
}

.modal.fade .modal-dialog {
  transform: scale(0.95);
  transition: transform 0.2s ease-out;
}

.modal.show .modal-dialog {
  transform: scale(1);
}

.modal-backdrop.fade {
  opacity: 0;
  transition: opacity 0.2s linear;
}

.modal-backdrop.show {
  opacity: 0.5;
}
</style>
