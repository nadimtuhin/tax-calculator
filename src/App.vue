<template>
  <div id="app" class="container">
    <div class="row">
      <div class="col col-8">
        <h2>Enter salary information</h2>
        <salaries/>
      </div>
      <div class="w-100"></div>
      <div class="col col-7">
        <h2>Taxable income breakdown</h2>
        <taxable-income />
      </div>
    </div>
    <hr>
    <div class="row">
      <div class="col-sm">
        <proposed/>
      </div>
      <div class="col-sm">
        <current/>
      </div>
    </div>
  </div>
</template>

<script>
import Proposed from "./components/Proposed";
import Current from "./components/Current";
import SalaryBreakdown from "./components/SalaryBreakdown";
import Salaries from "./components/Salaries";
import TaxableIncome from "./components/TaxableIncome";

export default {
  name: "App",
  data: () => ({}),
  components: {
    Proposed,
    Current,
    Salaries,
    TaxableIncome,
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
  margin-top: 60px;
}
</style>
