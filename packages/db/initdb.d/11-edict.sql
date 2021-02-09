CREATE TABLE "d_edict" (
  "id"              INT GENERATED ALWAYS AS IDENTITY,
  "data"            JSONB NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX "idx_d_edict_data" ON "d_edict" USING pgroonga ("data");
