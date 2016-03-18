// const net = require('net');
// var host = '127.0.0.1';
// var port = '1337';
'use strict';
var ready = false;
var YT = null;
var player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    videoId: 'M7lc1UVf-VE',
    width: 720,
    height: 480,
    playerVars: {
      color: 'white',
      autoplay: 0,
      controls: 1
    },
    events: {
      'onReady': onPlayerReady,
    }
  });
}

function onPlayerReady(event) {
  //event.target.playVideo();
}

function curTime() {
  var time = Math.floor(player.getCurrentTime());
  //Put Websocket here 
  //Emit function socket I/o
  //alert(time);
  return curTime;
}

function getDuration() {
  player.getDuration();
}

function writeComment(){
  var userInput = document.getElementById('userInput').value;
  document.getElementById('dispComment').innerHTML = userInput;
    // userInput.onKeyUp = function(){
    //   document.getElementById('dispTime').innerHTML = inputBox.curTime();
    // }
}
