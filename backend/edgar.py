import requests
import cache

HEADERS = {"User-Agent": "EngeluStocks support@engelustocks.com"}
BASE = "https://data.sec.gov"

_cik_map: dict[str, int] | None = None


def _load_cik_map() -> dict[str, int]:
    global _cik_map
    if _cik_map is not None:
        return _cik_map

    cached = cache.get("edgar:cik_map", ttl=86400)
    if cached:
        _cik_map = cached
        return _cik_map

    resp = requests.get(
        "https://www.sec.gov/files/company_tickers.json",
        headers=HEADERS,
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    _cik_map = {entry["ticker"].upper(): entry["cik_str"] for entry in data.values()}
    cache.set("edgar:cik_map", _cik_map)
    return _cik_map


def resolve_cik(symbol: str) -> int | None:
    cik_map = _load_cik_map()
    return cik_map.get(symbol.upper())


def get_company_facts(cik: int) -> dict | None:
    cache_key = f"edgar:facts:{cik}"
    cached = cache.get(cache_key, ttl=3600)
    if cached:
        return cached

    url = f"{BASE}/api/xbrl/companyfacts/CIK{cik:010d}.json"
    resp = requests.get(url, headers=HEADERS, timeout=15)
    if resp.status_code != 200:
        return None
    data = resp.json()
    cache.set(cache_key, data)
    return data


def get_submissions(cik: int) -> dict | None:
    cache_key = f"edgar:subs:{cik}"
    cached = cache.get(cache_key, ttl=600)
    if cached:
        return cached

    url = f"{BASE}/submissions/CIK{cik:010d}.json"
    resp = requests.get(url, headers=HEADERS, timeout=15)
    if resp.status_code != 200:
        return None
    data = resp.json()
    cache.set(cache_key, data)
    return data


CONCEPT_LABELS = {
    "Revenues": "Revenue",
    "RevenueFromContractWithCustomerExcludingAssessedTax": "Revenue",
    "NetIncomeLoss": "Net Income",
    "Assets": "Total Assets",
    "Liabilities": "Total Liabilities",
    "StockholdersEquity": "Stockholders' Equity",
    "EarningsPerShareBasic": "EPS (Basic)",
    "EarningsPerShareDiluted": "EPS (Diluted)",
    "NetCashProvidedByOperatingActivities": "Operating Cash Flow",
    "LongTermDebt": "Long-Term Debt",
}


def extract_financials(facts: dict, period: str = "annual") -> dict:
    """Parse companyfacts XBRL into { columns, rows } matching FinancialData format."""
    us_gaap = facts.get("facts", {}).get("us-gaap", {})
    if not us_gaap:
        return {"columns": [], "rows": []}

    form_filter = "10-K" if period == "annual" else "10-Q"

    # Collect data for each concept
    rows_map: dict[str, dict[str, float]] = {}
    all_periods: set[str] = set()
    seen_labels: set[str] = set()

    for concept, label in CONCEPT_LABELS.items():
        if label in seen_labels:
            # Skip duplicate labels (e.g. multiple Revenue concepts) if we already have data
            if label in rows_map and rows_map[label]:
                continue
        concept_data = us_gaap.get(concept)
        if not concept_data:
            continue

        units = concept_data.get("units", {})
        # Try USD first, then USD/shares for EPS
        values_list = units.get("USD") or units.get("USD/shares") or []

        period_values: dict[str, float] = {}
        for entry in values_list:
            form = entry.get("form", "")
            if form != form_filter:
                continue
            # Use entries with 'end' date and a fiscal year
            end = entry.get("end", "")
            fy = entry.get("fy")
            if not end or fy is None:
                continue

            # For annual, use the fiscal year; for quarterly, use end date quarter
            if period == "annual":
                key = str(fy)
            else:
                key = end[:7]  # YYYY-MM

            val = entry.get("val")
            if val is not None:
                period_values[key] = val

        if period_values:
            rows_map[label] = period_values
            all_periods.update(period_values.keys())
            seen_labels.add(label)

    if not all_periods:
        return {"columns": [], "rows": []}

    columns = sorted(all_periods, reverse=True)[:8]

    rows = []
    # Maintain display order
    ordered_labels = []
    seen = set()
    for label in CONCEPT_LABELS.values():
        if label not in seen and label in rows_map:
            ordered_labels.append(label)
            seen.add(label)

    for label in ordered_labels:
        values = {col: rows_map[label].get(col) for col in columns}
        rows.append({"label": label, "values": values})

    return {"columns": columns, "rows": rows}
