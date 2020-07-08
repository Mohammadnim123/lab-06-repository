DROP TABLE IF EXISTS city;
CREATE TABLE IF NOT EXISTS city (
    id SERIAL PRIMARY KEY,
    search_querycity VARCHAR(255),
    formatted_query VARCHAR(255),
    longitude VARCHAR(25),
    latitude VARCHAR(25)
);

INSERT INTO city(search_querycity,formatted_query,longitude,latitude) VALUES ('moon','hello','32.6347829','35.909391');
