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
import { mapGetters, mapMutations } from 'vuex';

export default {
  name: 'PersonalInfo',
  computed: {
    ...mapGetters('personalInfo', {
      storeAge: 'age',
      storeGender: 'gender',
      storeIsDisabled: 'isDisabled',
      storeIsFreedomFighter: 'isFreedomFighter'
    }),
    age: {
      get() {
        return this.storeAge;
      },
      set(value) {
        this.setAge(value);
      }
    },
    gender: {
      get() {
        return this.storeGender;
      },
      set(value) {
        this.setGender(value);
      }
    },
    isDisabled: {
      get() {
        return this.storeIsDisabled;
      },
      set(value) {
        this.setDisabled(value);
      }
    },
    isFreedomFighter: {
      get() {
        return this.storeIsFreedomFighter;
      },
      set(value) {
        this.setFreedomFighter(value);
      }
    }
  },
  methods: {
    ...mapMutations('personalInfo', [
      'setAge',
      'setGender',
      'setDisabled',
      'setFreedomFighter'
    ])
  }
};
</script>
