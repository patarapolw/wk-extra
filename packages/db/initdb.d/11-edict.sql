CREATE TABLE "edict" (
  "id"              INT GENERATED ALWAYS AS IDENTITY,
  "entry"           TEXT[] NOT NULL,
  "reading"         TEXT[] NOT NULL,
  "english"         TEXT[] NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX "idx_edict_entry" ON "edict" USING pgroonga ("entry");
CREATE INDEX "idx_edict_reading" ON "edict" USING pgroonga ("reading");
CREATE INDEX "idx_edict_english" ON "edict" USING pgroonga ("english");
