#!/bin/sh

echo "$(date): backup process started"
echo "$(date): pg_dump started for ${POSTGRES_DB}"

export BACKUP_ROOT=/backups
chdir $BACKUP_ROOT

FILE="$POSTGRES_DB-$(date +\%FT\%H-%M-%S).tar.gz"
pg_dump -U $POSTGRES_USER --exclude-table-data='wanikani.*' --exclude-table-data='dict.*' $POSTGRES_DB > /app/latest.sql

if (cmp -s /app/latest.sql latest.sql); then
  echo "$(date): not backup due-to no change"
else
  cp /app/latest.sql latest.sql
  tar -cvzf "$FILE" latest.sql
  echo "$(date): pg_dump completed"
fi

python3 /app/del.py && echo "$(date): removed cluttered old files" || true 
