import sys
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from pathlib import Path

BATCH_ORDER = ['batch_1', 'batch_2', 'batch_3']

COLORS = {
    'batch_1': '#4C72B0',
    'batch_2': '#DD8452',
    'batch_3': '#55A868',
}


def detect_encoding(path):
    with open(path, 'rb') as f:
        raw = f.read(4)
    if raw[:2] in (b'\xff\xfe', b'\xfe\xff'):
        return 'utf-16'
    if raw[:3] == b'\xef\xbb\xbf':
        return 'utf-8-sig'
    return 'utf-8'


def load_data(path):
    encoding = detect_encoding(path)
    records = []
    with open(path, 'r', encoding=encoding) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            if obj.get('event') != 'request.result':
                continue
            records.append({
                'batch_id':  obj['batch_id'],
                'latency_ms': obj['latency_ms'],
                'cost_usd':   obj.get('cost_usd'),
                'status':     obj['status'],
            })
    df = pd.DataFrame(records, columns=['batch_id', 'latency_ms', 'cost_usd', 'status'])
    return df


def plot_latency(df, output_dir, rng):
    fig, ax = plt.subplots(figsize=(10, 6))

    p99 = df['latency_ms'].quantile(0.99)
    ylim_top = p99 * 1.2

    clipped_counts = {}
    for i, batch_id in enumerate(BATCH_ORDER):
        batch_df = df[df['batch_id'] == batch_id]
        if batch_df.empty:
            continue

        jitter = rng.uniform(-0.2, 0.2, size=len(batch_df))
        x = i + jitter
        color = COLORS[batch_id]

        success = batch_df['status'] == 'success'
        failure = ~success

        ax.scatter(
            x[success.values],
            batch_df.loc[success, 'latency_ms'].values,
            color=color, marker='o', alpha=0.6, s=30,
            label=batch_id,
        )
        if failure.any():
            ax.scatter(
                x[failure.values],
                batch_df.loc[failure, 'latency_ms'].values,
                color=color, marker='X', alpha=0.9, s=60,
                edgecolors='red', linewidths=1.2,
            )

        clipped = int((batch_df['latency_ms'] > ylim_top).sum())
        if clipped:
            clipped_counts[batch_id] = clipped

    ax.set_ylim(0, ylim_top)
    ax.set_xticks([0, 1, 2])
    ax.set_xticklabels(BATCH_ORDER)
    ax.set_ylabel('latency (ms)')

    title = 'Latency per request by batch'
    total_clipped = sum(clipped_counts.values())
    if total_clipped:
        title += f'\n{total_clipped} points above y-axis cap not shown'
    ax.set_title(title)

    handles, labels = ax.get_legend_handles_labels()
    has_failures = (df['status'] == 'failure').any()
    if has_failures:
        from matplotlib.lines import Line2D
        failure_handle = Line2D(
            [0], [0], marker='X', color='gray', linestyle='None',
            markersize=8, label='failure',
        )
        handles.append(failure_handle)
        labels.append('failure')
    ax.legend(handles, labels)

    fig.savefig(output_dir / 'latency_scatter.png', dpi=150)
    plt.close(fig)


def plot_cost(df, output_dir, rng):
    null_count = int(df['cost_usd'].isna().sum())
    plot_df = df.dropna(subset=['cost_usd'])

    fig, ax = plt.subplots(figsize=(10, 6))

    for i, batch_id in enumerate(BATCH_ORDER):
        batch_df = plot_df[plot_df['batch_id'] == batch_id]
        if batch_df.empty:
            continue

        jitter = rng.uniform(-0.2, 0.2, size=len(batch_df))
        x = i + jitter
        color = COLORS[batch_id]

        ax.scatter(
            x,
            batch_df['cost_usd'].values,
            color=color, marker='o', alpha=0.6, s=30,
            label=batch_id,
        )

    ax.set_ylim(bottom=0)
    ax.set_xticks([0, 1, 2])
    ax.set_xticklabels(BATCH_ORDER)
    ax.set_ylabel('cost (USD)')

    title = 'Cost per request by batch'
    if null_count:
        title += f'\n({null_count} requests with null cost excluded)'
    ax.set_title(title)
    ax.legend()

    fig.savefig(output_dir / 'cost_scatter.png', dpi=150)
    plt.close(fig)


def plot_cost_vs_latency(df, output_dir):
    plot_df = df[(df['status'] == 'success') & df['cost_usd'].notna()]

    fig, ax = plt.subplots(figsize=(10, 6))

    for batch_id in BATCH_ORDER:
        batch_df = plot_df[plot_df['batch_id'] == batch_id]
        if batch_df.empty:
            continue
        ax.scatter(
            batch_df['latency_ms'].values,
            batch_df['cost_usd'].values,
            color=COLORS[batch_id], marker='o', alpha=0.5, s=30,
            label=batch_id,
        )

    ax.set_title('Cost vs Latency per request')
    ax.set_xlabel('latency (ms)')
    ax.set_ylabel('cost (USD)')
    ax.legend()

    fig.savefig(output_dir / 'cost_vs_latency.png', dpi=150)
    plt.close(fig)


def print_summary(df, output_dir):
    print('=== Experiment summary ===')
    print(f'Total requests: {len(df)}')
    for batch_id in BATCH_ORDER:
        batch_df = df[df['batch_id'] == batch_id]
        total = len(batch_df)
        success = int((batch_df['status'] == 'success').sum())
        failure = int((batch_df['status'] == 'failure').sum())
        print(f'  {batch_id:<10}: {total} total, {success} success, {failure} failure')
    print()
    print(f'Figures saved to: {output_dir}/')
    print('  latency_scatter.png')
    print('  cost_scatter.png')
    print('  cost_vs_latency.png')


def main():
    if len(sys.argv) < 2:
        print(f'Usage: python {sys.argv[0]} <path_to_ndjson>')
        sys.exit(1)

    ndjson_path = sys.argv[1]
    output_dir = Path(__file__).parent / 'output'
    output_dir.mkdir(exist_ok=True)

    df = load_data(ndjson_path)

    if df.empty:
        print('No request.result records found in the input file. Nothing to plot.')
        sys.exit(0)

    rng = np.random.default_rng(seed=42)
    plot_latency(df, output_dir, rng)
    plot_cost(df, output_dir, rng)
    plot_cost_vs_latency(df, output_dir)

    print_summary(df, output_dir)


if __name__ == '__main__':
    main()
