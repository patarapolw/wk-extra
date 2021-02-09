CREATE TABLE "d_kanji" (
  "kanji"           TEXT NOT NULL,
  "data"            JSONB NOT NULL,
  PRIMARY KEY ("d_kanji")
);

CREATE INDEX "idx_d_kanji_data" ON "d_kanji" USING pgroonga ("data");
