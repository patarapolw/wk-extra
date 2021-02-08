# Based on debian-slim
FROM postgres:12

RUN mkdir -p /app
RUN apt-get update

# pgroonga extension
# Does not officially support alpine
RUN apt-get install -y wget
RUN wget https://packages.groonga.org/debian/groonga-apt-source-latest-buster.deb
RUN apt install -y -V ./groonga-apt-source-latest-buster.deb
RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ buster-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN apt-get update
RUN apt-get install -y -V postgresql-12-pgdg-pgroonga
RUN apt-get install -y -V groonga-tokenizer-mecab

# postgres-json-schema extension
WORKDIR /app
RUN apt-get install -y git build-essential
RUN git clone --depth 1 https://github.com/gavinwahl/postgres-json-schema.git
RUN cd postgres-json-schema && make install

# Install cron backup engine
WORKDIR /app
RUN apt-get install -y cron python3
RUN mkdir /etc/crontab.d
COPY backup.sh del.py entrypoint.sh /app/

ENTRYPOINT ["/bin/bash", "-e", "/app/entrypoint.sh"]
