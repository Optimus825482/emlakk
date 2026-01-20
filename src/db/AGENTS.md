# DATABASE KNOWLEDGE BASE  
  
## OVERVIEW  
Data Access Layer using Drizzle ORM and Supabase PostgreSQL.  
Handles schema definitions, migrations, and seeding.  
  
## STRUCTURE  
```  
src/db/  
├── schema/          # Table definitions (Split by domain)  
│   ├── users.ts  
│   ├── listings.ts  
│   └── analytics.ts  
├── seed.ts          # Database seeding entry point  
└── index.ts         # DB Connection setup  
``` 
