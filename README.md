# HoloHut

![HoloHut Logo](frontend/public/images/logo.png)

**Track Pokémon TCG pack stock across India, auto‑updated hourly.**

---

## 📦 Repo Structure

```
.
├── .github/workflows/        # GitHub Actions scheduling scraper
│   └── hourly-scrape.yml    # Hourly run, commits data
├── frontend/                 # Next.js App Router + Shadcn/UI + Tailwind CSS
│   ├── app/
│   ├── data/products.json    # Auto‑updated stock data
│   ├── public/images/        # Static assets (logo, icons)
│   └── ...                   # TSX components, configs, styles
├── scrapers/                 # Python scraper
│   ├── scraper.py            # Main scraping script
│   └── requirements.txt      # requests, beautifulsoup4
├── .gitignore                # Exclude build artifacts, venv, node_modules
└── README.md                 # This file
```  

---

## 🔖 License

Published under the MIT License. See [LICENSE](LICENSE) for details.

---

**Enjoy HoloHut!**