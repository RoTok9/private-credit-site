# export_to_web.R
# ----------------------------------------------------------------
# Run this at the END of Vol__1.R (or source it from there) to
# write data/market-data.json, which the website reads directly.
#
# Usage:
#   source("export_to_web.R")
#   export_to_web(managers, bdcs, sector_risks, leverage_df,
#                 default_df, geography, sector_default)
# ----------------------------------------------------------------

library(jsonlite)

export_to_web <- function(managers, bdcs, sector_risks, leverage_df,
                          default_df, geography, sector_default,
                          output = "data/market-data.json") {

  # --- managers ---
  mgr_out <- managers %>%
    select(rank, firm, hq,
           aum_bn = private_credit_aum_bn,
           strategy = primary_strategy,
           geo = geographic_focus)

  # --- bdcs ---
  bdc_out <- bdcs %>%
    select(rank, name = bdc_name, ticker, manager,
           net_assets_bn, market_cap_bn,
           moodys   = moodys_rating,
           moodys_outlook,
           sp       = sp_rating,
           sp_outlook,
           fitch    = fitch_rating,
           fitch_outlook,
           kbra     = kbra_rating,
           dbrs     = dbrs_rating,
           non_accrual_pct,
           internally_managed,
           composite_score,
           risk_tier)

  # --- sectors ---
  sec_out <- sector_risks %>%
    rename(sector = sector, share_pct = share_pct,
           default_rate = default_rate, risk_level = risk_level)

  # --- leverage ---
  lev_out <- leverage_df %>%
    rename(label = label, leverage = leverage, category = category)

  # --- default types ---
  def_out <- default_df %>%
    rename(type = type, share = share)

  # --- default rates ---
  dr_out <- sector_default %>%
    select(label = sector, rate = default_rate, type = type)

  # --- geography ---
  geo_out <- geography %>%
    rename(region = region, share_pct = share_pct)

  payload <- list(
    `_source`     = paste("Vol__1.R — Private Credit Index,", format(Sys.Date(), "%B %Y")),
    `_note`       = "Auto-generated. Do not edit manually.",
    managers      = mgr_out,
    bdcs          = bdc_out,
    sectors       = sec_out,
    leverage      = lev_out,
    defaultTypes  = def_out,
    defaultRates  = dr_out,
    geography     = geo_out
  )

  dir.create(dirname(output), showWarnings = FALSE, recursive = TRUE)
  write_json(payload, output, pretty = TRUE, auto_unbox = TRUE, na = "null")
  cat(sprintf("[export_to_web] Written to %s\n", output))
}

# ----------------------------------------------------------------
# To wire into Vol__1.R, add at the bottom:
#
#   source("export_to_web.R")
#   export_to_web(managers, bdcs, sector_risks, leverage_df,
#                 default_df, geography, sector_default)
#
# Then commit and push:
#   git add data/market-data.json
#   git commit -m "Update market data $(date +%Y-%m-%d)"
#   git push
# ----------------------------------------------------------------
