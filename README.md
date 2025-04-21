<p align="center">
  <img src="frontend/public/images/background.png" alt="HoloHut Hero Background" width="100%" />
  <div style="position: relative; margin-top: -200px;">
    <img src="frontend/public/images/logo.png" alt="HoloHut Logo" width="150" />
  </div>
</p>

<h1 align="center">HoloHut</h1>

<p align="center">
  <b>Track in-stock Pokémon TCG packs across Indian retailers — updated hourly.</b><br/>
  🧊 No purchases. Just clean, real-time listings.
</p>

<p align="center">
  <a href="https://github.com/Nik-code/HoloHut/actions/workflows/hourly-scrape.yml">
    <img src="https://github.com/Nik-code/HoloHut/actions/workflows/hourly-scrape.yml/badge.svg" alt="Scraper Status"/>
  </a>
  <a href="https://holo-hut.vercel.app">
    <img src="https://vercel.com/button" alt="Live on Vercel"/>
  </a>
  <a href="https://x.com/PriyanshKSingh">
    <img src="https://img.shields.io/badge/contact-%40PriyanshKSingh-1DA1F2?logo=twitter&style=flat" alt="X @PriyanshKSingh"/>
  </a>
</p>

---

### 🔗 Live Site  
👉 [https://holo-hut.vercel.app](https://holo-hut.vercel.app)

> _HoloHut is a **non-commercial** project that aggregates stock listings from trusted TCG retailers in India._

---

## 🛍️ Current Sellers

<p align="center">
<img src="frontend/public/images/tcgrepublic-logo.png" alt="TCG Republic" width="180" style="margin: 0 20px;" />
<img src="frontend/public/images/bgc-logo.png" alt="Bored Game Company" width="180" style="margin: 0 20px;" />
<img src="frontend/public/images/pokevolt.png" alt="PokeVolt" width="180" style="margin: 0 20px;" />
</p>

---

## ✉️ Suggest a New Seller

If you run a reliable Pokémon TCG store and want to be featured:

- **Open a GitHub Issue** with your store link and proof of authenticity (website, socials, etc.)
- Or DM me on **[X (Twitter)](https://x.com/PriyanshKSingh)**  
*Only verified and trustworthy stores will be considered.*

---

## ⚙️ How It Works

1. **Hourly scrapes** via GitHub Actions.
2. All in-stock products get saved to `frontend/data/products.json`.
3. Next.js builds the site and enables client-side search and filtering.

---

## 🧑‍💻 Developer Setup

```bash
# Clone and set up the scraper
git clone https://github.com/Nik-code/HoloHut.git
cd HoloHut
python3 -m venv venv && source venv/bin/activate
pip install -r scrapers/requirements.txt

# Test the scraper
python scrapers/scraper.py

# Set up the frontend
cd frontend
npm install
npm run dev
