const { db } = require("./src/db");
const { sahibindenListe } = require("./src/db/schema/crawler");
const { sql } = require("drizzle-orm");

async function getDistricts() {
  try {
    const result = await db
      .select({
        ilce: sahibindenListe.ilce,
        mahalle: sahibindenListe.mahalle,
      })
      .from(sahibindenListe)
      .where(
        sql`${sahibindenListe.ilce} IS NOT NULL AND ${sahibindenListe.mahalle} IS NOT NULL`,
      )
      .groupBy(sahibindenListe.ilce, sahibindenListe.mahalle)
      .limit(200);

    // Group by district
    const districts = {};
    result.forEach(({ ilce, mahalle }) => {
      if (!districts[ilce]) districts[ilce] = [];
      if (!districts[ilce].includes(mahalle)) {
        districts[ilce].push(mahalle);
      }
    });

    console.log(JSON.stringify(districts, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

getDistricts();
