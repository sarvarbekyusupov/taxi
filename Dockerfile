
# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Bundle app source
COPY . .

# Build the app
RUN npm run build

# Expose the port the app runs on
EXPOSE 3030

# Command to run the application using PM2
CMD [ "npx", "pm2-runtime", "start", "ecosystem.config.js" ]
