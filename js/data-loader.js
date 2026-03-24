// ============================================================
// PRIVATE CREDIT INDEX — Vol. 1
// Data loader + chart renderer
// All data sourced from Vol__1.R
// ============================================================

// --- CHART DEFAULTS ---
Chart.defaults.color = '#8a92a6';
Chart.defaults.borderColor = '#1e2530';
Chart.defaults.font.family = "'DM Sans', sans-serif";
Chart.defaults.font.size = 12;

const C = {
  navy:    '#1B3A6B',
  blue:    '#2E6DA4',
  mid:     '#4A9BC4',
  light:   '#72BDD4',
  pale:    '#A8D5E2',
  orange:  '#F4A261',
  red:     '#E76F51',
  teal:    '#2A9D8F',
  green:   '#2A9D8F',
  yellow:  '#E9C46A',
  grid:    '#1e2530',
  card:    '#13171f',
  accent:  '#c9a84c',
};

const PALETTE = [C.navy, C.blue, C.mid, C.light, C.pale, C.orange, C.red, C.teal, C.yellow, '#9B2335'];

const tip = {
  backgroundColor: C.card,
  borderColor: '#252d3a',
  borderWidth: 1,
  titleColor: '#e8eaf0',
  bodyColor: '#8a92a6',
  padding: 12
};

const baseScales = {
  x: { grid: { color: C.grid }, ticks: { color: '#4a5268' } },
  y: { grid: { color: C.grid }, ticks: { color: '#4a5268' } }
};

// --- DATA LOAD ---
async function loadData() {
  try {
    const res = await fetch('data/market-data.json');
    if (!res.ok) throw new Error('not found');
    return await res.json();
  } catch (e) {
    console.error('Could not load market-data.json:', e);
    return null;
  }
}

// ============================================================
// INDEX PAGE
// ============================================================
function renderIndexCharts(d) {

  // Live PCDR stat — populated from fitch_pcdr block in market-data.json
  const pcdrVal = document.getElementById('pcdr-value');
  const pcdrLbl = document.getElementById('pcdr-label');
  if (pcdrVal && pcdrLbl && d.fitch_pcdr) {
    pcdrVal.textContent = d.fitch_pcdr.rate + '%';
    pcdrLbl.textContent = 'Fitch PCDR (' + d.fitch_pcdr.period + ')';
    pcdrLbl.title = 'Source: ' + d.fitch_pcdr.source_url + ' | Fetched: ' + d.fitch_pcdr.fetched;
  }

  // Top 15 managers bar
  const top15 = d.managers.slice(0, 15);
  const mCtx = document.getElementById('managerPreviewChart');
  if (mCtx) {
    new Chart(mCtx, {
      type: 'bar',
      data: {
        labels: top15.map(m => m.firm.replace(' Global Management','').replace(' Asset Management','').replace(' Capital Management','').replace(' Investment Partners (BlackRock)','').replace(' Capital','').replace(' Management','')),
        datasets: [{
          data: top15.map(m => m.aum_bn),
          backgroundColor: top15.map((_, i) => i < 5 ? C.navy : i < 10 ? C.blue : C.mid),
          borderRadius: 3,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { ...tip, callbacks: { label: ctx => ` $${ctx.raw}B` } } },
        scales: {
          x: { grid: { color: C.grid }, ticks: { color: '#4a5268', callback: v => `$${v}B` } },
          y: { grid: { display: false }, ticks: { color: '#8a92a6', font: { size: 10 } } }
        }
      }
    });
    mCtx.parentElement.style.height = '380px';
  }

  // Sector donut
  const sCtx = document.getElementById('sectorPreviewChart');
  if (sCtx) {
    new Chart(sCtx, {
      type: 'doughnut',
      data: {
        labels: d.sectors.map(s => s.sector),
        datasets: [{ data: d.sectors.map(s => s.share_pct), backgroundColor: PALETTE, borderColor: C.card, borderWidth: 3, hoverOffset: 6 }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', labels: { color: '#8a92a6', font: { size: 10 }, padding: 10 } },
          tooltip: { ...tip, callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}%` } }
        }
      }
    });
  }

  // Geography bar
  const gCtx = document.getElementById('geoPreviewChart');
  if (gCtx) {
    const sorted = [...d.geography].sort((a, b) => a.share_pct - b.share_pct);
    new Chart(gCtx, {
      type: 'bar',
      data: {
        labels: sorted.map(g => g.region),
        datasets: [{
          data: sorted.map(g => g.share_pct),
          backgroundColor: sorted.map(g => {
            const grad = { 75: C.navy, 11: C.blue, 6: C.mid, 4: C.light };
            return grad[g.share_pct] || C.pale;
          }),
          borderRadius: 3,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { ...tip, callbacks: { label: ctx => ` ${ctx.raw}%` } } },
        scales: {
          x: { grid: { color: C.grid }, ticks: { color: '#4a5268', callback: v => `${v}%` } },
          y: { grid: { display: false }, ticks: { color: '#8a92a6' } }
        }
      }
    });
  }

  // Default type donut
  const dCtx = document.getElementById('defaultTypeChart');
  if (dCtx) {
    new Chart(dCtx, {
      type: 'doughnut',
      data: {
        labels: d.defaultTypes.map(t => t.type),
        datasets: [{ data: d.defaultTypes.map(t => t.share), backgroundColor: [C.navy, C.blue, C.red, C.orange], borderColor: C.card, borderWidth: 3, hoverOffset: 6 }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#8a92a6', font: { size: 10 }, padding: 10 } },
          tooltip: { ...tip, callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}%` } }
        }
      }
    });
  }
}

// ============================================================
// ANALYSIS PAGE
// ============================================================
function renderAnalysisCharts(d) {

  // --- V2: Managers bar ---
  const mbCtx = document.getElementById('managersBarChart');
  if (mbCtx) {
    const top15 = d.managers.slice(0, 15);
    new Chart(mbCtx, {
      type: 'bar',
      data: {
        labels: top15.map(m => m.firm.replace(' Global Management','').replace(' Asset Management','').replace(' Capital Management','').replace(' Investment Partners (BlackRock)','').replace(' Management','')),
        datasets: [{
          label: 'Private Credit AUM ($B)',
          data: top15.map(m => m.aum_bn),
          backgroundColor: top15.map(m => m.geo === 'Global' ? C.navy : m.geo === 'Europe' ? C.teal : C.blue),
          borderRadius: 3,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { ...tip, callbacks: { label: ctx => ` $${ctx.raw}B AUM` } }
        },
        scales: {
          x: { grid: { color: C.grid }, ticks: { color: '#4a5268', callback: v => `$${v}B` } },
          y: { grid: { display: false }, ticks: { color: '#8a92a6', font: { size: 10 } } }
        }
      }
    });
    mbCtx.parentElement.style.height = '440px';
  }

  // --- Managers full table ---
  const tbody = document.getElementById('managers-tbody');
  if (tbody) {
    renderManagersTable(d.managers);
    document.getElementById('manager-search')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      const geo = document.getElementById('geo-filter')?.value || '';
      filterManagers(d.managers, q, geo);
    });
    document.getElementById('geo-filter')?.addEventListener('change', e => {
      const q = document.getElementById('manager-search')?.value.toLowerCase() || '';
      filterManagers(d.managers, q, e.target.value);
    });
  }

  // --- V4: Non-accrual lollipop (horizontal bar) ---
  const naCtx = document.getElementById('nonAccrualChart');
  if (naCtx) {
    const sorted = [...d.bdcs].sort((a, b) => b.non_accrual_pct - a.non_accrual_pct);
    new Chart(naCtx, {
      type: 'bar',
      data: {
        labels: sorted.map(b => b.ticker),
        datasets: [{
          label: 'Non-Accrual Rate (%)',
          data: sorted.map(b => b.non_accrual_pct),
          backgroundColor: sorted.map(b => b.non_accrual_pct >= 4 ? C.red : b.non_accrual_pct >= 2 ? C.orange : C.teal),
          borderRadius: 3,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { ...tip, callbacks: {
            title: ctx => sorted[ctx[0].dataIndex].name,
            label: ctx => ` ${ctx.raw}% non-accrual`
          }}
        },
        scales: {
          x: { grid: { color: C.grid }, ticks: { color: '#4a5268', callback: v => `${v}%` } },
          y: { grid: { display: false }, ticks: { color: '#8a92a6', font: { size: 10 } } }
        }
      }
    });
    naCtx.parentElement.style.height = '520px';
  }

  // --- V5: NAV vs Market Cap scatter ---
  const navCtx = document.getElementById('navScatterChart');
  if (navCtx) {
    const internal = d.bdcs.filter(b => b.internally_managed);
    const external = d.bdcs.filter(b => !b.internally_managed);
    new Chart(navCtx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Internally Managed',
            data: internal.map(b => ({ x: b.net_assets_bn, y: b.market_cap_bn, label: b.ticker })),
            backgroundColor: C.navy + 'cc',
            pointRadius: 7, pointHoverRadius: 10,
          },
          {
            label: 'Externally Managed',
            data: external.map(b => ({ x: b.net_assets_bn, y: b.market_cap_bn, label: b.ticker })),
            backgroundColor: C.mid + 'cc',
            pointRadius: 6, pointHoverRadius: 9,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: '#8a92a6' } },
          tooltip: {
            ...tip,
            callbacks: {
              title: ctx => ctx[0].raw.label,
              label: ctx => [`Net Assets: $${ctx.raw.x}B`, `Mkt Cap: $${ctx.raw.y}B`]
            }
          }
        },
        scales: {
          x: { grid: { color: C.grid }, ticks: { color: '#4a5268', callback: v => `$${v}B` }, title: { display: true, text: 'Net Assets ($B)', color: '#4a5268' } },
          y: { grid: { color: C.grid }, ticks: { color: '#4a5268', callback: v => `$${v}B` }, title: { display: true, text: 'Market Cap ($B)', color: '#4a5268' } }
        }
      }
    });
    // Draw NAV parity line via annotation-free approach using a custom dataset
    navCtx.chart = Chart.getChart(navCtx);
  }

  // --- V3: Ratings heatmap ---
  buildRatingsHeatmap(d.bdcs);

  // --- BDCs full table ---
  buildBdcTable(d.bdcs);

  // --- V6: Sector donut ---
  const sdCtx = document.getElementById('sectorDonutChart');
  if (sdCtx) {
    new Chart(sdCtx, {
      type: 'doughnut',
      data: {
        labels: d.sectors.map(s => s.sector),
        datasets: [{ data: d.sectors.map(s => s.share_pct), backgroundColor: PALETTE, borderColor: C.card, borderWidth: 3, hoverOffset: 8 }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', labels: { color: '#8a92a6', font: { size: 10 }, padding: 12 } },
          tooltip: { ...tip, callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}%` } }
        }
      }
    });
  }

  // --- Sector risk table ---
  const stbody = document.getElementById('sector-tbody');
  if (stbody) {
    const riskColor = { 'Low': '#2a9d8f', 'Medium': '#f4a261', 'High': '#e76f51', 'Very High': '#c0392b' };
    stbody.innerHTML = d.sectors.map(s => `<tr>
      <td style="color:var(--text-primary);font-weight:500">${s.sector}</td>
      <td>${s.share_pct}%</td>
      <td>${s.default_rate !== null ? s.default_rate + '%' : '<span style="color:var(--text-muted)">N/A</span>'}</td>
      <td><span style="color:${riskColor[s.risk_level] || '#8a92a6'};font-weight:600">${s.risk_level}</span></td>
    </tr>`).join('');
  }

  // --- V7: Default rates bar ---
  const drCtx = document.getElementById('defaultRatesChart');
  if (drCtx) {
    const typeColors = { 'Sector': C.red, 'BDC': C.orange, 'Market': C.blue };
    new Chart(drCtx, {
      type: 'bar',
      data: {
        labels: d.defaultRates.map(r => r.label),
        datasets: [{
          label: 'Rate (%)',
          data: d.defaultRates.map(r => r.rate),
          backgroundColor: d.defaultRates.map(r => typeColors[r.type] + 'bb'),
          borderColor: d.defaultRates.map(r => typeColors[r.type]),
          borderWidth: 1.5,
          borderRadius: 3,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { ...tip, callbacks: {
            title: ctx => ctx[0].label,
            label: ctx => ` ${ctx.raw}% — ${d.defaultRates[ctx.dataIndex].type}`
          }}
        },
        scales: {
          x: { grid: { color: C.grid }, ticks: { color: '#8a92a6', font: { size: 10 }, maxRotation: 20 } },
          y: { grid: { color: C.grid }, ticks: { color: '#4a5268', callback: v => `${v}%` } }
        }
      }
    });
  }

  // --- V8: Default types donut ---
  const dtCtx = document.getElementById('defaultTypesChart');
  if (dtCtx) {
    new Chart(dtCtx, {
      type: 'doughnut',
      data: {
        labels: d.defaultTypes.map(t => `${t.share}% — ${t.type}`),
        datasets: [{ data: d.defaultTypes.map(t => t.share), backgroundColor: [C.navy, C.blue, C.red, C.orange], borderColor: C.card, borderWidth: 3, hoverOffset: 8 }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#8a92a6', font: { size: 10 }, padding: 12, boxWidth: 14 } },
          tooltip: { ...tip }
        }
      }
    });
  }

  // --- V9: Leverage bar ---
  const levCtx = document.getElementById('leverageChart');
  if (levCtx) {
    const catColors = { 'Private Credit': C.navy, 'Leveraged Loans': C.mid, 'Buyout': C.teal };
    new Chart(levCtx, {
      type: 'bar',
      data: {
        labels: d.leverage.map(l => l.label),
        datasets: [{
          label: 'Debt / EBITDA (x)',
          data: d.leverage.map(l => l.leverage),
          backgroundColor: d.leverage.map(l => catColors[l.category] + 'cc'),
          borderColor: d.leverage.map(l => catColors[l.category]),
          borderWidth: 1.5,
          borderRadius: 3,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { ...tip, callbacks: {
            title: ctx => d.leverage[ctx[0].dataIndex].label,
            label: ctx => ` ${ctx.raw}x — ${d.leverage[ctx[0].dataIndex].category}`
          }},
          annotation: {}
        },
        scales: {
          x: { grid: { color: C.grid }, ticks: { color: '#8a92a6' } },
          y: {
            grid: { color: C.grid },
            ticks: { color: '#4a5268', callback: v => `${v}x` },
            max: 8,
          }
        }
      }
    });
  }

  // --- V10: Geography bar ---
  const geoCtx = document.getElementById('geoBarChart');
  if (geoCtx) {
    const sorted = [...d.geography].sort((a,b) => a.share_pct - b.share_pct);
    new Chart(geoCtx, {
      type: 'bar',
      data: {
        labels: sorted.map(g => g.region),
        datasets: [{
          data: sorted.map(g => g.share_pct),
          backgroundColor: sorted.map(g => {
            if (g.share_pct === 75) return C.navy;
            if (g.share_pct >= 10) return C.blue;
            return C.mid;
          }),
          borderRadius: 3,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { ...tip, callbacks: { label: ctx => ` ${ctx.raw}%` } } },
        scales: {
          x: { grid: { color: C.grid }, ticks: { color: '#4a5268', callback: v => `${v}%` } },
          y: { grid: { display: false }, ticks: { color: '#8a92a6' } }
        }
      }
    });
  }

  // --- Manager geo split (pie of top 40) ---
  const mgCtx = document.getElementById('managerGeoChart');
  if (mgCtx) {
    const geoCounts = d.managers.reduce((acc, m) => { acc[m.geo] = (acc[m.geo] || 0) + 1; return acc; }, {});
    new Chart(mgCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(geoCounts),
        datasets: [{ data: Object.values(geoCounts), backgroundColor: [C.navy, C.blue, C.teal], borderColor: C.card, borderWidth: 3, hoverOffset: 6 }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#8a92a6', font: { size: 11 }, padding: 16 } },
          tooltip: { ...tip, callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} managers` } }
        }
      }
    });
  }

  // --- V11: BDC Risk Matrix scatter ---
  const rmCtx = document.getElementById('riskMatrixChart');
  if (rmCtx) {
    const internal = d.bdcs.filter(b => b.internally_managed);
    const external = d.bdcs.filter(b => !b.internally_managed);
    new Chart(rmCtx, {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: 'Internally Managed',
            data: internal.map(b => ({ x: b.net_assets_bn, y: b.non_accrual_pct, r: Math.max(5, Math.sqrt(b.market_cap_bn) * 6), label: b.ticker, name: b.name })),
            backgroundColor: C.navy + 'bb',
            borderColor: C.navy,
            borderWidth: 1,
          },
          {
            label: 'Externally Managed',
            data: external.map(b => ({ x: b.net_assets_bn, y: b.non_accrual_pct, r: Math.max(4, Math.sqrt(b.market_cap_bn) * 5), label: b.ticker, name: b.name })),
            backgroundColor: C.mid + 'aa',
            borderColor: C.mid,
            borderWidth: 1,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#8a92a6' } },
          tooltip: {
            ...tip,
            callbacks: {
              title: ctx => ctx[0].raw.label + ' — ' + ctx[0].raw.name,
              label: ctx => [`Net Assets: $${ctx.raw.x}B`, `Non-Accrual: ${ctx.raw.y}%`]
            }
          }
        },
        scales: {
          x: {
            grid: { color: C.grid },
            ticks: { color: '#4a5268', callback: v => `$${v}B` },
            title: { display: true, text: 'Net Assets ($B)', color: '#4a5268' }
          },
          y: {
            grid: { color: C.grid },
            ticks: { color: '#4a5268', callback: v => `${v}%` },
            title: { display: true, text: 'Non-Accrual Rate (%)', color: '#4a5268' }
          }
        }
      }
    });
    rmCtx.parentElement.style.height = '460px';
  }
}

// ============================================================
// RATINGS HEATMAP
// ============================================================
function buildRatingsHeatmap(bdcs) {
  const container = document.getElementById('ratings-heatmap');
  if (!container) return;

  const rated = bdcs.filter(b => b.moodys || b.sp || b.fitch || b.kbra);
  const agencies = ['Moody\'s', 'S&P', 'Fitch', 'KBRA'];

  const ratingScore = r => {
    if (!r) return null;
    const map = { 'BBB+':8,'BBB':9,'BBB-':10,'Baa1':8,'Baa2':9,'Baa3':10,'Ba1':11,'Ba2':12,'Ba3':13 };
    return map[r] || null;
  };

  const ratingBg = score => {
    if (!score) return 'rgba(255,255,255,0.03)';
    if (score <= 8)  return 'rgba(42,157,143,0.75)';
    if (score <= 9)  return 'rgba(42,157,143,0.5)';
    if (score <= 10) return 'rgba(244,162,97,0.5)';
    if (score <= 11) return 'rgba(231,111,81,0.55)';
    return 'rgba(231,111,81,0.75)';
  };

  let html = `<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:0.8rem">
    <thead><tr>
      <th style="text-align:left;padding:0.5rem 1rem;color:var(--text-muted);font-size:0.72rem;font-weight:500">BDC</th>
      <th style="padding:0.5rem 1rem;color:var(--text-muted);font-size:0.72rem;font-weight:500">Ticker</th>
      ${agencies.map(a => `<th style="padding:0.5rem 1rem;color:var(--text-muted);font-size:0.72rem;font-weight:500;text-align:center">${a}</th>`).join('')}
      <th style="padding:0.5rem 1rem;color:var(--text-muted);font-size:0.72rem;font-weight:500;text-align:center">Non-Accrual</th>
    </tr></thead><tbody>`;

  rated.forEach(b => {
    const ratings = [b.moodys, b.sp, b.fitch, b.kbra];
    html += `<tr>
      <td style="padding:0.5rem 1rem;color:var(--text-secondary);white-space:nowrap">${b.name}</td>
      <td style="padding:0.5rem 1rem;color:var(--accent);font-weight:600;text-align:center">${b.ticker}</td>
      ${ratings.map(r => {
        const score = ratingScore(r);
        const bg = ratingBg(score);
        const textColor = score && score <= 10 ? '#0a0c10' : 'var(--text-secondary)';
        return `<td style="padding:0.5rem 1rem;text-align:center;background:${bg};border-radius:3px;font-weight:600;color:${textColor}">${r || '<span style="color:var(--text-muted)">NR</span>'}</td>`;
      }).join('')}
      <td style="padding:0.5rem 1rem;text-align:center;font-weight:600;color:${b.non_accrual_pct >= 4 ? '#e76f51' : b.non_accrual_pct >= 2 ? '#f4a261' : '#2a9d8f'}">${b.non_accrual_pct}%</td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// ============================================================
// MANAGERS TABLE
// ============================================================
function renderManagersTable(managers) {
  const tbody = document.getElementById('managers-tbody');
  if (!tbody) return;
  tbody.innerHTML = managers.map(m => `<tr>
    <td style="color:var(--text-muted)">${m.rank}</td>
    <td style="color:var(--text-primary);font-weight:500">${m.firm}</td>
    <td style="color:var(--text-secondary)">${m.hq}</td>
    <td style="color:var(--accent);font-weight:600">$${m.aum_bn}B</td>
    <td style="color:var(--text-secondary);font-size:0.82rem">${m.strategy}</td>
    <td><span class="geo-badge geo-${m.geo.toLowerCase()}">${m.geo}</span></td>
  </tr>`).join('');
}

function filterManagers(managers, query, geo) {
  const filtered = managers.filter(m => {
    const matchQ = !query || m.firm.toLowerCase().includes(query) || m.strategy.toLowerCase().includes(query) || m.hq.toLowerCase().includes(query);
    const matchG = !geo || m.geo === geo;
    return matchQ && matchG;
  });
  const tbody = document.getElementById('managers-tbody');
  if (tbody) {
    tbody.innerHTML = filtered.length
      ? filtered.map(m => `<tr>
        <td style="color:var(--text-muted)">${m.rank}</td>
        <td style="color:var(--text-primary);font-weight:500">${m.firm}</td>
        <td style="color:var(--text-secondary)">${m.hq}</td>
        <td style="color:var(--accent);font-weight:600">$${m.aum_bn}B</td>
        <td style="color:var(--text-secondary);font-size:0.82rem">${m.strategy}</td>
        <td><span class="geo-badge geo-${m.geo.toLowerCase()}">${m.geo}</span></td>
      </tr>`).join('')
      : `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">No results found</td></tr>`;
  }
}

// ============================================================
// BDC TABLE
// ============================================================
function buildBdcTable(bdcs) {
  const tbody = document.getElementById('bdcs-tbody');
  if (!tbody) return;
  const ratingColor = r => !r ? 'var(--text-muted)' : 'var(--text-secondary)';
  const tierColor = t => t.includes('Strong') ? '#2a9d8f' : t.includes('Adequate') ? '#f4a261' : 'var(--text-muted)';
  tbody.innerHTML = bdcs.map(b => `<tr>
    <td style="color:var(--accent);font-weight:700">${b.ticker}</td>
    <td style="color:var(--text-primary);font-weight:500;white-space:nowrap">${b.name}</td>
    <td style="color:var(--text-secondary);font-size:0.82rem">${b.manager}</td>
    <td>$${b.net_assets_bn}B</td>
    <td>$${b.market_cap_bn}B</td>
    <td style="color:${ratingColor(b.moodys)}">${b.moodys || '—'}</td>
    <td style="color:${ratingColor(b.sp)}">${b.sp || '—'}</td>
    <td style="color:${ratingColor(b.fitch)}">${b.fitch || '—'}</td>
    <td style="color:${ratingColor(b.kbra)}">${b.kbra || '—'}</td>
    <td style="color:${b.non_accrual_pct >= 4 ? '#e76f51' : b.non_accrual_pct >= 2 ? '#f4a261' : '#2a9d8f'};font-weight:600">${b.non_accrual_pct}%</td>
    <td style="color:${tierColor(b.risk_tier)};font-size:0.8rem">${b.risk_tier}</td>
  </tr>`).join('');
}

// ============================================================
// INIT
// ============================================================
async function init() {
  const d = await loadData();
  if (!d) { console.error('No data loaded.'); return; }

  if (document.getElementById('managerPreviewChart')) renderIndexCharts(d);
  if (document.getElementById('managersBarChart'))    renderAnalysisCharts(d);
}

init();
