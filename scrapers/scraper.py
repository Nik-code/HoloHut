import asyncio
import aiohttp
from aiohttp import ClientResponseError
from bs4 import BeautifulSoup
import json
import os
import re

HEADERS = {
    'User-Agent': (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/114.0.0.0 Safari/537.36"
    )
}
OUTPUT_PATH = os.path.join('frontend', 'data', 'products.json')
BASE_URL = "https://www.pokevolt.shop"

POKEVOLT_SECTIONS = {
    "etb":            {"path": "/etb",                  "type": "Elite Trainer Box",   "language": "English"},
    "boosterbundle":  {"path": "/boosterbundle",        "type": "Booster Bundle",       "language": "English"},
    "japanesesets":   {"path": "/japenesesets",         "type": "Japanese Set",         "language": "Japanese"},
    "boosterboxes":   {"path": "/boosterboxes",         "type": "Booster Box",          "language": "English"},
    "singleboosters": {"path": "/single-booster-packs", "type": "Single Booster Pack",  "language": "English"},
    "tins":           {"path": "/tins",                 "type": "Tin",                  "language": "English"},
    "collection":     {"path": "/collection-boxes",     "type": "Collection Box",       "language": "English"},
    "blisters":       {"path": "/blisters",             "type": "Blister Pack",         "language": "English"},
}


def extract_details_from_name(name):
    nl = name.lower()
    if 'japanese' in nl:
        language = 'Japanese'
    elif 'korean' in nl:
        language = 'Korean'
    elif 'simplified chinese' in nl:
        language = 'Simplified Chinese'
    else:
        language = 'English'
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
    num = text.replace('₹', '').replace(',', '').strip()
    try:
        f = float(num)
        return int(f) if f.is_integer() else f
    except ValueError:
        return None


def load_existing():
    try:
        with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


async def fetch(session, url, **kwargs):
    max_retries = 3
    backoff = 1
    for attempt in range(1, max_retries + 1):
        try:
            async with session.get(url, headers=HEADERS, **kwargs) as resp:
                if resp.status == 429:
                    # too many requests → wait & retry
                    print(f"[429] {url}, retrying in {backoff}s (#{attempt})")
                    await asyncio.sleep(backoff)
                    backoff *= 2
                    continue
                resp.raise_for_status()
                return await resp.text()
        except ClientResponseError as e:
            if e.status == 429 and attempt < max_retries:
                print(f"[429] {url}, retrying in {backoff}s (#{attempt})")
                await asyncio.sleep(backoff)
                backoff *= 2
                continue
            raise
    raise RuntimeError(f"Failed to fetch {url} after {max_retries} tries")


async def scrape_bgc(session):
    out, page = [], 1
    while True:
        url = (
            'https://in.boredgamecompany.com/?s=Pokemon+TCG&post_type=product&product_cat=0'
            if page == 1 else
            f'https://in.boredgamecompany.com/page/{page}/?s=Pokemon+TCG&post_type=product&product_cat=0'
        )
        print(f'[BGC] {url}')
        html = await fetch(session, url)
        soup = BeautifulSoup(html, 'html.parser')
        found = False
        for li in soup.select('li.product-col'):
            if 'instock' not in li.get('class', []):
                continue
            found = True
            a = li.select_one('a.product-loop-title')
            name = a.get_text(strip=True) if a else None
            link = a['href'] if a and a.has_attr('href') else None
            if not (name and link):
                continue
            lang, typ = extract_details_from_name(name)
            pe = li.select_one('span.price ins .amount') or li.select_one('span.price .amount')
            fprice = pe.get_text(strip=True) if pe else None
            price = parse_price(fprice) if fprice else None
            img = li.select_one('div.product-image img')
            img_url = img.get('src') or img.get('data-src') if img else None
            out.append({
                'name': name, 'price': price, 'formattedPrice': fprice,
                'image': img_url, 'link': link,
                'language': lang, 'type': typ,
                'shop': 'Bored Game Company', 'inStock': True
            })
        if not found:
            break
        page += 1
    return out


async def scrape_tcgrepublic(session):
    out, page = [], 1
    while True:
        url = (
            'https://tcgrepublic.in/product-category/pokemon-tcg/'
            if page == 1 else
            f'https://tcgrepublic.in/product-category/pokemon-tcg/page/{page}/'
        )
        print(f'[TCGR] {url}')
        try:
            html = await fetch(session, url, timeout=15)
        except aiohttp.ClientResponseError as e:
            if e.status == 404:
                break
            raise
        soup = BeautifulSoup(html, 'html.parser')
        items = soup.select('li.product.type-product')
        if not items:
            break
        for prod in items:
            if prod.select_one('span.ast-shop-product-out-of-stock') or 'outofstock' in prod.get('class', []):
                continue
            name_el = prod.select_one('h2.woocommerce-loop-product__title')
            link_el = prod.select_one('a.ast-loop-product__link')
            name = name_el.get_text(strip=True) if name_el else None
            link = link_el['href'] if link_el and link_el.has_attr('href') else None
            if not (name and link):
                continue
            lang, typ = extract_details_from_name(name)
            pe = prod.select_one('span.price span.woocommerce-Price-amount.amount bdi')
            fprice = pe.get_text(strip=True) if pe else None
            price = parse_price(fprice) if fprice else None
            img = prod.select_one('div.astra-shop-thumbnail-wrap img')
            img_url = img.get('src') or img.get('data-lazy-src') if img else None
            out.append({
                'name': name, 'price': price, 'formattedPrice': fprice,
                'image': img_url, 'link': link,
                'language': lang, 'type': typ,
                'shop': 'TCG Republic', 'inStock': True
            })
        page += 1
    return out


async def scrape_pokevolt_section(session, name, info, seen, sem):
    prods, page = [], 1
    while True:
        url = f"{BASE_URL}{info['path']}?page={page}"
        print(f'[PokeVolt:{name}] {url}')
        async with sem:
            html = await fetch(session, url, timeout=15)
        soup = BeautifulSoup(html, 'html.parser')
        items = soup.select('li[data-hook="product-list-grid-item"]')
        if not items:
            break
        for li in items:
            if li.select_one('[data-hook="product-item-out-of-stock"]'):
                continue
            a = li.select_one('a[data-hook="product-item-container"]')
            link = a['href'] if a else None
            if not link or link in seen:
                continue
            seen.add(link)

            # title, price, etc...
            name_el = li.select_one('[data-hook="product-item-name"]')
            title = name_el.get_text(strip=True) if name_el else None

            # **fixed image logic**:
            img = li.find('img')
            raw_url = None
            if img:
                raw_url = img.get('data-src') or img.get('data-lazy-src') or img.get('src')
                # strip Wix-transform path (/v1/…)
                if raw_url and '/v1/' in raw_url:
                    raw_url = raw_url.split('/v1/')[0]

            txt = next((t for t in li.stripped_strings if t.startswith('₹')), None)
            price = parse_price(txt) if txt else None

            prods.append({
                'name': title, 'price': price, 'formattedPrice': txt,
                'image': raw_url, 'link': link,
                'language': info['language'], 'type': info['type'],
                'shop': 'PokeVolt', 'inStock': True
            })
        page += 1
    return prods


async def scrape_pokevolt(session):
    sem = asyncio.Semaphore(5)
    seen = set()
    tasks = [
        scrape_pokevolt_section(session, key, info, seen, sem)
        for key, info in POKEVOLT_SECTIONS.items()
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    all_p = []
    for res in results:
        if isinstance(res, Exception):
            print(f"[PokeVolt] section error: {res}")
        else:
            all_p.extend(res)
    return all_p


async def main():
    async with aiohttp.ClientSession() as session:
        bgc, tcgr, pokev = await asyncio.gather(
            scrape_bgc(session),
            scrape_tcgrepublic(session),
            scrape_pokevolt(session),
        )
    all_products = bgc + tcgr + pokev
    for idx, item in enumerate(all_products, 1):
        item['id'] = idx
    existing = load_existing()
    if existing == all_products:
        print("No changes, skipping write.")
        return
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)
    print(f"\n✅ Scraped {len(all_products)} products → {OUTPUT_PATH}")

if __name__ == '__main__':
    asyncio.run(main())
