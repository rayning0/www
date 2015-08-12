/*
 * jQuery File Upload Plugin JS Example 8.9.1
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/* global $, window */

$(function () {
    'use strict';
    $('#buttons').hide();

    $('#fileupload').submit(function() {
      event.preventDefault();
      $('#buttons').show();

      // Load images already in database:
      $('#fileupload').addClass('fileupload-processing');
      $.ajax({
          // Uncomment the following to send cross-domain cookies:
          //xhrFields: {withCredentials: true},
          url: $('#fileupload').fileupload('option', 'url'),
          dataType: 'json',
          context: $('#fileupload')[0],
          beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Basic ' +
              btoa($('input:text').val() + ":" + $('input:password').val()));
          }

      }).always(function () {
          $(this).removeClass('fileupload-processing');
      }).done(function (result) {
          $(this).fileupload('option', 'done')
              .call(this, $.Event('done'), {result: result});
      });
    });

    // Initialize the jQuery File Upload widget:
    $('#fileupload').fileupload({
      url: 'https://api.playlist.com/images', // production
      // url: 'http://localhost:3000/images', // development
      singleFileUploads: true,
      // Uncomment the following to send cross-domain cookies:
      // xhrFields: {withCredentials: true},
      beforeSend: function(xhr) {
        xhr.setRequestHeader('Authorization', 'Basic ' +
          btoa($('input:text').val() + ":" + $('input:password').val()));
      }
    });

    $('#fileupload')
      .bind('fileuploaddestroy', function (e, data) {
        data.beforeSend = function(xhr) {
          xhr.setRequestHeader('Authorization', 'Basic ' +
          btoa($('input:text').val() + ":" + $('input:password').val()));
        }
    });

});
