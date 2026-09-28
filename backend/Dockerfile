FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Expose port (local Docker). No Railway o processo escuta $PORT.
EXPOSE 8000

# Migrate and start ASGI server. populate_db roda uma vez, no shell do Railway.
CMD python manage.py migrate && \
    daphne -b 0.0.0.0 -p ${PORT:-8000} config.asgi:application




