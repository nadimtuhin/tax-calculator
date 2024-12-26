<template>
  <div class="tax-guide container py-5">
    <h1 class="display-4 text-center mb-4 pb-3 border-bottom">How to Calculate Income Tax in Bangladesh (2023-2024)</h1>

    <div class="row">
      <div class="col-12 mb-4">
        <div class="card shadow">
          <div class="card-body">
            <h2 class="card-title h3 text-primary mb-4">
              <i class="fas fa-calculator align-middle mr-2"></i>
              Basic Steps of Tax Calculation
            </h2>
            <ol class="pl-3">
              <li class="mb-3">Calculate your total taxable income from all sources</li>
              <li class="mb-3">Identify your taxpayer category (resident or non-resident)</li>
              <li class="mb-3">Apply the appropriate tax rates to your income slabs</li>
              <li class="mb-3">Calculate tax rebates and deductions</li>
              <li class="mb-3">Determine your final tax liability</li>
            </ol>
          </div>
        </div>
      </div>

      <div class="col-12 mb-4">
        <div class="card shadow">
          <div class="card-body">
            <h2 class="card-title h3 text-primary mb-4">
              <i class="fas fa-table align-middle mr-2"></i>
              Income Tax Slabs (2023-2024)
            </h2>
            <div class="table-responsive">
              <table class="table table-hover">
                <thead class="bg-light">
                  <tr>
                    <th class="border-top-0">Income Range (BDT)</th>
                    <th class="border-top-0">Tax Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>First 350,000</td>
                    <td class="text-success font-weight-bold">0%</td>
                  </tr>
                  <tr>
                    <td>Next 100,000</td>
                    <td class="text-primary font-weight-bold">5%</td>
                  </tr>
                  <tr>
                    <td>Next 300,000</td>
                    <td class="text-primary font-weight-bold">10%</td>
                  </tr>
                  <tr>
                    <td>Next 400,000</td>
                    <td class="text-primary font-weight-bold">15%</td>
                  </tr>
                  <tr>
                    <td>Next 500,000</td>
                    <td class="text-primary font-weight-bold">20%</td>
                  </tr>
                  <tr>
                    <td>Rest Amount</td>
                    <td class="text-primary font-weight-bold">25%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 mb-4">
        <div class="card shadow">
          <div class="card-body">
            <h2 class="card-title h3 text-primary mb-4">
              <i class="fas fa-piggy-bank align-middle mr-2"></i>
              Tax-Free Income Threshold
            </h2>
            <div class="row">
              <div class="col-md-6 mb-4">
                <div class="card bg-light">
                  <div class="card-body">
                    <h3 class="h5 mb-3">General taxpayers</h3>
                    <p class="h3 text-primary mb-0">BDT 350,000</p>
                  </div>
                </div>
              </div>
              <div class="col-md-6 mb-4">
                <div class="card bg-light">
                  <div class="card-body">
                    <h3 class="h5 mb-3">Women and senior citizens (65+)</h3>
                    <p class="h3 text-primary mb-0">BDT 400,000</p>
                  </div>
                </div>
              </div>
              <div class="col-md-6 mb-4">
                <div class="card bg-light">
                  <div class="card-body">
                    <h3 class="h5 mb-3">Persons with disabilities</h3>
                    <p class="h3 text-primary mb-0">BDT 450,000</p>
                  </div>
                </div>
              </div>
              <div class="col-md-6 mb-4">
                <div class="card bg-light">
                  <div class="card-body">
                    <h3 class="h5 mb-3">War-wounded freedom fighters</h3>
                    <p class="h3 text-primary mb-0">BDT 475,000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 mb-4">
        <div class="card shadow">
          <div class="card-body">
            <h2 class="card-title h3 text-primary mb-4">
              <i class="fas fa-info-circle align-middle mr-2"></i>
              Important Notes
            </h2>
            <div class="mb-4">
              <div class="card bg-light mb-3">
                <div class="card-body">
                  <h3 class="h5 mb-3">Minimum Tax by Location</h3>
                  <ul class="list-unstyled">
                    <li class="mb-2">
                      <i class="fas fa-city align-middle text-primary mr-2"></i>
                      Dhaka and Chattogram City Corporations: BDT 5,000
                    </li>
                    <li class="mb-2">
                      <i class="fas fa-city align-middle text-primary mr-2"></i>
                      Other City Corporations: BDT 4,000
                    </li>
                    <li class="mb-2">
                      <i class="fas fa-map-marker-alt align-middle text-primary mr-2"></i>
                      Other areas: BDT 3,000
                    </li>
                  </ul>
                </div>
              </div>
              <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle align-middle mr-2"></i>
                Tax returns must be submitted within the specified deadline to avoid penalties
              </div>
              <div class="alert alert-success">
                <i class="fas fa-check-circle align-middle mr-2"></i>
                Various tax rebates are available for investments in approved sectors
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 mb-4">
        <div class="card shadow">
          <div class="card-body">
            <h2 class="card-title h3 text-primary mb-4">
              <i class="fas fa-calculator align-middle mr-2"></i>
              Tax Calculation Example
            </h2>
            <div class="card bg-light">
              <div class="card-body">
                <p class="mb-4">For a person with total taxable income of <span class="font-weight-bold text-primary">BDT 800,000</span>:</p>
                <div class="list-group">
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>First 350,000 × 0%</span>
                    <span class="font-weight-bold">= 0</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Next 100,000 × 5%</span>
                    <span class="font-weight-bold">= 5,000</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Next 300,000 × 10%</span>
                    <span class="font-weight-bold">= 30,000</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Remaining 50,000 × 15%</span>
                    <span class="font-weight-bold">= 7,500</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center bg-primary text-white">
                    <span class="font-weight-bold">Total Tax</span>
                    <span class="font-weight-bold">BDT 42,500</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 mb-4">
        <div class="card shadow">
          <div class="card-body">
            <h2 class="card-title h3 text-primary mb-4">
              <i class="fas fa-piggy-bank align-middle mr-2"></i>
              Tax Rebate Calculation Guide
            </h2>
            <div class="card bg-light mb-4">
              <div class="card-body">
                <h3 class="h5 mb-3">How Rebates Work</h3>
                <ol class="pl-3">
                  <li class="mb-2">Calculate 3% of your taxable income</li>
                  <li class="mb-2">Calculate 15% of your total investments</li>
                  <li class="mb-2">Consider the fixed amount of BDT 10,00,000</li>
                  <li class="mb-2">Choose the lowest amount from above three</li>
                  <li class="mb-2">Add any Advance Income Tax (AIT) paid</li>
                  <li class="mb-2">Subtract total rebate from initial tax for net tax</li>
                </ol>
              </div>
            </div>

            <div class="card bg-light">
              <div class="card-body">
                <h3 class="h5 mb-3">Rebate Calculation Example</h3>
                <p class="mb-4">For a person with:</p>
                <ul class="mb-4">
                  <li>Taxable Income: BDT 9,50,000</li>
                  <li>Total Investment: BDT 8,00,000</li>
                  <li>Initial Tax: BDT 65,000</li>
                  <li>Advance Income Tax: BDT 18,000</li>
                </ul>

                <div class="list-group">
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>3% of Taxable Income (9,50,000 × 3%)</span>
                    <span class="font-weight-bold">= 28,500</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>15% of Investment (8,00,000 × 15%)</span>
                    <span class="font-weight-bold">= 1,20,000</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Fixed Amount</span>
                    <span class="font-weight-bold">= 10,00,000</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center bg-info text-white">
                    <span>Lowest Amount (Selected)</span>
                    <span class="font-weight-bold">= 28,500</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Add Advance Income Tax</span>
                    <span class="font-weight-bold">+ 18,000</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center bg-success text-white">
                    <span class="font-weight-bold">Total Rebate</span>
                    <span class="font-weight-bold">= 46,500</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Initial Tax</span>
                    <span class="font-weight-bold">65,000</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Subtract Total Rebate</span>
                    <span class="font-weight-bold">- 46,500</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center bg-primary text-white">
                    <span class="font-weight-bold">Final Net Tax</span>
                    <span class="font-weight-bold">= 18,500</span>
                  </div>
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
export default {
  name: 'TaxCalculationGuide'
}
</script>

<style scoped>
.tax-guide {
  max-width: 1200px;
}

.fas {
  vertical-align: middle;
  font-size: 1.2rem;
}
</style>
