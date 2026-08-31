# Base Python Image
FROM python:3.11-slim

WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 appgroup && adduser --system --uid 1001 appuser

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

# Start FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
