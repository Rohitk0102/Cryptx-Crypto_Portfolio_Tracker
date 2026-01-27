FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/
COPY setup.py .

# Install package
RUN pip install -e .

# Expose API port
EXPOSE 8000

# Run application
CMD ["python", "-m", "matching_engine.main"]
