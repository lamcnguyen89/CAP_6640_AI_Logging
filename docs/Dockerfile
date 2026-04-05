# Use an official Python image as a base image
FROM python:3.9-slim

# Install make and other essential build tools
RUN apt-get update && apt-get install -y make

# Set working directory inside the container
WORKDIR /docs

# Install Sphinx directly
RUN pip install sphinx

# Copy your documentation source (including Makefile)
COPY . .

# Ensure the Makefile is executable
RUN chmod +x Makefile

# Default command to build HTML docs
CMD ["make", "html"]
