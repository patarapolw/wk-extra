CREATE TABLE dict.tatoeba (
  "id"            INT NOT NULL,
  "lang"          TEXT NOT NULL,
  "text"          TEXT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX idx_tatoeba_lang ON dict.tatoeba ("lang");
CREATE INDEX idx_tatoeba_text ON dict.tatoeba USING pgroonga ("text");

CREATE TABLE dict.tatoebaLink (
  "sentenceId"    INT NOT NULL,
  "translationId" INT NOT NULL,
  PRIMARY KEY ("sentenceId", "translationId")
);
