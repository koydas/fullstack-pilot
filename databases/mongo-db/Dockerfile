FROM mongo:8.3.11

ENV MONGO_INITDB_DATABASE=fullstack-pilot

COPY init/ /docker-entrypoint-initdb.d/

VOLUME ["/data/db"]

EXPOSE 27017
