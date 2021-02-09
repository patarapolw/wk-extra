SELECT * FROM (
  SELECT
    s ->> 'en' AS en,
    s ->> 'ja' AS ja
  FROM (
    SELECT
      jsonb_array_elements("data" -> 'context_sentences') AS s
    FROM wanikani.subjects
  ) t1
  UNION ALL
  SELECT
    s1.text   en,
    s2.text   ja
  FROM dict.tatoeba     AS s1
  JOIN dict.tatoebaLink AS "t"   ON s1.id = "t"."sentenceId"
  JOIN dict.tatoeba     AS s2    ON s2.id = "t"."translationId"
  WHERE s1.lang = 'eng' AND s2.lang = 'jpn'
) t2 ORDER BY RANDOM()