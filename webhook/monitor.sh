#!/usr/bin/env bash
# A function to handle lines from the container's output
handle_container_output() {
  local line="$1"
  echo "Container sent: $line"

  # Example logic:
  # If line contains "READY", run a host command or do something else
  if [[ "$line" == *"STAGING"* ]]; then
    echo "Detected STAGING signal! Updating host to branch 'staging'..."
    # e.g., call a local script or command
    cd ~jo284142admin/sherlock
    git fetch
    git checkout --force vera/staging
    git pull
    docker compose -f 'docker-compose.azure.prod.yml' up -d --build
  fi
  if [[ "$line" == *"DEPLOY"* ]]; then
    echo "Detected DEPLOY signal! Running a host command..."
    # e.g., call a local script or command
    cd ~jo284142admin/sherlock
    git fetch
    git checkout --force production
    git pull
    ./scripts/deploy.sh --build
    git checkout --force staging
  fi
}
export WEBHOOK_SECRET='$ecret123'
# Run the container, capture stdout, and pipe it to a while loop
docker build -t webhook:latest /home/ad/jo284142admin/sherlock/webhook
docker run -p 8089:8089 -e WEBHOOK_SECRET --rm webhook:latest  | while IFS= read -r output_line
do
  handle_container_output "$output_line"
done