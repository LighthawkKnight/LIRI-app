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

// movie-this '<movie name here>'
// npm install -g inspect-process

var command = null;
var options = null;
var lineBreak = "\n=============================================================================================\n";


if (process.argv.length >= 3) {
    command = process.argv[2];

    if (process.argv.length > 3)
        options = process.argv.slice(3);

    switch(command) {
        case "movie-this":
            if (options)
                omdbMovieSearch(options.join(" "));
            else
                omdbMovieSearch(omdbDefault);
            break;
        case "spotify-this-song":
            if (options)
                spotifySongSearch(options.join(" "));
            else
                spotifySongSearch(spotifyDefault);
            break;
        case "concert-this":
            if (options)
                bandsInTown(options.join(" "));
            else
                console.log("No artist/band name entered.")
            break;
        case "do-what-it-says":
            break;
        
        case "my-tweets":
            if (options) {
                var user = options[0];
                var count = twitterDefaultCount;
                
                if (options.length > 1)
                    count = parseInt(options[1]);
            
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
else
    readMe();


function spotifySongSearch(queryStr){

    spotify.search({type: 'track', query: queryStr}, function(err, data){
        if (err)
            return console.error("Spotify song search error", err);

        var itemsArr = data.tracks.items;
        console.log(lineBreak);

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

    console.log("Song Name:  " + song.name);
    console.log("Artist(s):  " + artists);
    console.log("Album:      " + song.album.name);
    console.log("Released:   " + song.album.release_date);
    console.log("Preview:    " + song.preview_url);
    console.log(lineBreak);
}

function twitterUserSearch(user, count) {

    twitter.get('search/tweets', {q: user, count: count}, function(err, tweets, response) {
        if (err)
            return console.error("Twitter user search error", err);
        // console.log(util.inspect(tweets, false, null, true));

        console.log(lineBreak);
        for (var i = 0; i < tweets.statuses.length; i++) {
            console.log("Tweet Date:\n" + tweets.statuses[i].created_at);
            console.log("\nText:\n" + tweets.statuses[i].text);
            console.log(lineBreak);
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
        console.log(lineBreak);
        console.log("Title:  " + data.Title);
        console.log("Year:  " + data.Year);
        console.log("IMDB Rating:  " + data.imdbRating);
        console.log("Rotten Tomatoes:  " + findObjectByKey(data.Ratings, 'Source', 'Rotten Tomatoes').Value);
        console.log("Country Produced:  " + data.Country);
        console.log("Language:  " + data.Language);
        console.log("Actors:  " + data.Actors);
        console.log("Plot summary: " + data.Plot);
        console.log(lineBreak);
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
        console.log(lineBreak);
        data.forEach(function(item){
            console.log("Venue:     " + item.venue.name);
            console.log("Location:  " + item.venue.city);
            console.log("Date:      " + moment(item.datetime,'YYYY-MM-DD').format('MM/DD/YYYY'));
            console.log(lineBreak);
        });

    });
}

function readMe(){
    console.log("Invalid or no command found.\n\nValid commands are:\n--------------")
    console.log("movie-this (movie name)\nspotify-this-song (song title)\nmy-tweets (twitter handle)");
}

function findObjectByKey(array, key, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            return array[i];
        }
    }
    return null;
}