'use strict';

require('dotenv').config();
const pg = require('pg');
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const client = new pg.Client(process.env.DATABASE_URL);
const PORT = process.env.PORT;
const app = express();
app.use(cors());

app.get('/', (request, response) => {
  response.send('Home Page!');
});
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailsHandler);

function locationHandler(request, response) {
  const city = request.query.city;

  let SQL = `SELECT * FROM city WHERE search_querycity='${city}';`;
  client.query(SQL)
    .then(results => {
      if (results.rows.length) {
        response.status(200).json(results.rows[0]);
      }
      else {
        getLocation(city)
          .then(locationData => {
            
            let SQL = `INSERT INTO city (search_querycity,formatted_query,longitude,latitude) VALUES ($1,$2,$3,$4);`;
            let safeValues = [locationData.search_query, locationData.formatted_query, locationData.longitude, locationData.latitude];
            client.query(SQL, safeValues);
            response.status(200).json(locationData);
          });
      }
    });

};
function getLocation(city) {
  let key = process.env.LOCATIONIQ_KEY;
  let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;
  return superagent.get(url)
    .then(geoData => {
      const locationData = new Location(city, geoData.body);
      return locationData;
    })
}
function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}
function weatherHandler(request, response) {
  let latitude = request.query.latitude;
  let longitude = request.query.longitude;
  getWeather(latitude, longitude)
    .then(val => {
      response.status(200).json(val);
    });
}
function getWeather(latitude, longitude) {
  let weatherSummaries = [];
  let key = process.env.WEATHER_KEY;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${latitude}&lon=${longitude}&days=8&units=S&key=${key}`;

  return superagent.get(url)
    .then(weatherData => {
      let data = weatherData.body.data;
      return data;
    })
    .then(weatherData => {
      weatherSummaries = weatherData.map(val => {
        return new Weather(val)
      });
      return weatherSummaries
    });
}
function Weather(day) {
  this.forecast = day.weather.description;
  this.time = new Date(day.valid_date).toString().slice(0, 15);
}
function trailsHandler(request, response) {
  let latitude = request.query.latitude;
  let longitude = request.query.longitude;
  getTrails(latitude, longitude)
    .then(val => {
      response.status(200).json(val);
    });
}
function getTrails(latitude, longitude) {
  let trailsArr = [];
  let key = process.env.TRAILS_KEY;
  let url = `https://www.hikingproject.com/data/get-trails?lat=${latitude}04&lon=${longitude}&key=${key}`;
  return superagent.get(url)
    .then(trailsData => {
      let data = trailsData.body.trails;
      return data;
    })
    .then(trailsData => {
      trailsArr = trailsData.map(val => {
        return new Trail(val)
      });
      return trailsArr
    });
}
function Trail(trail) {
  this.name = trail.name;
  this.location = trail.location;
  this.length = trail.length;
  this.stars = trail.stars;
  this.star_votes = trail.starVotes;
  this.summary = trail.summary;
  this.trail_url = trail.url;
  this.conditions = trail.conditionStatus;
  this.condition_date = trail.conditionDate.split(" ")[0];
  this.condition_time = trail.conditionDate.split(" ")[1];
}
client.connect()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`listening on ${PORT}`)
    );
  })