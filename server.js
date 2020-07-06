'use strict'
const express = require('express');
const cors = require('cors');
const { request, response } = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3030;

const app = express();
app.use(cors());

app.get('/',(request,response)=>{
    response.status(200).send('this is starter page');
});

// http://localhost:3000/weather
app.get('/weather',(request,response) => {
const status = request.query.data;
const getWeather = require('./data/weather.json');

var arr = [];
getWeather.data.forEach((element)=>{
    const weatherData = new Weather(element);
    arr.push(weatherData);
 });

 response.send(arr);
});

// [
//     {
//       "forecast": "Partly cloudy until afternoon.",
//       "time": "Mon Jan 01 2001"
//     },
//     {
//       "forecast": "Mostly cloudy in the morning.",
//       "time": "Tue Jan 02 2001"
//     },
//     ...
//   ]

function Weather(element2){
    this.forecast = element2.weather.description;
    this.time = element2.datetime;
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

