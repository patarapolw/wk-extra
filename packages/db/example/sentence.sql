SELECT
	s ->> 'en' AS en,
	s ->> 'ja' AS ja
FROM (
	SELECT
		jsonb_array_elements("data" -> 'context_sentences') AS s
	FROM wanikani.subjects
	LIMIT 10
) t1