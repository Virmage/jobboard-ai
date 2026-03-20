FROM node:22-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
# We need a tsconfig for the worker that emits JS
RUN echo '{ \
  "extends": "./tsconfig.json", \
  "compilerOptions": { \
    "noEmit": false, \
    "outDir": "./dist", \
    "module": "NodeNext", \
    "moduleResolution": "NodeNext", \
    "jsx": "react-jsx", \
    "paths": { "@/*": ["./src/*"] }, \
    "baseUrl": ".", \
    "rootDir": "." \
  }, \
  "include": ["src/**/*.ts"], \
  "exclude": ["node_modules", "src/app/**/*"] \
}' > tsconfig.worker.json

RUN npx tsc -p tsconfig.worker.json || true

# Install tsx for running TS directly as fallback
RUN npm install -g tsx

# Production image
FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/src ./src
COPY --from=base /app/package.json ./
COPY --from=base /app/tsconfig.json ./
COPY --from=base /usr/local/lib/node_modules/tsx /usr/local/lib/node_modules/tsx
COPY --from=base /usr/local/bin/tsx /usr/local/bin/tsx

ENV NODE_ENV=production

# Use tsx to run the worker directly (handles TS + path aliases)
CMD ["tsx", "src/worker/index.ts"]
