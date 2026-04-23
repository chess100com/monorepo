FROM node:24-alpine

WORKDIR /app

# Copy workspace manifests so `npm install` resolves the workspace graph.
COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/rules/package.json ./packages/rules/
COPY packages/client-core/package.json ./packages/client-core/

RUN npm install

# Copy sources for the packages we actually run.
COPY packages/backend/tsconfig.json ./packages/backend/
COPY packages/backend/src ./packages/backend/src
COPY packages/backend/templates ./packages/backend/templates
COPY packages/rules/src ./packages/rules/src
# client-core is only used by backend tests but TypeORM/ts-node will still need
# the devDep's source to resolve type imports during test runs.
COPY packages/client-core/src ./packages/client-core/src
COPY packages/client-core/tsconfig.json ./packages/client-core/

WORKDIR /app/packages/backend

EXPOSE 3000

CMD ["npx", "ts-node", "src/index.ts"]
