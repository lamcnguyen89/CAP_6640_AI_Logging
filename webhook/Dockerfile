FROM python:3.9-slim

WORKDIR /app

# Copy requirements file
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy webhook handler script
COPY webhook-handler.py .

# Expose port 8089
EXPOSE 8089
ENV PYTHONUNBUFFERED=1
CMD ["python", "webhook-handler.py"]