# The site on Bun, for the VPS (served behind nginx as the compose service
# "site"). Two stages: install and build with the full dependency tree, then
# ship only Next's standalone server, which keeps the image small.
#
# The server runs on the Bun runtime, so lib/views.ts uses bun:sqlite. The
# view counts live in /app/databases; mount a volume there or they reset
# with every new container.

FROM oven/bun:1 AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Dependencies first, so a code-only change reuses the cached install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
# --bun runs Next itself on Bun; the image has no Node.js
RUN bun --bun next build


FROM oven/bun:1-slim
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# The standalone server, plus the two folders it doesn't copy on its own
COPY --from=build --chown=bun:bun /app/.next/standalone ./
COPY --from=build --chown=bun:bun /app/.next/static ./.next/static
COPY --from=build --chown=bun:bun /app/public ./public

RUN mkdir databases && chown bun:bun databases
USER bun

EXPOSE 3000
CMD ["bun", "server.js"]
