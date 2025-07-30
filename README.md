<div align="center">
  
# 🇧🇩 Bangladesh Tax Calculator

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

</div>

---

## ✨ Overview

Bangladesh Tax Calculator is a comprehensive Vue 3 application designed to help salaried individuals in Bangladesh calculate their income tax obligations accurately. Supporting both 2023 and 2024 tax years, this tool provides detailed breakdowns, investment tracking, and supports different taxpayer categories.

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
- ✅ Support for 2023 & 2024 tax years
- ✅ Multiple taxpayer profiles (General, Women/Senior, Disabled, Freedom Fighter)
- ✅ Detailed salary component breakdown
- ✅ Investment tracking & tax credits
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

## 🆕 What's New in v1.1.0

| Feature | Description |
|---------|-------------|
| 🚀 **Vue 3 Migration** | Enhanced performance and modern development experience |
| 👥 **Taxpayer Profiles** | Support for different taxpayer categories with specific exemptions |
| 🎨 **Enhanced UI** | Improved navigation with quick action buttons |
| 🧪 **Better Testing** | Comprehensive unit and E2E test coverage |
| ⚡ **Performance** | Faster load times and improved reactivity |

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16.0 or higher
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
│   ├── 📄 Calculation-2023.vue
│   ├── 📄 Calculation-2024.vue
│   ├── 📄 Investment.vue
│   ├── 📄 TaxpayerProfile.vue
│   └── ...
├── 📂 pages/              # Page components
├── 📂 store/              # Vuex store modules
├── 📂 router/             # Vue Router configuration
├── 📂 utils/              # Utility functions
└── 📄 calculateTaxBreakdown.js  # Core tax logic
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

- [ ] Support for more tax years
- [ ] Business income tax calculation
- [ ] Tax planning recommendations
- [ ] Multi-language support
- [ ] PDF report generation

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