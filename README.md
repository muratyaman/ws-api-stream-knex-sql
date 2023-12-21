# ws-api-stream-knex-sql

A lightweight WebSocket server/API and client using ws, knex, stream, pg (PostgreSQL), mysql2, msgpackr

Aim is to achieve more efficient usage of network and memory between client, server and database by using binary streaming.

Currently, most of us load many records from a database into server memory, then use `JSON.stringify()` and send it to client via HTTP.

In this example, we will fetch records 1-by-1 via streaming, use msgpackr to convert to binary payload and send it to client via WebSocket.

## requirements

* Node v20.x

## installation

```sh
npm i
```

## configuration

Copy sample env settings file and edit it.

```sh
cp .env_sample.env .env
```

## execution

```sh
# terminal 1: start server
npm run start
```

## usage

Check [client](./client/)

```sh
# terminal 2: start client app
cd ./client
npm i
npm run start
```
