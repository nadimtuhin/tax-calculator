<template>
  <div id="app" class="container">
    <h1>Step 1:</h1>
    <salaries/>
    <h1>Step 2:</h1>
    <taxable-income />
    <h1>Step 3:</h1>
    <proposed/>
    <current/>
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
