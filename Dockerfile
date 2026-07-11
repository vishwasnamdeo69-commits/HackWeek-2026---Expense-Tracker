FROM nginx:alpine

LABEL org.opencontainers.image.title="LedgerFlow"
LABEL org.opencontainers.image.description="A lightweight static expense tracker served with Nginx."
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/vishwasnamdeo69-commits/HackWeek-2026---Expense-Tracker"

# Copy the static application sources into the nginx web root
COPY index.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css/
COPY js /usr/share/nginx/html/js/
COPY assets /usr/share/nginx/html/assets/
COPY LICENSE /usr/share/nginx/html/

# Copy Nginx configuration and runtime entrypoint
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

WORKDIR /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
