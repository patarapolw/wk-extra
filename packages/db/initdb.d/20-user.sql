CREATE TABLE "user" (
  "id"              UUID NOT NULL DEFAULT uuid_generate_v1(),
  "createdAt"       TIMESTAMPTZ DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ DEFAULT now(),
  "name"            TEXT NOT NULL,
  "identifier"      TEXT NOT NULL UNIQUE,
  "apiKey.wanikani" TEXT,
  "quiz"            JSONB,
  "sentence"        JSONB,
  PRIMARY KEY ("id")
);

CREATE TRIGGER "t_user_updatedAt"
  BEFORE UPDATE ON "user"
  FOR EACH ROW
  EXECUTE PROCEDURE "f_updatedAt"();

CREATE INDEX "idx_user_updatedAt" ON "user" ("updatedAt");
CREATE INDEX "idx_user_identifier" ON "user" ("identifier");
