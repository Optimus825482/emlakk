# PLAN: SEO & Design Optimization - Demir Gayrimenkul

## 1. ANALYSIS & GOALS

- **Objective**: Improve Google indexing speed and ranking for real estate keywords in Sakarya/Hendek.
- **Design**: Implement a professional logo and favicon consistent with the "Demir" (Iron/Strong) brand.
- **SEO Keywords**: "Hendek Gayrimenkul", "Sakarya Emlak", "Kiralık Daire Hendek", "Satılık Arsa Sakarya", "Yatırım Danışmanlığı".

## 2. DESIGN ASSETS

- [x] Generate Logo (Premium Navy/Silver theme)
- [x] Generate Favicon (Simplified icon)
- [ ] Implement assets in `public/` directory
- [ ] Update `src/app/layout.tsx` to include the new icons

## 3. TECHNICAL SEO IMPLEMENTATION

### Phase A: Crawlability

- [ ] Create `src/app/sitemap.ts`: Dynamic sitemap fetching listings from Database.
- [ ] Create `src/app/robots.ts`: standard robots configuration.

### Phase B: Metadata Optimization

- [ ] Update `src/app/layout.tsx` metadata with optimized title and description.
- [ ] Add OpenGraph and Twitter cards for better social sharing.
- [ ] Implement `generateMetadata` in listing detail pages for dynamic SEO.

### Phase C: Structured Data (JSON-LD)

- [ ] Add `RealEstateListing` schema to single property pages.
- [ ] Add `Organization` schema to the home page.

## 4. FINAL VERIFICATION & ORCHESTRATION

- [ ] **SEO Specialist**: Final keyword density audit and implementation of `Organization` schema on the home page.
- [ ] **Performance Optimizer**: Run performance audit (Lighthouse) and optimize image loading strategies.
- [ ] **Test Engineer**: Execute `seo_checker.py` and verify `sitemap.xml` for correctness.

## 5. ROLES & AGENTS

- `seo-specialist`: Audit and Schema.
- `performance-optimizer`: Speed and Core Web Vitals.
- `test-engineer`: Verification scripts and final check.
