#!/bin/bash

# Ensure a backup file is provided as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 backup_file.tar.gz"
  exit 1
fi

# Load environment variables from .env file
source .env

# Variables
backup_file=$1
backup_dir="./db_backups/restore_tmp"
container_backup_dir="/data/backup/restore_tmp"

# Step 1: Extract the backup to a temporary directory
mkdir -p $backup_dir
tar -xzvf $backup_file -C $backup_dir

# Step 2: Copy the extracted backup to the MongoDB container
docker cp $backup_dir mongodb_backup:$container_backup_dir

# Step 3: Restore the database using mongorestore
docker-compose -f docker-compose.azure.yml exec mongodb_backup \
  mongorestore --host mongo --username ${MONGO_USER} --password ${MONGO_PASS} \
               --authenticationDatabase ${MONGO_AUTH_DB} --dir $container_backup_dir

# Step 4: Clean up the temporary files
rm -rf $backup_dir
docker-compose -f docker-compose.azure.yml exec mongodb_backup \
  sh -c "rm -rf $container_backup_dir"

echo "Database restored from $backup_file"