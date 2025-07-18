# Bangladesh Tax Calculator 🇧🇩

A comprehensive Vue.js application for calculating income tax for salaried people in Bangladesh. This tool helps users calculate their tax obligations based on the current and proposed tax rates for 2023-2024.

## 🌟 Features

- **Tax Year Support**: Calculate taxes for 2023 and 2024 tax years
- **Salary Breakdown**: Detailed breakdown of taxable income components
- **Investment Tracking**: Track tax-saving investments
- **Historical Data**: View and compare historical tax calculations
- **Export/Import**: Save and load your tax data
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Live Demo

Visit the live application: [http://tax.nadimtuhin.com](http://tax.nadimtuhin.com)

## 🛠️ Installation

### Prerequisites
- Node.js (version 14 or higher)
- Yarn package manager

### Setup

1. Clone the repository:
```bash
git clone https://github.com/nadimtuhin/tax-calculator.git
cd tax-calculator
```

2. Install dependencies:
```bash
yarn install
```

3. Start the development server:
```bash
yarn serve
```

The application will be available at `http://localhost:8080`

## 📦 Build for Production

```bash
yarn build
```

## 🧪 Linting

```bash
yarn lint
```

## 🔧 Troubleshooting

### SSL Issues on Unix Systems

If you encounter SSL-related issues, run this command first:

```bash
export NODE_OPTIONS=--openssl-legacy-provider
```

## 🏗️ Built With

- **Vue.js 2.6** - Progressive JavaScript framework
- **Vuex** - State management
- **Vue Router** - Client-side routing
- **Vue CLI** - Development tooling

## 📁 Project Structure

```
src/
├── components/          # Reusable Vue components
│   ├── Calculation-2023.vue
│   ├── Calculation-2024.vue
│   ├── Investment.vue
│   ├── Salaries.vue
│   └── ...
├── pages/              # Page components
│   ├── Home.vue
│   └── Historical-2023.vue
├── store/              # Vuex store modules
│   ├── breakdown.js
│   ├── salaries.js
│   └── index.js
├── router/             # Vue Router configuration
└── calculateTaxBreakdown.js  # Tax calculation logic
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Nadim Tuhin** - [nadimtuhin@gmail.com](mailto:nadimtuhin@gmail.com)

## 🐛 Issues

If you find any bugs or have feature requests, please open an issue on the [GitHub Issues](https://github.com/nadimtuhin/tax-calculator/issues) page.

## ⭐ Show Your Support

If this project helps you, please give it a ⭐️!