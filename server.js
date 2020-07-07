'use strict'
const express = require('express');
const cors = require('cors');
const { request, response } = require('express');
require('dotenv').config();
const superagent = require('superagent');


const PORT = process.env.PORT || 3030;

const app = express();
app.use(cors());

app.get('/',(request,response)=>{
    response.status(200).send('this is starter page!');
});


app.get('/location', locationHandler);
function locationHandler(request, response) {

  const city = request.query.city;
  getLocation(city)
    .then(locationData => {
      response.status(200).json(locationData);
    })

}

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
// http://localhost:3000/weather
app.get('/weather', weatherHandler);
function weatherHandler(request, response) {
  let city = request.query.city;
  

  getWeather(city)
    .then(weatherStatuse => {
      response.status(200).json(weatherStatuse);
    });
}


function getWeather(city) {
  let weatherArr = [];
  let key = process.env.API_KEY;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&days=8&units=S&key=${key}`;

  return superagent.get(url)
    .then(weatherData => {
      let data = weatherData.body.data;
      console.log(data)
      return data;
    })
    
    .then(weatherData => {
    
        weatherData.forEach(element => {
          let newObj = new Weather(element);
          weatherArr.push(newObj)
        });
      
      return weatherArr

    });
}

function Weather(weatherStatuse) {
  this.description = weatherStatuse.weather.description;
  this.time = new Date(weatherStatuse.valid_date).toString().slice(0, 15);
}



app.get('/trails', trailsHandler);
function trailsHandler(request, response) {
  let latitude = request.query.latitude;
  let longitude = request.query.longitude;

  getTrails(latitude, longitude)
    .then(ourTrails => {
      response.status(200).json(ourTrails);
    });
}


function getTrails(latitude, longitude) {
let trailsArr = [];
let key = process.env.TRAIL_API_KEY;
let url = `https://www.hikingproject.com/data/get-trails?lat=${latitude}04&lon=${longitude}&key=${key}`;
return superagent.get(url)
.then(trailsData => {
  let data = trailsData.body.trails;
  return data;
})
.then(trailsData => {
  trailsArr = trailsData.map(ourTrails => {
    return new Trail(ourTrails)
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

app.get('*', (req, res) => {
    res.status(404).send('Not Found');
});

app.use((error, req, res) => {
    res.status(500).send(error);
});

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})

