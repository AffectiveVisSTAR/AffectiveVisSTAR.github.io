# Python module installation

Install all Python dependencies for the scripts from `scripts/requirements.txt`.

## Option 1: From repository root

```bash
python3 -m pip install -r scripts/requirements.txt
```

## Option 2: From `scripts/` folder

```bash
cd scripts
python3 -m pip install -r requirements.txt
```

## Recommended: use a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install -r scripts/requirements.txt
```

## Current required modules

- `pandas>=2.0`
- `openpyxl>=3.1`
