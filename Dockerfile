# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Stage 2: Create the final image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app .

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables for the Telegram bot
# These should be configured in your aaPanel Docker setup
ENV TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
ENV TELEGRAM_CHAT_ID=-1002894846288

# Command to run the application
CMD ["npm", "start"]
