# IMPLEMENTATION PROMPT — Load Experiment Analysis (Python scatter plots)

---

## 1. PURPOSE

Implement a Python analysis script that consumes the NDJSON output of `runner-experiment.js`
and produces three scatter plot images showing the real per-request distribution of latency
and cost across the three experiment batches (batch_10, batch_50, batch_100).

---

## 2. SCOPE

### INCLUDED

- Create `synthetic/analysis/requirements.txt`
- Create `synthetic/analysis/analyze.py`

### EXCLUDED

- No changes to the runner (`runner-experiment.js`)
- No changes to any backend file
- No interactive dashboards or HTML output
- No statistical tests or aggregated metrics computation beyond what is needed for the plots
- No seaborn, plotly, or any library beyond pandas and matplotlib

---

## 3. FILES

### Files to create

```
synthetic/analysis/requirements.txt
synthetic/analysis/analyze.py
```

The script creates `synthetic/analysis/output/` at runtime if it does not exist.

---

## 4. REQUIREMENTS

### 4.1 — synthetic/analysis/requirements.txt

```
pandas
matplotlib
```

No version pins. No other dependencies.

---

### 4.2 — synthetic/analysis/analyze.py

#### Invocation

```bash
python synthetic/analysis/analyze.py <path_to_ndjson>
```

`<path_to_ndjson>` is a required positional argument. If omitted, print usage and exit with
code 1.

#### Input parsing

- Read the file line by line
- Parse each line as JSON
- Keep only lines where `event == "request.result"`
- Discard all other lines silently

Each kept record has these fields (as emitted by the runner):

```
batch_id          str   "batch_10" | "batch_50" | "batch_100"
concurrency_level int   10 | 50 | 100
request_index     int   position within batch, 0-based
ts                str   ISO timestamp
status            str   "success" | "failure"
http_status       int
latency_ms        int   wall-clock duration in ms
cost_usd          float | null
error_code        str | null
```

#### DataFrame construction

Build a DataFrame with exactly these columns after parsing:

```
batch_id, latency_ms, cost_usd, status
```

`cost_usd` may be null for failed requests — keep the null (NaN in pandas).

#### Batch ordering

Define a fixed order for batches used consistently across all plots:

```python
BATCH_ORDER = ['batch_10', 'batch_50', 'batch_100']
```

This order determines the left-to-right position of columns in the scatter plots
and the legend order.

#### Color palette

Define a fixed color map for batches:

```python
COLORS = {
  'batch_10':  '#4C72B0',
  'batch_50':  '#DD8452',
  'batch_100': '#55A868',
}
```

#### Jitter

Each batch is plotted as a vertical column of points on a categorical X axis.
To prevent point overlap, add random horizontal noise to each point:

```python
import numpy as np
rng = np.random.default_rng(seed=42)
```

For each batch column, generate jitter offsets:
```python
jitter = rng.uniform(-0.2, 0.2, size=len(batch_df))
```

The X position for a batch at index `i` in `BATCH_ORDER` is `i + jitter`.

Use a fixed seed so the layout is reproducible across runs.

---

#### Figure 1 — latency_scatter.png

File: `synthetic/analysis/output/latency_scatter.png`

- One scatter plot
- X axis: batch categories (categorical with jitter as described above)
  - X tick positions: `[0, 1, 2]`
  - X tick labels: `['batch_10', 'batch_50', 'batch_100']`
- Y axis: `latency_ms`
- Points colored by batch using `COLORS`
- Successful requests: `marker='o'`, `alpha=0.6`, `s=30`
- Failed requests: `marker='X'`, `alpha=0.9`, `s=60`, same color as batch, `edgecolors='red'`, `linewidths=1.2`

**Y axis cap:**
- Compute `p99 = df['latency_ms'].quantile(0.99)`
- Set `ylim = (0, p99 * 1.2)`
- For any point above `ylim`, do NOT move the point — matplotlib will clip it.
  Instead, after plotting, annotate the count of clipped points per batch in the plot title
  or as a text note below the title. Format: `"N points above y-axis cap not shown"` only
  if there are clipped points; omit the note otherwise.

Title: `Latency per request by batch`
Y label: `latency (ms)`
X label: omit (batch names on ticks are sufficient)
Legend: one entry per batch, success markers only. Add a separate legend entry for failure
markers using `marker='X'`, color gray, label `'failure'` — only if there are failures in
the dataset.

Figure size: `(10, 6)`, dpi=150.

---

#### Figure 2 — cost_scatter.png

File: `synthetic/analysis/output/cost_scatter.png`

- Same X axis structure and jitter as Figure 1 (use the same `rng` state — do NOT reinitialize)
- Y axis: `cost_usd`
- Only plot rows where `cost_usd` is not null (i.e., successful requests with a recorded cost)
- Y axis: linear scale, no cap (costs are expected to be stable)
- `ylim` bottom: 0
- Points: `marker='o'`, `alpha=0.6`, `s=30`, colored by batch

Title: `Cost per request by batch`
If any requests were excluded due to null `cost_usd`, append to title:
`(N requests with null cost excluded)`

Y label: `cost (USD)`
Legend: one entry per batch.
Figure size: `(10, 6)`, dpi=150.

---

#### Figure 3 — cost_vs_latency.png

File: `synthetic/analysis/output/cost_vs_latency.png`

- Only successful requests with non-null `cost_usd`
- X axis: `latency_ms`
- Y axis: `cost_usd`
- Color: by batch using `COLORS`
- Markers: `marker='o'`, `alpha=0.5`, `s=30`
- No jitter (both axes are continuous)

Title: `Cost vs Latency per request`
X label: `latency (ms)`
Y label: `cost (USD)`
Legend: one entry per batch.
Figure size: `(10, 6)`, dpi=150.

---

#### stdout summary

After saving all figures, print to stdout:

```
=== Experiment summary ===
Total requests: N
  batch_10  : N total, N success, N failure
  batch_50  : N total, N success, N failure
  batch_100 : N total, N success, N failure

Figures saved to: synthetic/analysis/output/
  latency_scatter.png
  cost_scatter.png
  cost_vs_latency.png
```

---

#### Output directory

Create `synthetic/analysis/output/` if it does not exist before saving any file:

```python
from pathlib import Path
output_dir = Path(__file__).parent / 'output'
output_dir.mkdir(exist_ok=True)
```

---

## 5. NON-GOALS

- Do NOT compute p50, p95, or any aggregated statistics beyond what is needed to set the
  Y axis cap in Figure 1
- Do NOT produce any interactive output (no plt.show())
- Do NOT add command-line flags beyond the positional NDJSON path argument
- Do NOT handle multiple input files
- Do NOT add logging or verbose output beyond the summary printed at the end

---

## 6. DELIVERABLES

1. `synthetic/analysis/requirements.txt` — created
2. `synthetic/analysis/analyze.py` — created

**Verification:**

- `python synthetic/analysis/analyze.py` (no args) exits with code 1 and prints usage
- `python synthetic/analysis/analyze.py experiment_results.ndjson` produces three `.png`
  files in `synthetic/analysis/output/`
- Each figure has the correct title, axis labels, and legend
- Points are colored by batch using the defined palette
- Failed requests appear as `X` markers in Figure 1
- Figure 3 contains only successful requests with non-null cost
- The jitter is reproducible (fixed seed=42): running the script twice on the same input
  produces identical images
