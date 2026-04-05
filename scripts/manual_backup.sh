#!/bin/bash 
source .env
curdate=$(date +%Y-%m-%d_%H-%M-%S)
docker-compose -f docker-compose.azure.yml exec mongodb_backup mongodump --host mongo --username ${MONGO_USER} --password ${MONGO_PASS} --authenticationDatabase ${MONGO_AUTH_DB} --out /data/backup/$curdate
tar -czvf ./db_backups/$curdate.tar.gz -C ./db_backups $curdate
sudo rm -rf ./db_backups/$curdate
docker-compose -f docker-compose.azure.yml exec mongodb_backup sh -c 'rm -rf /data/backup/$date'