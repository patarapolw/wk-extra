CREATE TABLE wanikani.subjects (
  "id"              INT NOT NULL,
  "object"          TEXT NOT NULL,
  "data_updated_at" TEXT NOT NULL,
  "url"             TEXT NOT NULL,
  "data"            JSONB NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX wanikani.idx_subjects_object ON wanikani.subjects ("object");
CREATE INDEX "idx_wk_subjects_data_updated_at" ON "wk_subjects" ("data_updated_at");
CREATE INDEX "idx_wk_subjects_data" ON "wk_subjects" USING pgroonga ("data");
