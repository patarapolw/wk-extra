CREATE TABLE "edict" (
  "id"              INT GENERATED ALWAYS AS IDENTITY,
  "data"            JSONB NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX "idx_edict_data" ON "edict" USING pgroonga ("data");
