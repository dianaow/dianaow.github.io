var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var pkg = require('./package.json');
var AWS = require('aws-sdk');
var fs = require('fs');
var csv = require('csv-parser')
require('dotenv').config({path: '.env'});

// Copy third party libraries from /node_modules into /vendor
gulp.task('vendor', function() {

  // Bootstrap
  gulp.src([
      './node_modules/bootstrap/dist/**/*',
      '!./node_modules/bootstrap/dist/css/bootstrap-grid*',
      '!./node_modules/bootstrap/dist/css/bootstrap-reboot*'
    ])
    .pipe(gulp.dest('./vendor/bootstrap'))

  // jQuery
  gulp.src([
      './node_modules/jquery/dist/*',
      '!./node_modules/jquery/dist/core.js'
    ])
    .pipe(gulp.dest('./vendor/jquery'))
 
})

// Configure the browserSync task
gulp.task('browserSync', function() {
  browserSync.init({
    server: {
      baseDir: "./",
      port: 3010
    },
    ui: {
      port: 3001
    },
    browser: "google chrome"
  });
});

gulp.task('download', function() {
  var s3 = new AWS.S3();

  //configuring the AWS environment
  AWS.config.update({
      region: 'ap-southeast-1',
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY
    })

  //configuring parameters
  var params = {
    Bucket: 'transport-api-data',
    Key: 'origin_destination_bus_201812.csv'
  }
  //var file = fs.createWriteStream('./busroutes/data/origin_destination_bus_201812.csv')
  //s3.getObject(params).createReadStream().pipe(file)

  var params = {
    Bucket: 'transport-api-data',
    Key: 'busroutes.csv'
  }
  var file = fs.createWriteStream('./busroutes/data/busroutes.csv')
  s3.getObject(params).createReadStream().pipe(file)

  var params = {
    Bucket: 'transport-api-data',
    Key: 'busstops.csv'
  }
  var file = fs.createWriteStream('./busroutes/data/busstops.csv')
  s3.getObject(params).createReadStream().pipe(file)
})

gulp.task('parse', function() {

  var od = []
  fs.createReadStream('./busroutes/data/origin_destination_bus_201812.csv')
    .pipe(csv())
    .on('data', function (row) {
      od.push(row)
    })
    .on('end', function () {
      console.log('Data loaded')
    })

})

// Dev task
gulp.task('dev', ['browserSync'], function() {
  gulp.watch('./css/*.css', browserSync.reload);
  gulp.watch('**/*.html', browserSync.reload);
});

// Default task
gulp.task('default', ['vendor', 'download', 'dev']);
