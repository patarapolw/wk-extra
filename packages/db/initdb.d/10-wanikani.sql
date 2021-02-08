CREATE TABLE "wkSubjects" (
  "id"              INT NOT NULL,
  "object"          TEXT NOT NULL,
  "data_updated_at" TEXT NOT NULL,
  "url"             TEXT NOT NULL,
  "data"            JSONB NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX "idx_wkSubjects_object" ON "wkSubjects" ("object");
CREATE INDEX "idx_wkSubjects_data_updated_at" ON "wkSubjects" ("data_updated_at");
CREATE INDEX "idx_wkSubjects_data" ON "wkSubjects" USING pgroonga ("data");
