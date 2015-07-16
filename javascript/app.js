/* global soundManager */

// /////////////////// //
// API Request Helper //
// /////////////////// //

var request = require('superagent');

var API_URL = 'http://localhost:3000';

var API = function(method, endpoint) {
  return request[method](API_URL + endpoint);
};

// ///////// //
// App Class //
// ///////// //

var App = function() {
  this.playlistId = null;
  this.tracks = [];
  this.currentTrack = null;
  this.currentSound = null;

  this.ready = false;
};

// Internal API

App.prototype._advance = function() {
  this.currentTrack = this.tracks.pop();
  if (!this.currentTrack) {
    this.stop();
  }
};

App.prototype._play = function() {
  var self = this;

  if (!this.currentTrack || !this.playlistId) {
    return;
  }

  API('get', '/playback/media/' + this.currentTrack.id + '?protocol=rtmp&playlist_id=' + this.playlistId).end(function(err, res) {
    if (err) {
      self._advance();
      self._play();
      return;
    }

    if (!res.body.asset) {
      return;
    }

    if (self.currentSound) {
      self.currentSound.stop();
      self.currentSound.destruct();
    }

    self.currentSound = soundManager.createSound({
      id: 'track-' + Date.now(),
      serverURL: res.body.host,
      url: res.body.asset,
      autoLoad: true,
      autoPlay: true,
      onload: function() {
      },
      onfinish: function() {
        self.currentSound.destruct();
        self.currentSound = null;
        self._advance();
        self._play();
      },
      volume: 100
    });

    window.sound = self.currentSound;
  });

};

// Public API

App.prototype.getReady = function() {
  return this.ready;
};

App.prototype.setReady = function(ready) {
  this.ready = ready;
};

App.prototype.play = function(playlistId) {
  var self = this;

  if ((this.playlistId === playlistId || !playlistId) && this.currentSound) {
    this.currentSound.play();
    return;
  }

  if (!playlistId) {
    return;
  }

  API('get', '/playback/tracks/' + playlistId).end(function(err, res) {
    if (err) {
      return;
    }

    self.stop();
    self.playlistId = playlistId;
    self.tracks = res.body;
    self._advance();
    self._play();
  });
};

App.prototype.pause = function() {
  if (this.currentSound) {
    this.currentSound.pause();
  }
};

App.prototype.stop = function() {
  if (this.currentSound) {
    this.currentSound.destruct();
  }

  this.currentSound = null;
  this.currentTrack = null;
  this.playlistId = null;
  this.tracks = [];
};

App.prototype.next = function() {
  if (this.currentSound) {
    this.currentSound.stop();
    this.currentSound.destruct();
  }
  this._advance();
  this._play();
};

// ////////////////// //
// App Initialization //
// ////////////////// //

window.app = new App();

soundManager.setup({
  url: '/javascript/swf/',
  flashVersion: 9,
  preferFlash: true,
  onready: function() {
    window.app.setReady(true);
  }
});
