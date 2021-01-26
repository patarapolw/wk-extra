import sqlite3 from 'better-sqlite3'

async function main() {
  const db = sqlite3('../../data/wanikani.db')

  db.exec(/* sql */ `
  CREATE TABLE IF NOT EXISTS "kanji" (
    "id"              INT PRIMARY KEY NOT NULL,   -- do not autoincrement
    "data_updated_at" TEXT NOT NULL,
    "url"             TEXT NOT NULL,
    "data"            JSON NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "vocabulary" (
    "id"              INT PRIMARY KEY NOT NULL,   -- do not autoincrement
    "data_updated_at" TEXT NOT NULL,
    "url"             TEXT NOT NULL,
    "data"            JSON NOT NULL
  );
  `)

  db.close()
}

if (require.main === module) {
  main()
}
