<div align="center">

# Bangladesh Tax Calculator

![Bangladesh Tax Calculator: income tax for salaried people, FY 2024-25 vs 2025-26](https://raw.githubusercontent.com/nadimtuhin/tax-calculator/master/docs/images/hero.svg)

**Know your tax before you file.** Put in your salary and see the tax under both fiscal years, side by side.

[`Live demo`](https://tax.nadimtuhin.com) `Vue 3` [`MIT`](LICENSE) `★ 20`

</div>

<br>

Working out income tax by hand means slabs, rebates, and a new rule set each year. This app does the math for salaried people in Bangladesh and shows FY 2024-25 next to FY 2025-26, so you can see what changes for you. It runs in your browser and keeps your data local.

<br>

![Get started](https://raw.githubusercontent.com/nadimtuhin/tax-calculator/master/docs/images/h-start.svg)

**1. Open the app.** Go to [tax.nadimtuhin.com](https://tax.nadimtuhin.com). Nothing to install.

**2. Enter your numbers.** Pick a taxpayer profile (General, Female, Senior, Disabled, Freedom Fighter, Parent of Disabled Child, Third Gender), then add your salary and investments.

**3. Read the result.** You get the tax for each year, a breakdown, and what you save or pay extra under the new structure.

**Want to run it yourself?** You need Node 20 or newer and Yarn.

```bash
git clone https://github.com/nadimtuhin/tax-calculator.git
cd tax-calculator
yarn install
yarn dev
```

Open `http://localhost:8080`.

<br>

![What you get](https://raw.githubusercontent.com/nadimtuhin/tax-calculator/master/docs/images/h-how.svg)

**Two years, one screen.** FY 2024-25 and FY 2025-26 sit side by side, with the savings or extra tax shown for you.

**Your data stays with you.** Inputs are saved in your browser between visits. You can export and import them.

<br>

![Need help](https://raw.githubusercontent.com/nadimtuhin/tax-calculator/master/docs/images/h-help.svg)

<details>
<summary><code>yarn: command not found</code>, or an error about Node</summary>

Run `node -v`. You need 20 or newer, from [nodejs.org](https://nodejs.org). Install Yarn with `npm install -g yarn`, or run `npm install` and `npm run dev` instead.

</details>

<details>
<summary>Is my salary sent anywhere?</summary>

No. The calculation runs in your browser. The page loads Google Analytics for page views only.

</details>

<details>
<summary>Can I trust the result for filing?</summary>

The app follows the National Board of Revenue (NBR) guidelines, but check the final figure against the official rules or ask a tax professional before you file.

</details>

<br>

![For developers](https://raw.githubusercontent.com/nadimtuhin/tax-calculator/master/docs/images/h-dev.svg)

Everything below is reference. You don't need it to get started.

[Features](#-key-features) · [Scripts](#-available-scripts) · [Stack](#%EF%B8%8F-technical-stack) · [Structure](#-project-structure) · [Contributing](#-contributing) · [Roadmap](#-roadmap)

<p align="center">
  <strong>A modern, user-friendly web application for calculating income tax in Bangladesh</strong>
</p>

<p align="center">
  <a href="http://tax.nadimtuhin.com">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-Visit_Now-4CAF50?style=for-the-badge" alt="Live Demo">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat-square&logo=vue.js" alt="Vue 3">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/Maintained-yes-green?style=flat-square" alt="Maintained">
</p>


## ✨ Overview

Bangladesh Tax Calculator is a comprehensive Vue 3 application designed to help salaried individuals in Bangladesh calculate their income tax obligations accurately. Now featuring **dual tax comparison** between FY 2024-2025 and FY 2025-2026, this tool provides detailed breakdowns, investment tracking, and supports different taxpayer categories with side-by-side comparison of tax structures.

<div align="center">
  <table>
    <tr>
      <td align="center"><strong>🎯 Accurate</strong><br/>Follows official NBR guidelines</td>
      <td align="center"><strong>⚡ Fast</strong><br/>Instant calculations</td>
      <td align="center"><strong>📱 Responsive</strong><br/>Works on all devices</td>
      <td align="center"><strong>🔒 Private</strong><br/>All data stays local</td>
    </tr>
  </table>
</div>

## 🎯 Key Features

<table>
<tr>
<td width="50%">

### 💼 Tax Management
- ✅ **Dual tax comparison** FY 2024-25 vs 2025-26
- ✅ Side-by-side calculation display
- ✅ Multiple taxpayer profiles (General, Female, Senior, Disabled, Freedom Fighter, Parent of Disabled Child, Third Gender)
- ✅ Detailed salary component breakdown
- ✅ Investment tracking & progressive rebate rates
- ✅ TDS calculation support

</td>
<td width="50%">

### 🛠️ User Experience
- ✅ Clean, intuitive interface
- ✅ Real-time calculations
- ✅ Data persistence across sessions
- ✅ Export/Import functionality
- ✅ Mobile-optimized design

</td>
</tr>
</table>

## 🆕 What's New in v1.2.0

| Feature | Description |
|---------|-------------|
| ⚖️ **Dual Tax Comparison** | Side-by-side comparison of FY 2024-25 vs FY 2025-26 tax calculations |
| 📊 **Tax Structure Changes** | Reflects new thresholds, unified minimum tax, and progressive rebate rates |
| 💰 **Savings Calculator** | Shows tax savings or additional tax with new structure |
| 📱 **Responsive Comparison** | Mobile-optimized side-by-side or stacked layout |
| 🧪 **Comprehensive Testing** | Full test coverage for dual calculations and edge cases |

<details>
<summary><strong>Previous Updates (v1.1.0)</strong></summary>

| Feature | Description |
|---------|-------------|
| 🚀 **Vue 3 Migration** | Enhanced performance and modern development experience |
| 👥 **Taxpayer Profiles** | Support for different taxpayer categories with specific exemptions |
| 🎨 **Enhanced UI** | Improved navigation with quick action buttons |
| 🧪 **Better Testing** | Comprehensive unit and E2E test coverage |
| ⚡ **Performance** | Faster load times and improved reactivity |

</details>

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.0 or higher
- **npm** 8.0+ or **Yarn** 1.22+

### Installation

```bash
# Clone the repository
git clone https://github.com/nadimtuhin/tax-calculator.git
cd tax-calculator

# Install dependencies
yarn install

# Start development server
yarn dev
```

Visit `http://localhost:8080` to see the application running.

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server |
| `yarn build` | Build for production |
| `yarn test` | Run unit tests |
| `yarn test:e2e` | Run E2E tests |
| `yarn test:all` | Run all tests |
| `yarn lint` | Lint and fix files |

## 🏗️ Technical Stack

<table>
<tr>
<td align="center"><img src="https://vuejs.org/images/logo.png" width="50"><br><strong>Vue 3</strong></td>
<td align="center"><img src="https://user-images.githubusercontent.com/7110136/29002857-9e802f08-7ab4-11e7-9c31-604b5d0d0c19.png" width="50"><br><strong>Vuex 4</strong></td>
<td align="center"><img src="https://router.vuejs.org/logo.png" width="50"><br><strong>Vue Router 4</strong></td>
<td align="center"><img src="https://jestjs.io/img/jest.png" width="50"><br><strong>Jest</strong></td>
<td align="center"><img src="https://playwright.dev/img/playwright-logo.svg" width="50"><br><strong>Playwright</strong></td>
</tr>
</table>

## 📁 Project Structure

```
src/
├── 📂 components/          # Reusable Vue components
│   ├── 📄 Calculation-2024.vue    # FY 2024-25 calculations
│   ├── 📄 Calculation-2025.vue    # FY 2025-26 calculations
│   ├── 📄 TaxComparison.vue       # Dual comparison display
│   ├── 📄 Investment.vue
│   ├── 📄 TaxpayerProfile.vue
│   └── ...
├── 📂 pages/              # Page components
├── 📂 store/              # Vuex store modules
├── 📂 router/             # Vue Router configuration
├── 📂 utils/              # Utility functions
│   ├── 📄 taxSlabs.js             # FY 2024-25 tax logic
│   └── 📄 taxSlabs2025.js         # FY 2025-26 tax logic
├── 📄 calculateTaxBreakdown.js    # FY 2024-25 calculations
└── 📄 calculateTaxBreakdown2025.js # FY 2025-26 calculations
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

<details>
<summary><strong>Quick Contribution Steps</strong></summary>

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

</details>

## 📈 Roadmap

- [x] **Dual tax comparison** (FY 2024-25 vs 2025-26)
- [ ] Historical tax year comparisons
- [ ] Export comparison reports (PDF/Excel)
- [ ] Business income tax calculation
- [ ] Tax planning recommendations
- [ ] Multi-language support (Bengali)
- [ ] Chart visualizations for tax breakdown

## 📚 Documentation

- [Dual Tax Comparison Guide](DUAL_TAX_COMPARISON.md) - Comprehensive guide to the new comparison feature
- [API Documentation](docs/) - Technical implementation details
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute to the project

## 👨‍💻 Author

<div align="center">
  <img src="https://github.com/nadimtuhin.png" width="100" style="border-radius: 50%;">
  <h3>Nadim Tuhin</h3>
  <p>
    <a href="mailto:nadimtuhin@gmail.com">📧 Email</a> •
    <a href="https://github.com/nadimtuhin">🐙 GitHub</a>
  </p>
</div>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- National Board of Revenue (NBR) Bangladesh for tax guidelines
- Vue.js community for excellent documentation
- All contributors who have helped improve this project

---

<div align="center">
  <p>
    <strong>⭐ If this project helps you, please give it a star!</strong>
  </p>
  <p>
    <a href="https://github.com/nadimtuhin/tax-calculator/issues">Report Bug</a> •
    <a href="https://github.com/nadimtuhin/tax-calculator/issues">Request Feature</a>
  </p>
</div>