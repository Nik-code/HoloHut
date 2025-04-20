import requests
from bs4 import BeautifulSoup
import json
import re
import time
import os

# HTTP headers to mimic a real browser
HEADERS = {
    'User-Agent': (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/114.0.0.0 Safari/537.36"
    )
}

# Filepath for the frontend JSON
OUTPUT_PATH = os.path.join('frontend', 'data', 'products.json')


def extract_details_from_name(name):
    """
    Detect language and product type from product name.
    """
    nl = name.lower()
    # language detection
    if 'japanese' in nl:
        language = 'Japanese'
    elif 'korean' in nl:
        language = 'Korean'
    elif 'simplified chinese' in nl:
        language = 'Simplified Chinese'
    else:
        language = 'English'

    # product type detection
    if 'booster display box' in nl and '(36 packs)' in nl:
        p_type = 'Booster Display Box (36 Packs)'
    elif 'precious collector box' in nl:
        p_type = 'Precious Collector Box'
    elif 'elite trainer box' in nl or 'etb' in nl:
        p_type = 'Elite Trainer Box'
    elif 'booster box' in nl:
        p_type = 'Booster Box'
    elif 'blister' in nl:
        p_type = '3 Pack Blister'
    elif 'booster pack' in nl or 'booster packs' in nl:
        p_type = 'Booster Pack'
    elif 'collection box' in nl:
        p_type = 'Collection Box'
    else:
        p_type = None

    return language, p_type


def parse_price(text):
    """Convert formatted price string to a number."""
    num = text.replace('₹', '').replace(',', '').strip()
    try:
        f = float(num)
        return int(f) if f.is_integer() else f
    except ValueError:
        return None


def scrape_bgc():
    """Scrape Bored Game Company products in stock."""
    out = []
    page = 1
    while True:
        url = (
            'https://in.boredgamecompany.com/?s=Pokemon+TCG&post_type=product&product_cat=0'
            if page == 1 else
            f'https://in.boredgamecompany.com/page/{page}/?s=Pokemon+TCG&post_type=product&product_cat=0'
        )
        print(f'[BGC] Fetching {url}')
        resp = requests.get(url, headers=HEADERS)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')

        found = False
        for li in soup.select('li.product-col'):
            if 'instock' not in li.get('class', []):
                continue
            found = True

            link_el = li.select_one('a.product-loop-title')
            name = link_el.get_text(strip=True) if link_el else None
            href = link_el['href'] if link_el and link_el.has_attr('href') else None
            if not name or not href:
                continue

            language, p_type = extract_details_from_name(name)

            price_el = li.select_one('span.price ins .amount') or li.select_one('span.price .amount')
            fprice = price_el.get_text(strip=True) if price_el else None
            price = parse_price(fprice) if fprice else None

            img_el = li.select_one('div.product-image img')
            img_url = img_el.get('src') or img_el.get('data-src') if img_el else None

            out.append({
                'name':           name,
                'price':          price,
                'formattedPrice': fprice,
                'image':          img_url,
                'link':           href,
                'language':       language,
                'type':           p_type,
                'shop':           'Bored Game Company',
                'inStock':        True
            })

        if not found:
            break
        page += 1

    return out


def scrape_tcgrepublic():
    """Scrape TCG Republic products in stock."""
    out = []
    page = 1
    while True:
        url = (
            'https://tcgrepublic.in/product-category/pokemon-tcg/'
            if page == 1 else
            f'https://tcgrepublic.in/product-category/pokemon-tcg/page/{page}/'
        )
        print(f'[TCGR] Fetching {url}')
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code == 404:
            print(f'[TCGR] 404 on page {page}, stopping.')
            break
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')

        items = soup.select('li.product.type-product')
        if not items:
            break

        for prod in items:
            if prod.select_one('span.ast-shop-product-out-of-stock') or 'outofstock' in prod.get('class', []):
                continue

            name_el = prod.select_one('h2.woocommerce-loop-product__title')
            name = name_el.get_text(strip=True) if name_el else None
            link_el = prod.select_one('a.ast-loop-product__link')
            href = link_el['href'] if link_el and link_el.has_attr('href') else None
            if not name or not href:
                continue

            language, p_type = extract_details_from_name(name)

            pe = prod.select_one('span.price span.woocommerce-Price-amount.amount bdi')
            fprice = pe.get_text(strip=True) if pe else None
            price = parse_price(fprice) if fprice else None

            img_el = prod.select_one('div.astra-shop-thumbnail-wrap img')
            img_url = img_el.get('src') or img_el.get('data-lazy-src') if img_el else None

            out.append({
                'name':           name,
                'price':          price,
                'formattedPrice': fprice,
                'image':          img_url,
                'link':           href,
                'language':       language,
                'type':           p_type,
                'shop':           'TCG Republic',
                'inStock':        True
            })

        page += 1
        time.sleep(1)

    return out


def load_existing():
    """Load existing products JSON or return empty list."""
    try:
        with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def main():
    bgc  = scrape_bgc()
    tcgr = scrape_tcgrepublic()
    all_products = bgc + tcgr

    # assign IDs sequentially
    for idx, item in enumerate(all_products, 1):
        item['id'] = idx

    existing = load_existing()
    if existing == all_products:
        print("No changes detected, skipping write.")
        return

    # write only if data changed
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Scraped {len(all_products)} products → {OUTPUT_PATH}")

if __name__ == '__main__':
    main()
