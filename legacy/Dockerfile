# Use a small, secure nginx image
FROM nginx:alpine

# Remove default nginx files we don't need
RUN rm -rf /usr/share/nginx/html/*

# Copy the entire current directory (all folders + index.html) 
# into nginx's default static file location
COPY . /usr/share/nginx/html/

# Make sure nginx can read everything (usually not needed with COPY, but safe)
RUN chmod -R 755 /usr/share/nginx/html

# Expose the port nginx listens on
EXPOSE 80

# nginx starts automatically – no need for CMD/ENTRYPOINT in most cases