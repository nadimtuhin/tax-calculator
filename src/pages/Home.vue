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
import Current from "../components/Calculation-2024";
import SalaryBreakdown from "../components/SalaryBreakdown";
import Salaries from "../components/Salaries";
import Investment from "../components/Investment";
import TaxableIncome from "../components/TaxableIncome";

export default {
  name: "Home",
  components: {
    Current,
    Salaries,
    TaxableIncome,
    Investment,
  }
};
</script>

<style>
.home {
  min-height: calc(100vh - 70px); /* Adjust based on navbar height */
  background-color: #f8f9fa;
}
</style>
