FROM nginx:stable-alpine AS nginx-dev
COPY ./nginx-dev.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]

# production environment
FROM nginx:stable-alpine AS nginx-prod
CMD ["nginx", "-g", "daemon off;"]
