FROM rust:1.78 AS builder
WORKDIR /app
COPY ./server .
COPY ./server/.sqlx /app/.sqlx
COPY ./server/migrations /app/migrations
ENV SQLX_OFFLINE=true
RUN \
  --mount=type=cache,target=/app/target/ \
  --mount=type=cache,target=/usr/local/cargo/registry/ \
  cargo build --release && \
  cp ./target/release/server /

FROM debian:bookworm-slim AS final
COPY --from=builder /server /usr/local/bin
COPY --from=builder /app/config.docker.toml /opt/server/config.toml
COPY ./.docker/cmd/* /usr/bin/
WORKDIR /opt/server
EXPOSE 3000
ENTRYPOINT [ "server" ]