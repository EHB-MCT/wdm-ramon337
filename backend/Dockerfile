# 1. Base Image
# Use a lightweight Node.js version (Alpine Linux) to keep the container small
FROM node:20-alpine

# 2. Working Directory
# Set the working directory inside the container
WORKDIR /usr/src/app

# 3. Dependency Installation
# Copy package.json and package-lock.json first to utilize Docker cache.
# If dependencies don't change, this step is skipped on rebuilds.
COPY package*.json ./

# Install dependencies defined in package.json
RUN npm install

# 4. Source Code
# Copy the rest of the application code into the container
COPY . .

# 5. Network
# Document that the container listens on port 8080 (matches .env)
EXPOSE 8080

# 6. Startup Command
# Start the application
CMD [ "npm", "start" ]