# Use official Node.js runtime as the base image
FROM node:20-slim

# Install Python, pip, and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the entire monorepo
COPY . .

# Setup virtual environment for Python to avoid PEP 668 externally managed environment error
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python requirements
RUN pip3 install --no-cache-dir -r ai-agent/requirements.txt

# Install Node.js backend dependencies
WORKDIR /app/backend
RUN npm install

# Expose port
EXPOSE 3001

# Start the backend server
CMD ["node", "src/index.js"]
