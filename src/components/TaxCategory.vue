<template>
  <fieldset class="card-panel fade-in">
    <legend class="flow-text">Category and Tax-Free Slab</legend>
    <p>Select Your Category:</p>
    <p class="description">Choose your category to determine your applicable tax-free slab.</p>

    <div class="category-options">
      <p>
        <label>
          <input
            type="radio"
            name="category"
            :checked="isGeneralCategory"
            @change="setGeneralCategory"
          >
          <span>General Man - BDT 350,000</span>
        </label>
      </p>
      <p>
        <label>
          <input
            type="radio"
            name="category"
            :checked="gender === 'female'"
            @change="setGender('female')"
          >
          <span>Woman - BDT 400,000</span>
        </label>
      </p>
      <p>
        <label>
          <input
            type="radio"
            name="category"
            :checked="age >= 65"
            @change="setSenior"
          >
          <span>65 years or older citizen - BDT 400,000</span>
        </label>
      </p>
      <p>
        <label>
          <input
            type="radio"
            name="category"
            :checked="isDisabled"
            @change="setDisabled(!isDisabled)"
          >
          <span>Physical or Mental unfit person - BDT 475,000</span>
        </label>
      </p>
      <p>
        <label>
          <input
            type="radio"
            name="category"
            :checked="isFreedomFighter"
            @change="setFreedomFighter(!isFreedomFighter)"
          >
          <span>Gazetted Freedom Fighter - BDT 500,000</span>
        </label>
      </p>
      <p>
        <label>
          <input
            type="radio"
            name="category"
            :checked="isThirdGender"
            @change="setThirdGender(!isThirdGender)"
          >
          <span>Third Gender - BDT 475,000</span>
        </label>
      </p>
    </div>
  </fieldset>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'tax-category',
  computed: {
    ...mapGetters('personalInfo', [
      'age',
      'gender',
      'isDisabled',
      'isFreedomFighter',
      'isThirdGender'
    ]),
    isGeneralCategory() {
      return this.gender === 'male' &&
             this.age < 65 &&
             !this.isDisabled &&
             !this.isFreedomFighter &&
             !this.isThirdGender;
    }
  },
  methods: {
    setGeneralCategory() {
      this.$store.commit('personalInfo/setGender', 'male');
      this.$store.commit('personalInfo/setAge', 30);
      this.$store.commit('personalInfo/setDisabled', false);
      this.$store.commit('personalInfo/setFreedomFighter', false);
      this.$store.commit('personalInfo/setThirdGender', false);
    },
    setGender(gender) {
      this.$store.commit('personalInfo/setGender', gender);
      this.$store.commit('personalInfo/setThirdGender', false);
    },
    setSenior() {
      this.$store.commit('personalInfo/setAge', 65);
    },
    setDisabled(value) {
      this.$store.commit('personalInfo/setDisabled', value);
      if (value) {
        this.$store.commit('personalInfo/setFreedomFighter', false);
        this.$store.commit('personalInfo/setThirdGender', false);
      }
    },
    setFreedomFighter(value) {
      this.$store.commit('personalInfo/setFreedomFighter', value);
      if (value) {
        this.$store.commit('personalInfo/setDisabled', false);
        this.$store.commit('personalInfo/setThirdGender', false);
      }
    },
    setThirdGender(value) {
      this.$store.commit('personalInfo/setThirdGender', value);
      if (value) {
        this.$store.commit('personalInfo/setDisabled', false);
        this.$store.commit('personalInfo/setFreedomFighter', false);
      }
    }
  }
};
</script>

<style scoped>
.card-panel {
  padding: 20px;
  margin: 20px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.description {
  color: #666;
  margin-bottom: 20px;
}

.category-options {
  margin-top: 15px;
}

.category-options p {
  margin: 10px 0;
}

label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

input[type="radio"] {
  margin-right: 10px;
}
</style>
