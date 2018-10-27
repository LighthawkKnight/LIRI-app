require("dotenv").config();
var Twitter = require('twitter');
var Spotify = require('node-spotify-api');
var keys = require('./keys.js');
var request = require('request');
var fs = require("fs");
var moment = require('moment');
const util = require('util')

var spotify = new Spotify(keys.spotify);
var twitter = new Twitter(keys.twitter);

const spotifyDefault = 'The Sign';
const spotifyArtistDefault = 'Ace of Base';
const omdbDefault = 'Mr. Nobody';
const twitterDefault = '@wojespn'
const twitterDefaultCount = 20;

// npm install -g inspect-process

var command = null;
var options = null;
var lineBreak = "\n=============================================================================================\n";


function commandReader(command, options){

    switch(command) {

    case "movie-this":
        if (options)
            omdbMovieSearch(options);
        else
            omdbMovieSearch(omdbDefault);
        break;
    case "spotify-this-song":
        if (options)
            spotifySongSearch(options);
        else
            spotifySongSearch(spotifyDefault);
        break;
    case "concert-this":
        if (options)
            bandsInTown(options);
        else
            console.log("No artist/band name entered.")
        break;
    case "do-what-it-says":
        doWhatItSays();
        break; 
    case "my-tweets":
        if (options) {
            var arr = options.split(" ")
            var user = arr[0];
            var count = twitterDefaultCount;
            
            if (arr.length > 1)
                count = parseInt(arr[1]);
        
            if (user.charAt(0) != '@')
                user = '@' + user;
        
            if (isNaN(count) || count <= 0 || count > 20)
                count = 20;

            twitterUserSearch(user, count);
        }
        else
            twitterUserSearch(twitterDefault, twitterDefaultCount);
        break;
    default:
        readMe();
    }
}


function spotifySongSearch(queryStr){

    spotify.search({type: 'track', query: queryStr}, function(err, data){
        if (err)
            return console.error("Spotify song search error", err);

        var itemsArr = data.tracks.items;
        outputStream(lineBreak);
        if (queryStr == spotifyDefault) {
            var artistArr = [];
            itemsArr.forEach(function(item){
                artistArr.push(item.artists[0].name);
            });           
            outputSongInfo(data.tracks.items[artistArr.indexOf(spotifyArtistDefault)]);
        }
        else {
            itemsArr.forEach(function(item){
                outputSongInfo(item);
            });
        }
    });
}

function outputSongInfo(song){
    // Artist(s)
    // The song's name
    // A preview link of the song from Spotify
    // The album that the song is from

    var artists = "";

    // For handling multiple artists
    if (song.artists.length > 1) {
        song.artists.forEach(function(item){
            artists += item.name + ", ";
        })
        artists = artists.slice(0, artists.length-2);
    }
    else if (song.artists.length === 1)
        artists += song.artists[0].name;

    var output = [
        "Song Name:  " + song.name,
        "Artist(s):  " + artists,
        "Album:      " + song.album.name,
        "Released:   " + song.album.release_date,
        "Preview:    " + song.preview_url,
        lineBreak].join('\n');
    outputStream(output);
}

function twitterUserSearch(user, count) {

    twitter.get('search/tweets', {q: user, count: count}, function(err, tweets, response) {
        if (err)
            return console.error("Twitter user search error", err);
        // console.log(util.inspect(tweets, false, null, true));
        outputStream(lineBreak);
        for (var i = 0; i < tweets.statuses.length; i++) {
            var output = [
                "Tweet Date:\n" + tweets.statuses[i].created_at,
                "\nText:\n" + tweets.statuses[i].text,
                lineBreak].join('\n');
            outputStream(output);
        }
    });    
}

/* * Title of the movie.
   * Year the movie came out.
   * IMDB Rating of the movie.
   * Rotten Tomatoes Rating of the movie.
   * Country where the movie was produced.
   * Language of the movie.
   * Plot of the movie.
   * Actors in the movie.*/
 function omdbMovieSearch(movieTitle){
    var queryURL = "http://www.omdbapi.com/?t=" + movieTitle + "&y=&plot=short&apikey=trilogy"
    
    request(queryURL, function(err, response, data){
        if (err)
            console.error("Omdb movie search error", err);
        data = JSON.parse(data);
        // console.log(util.inspect(data, false, null, true));
        var output = [
            lineBreak,
            "Title:  " + data.Title,
            "Year:  " + data.Year,
            "IMDB Rating:  " + data.imdbRating,
            "Rotten Tomatoes:  " + findObjectByKey(data.Ratings, 'Source', 'Rotten Tomatoes').Value,
            "Country Produced:  " + data.Country,
            "Language:  " + data.Language,
            "Actors:  " + data.Actors,
            "Plot summary: " + data.Plot,
            lineBreak].join('\n');
        outputStream(output);
    });
}

/*Name of the venue
Venue location
Date of the Event (use moment to format this as "MM/DD/YYYY") */
function bandsInTown(artist = "") {

    var queryURL = "https://rest.bandsintown.com/artists/" + artist + "/events?app_id=codingbootcamp"

    request(queryURL, function(err, response, data){
        if (err) 
            console.error("Bands in Town API search error", err);

        data = JSON.parse(data);
        outputStream(lineBreak);
        data.forEach(function(item){
            var output = [
                "Venue:     " + item.venue.name,
                "Location:  " + item.venue.city,
                "Date:      " + moment(item.datetime,'YYYY-MM-DD').format('MM/DD/YYYY'),
                lineBreak].join('\n');
            outputStream(output);
        });

    });
}

function doWhatItSays() {
    fs.readFile('random.txt', 'utf8', (err, data) => {
        if (err) throw err;
        console.log(data);
        var str = data.split(',');
        str[1] = str[1].replace('"', '')
        commandReader(str[0], str[1]);
    });
}

function outputStream(output) {
    console.log(output);
    fs.appendFile("log.txt", output, (err) => {
        if (err) console.error ("fs append file error", error);
    });
    
}

function readMe(){
    console.log("\nInvalid or no command found.\n\nValid commands are:\n--------------")
    console.log("movie-this (movie name)\nspotify-this-song (song title)\nmy-tweets (twitter handle)\nconcert-this (artist/band)\ndo-what-it-says");
}

function findObjectByKey(array, key, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            return array[i];
        }
    }
    return null;
}

if (process.argv.length >= 3) {
    command = process.argv[2];
    if (process.argv.length > 3)
        options = process.argv.slice(3).join(" ");
    commandReader(command, options);
}
else
    readMe();