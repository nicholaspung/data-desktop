# CSV Transformer

This tool transforms CSV data from a vertical format to a horizontal format.

## Features

- Transforms vertical CSV data to horizontal format
- Handles both headers and data values
- Supports custom delimiters (tab, comma, etc.)
- Works with files of any size

## Installation

```bash
# Clone the repository or download the files
git clone [repository-url]
cd csv-transformer

# Install dependencies
npm install
```

## Usage

### Using npm scripts

```bash
# Basic usage (provides input file only)
npm run transform -- input.csv

# Specify output file
npm run transform -- input.csv output.csv

# Use comma as delimiter
npm run transform:comma -- input.csv output.csv

# Run predefined transformation for DEXA data
npm run transform:dexa
```

### Using the script directly

```bash
node csv-transformer.js input.csv
node csv-transformer.js input.csv output.csv
node csv-transformer.js --delimiter=, input.csv
node csv-transformer.js --comma input.csv
```

### Command-line options

- `--delimiter=<char>`: Specify the delimiter for the output file (default: tab)
- `--comma`: Use comma as delimiter (shorthand for `--delimiter=,`)
- `--help`, `-h`: Show help message

## Input format

The input CSV can have two formats:

### Headers only (one column)

```
date
fasted
total_body_fat_percentage
total_mass_lbs
...
```

### Headers and values (multiple columns)

```
date,2023-11-15,2023-12-15
fasted,true,false
total_body_fat_percentage,24.5,23.8
total_mass_lbs,182.6,180.4
...
```

## Output format

The output will be in horizontal format with each field becoming a column:

```
date    fasted    total_body_fat_percentage    total_mass_lbs    ...
2023-11-15    true    24.5    182.6    ...
2023-12-15    false    23.8    180.4    ...
```

## Examples

### Converting header-only data

Input file (`fields.csv`):
```
date
fasted
total_body_fat_percentage
total_mass_lbs
```

Command:
```bash
npm run transform -- fields.csv template.csv
```

Output file (`template.csv`):
```
date    fasted    total_body_fat_percentage    total_mass_lbs
```

### Converting data with values

Input file (`dexa-data.csv`):
```
date,2023-11-15,2023-12-15
fasted,true,false
total_body_fat_percentage,24.5,23.8
```

Command:
```bash
npm run transform -- dexa-data.csv dexa-transformed.csv
```

Output file (`dexa-transformed.csv`):
```
date    fasted    total_body_fat_percentage
2023-11-15    true    24.5
2023-12-15    false    23.8
```

## License

MIT