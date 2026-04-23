FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/client/package.json ./packages/client/
COPY packages/rules/package.json ./packages/rules/
COPY packages/client-core/package.json ./packages/client-core/
# Chessground has a `prepare` script that recompiles TS during npm install;
# copy the whole package before installing so its src/tsconfig are available.
COPY packages/chessground ./packages/chessground

RUN npm install

COPY packages/client ./packages/client
COPY packages/rules/src ./packages/rules/src
COPY packages/client-core/src ./packages/client-core/src
COPY packages/client-core/tsconfig.json ./packages/client-core/

WORKDIR /app/packages/client
RUN npm run build


FROM nginx:alpine

COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/client/dist /usr/share/nginx/html

EXPOSE 80
