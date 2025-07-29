<template>
  <div id="app" class="container">
    <Salaries />
    <div class="row" style="margin-top: 100px">
      <div class="col-sm">
        <taxable-income />
      </div>
      <div class="col-sm">
        <investment />
      </div>
    </div>
    <div class="row" style="margin-top: 100px">
      <div class="col-sm">
        <current />
      </div>
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
  margin-top: 0;
}
</style>
