# PROJECT KNOWLEDGE BASE  
  
**Generated:** Pzt 19.01.2026  
  
## OVERVIEW  
Next.js 16 Full-Stack Real Estate Application.  
Stack: React 19, TypeScript, Drizzle ORM (PostgreSQL/Supabase), Tailwind v4.  
Includes Python-based crawling microservices for data aggregation.  
  
## STRUCTURE  
```  
.  
├── src/  
│   ├── db/          # Data Access Layer (Schema, Seeds)  
│   └── workflows/   # Business Logic & AI Automation chains  
├── crwal4ai/        # Python Crawler Microservices (Sahibinden/Emlakjet)  
├── drizzle/         # SQL Migrations  
└── docs/            # Deployment & Setup documentation  
```  
  
## WHERE TO LOOK  
| Task | Location | Notes |  
|------|----------|-------|  
| **Database Schema** | src/db/schema | Drizzle ORM definitions |  
| **Migrations** | drizzle/ | SQL migration files |  
| **Business Logic** | src/workflows | AI & Automation logic |  
| **Crawlers** | crwal4ai/ | Python scripts |  
| **Config** | next.config.ts, drizzle.config.ts | App & DB Config | 
