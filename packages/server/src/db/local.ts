import sqlite3 from 'better-sqlite3'

export const wkDb = sqlite3('assets/wk.db')

export function wkDbInit () {
  wkDb.exec(/*sql*/`
  CREATE TABLE kanji (
    id        INTEGER PRIMARY KEY,
    [entry]   TEXT NOT NULL UNIQUE,
    [level]   INTEGER NOT NULL
  );

  CREATE TABLE vocab (
    id        INTEGER PRIMARY KEY,
    [entry]   TEXT NOT NULL UNIQUE,
    [level]   INTEGER NOT NULL
  );

  CREATE TABLE sentence (
    ja        TEXT NOT NULL UNIQUE,
    en        TEXT NOT NULL,
    vocab_id  INTEGER NOT NULL REFERENCES vocab(id)
  );
  `)
}
