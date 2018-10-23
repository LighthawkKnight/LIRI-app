require("dotenv").config();
var Twitter = require('twitter');
var Spotify = require('node-spotify-api');
var keys = require('./keys.js');
var request = require('request');
const util = require('util')

var spotify = new Spotify(keys.spotify);
var twitter = new Twitter(keys.twitter);

// movie-this '<movie name here>'

var input = process.argv;
var command = null;
var options = null;


if (input.length >= 3) {
    command = input[2];
    if (input.length > 3) {
        options = input.splice(3, input.length);
    }
}
else
    console.log ("No command found.");  // Maybe a helpme here

// console.log(command);

// if (options)
//     console.log("options = true");

switch(command) {
    case "movie-this":
        break;
    case "spotify-this-song":
        if (options)
            spotifySongSearch();
        else
            spotifyDefault();
        break;
    case "my-tweets":
        if (options)
            twitterUserSearch();
        else
            twitterDefault();
        break;
    default:
        readMe();
}


function spotifyDefault(){
    // "The Sign" by Ace of Base
    spotify.search({type: 'track', query: 'The Sign'}, function(err, data) {
        if (err)
            return console.error("Spotify default search error", err);
        // console.log(util.inspect(data, false, null, true))
        var itemsArr = data.tracks.items;
        var artistArr = [];

        itemsArr.forEach(function(item){
            artistArr.push(item.artists[0].name);
        });
        
        outputSongInfo(data.tracks.items[artistArr.indexOf("Ace of Base")]);
        
        // console.log(util.inspect(data.tracks.items[artistArr.indexOf("Ace of Base")], false, null, true));
                

    });
}

function spotifySongSearch(){
    var queryStr = ""

    for (var i = 0; i < options.length; i++)
        if (i < options.length-1)
            queryStr += options[i] + " ";
        else
            queryStr += options[i];

    spotify.search({type: 'track', query: queryStr}, function(err, data){
        if (err)
            return console.error("Spotify song search error", err);

        var itemsArr = data.tracks.items;

        lineBreak();
        itemsArr.forEach(function(item){
            outputSongInfo(item);
        });
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
    lineBreak();
}

function twitterDefault() {
    twitter.get('search/tweets', {q: '@SonWukongSSJ', count: 20}, function(err, tweets, response) {
        if (err)
            return console.error("Twitter default search error", err);
        // console.log(util.inspect(tweets, false, null, true));

        for (var i = 0; i < tweets.statuses.length; i++) {
            outputTweet(tweets.statuses[i]);
        }
    });
}

function twitterUserSearch() {

    var user = options[0];
    var count = parseInt(options[1]);

    if (user.charAt(0) != '@')
        user = '@' + user;

    if (count < 0 || count > 20)
        count = 20;

    twitter.get('search/tweets', {q: user, count: count}, function(err, tweets, response) {
        if (err)
            return console.error("Twitter user search error", err);
        // console.log(util.inspect(tweets, false, null, true));

        lineBreak();
        for (var i = 0; i < tweets.statuses.length; i++) {
            outputTweet(tweets.statuses[i]);
        }
    });    
}

function outputTweet(tweet){
    console.log("Tweet Date:");
    console.log(tweet.created_at);
    console.log("")
    console.log("Text:");
    console.log(tweet.text);
    lineBreak();
}


function lineBreak(){
    console.log("");
    console.log("===================================================================================");
    console.log("");
}

function readMe(){
    console.log("Invalid command");
}