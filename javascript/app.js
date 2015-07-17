/* global soundManager */

var $ = require('jquery');
var request = require('superagent');

$(function() {
  $('#player').hide();
});

// /////////////////// //
// API Request Helper //
// /////////////////// //

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
  this.playing = false;
};

// Internal API

App.prototype._advance = function() {
  this._setCurrentTrack(this.tracks.pop());
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
      onpause: function() {
        self._setPlaying(false);
      },
      onstop: function() {
        self._setPlaying(false);
      },
      onplay: function() {
        self._setPlaying(true);
      },
      onresume: function() {
        self._setPlaying(true);
      },
      whileplaying: function() {
        self._setPlaying(true);
        $('#bar').css('width', Math.floor(this.position / this.duration * 100) + '%');
      },
      onfinish: function() {
        self._setPlaying(false);
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

App.prototype._setCurrentTrack = function(currentTrack) {
  this.currentTrack = currentTrack;
  if (currentTrack) {
    $('#track-image').attr('src', currentTrack.album.album_art);
    $('#track-name').html(currentTrack.title);
    $('#artist-name').html((currentTrack.artists[0] || {}).name);
  }
};

App.prototype._setPlaying = function(playing) {
  if (playing !== this.playing) {
    this.playing = playing;
    if (playing) {
      $('#play').hide();
      $('#pause').show();
    } else {
      $('#pause').hide();
      $('#play').show();
    }
  }
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

  $('#player').show();

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
  this._setCurrentTrack(null);
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
