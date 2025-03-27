# FROM node:20

# # Create and change to the app directory
# WORKDIR /app

# # Copy application dependency manifests to the container image
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # # Copy frontend files (index.html) to the app directory
# # COPY frontend/index.html ./index.html  

# # # Copy static files (images, etc.) from frontend/public/pic to /app/public
# # COPY frontend/public/pic /app/public/pic 

# # Expose port 5173 for Vite
# # EXPOSE 5173

# # Run the web service on container startup
# CMD ["npm", "run", "dev"]


FROM node:22-alpine3.19 AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM nginx:1.27.0-alpine AS production
COPY ./nginx.conf.template /etc/nginx/templates/nginx.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html