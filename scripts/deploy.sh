#!/bin/bash

# Variables
SERVER="sreal.ucf.edu"
USER="murray"
REMOTE_PATH="~/vera"
LOCAL_PATH="$(pwd)"  # Assuming you're running this from the project root
COMPOSE_FILE="docker-compose.azure.prod.yml"
STATIC="static"

# Docker image names
CLIENT_IMAGE="sh-client:prod"
API_IMAGE="sh-api:prod"
MONGO_IMAGE="mongo:prod"

# Tar file names
CLIENT_TAR="sh-client-prod.tar"
API_TAR="sh-api-prod.tar"
MONGO_TAR="mongo-prod.tar"
ENV=".env"
ENV2="sendgrid.env"

# Flags for actions
BUILD_IMAGES=false
FORCE_REBUILD=false
SKIP_UPLOAD=false

# Check command-line arguments for build, force, and no-upload flags
for arg in "$@"; do
  case $arg in
    --build)
      BUILD_IMAGES=true
      ;;
    --force)
      FORCE_REBUILD=true
      ;;
    --no-upload)
      SKIP_UPLOAD=true
      ;;
    *)
      ;;
  esac
done

# Function to build image only if necessary
build_image() {
  local image_name=$1
  local dockerfile=$2
  local target_stage=$3
  local context=$4

  if [[ "$FORCE_REBUILD" == true || "$(docker images -q $image_name 2> /dev/null)" == "" ]]; then
    echo "Building Docker image $image_name..."
    docker build -t $image_name --no-cache -f $dockerfile --target $target_stage $context
  else
    echo "Docker image $image_name already exists. Skipping build."
  fi
}

# Function to export image to tar only if necessary
export_image() {
  local image_name=$1
  local tar_name=$2

  if [[ "$FORCE_REBUILD" == true || ! -f $tar_name ]]; then
    echo "Exporting Docker image $image_name to $tar_name..."
    docker save -o $tar_name $image_name
  else
    echo "Tar file $tar_name already exists. Skipping export."
  fi
}

# Build Docker images if the --build option is provided
if [[ "$BUILD_IMAGES" == true ]]; then
  echo "Building Docker images..."
  
  build_image $CLIENT_IMAGE "client/Dockerfile" "client-prod" "./client"
  build_image $API_IMAGE "server/Dockerfile" "api-prod" "./server"
  # MongoDB custom image (optional)
  # Uncomment if you are using a custom MongoDB image
  # build_image $MONGO_IMAGE "mongo/Dockerfile" "" "./mongo"

  # Export Docker Images
  echo "Checking and exporting Docker images as tar files if necessary..."
  export_image $CLIENT_IMAGE $CLIENT_TAR
  export_image $API_IMAGE $API_TAR
  export_image $MONGO_IMAGE $MONGO_TAR
else
  echo "Skipping Docker image build as --build option was not provided."
fi
docker run --rm -v $(pwd)/static/docs:/docs/_build/html sphinx-docs-builder
# Upload files using rsync, if --no-upload is not provided
if [[ "$SKIP_UPLOAD" == false ]]; then
  echo "Uploading tar files, .env, and docker-compose.yml using rsync..."
  echo "$SRPWD" | rsync -avz $STATIC $CLIENT_TAR $API_TAR $MONGO_TAR $COMPOSE_FILE $USER@$SERVER:$REMOTE_PATH
else
  echo "Skipping file upload as --no-upload option was provided."
fi
# Upload files using rsync, if --no-upload is not provided
if [[ "$SKIP_UPLOAD" == false ]]; then

  # SSH into the server and load images, then run Docker Compose
  echo "Loading Docker images and running Docker Compose on the server..."

  echo "$SRPWD" | ssh $USER@$SERVER << EOF
    cd $REMOTE_PATH

    # Load Docker images
    echo "Loading Docker images..."
    docker load -i $CLIENT_TAR
    docker load -i $API_TAR
    docker load -i $MONGO_TAR

    # Run Docker Compose
    echo "Running Docker Compose..."
    docker compose -f $COMPOSE_FILE up -d

    echo "Deployment complete."
EOF
fi
echo "Deployment process finished."
