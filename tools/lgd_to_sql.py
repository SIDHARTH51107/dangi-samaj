#!/usr/bin/env python3
"""
Turn an official village list (LGD download, or your own Excel/CSV) into
SQL files you can paste into Supabase -> SQL Editor.

The file needs one row per village with these columns (names can vary,
the script recognises common LGD headings automatically):
    State | District | Block | Gram Panchayat | Village

Usage:
    python3 lgd_to_sql.py villages.csv                 # writes import_001.sql, import_002.sql, ...
    python3 lgd_to_sql.py villages.xlsx --state Bihar  # fill State if the file has no state column
    python3 lgd_to_sql.py villages.csv --rows 4000     # rows per output file (default 4000)

Safe to run again: places that already exist are skipped, nothing is duplicated.
"""
import argparse, csv, re, sys
from pathlib import Path

# Common LGD heading variants -> our level
HEADINGS = {
    'state':     ['state name', 'state'],
    'district':  ['district name', 'district'],
    'block':     ['block name', 'development block', 'block', 'sub-district name', 'subdistrict name', 'sub district'],
    'panchayat': ['gram panchayat name', 'local body name', 'panchayat name', 'gram panchayat', 'panchayat', 'gp name'],
    'village':   ['village name (in english)', 'village name', 'village'],
}
CODE_HEADINGS = ['village code', 'village lgd code', 'lgd code']

# LGD spellings that differ from the names already seeded for Bihar
ALIASES = {
    'purbi champaran': 'East Champaran', 'purba champaran': 'East Champaran',
    'pashchim champaran': 'West Champaran', 'paschim champaran': 'West Champaran',
    'kaimur (bhabua)': 'Kaimur', 'gaya ji': 'Gaya',
}


def tidy(name):
    name = re.sub(r'\s+', ' ', str(name or '')).strip()
    if not name:
        return ''
    if name.lower() in ALIASES:
        return ALIASES[name.lower()]
    # LGD often writes NAMES IN CAPITALS -> Title Case, keep short words like "(Part)"
    if name.isupper():
        name = ' '.join(w.capitalize() if not w.startswith('(') else '(' + w[1:].capitalize() for w in name.split(' '))
    return name


def read_rows(path):
    p = Path(path)
    if p.suffix.lower() in ('.xlsx', '.xls'):
        try:
            import openpyxl
        except ImportError:
            sys.exit('For Excel files run:  pip install openpyxl   (or save the sheet as CSV)')
        ws = openpyxl.load_workbook(p, read_only=True, data_only=True).active
        rows = [[('' if c is None else str(c)) for c in r] for r in ws.iter_rows(values_only=True)]
    else:
        text = p.read_bytes().decode('utf-8-sig', errors='replace')
        rows = list(csv.reader(text.splitlines()))
    # find the heading row (LGD files sometimes have a title line first)
    for i, r in enumerate(rows[:15]):
        low = [c.strip().lower() for c in r]
        if any('village' in c for c in low) and any('district' in c for c in low):
            return low, rows[i + 1:]
    sys.exit('Could not find a heading row with "District" and "Village" columns.')


def find_col(head, options):
    for opt in options:                      # exact match first
        if opt in head:
            return head.index(opt)
    for opt in options:                      # then "contains"
        for i, h in enumerate(head):
            if opt in h and 'code' not in h:
                return i
    return None


def q(s):
    return "'" + s.replace("'", "''") + "'"


SQL_BODY = """
-- add any missing places, level by level (existing ones are skipped)
insert into public.locations(level, name)
select distinct 'state', i.state from imp i
where not exists (select 1 from public.locations l where l.level = 'state' and lower(l.name) = lower(i.state))
on conflict do nothing;

insert into public.locations(level, name, parent_id)
select distinct 'district', i.district, s.id from imp i
join public.locations s on s.level = 'state' and lower(s.name) = lower(i.state)
on conflict do nothing;

insert into public.locations(level, name, parent_id)
select distinct 'block', i.block, d.id from imp i
join public.locations s on s.level = 'state' and lower(s.name) = lower(i.state)
join public.locations d on d.parent_id = s.id and lower(d.name) = lower(i.district)
on conflict do nothing;

insert into public.locations(level, name, parent_id)
select distinct 'panchayat', i.panchayat, b.id from imp i
join public.locations s on s.level = 'state' and lower(s.name) = lower(i.state)
join public.locations d on d.parent_id = s.id and lower(d.name) = lower(i.district)
join public.locations b on b.parent_id = d.id and lower(b.name) = lower(i.block)
on conflict do nothing;

insert into public.locations(level, name, parent_id, lgd_code)
select distinct on (p.id, lower(i.village)) 'village', i.village, p.id, nullif(i.code, '') from imp i
join public.locations s on s.level = 'state' and lower(s.name) = lower(i.state)
join public.locations d on d.parent_id = s.id and lower(d.name) = lower(i.district)
join public.locations b on b.parent_id = d.id and lower(b.name) = lower(i.block)
join public.locations p on p.parent_id = b.id and lower(p.name) = lower(i.panchayat)
on conflict do nothing;

drop table imp;
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('file')
    ap.add_argument('--state', help='State name to use when the file has no state column (e.g. Bihar)')
    ap.add_argument('--rows', type=int, default=4000, help='rows per SQL file (default 4000)')
    ap.add_argument('--out', default='.', help='folder for the SQL files')
    a = ap.parse_args()

    head, body = read_rows(a.file)
    cols = {lvl: find_col(head, opts) for lvl, opts in HEADINGS.items()}
    code_col = find_col(head, CODE_HEADINGS)
    if code_col is None:
        code_col = next((i for i, h in enumerate(head) if 'village' in h and 'code' in h), None)
    missing = [l for l, c in cols.items() if c is None and not (l == 'state' and a.state)]
    if missing:
        sys.exit(f'Missing column(s): {", ".join(missing)}. Headings found: {head}')
    print('Columns used:', {l: head[c] for l, c in cols.items() if c is not None}, '| code:', head[code_col] if code_col is not None else '-')

    out, seen = [], set()
    for r in body:
        g = lambda c: tidy(r[c]) if c is not None and c < len(r) else ''
        row = (g(cols['state']) or tidy(a.state), g(cols['district']), g(cols['block']), g(cols['panchayat']), g(cols['village']),
               (r[code_col].strip() if code_col is not None and code_col < len(r) else ''))
        if not all(row[:5]):
            continue
        key = tuple(x.lower() for x in row[:5])
        if key in seen:
            continue
        seen.add(key); out.append(row)

    if not out:
        sys.exit('No complete rows found.')
    Path(a.out).mkdir(parents=True, exist_ok=True)
    files = 0
    for start in range(0, len(out), a.rows):
        chunk = out[start:start + a.rows]
        files += 1
        values = ',\n'.join('(' + ','.join(q(x) for x in row) + ')' for row in chunk)
        sql = (f'-- Location import part {files}: rows {start + 1}-{start + len(chunk)} of {len(out)}\n'
               'create temp table imp(state text, district text, block text, panchayat text, village text, code text);\n'
               f'insert into imp values\n{values};\n' + SQL_BODY)
        Path(a.out, f'import_{files:03d}.sql').write_text(sql, encoding='utf-8')
    summary = {lvl: len({tuple(x.lower() for x in r[:i + 1]) for r in out}) for i, lvl in enumerate(['state', 'district', 'block', 'panchayat', 'village'])}
    print(f'{len(out)} villages -> {files} file(s): import_001.sql ... import_{files:03d}.sql')
    print('Counts:', summary)
    print('Paste each file into Supabase -> SQL Editor and press Run, in order.')


if __name__ == '__main__':
    main()
