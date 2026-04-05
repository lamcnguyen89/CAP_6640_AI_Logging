FROM mongo:latest
RUN cd / && rm -rf docker-entrypoint-initdb.d && ln -s /dbinit /docker-entrypoint-initdb.d
VOLUME /dbinit