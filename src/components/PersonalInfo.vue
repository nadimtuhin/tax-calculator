<template>
  <div class="card shadow-sm border-0 mb-4">
    <div class="card-header bg-primary text-white py-3">
      <h5 class="mb-0">
        <i class="fas fa-user mr-2"></i>
        ব্যক্তিগত তথ্য / Personal Information
      </h5>
    </div>
    <div class="card-body p-4">
      <div class="row">
        <div class="col-md-6 mb-4">
          <label class="form-label font-weight-bold">
            <i class="fas fa-birthday-cake mr-2"></i>
            বয়স / Age
          </label>
          <input
            type="number"
            class="form-control form-control-lg shadow-sm"
            v-model="age"
            @input="updatePersonalInfo"
            min="0"
            max="150"
          />
        </div>
        <div class="col-md-6 mb-4">
          <label class="form-label font-weight-bold d-block">
            <i class="fas fa-venus-mars mr-2"></i>
            লিঙ্গ / Gender
          </label>
          <div class="custom-control custom-radio custom-control-inline">
            <input
              type="radio"
              id="genderMale"
              name="gender"
              class="custom-control-input"
              value="male"
              v-model="gender"
              @change="updatePersonalInfo"
            />
            <label class="custom-control-label" for="genderMale">
              পুরুষ / Male
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
              @change="updatePersonalInfo"
            />
            <label class="custom-control-label" for="genderFemale">
              মহিলা / Female
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
              @change="updatePersonalInfo"
            />
            <label class="custom-control-label" for="genderThird">
              তৃতীয় লিঙ্গ / Third Gender
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
                    @change="updatePersonalInfo"
                    id="disabilityCheck"
                  />
                  <label class="custom-control-label" for="disabilityCheck">
                    <i class="fas fa-wheelchair mr-2"></i>
                    প্রতিবন্ধী / Person with Disability
                  </label>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="custom-control custom-checkbox">
                  <input
                    type="checkbox"
                    class="custom-control-input"
                    v-model="isFreedomFighter"
                    @change="updatePersonalInfo"
                    id="freedomFighterCheck"
                  />
                  <label class="custom-control-label" for="freedomFighterCheck">
                    <i class="fas fa-medal mr-2"></i>
                    গেজেটভুক্ত যুদ্ধাহত মুক্তিযোদ্ধা / Gazetted Freedom Fighter
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
import { ref, onMounted } from 'vue';

export default {
  name: 'PersonalInfo',
  setup() {
    const store = useStore();
    const age = ref(30);
    const gender = ref('male');
    const isDisabled = ref(false);
    const isFreedomFighter = ref(false);

    const updatePersonalInfo = () => {
      store.commit('setPersonalInfo', {
        age: age.value,
        gender: gender.value,
        isDisabled: isDisabled.value,
        isFreedomFighter: isFreedomFighter.value
      });
    };

    onMounted(() => {
      updatePersonalInfo();
    });

    return {
      age,
      gender,
      isDisabled,
      isFreedomFighter,
      updatePersonalInfo
    };
  }
};
</script>
