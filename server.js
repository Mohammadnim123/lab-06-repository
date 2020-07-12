'use strict';

require('dotenv').config();
const pg = require('pg');
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const yelp = require('yelp-fusion');
const client = new pg.Client(process.env.DATABASE_URL);
const PORT = process.env.PORT;
const app = express();
app.use(cors());


// -----------------------------------------------------------------------------------------
app.get('/', (request, response) => {
  response.send('Home Page!');
});

// --------------------------------------------------------------------------------
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailsHandler);
app.get('/movies', moviesHandler);
app.get('/yelp', yelpHandler);
// -----------------------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------------------



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

// -----------------------------------------------------------------------------------------


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

// -----------------------------------------------------------------------------------------



function moviesHandler(request, response) {
  let city = request.query.city;
  getMovies(city)
    .then(val => {
      response.status(200).json(val);
    });
}

function getMovies(city) {
  let moviesArr = [];
  let key = process.env.MOVIE_API_KEY;
  let url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${city}&language=en-US`;
 
  return superagent.get(url)
    .then(moviesData => {
      let data = moviesData.body.results;
      return data;
    })
    .then(moviesData => {
      moviesArr = moviesData.map(val => {
        return new Movies(val)
      });
      return moviesArr
    });
}

function Movies(val){
  this.title = val.title;
  this.overview = val.overview;
  this.average_votes = val.vote_average;
  this.total_votes = val.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500/${val.poster_path}`;
  this.popularity = val.popularity;
  this.released_on = val.release_date;
}


// -------------------------------------------------------------------------------------------------------------------

function yelpHandler(request, response) {
  let latitude = request.query.latitude;
  let longitude = request.query.longitude;
  getyelp(latitude, longitude)
    .then(val => {
      response.status(200).json(val);
    });
}

function getyelp(latitude, longitude) {
  
  let yelpArr = [];
const apiKey = process.env.YELP_API_KEY;

const searchRequest = {
  latitude : latitude,
  longitude : longitude
};

 

 return yelp.client(apiKey).search(searchRequest)
.then(yelpData => {
  const firstResult = yelpData.jsonBody;
  let yelpFirst = firstResult.businesses;
  return yelpFirst;
})
.then(yelpData => {
  yelpArr = yelpData.map(val => {
    return new Yelp(val)
  });
return yelpArr;

      
    })
}




function Yelp(yelp){
  this.name = yelp.name;
  this.image_url = yelp.image_url;
  this.price = yelp.price;   
  this.rating = yelp.rating;
  this.url = yelp.url;
}


// -------------------------------------------------------------------------------------------------------------------


client.connect()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`listening on ${PORT}`)
    );
  })
