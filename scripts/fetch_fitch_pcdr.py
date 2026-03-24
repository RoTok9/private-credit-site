#!/usr/bin/env python3
"""
fetch_fitch_pcdr.py
-------------------
Parses Fitch's public research sitemap to detect new Private Credit Default
Rate (PCDR) publications. Extracts the rate from the URL slug — no
subscription or scraping required. Updates data/market-data.json if a new
rate is found.

Exit codes:
  0 = JSON was updated (caller should commit + push)
  1 = No change / rate already current
  2 = Error (network, parse failure, etc.)
"""

import json
import re
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

SITEMAP_URL  = "https://www.fitchratings.com/sitemap-research.xml"
JSON_PATH    = "data/market-data.json"

# Matches URLs like:
#   us-private-credit-defaults-ease-to-5-4-in-february-2026-...
#   us-private-credit-default-rate-rises-to-6-1-in-...
#   us-private-credit-defaults-at-5-4-...
SLUG_RE = re.compile(
    r"private-credit-default[s\-]",
    re.IGNORECASE
)
RATE_RE = re.compile(
    r"(?:to|at|of|rate)-(\d+)-(\d+)-(?:in|percent|pct|-)",
    re.IGNORECASE
)
MONTH_RE = re.compile(
    r"-(january|february|march|april|may|june|july|august|"
    r"september|october|november|december)-(\d{4})",
    re.IGNORECASE
)
DATE_RE = re.compile(r"-(\d{2}-\d{2}-\d{4})$")


def fetch_sitemap():
    req = urllib.request.Request(
        SITEMAP_URL,
        headers={"User-Agent": "Mozilla/5.0 (compatible; PCIBot/1.0)"}
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode("utf-8")


def parse_pcdr_entries(xml_text):
    """Return list of (url, lastmod) tuples for PCDR entries, newest first."""
    loc_re  = re.compile(r"<loc>(.*?)</loc>")
    mod_re  = re.compile(r"<lastmod>(.*?)</lastmod>")
    entries = []
    locs  = loc_re.findall(xml_text)
    mods  = mod_re.findall(xml_text)
    for loc, mod in zip(locs, mods):
        if SLUG_RE.search(loc):
            entries.append((loc, mod))
    # sort newest first by lastmod
    entries.sort(key=lambda x: x[1], reverse=True)
    return entries


def extract_rate(url):
    """Pull the numeric rate out of the URL slug. Returns float or None."""
    slug = url.split("/")[-1].lower()
    m = RATE_RE.search(slug)
    if m:
        integer_part  = m.group(1)
        decimal_part  = m.group(2)
        return float(f"{integer_part}.{decimal_part}")
    return None


def extract_period(url):
    """Extract 'Month YYYY' string from URL slug."""
    slug = url.split("/")[-1].lower()
    m = MONTH_RE.search(slug)
    if m:
        return f"{m.group(1).capitalize()} {m.group(2)}"
    return "Unknown"


def extract_pub_date(url):
    """Extract publication date string from URL slug (DD-MM-YYYY → YYYY-MM-DD)."""
    slug = url.split("/")[-1]
    m = DATE_RE.search(slug)
    if m:
        parts = m.group(1).split("-")
        if len(parts) == 3:
            return f"{parts[2]}-{parts[1]}-{parts[0]}"
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def load_json():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(data):
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def main():
    print("[PCDR] Fetching Fitch sitemap...")
    try:
        xml = fetch_sitemap()
    except urllib.error.URLError as e:
        print(f"[PCDR] ERROR: Could not fetch sitemap — {e}")
        sys.exit(2)

    entries = parse_pcdr_entries(xml)
    if not entries:
        print("[PCDR] No PCDR entries found in sitemap.")
        sys.exit(1)

    latest_url, latest_mod = entries[0]
    print(f"[PCDR] Latest entry: {latest_url}")

    new_rate = extract_rate(latest_url)
    if new_rate is None:
        print(f"[PCDR] Could not extract rate from URL slug: {latest_url}")
        sys.exit(2)

    period   = extract_period(latest_url)
    pub_date = extract_pub_date(latest_url)
    print(f"[PCDR] Parsed rate: {new_rate}% | Period: {period} | Published: {pub_date}")

    # Load current JSON
    try:
        payload = load_json()
    except FileNotFoundError:
        print(f"[PCDR] ERROR: {JSON_PATH} not found.")
        sys.exit(2)

    current = payload.get("fitch_pcdr", {})
    current_rate = current.get("rate")
    current_url  = current.get("source_url", "")

    if current_rate == new_rate and current_url == latest_url:
        print(f"[PCDR] Rate unchanged at {new_rate}%. No update needed.")
        sys.exit(1)

    # Update
    payload["fitch_pcdr"] = {
        "rate":        new_rate,
        "period":      period,
        "published":   pub_date,
        "fetched":     datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_url":  latest_url,
        "_note":       "Auto-updated by GitHub Actions — source: Fitch sitemap-research.xml"
    }

    # Also update the matching entry in defaultRates if present
    if "defaultRates" in payload:
        for item in payload["defaultRates"]:
            lbl = str(item.get("label", "")).lower()
            if "fitch" in lbl and ("pcdr" in lbl or "private credit" in lbl or "default rate" in lbl):
                item["rate"] = new_rate
                print(f"[PCDR] Also updated defaultRates entry: {item.get('label')}")
                break

    save_json(payload)
    print(f"[PCDR] Updated {JSON_PATH}: {current_rate}% → {new_rate}% ({period})")
    sys.exit(0)


if __name__ == "__main__":
    main()
