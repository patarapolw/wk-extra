CREATE TABLE "kanji" (
  "kanji"           TEXT NOT NULL,
  "data"            JSONB NOT NULL,
  PRIMARY KEY ("kanji")
);

CREATE INDEX "idx_kanji_data" ON "kanji" USING pgroonga ("data");
