FROM node:12-buster

RUN mkdir -p /app
RUN apt-get update
RUN apt-get install -y jq
RUN apt-get install -y mecab

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile
COPY . .
RUN yarn build
RUN jq 'del(.devDependencies)' package.json > tmp.json && mv tmp.json package.json
RUN yarn --frozen-lockfile

CMD [ "yarn", "start" ]
