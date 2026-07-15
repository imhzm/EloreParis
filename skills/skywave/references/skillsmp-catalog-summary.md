# SkillsMP Catalog Export

This reference documents the SkillsMP catalog export stored with the SkyWave workspace library.

## Files

- `D:\REDA\skywave\exports\skillsmp_catalog_professional.xlsx`
- `D:\REDA\skywave\scripts\build_skillsmp_catalog.py`
- `D:\REDA\skywave\scripts\download_skillsmp_skills.py`
- `D:\REDA\skywave\downloaded-skills`

## Source

- Marketplace: https://skillsmp.com
- Public skills API: https://skillsmp.com/api/skills
- Categories page: https://skillsmp.com/categories
- Occupations page: https://skillsmp.com/occupations

## Export Contents

The workbook includes:

- `Overview`: generation metadata and API limits.
- `Skills_Index`: exported public skill records.
- `Categories`: category and domain index.
- `Occupations`: occupation index.
- `Fetch_Summary`: one row per API filter request.
- `Sources`: source URLs used during generation.

## Current Export Stats

- Public API reported total skills: `1,526,098`.
- Unique skills exported: `69,208`.
- Category/domain filters scanned: `75`.
- Occupation pages indexed: `988`.
- Public API cap observed: `1,200` results per large filter.
- Test download completed: `50` SkillsMP `SKILL.md` files in `D:\REDA\skywave\downloaded-skills`.

## Important Limitation

The SkillsMP public API caps large result sets at `1,200` rows per large filter. The workbook is therefore a broad professional catalog built from public domain/category/global filters plus category and occupation indexes. It is not a literal one-row-per-skill dump of every reported marketplace record.

Do not treat SkillsMP catalog rows as always-active instructions. Use them for discovery, naming, categorization, and selective download/review.

## Refresh Commands

Run from the SkyWave workspace folder:

```powershell
python .\scripts\build_skillsmp_catalog.py
python .\scripts\download_skillsmp_skills.py --limit 50 --workers 8
```

Use a small limit first, inspect results, then increase only when needed.
