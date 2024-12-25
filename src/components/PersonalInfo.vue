<template>
  <div class="card shadow-sm border-0 mb-4">
    <div class="card-header bg-primary text-white py-3">
      <h5 class="mb-0">
        <i class="fas fa-user mr-2"></i>
        {{ $t('personalInfo.title') }}
      </h5>
    </div>
    <div class="card-body p-4">
      <div class="row">
        <div class="col-md-6 mb-4">
          <label class="form-label font-weight-bold mb-2">
            <i class="fas fa-birthday-cake mr-2"></i>
            {{ $t('personalInfo.age') }}
          </label>
          <div class="input-group">
            <input
              type="number"
              class="form-control form-control-lg shadow-sm"
              v-model="age"
              min="0"
              max="150"
              placeholder="Enter your age"
            />
            <div class="input-group-append">
              <span class="input-group-text">years</span>
            </div>
          </div>
          <small class="text-muted mt-1 d-block">Default: 30 years</small>
        </div>
        <div class="col-md-6 mb-4">
          <label class="form-label font-weight-bold d-block mb-2">
            <i class="fas fa-venus-mars mr-2"></i>
            {{ $t('personalInfo.gender.label') }}
          </label>
          <div class="custom-control custom-radio custom-control-inline">
            <input
              type="radio"
              id="genderMale"
              name="gender"
              class="custom-control-input"
              value="male"
              v-model="gender"
            />
            <label class="custom-control-label" for="genderMale">
              {{ $t('personalInfo.gender.male') }}
            </label>
          </div>
          <div class="custom-control custom-radio custom-control-inline">
            <input
              type="radio"
              id="genderFemale"
              name="gender"
              class="custom-control-input"
              value="female"
              v-model="gender"
            />
            <label class="custom-control-label" for="genderFemale">
              {{ $t('personalInfo.gender.female') }}
            </label>
          </div>
          <div class="custom-control custom-radio custom-control-inline">
            <input
              type="radio"
              id="genderThird"
              name="gender"
              class="custom-control-input"
              value="third"
              v-model="gender"
            />
            <label class="custom-control-label" for="genderThird">
              {{ $t('personalInfo.gender.third') }}
            </label>
          </div>
        </div>
        <div class="col-12">
          <div class="border rounded p-4 bg-light">
            <div class="row">
              <div class="col-md-6 mb-3">
                <div class="custom-control custom-checkbox">
                  <input
                    type="checkbox"
                    class="custom-control-input"
                    v-model="isDisabled"
                    id="disabilityCheck"
                  />
                  <label class="custom-control-label" for="disabilityCheck">
                    <i class="fas fa-wheelchair mr-2"></i>
                    {{ $t('personalInfo.disability') }}
                  </label>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="custom-control custom-checkbox">
                  <input
                    type="checkbox"
                    class="custom-control-input"
                    v-model="isFreedomFighter"
                    id="freedomFighterCheck"
                  />
                  <label class="custom-control-label" for="freedomFighterCheck">
                    <i class="fas fa-medal mr-2"></i>
                    {{ $t('personalInfo.freedomFighter') }}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useStore } from 'vuex';
import { computed, onMounted } from 'vue';

export default {
  name: 'PersonalInfo',
  setup() {
    const store = useStore();

    const age = computed({
      get: () => store.state.personalInfo.age,
      set: (value) => {
        store.commit('personalInfo/setAge', value);
      }
    });

    const gender = computed({
      get: () => store.state.personalInfo.gender,
      set: (value) => {
        store.commit('personalInfo/setGender', value);
      }
    });

    const isDisabled = computed({
      get: () => store.state.personalInfo.isDisabled,
      set: (value) => {
        store.commit('personalInfo/setDisabled', value);
      }
    });

    const isFreedomFighter = computed({
      get: () => store.state.personalInfo.isFreedomFighter,
      set: (value) => {
        store.commit('personalInfo/setFreedomFighter', value);
      }
    });

    return {
      age,
      gender,
      isDisabled,
      isFreedomFighter
    };
  }
};
</script>
