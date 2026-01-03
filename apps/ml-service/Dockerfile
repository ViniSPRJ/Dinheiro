FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download pt_core_news_sm

# Copy application code
COPY . .

# Create models directory
RUN mkdir -p /tmp/ml_models

# Set environment variables
ENV PYTHONPATH=/app
ENV MODELS_DIR=/tmp/ml_models

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
