# csvdelta

A command-line tool for comparing two CSV files row by row and showing what changed.

Unlike a plain text diff, `csvdelta` understands CSV structure. It matches rows by a key column, so reordered rows don't show up as changes, and it reports differences at the cell level.

```
$ csvdelta old.csv new.csv --key id
~ id=1042  email: "ana@old.example" → "ana@new.example"
+ id=1077  name="Jordan Lee", email="jordan@example.com", plan="pro"
- id=0981  name="Sam Ortiz", email="sam@example.com", plan="free"

1 changed, 1 added, 1 removed (2,318 unchanged)
```

## Features

- Matches rows by one or more key columns
- Reports added, removed, and changed rows, with the changed cells highlighted
- Ignores row order and, optionally, column order
- Handles large files by streaming (tested with files of several million rows)
- Output as human-readable text, JSON, or CSV
- Exit codes suitable for use in scripts and CI

## Installation

With pip:

```bash
pip install csvdelta
```

Or with pipx, to install it as a standalone tool:

```bash
pipx install csvdelta
```

Requires Python 3.9 or later.

## Usage

```bash
csvdelta OLD NEW [options]
```

### Examples

Compare two files using the `id` column as the key:

```bash
csvdelta customers_2024.csv customers_2025.csv --key id
```

Use a composite key:

```bash
csvdelta orders_old.csv orders_new.csv --key order_id,line_no
```

Ignore some columns (for example, timestamps that always change):

```bash
csvdelta a.csv b.csv --key id --ignore updated_at,last_seen
```

Output JSON for further processing:

```bash
csvdelta a.csv b.csv --key id --format json > changes.json
```

Show only a summary:

```bash
csvdelta a.csv b.csv --key id --summary
```

### Options

| Option | Description |
| --- | --- |
| `--key COLS` | Comma-separated list of key columns. Required unless `--by-position` is set. |
| `--by-position` | Compare rows by line number instead of by key. |
| `--ignore COLS` | Comma-separated list of columns to leave out of the comparison. |
| `--ignore-case` | Treat values that differ only in case as equal. |
| `--trim` | Strip leading and trailing whitespace from values before comparing. |
| `--delimiter CHAR` | Field delimiter (default: `,`). Use `'\t'` for TSV. |
| `--encoding ENC` | File encoding (default: `utf-8`). |
| `--format FMT` | Output format: `text` (default), `json`, or `csv`. |
| `--summary` | Print only the counts of added, removed, and changed rows. |
| `--no-color` | Disable colored output. |

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | The files are identical. |
| `1` | Differences were found. |
| `2` | An error occurred (for example, a missing file or an unknown key column). |

This makes it easy to use `csvdelta` in a CI pipeline to check that an export hasn't changed unexpectedly.

## Duplicate keys

If a key value appears more than once in a file, `csvdelta` stops with an error and lists the duplicate keys. Use a composite key to make rows unique, or pass `--allow-duplicates` to compare duplicate rows in the order they appear.

## Contributing

Contributions are welcome! To set up a development environment:

```bash
git clone https://github.com/your-username/csvdelta.git
cd csvdelta
pip install -e ".[dev]"
pytest
```

Please open an issue before starting work on a large change so we can discuss the approach.

## License

MIT. See [LICENSE](LICENSE) for details.
