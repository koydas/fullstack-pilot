FROM mongo:7

ENV MONGO_INITDB_DATABASE=fullstack-pilot

COPY init/ /docker-entrypoint-initdb.d/

VOLUME ["/data/db"]

EXPOSE 27017
