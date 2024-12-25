<template>
  <div class="home py-4">
    <div class="container">
      <section class="mb-5">
        <Salaries />
      </section>

      <section class="mb-5">
        <div class="row g-4">
          <div class="col-md-6">
            <taxable-income />
          </div>
          <div class="col-md-6">
            <investment />
          </div>
        </div>
      </section>

      <section class="mb-4">
        <div class="row">
          <div class="col-12">
            <current />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import Current from "@/components/Calculation-2023";
import Salaries from "@/components/Salaries";
import Investment from "@/components/Investment";
import TaxableIncome from "@/components/TaxableIncome";

export default {
  name: "Historical-2023",
  data: () => ({}),
  components: {
    Current,
    Salaries,
    TaxableIncome,
    Investment,
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
