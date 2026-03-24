# Private Credit Market Analysis — Website

A professional 3-page research site showcasing private credit market analysis.
Built for GitHub Pages with auto-deploy on every push.

## Project Structure

```
private-credit-site/
├── index.html              # Overview / landing page
├── analysis.html           # Full charts & tables
├── methodology.html        # Data sources & pipeline
├── css/
│   └── style.css
├── js/
│   ├── charts.js           # Chart.js rendering
│   └── data-loader.js      # Reads data/market-data.json
├── data/
│   └── market-data.json    # ← Your pipeline writes here
├── export_to_web.py        # Python export helper
└── .github/
    └── workflows/
        └── deploy.yml      # Auto-deploys on git push
```

---

## One-Time GitHub Pages Setup

1. **Create a new GitHub repo** (e.g. `private-credit-analysis`)
2. Push this entire folder to the `main` branch
3. Go to **Settings → Pages**
4. Under "Source", select **GitHub Actions**
5. Your site will be live at: `https://<your-username>.github.io/private-credit-analysis/`

Every time you push to `main`, GitHub Actions redeploys automatically (~60 seconds).

---

## Connecting Your Python Pipeline

At the end of your analysis script, add:

```python
from export_to_web import export_market_data

market_data = {
    "dealVolume":  { ... },   # see export_to_web.py for full schema
    "sector":      { ... },
    "leverage":    { ... },
    "macro":       { ... },
    "fundPerf":    { ... },
    "scatter":     [ ... ],
    "heatmap":     { ... },
}

export_market_data(market_data)
```

Then run:
```bash
git add data/market-data.json
git commit -m "Update market data"
git push
```

The site updates automatically within ~60 seconds.

---

## Adding Images / Charts from Python

Drop `.png` exports from your Python script into an `images/` folder:

```python
import matplotlib.pyplot as plt
fig.savefig("images/leverage_analysis.png", dpi=150, bbox_inches='tight')
```

Then reference them in any HTML page:
```html
<img src="images/leverage_analysis.png" alt="Leverage Analysis" style="width:100%;border-radius:6px;">
```

---

## Customizing Your Data

Edit `data/market-data.json` manually, or let `export_to_web.py` generate it from your pipeline.
The website reads this file fresh on every page load — no rebuilds needed.
