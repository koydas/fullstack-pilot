FROM mongo:9.0.4

ENV MONGO_INITDB_DATABASE=fullstack-pilot

COPY init/ /docker-entrypoint-initdb.d/

VOLUME ["/data/db"]

EXPOSE 27017
