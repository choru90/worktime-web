FROM nginx:stable-alpine@sha256:970364228b1e4f932abc22d321932816782cca8a20b85a77552a7cfe9acfb3b5
COPY dist/ /usr/share/nginx/html/
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
