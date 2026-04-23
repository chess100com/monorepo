FROM node:24-alpine

WORKDIR /app

# Copy workspace manifests so `npm install` resolves the workspace graph.
# external-mock has no intra-workspace deps, so only its own manifest is needed.
COPY package.json package-lock.json ./
COPY packages/external-mock/package.json ./packages/external-mock/

RUN npm install --workspace @chess100com/external-mock --include-workspace-root

COPY packages/external-mock/tsconfig.json ./packages/external-mock/
COPY packages/external-mock/src ./packages/external-mock/src

WORKDIR /app/packages/external-mock

EXPOSE 4000

CMD ["npx", "ts-node", "src/index.ts"]
