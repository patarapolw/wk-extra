CREATE TABLE dict.edict (
  "id"              INT GENERATED ALWAYS AS IDENTITY,
  "data"            JSONB NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX idx_edict_data ON dict.edict USING pgroonga ("data");
