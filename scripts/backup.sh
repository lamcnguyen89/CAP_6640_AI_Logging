#!/bin/sh
while true; do
  mongodump --host mongo --username "$MONGO_INITDB_ROOT_USERNAME" \
            --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase "$MONGO_INITDB_DATABASE" \
            --out /data/backup/$(date +%Y-%m-%d_%H-%M-%S)
  sleep 86400
done