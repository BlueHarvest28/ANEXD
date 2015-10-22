// README
// This is responsilbe for serving up the front end.
// 
// To start the server type:
// 	    $ gulp 
//
// Where you should be in same directory as the gulpfile.js
//
// Running this will complie the scss into one css file found in /css
// Will also run check on js to make sure no errors

// BUILDING
// This is done when want to compress the project for use in actual 
// environment. Simply type
// 		$ gulp build 
//
// instead of gulp.
//
// This will uglify all code compress it and move it to dis folder. It will
// also run web server so can check the site running from the dist folder.


// TO DO
// -----------
// 1. Add image compression
// 2. css have compatibility in it e.g. IE 7

// Tutorial used to setup:
// http://mherman.org/blog/2014/08/14/kickstarting-angular-with-gulp/#.ViPZ636rTDc

// gulp
var gulp = require('gulp');

// plugins
var connect = require('gulp-connect');		 //1.
var jshint = require('gulp-jshint');		 //2.
var uglify = require('gulp-uglify'); 		 //3.
var clean = require('gulp-clean'); 			 //4.
var minifycss = require('gulp-minify-css');  //5.
var sass = require('gulp-sass'); 			 //6.

// Checks Js files for any errors
// Descript: Finds all js files in app directory and checks them for errors
gulp.task('lint', function() {
  gulp.src(['./app/views/**/*.js', './app/*.js', '!./app/bower_components/**'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});

// Converts all scss files into one css file.
// Descript: All scss files in views/** and app/ combined into on file found in css/
gulp.task('sass', function () {
  gulp.src('./app/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('.app/css'));
});
 
gulp.task('sass:watch', function () {
  gulp.watch(['./app/views/**/*.scss','./app/*.scss'], ['sass']);
});

// COMPRESSION
// -------------------------------------------------

// Removes any empty or unsued files
// Descript: Goes through dist/ directory clears out any unused files.
gulp.task('clean', function() {
    gulp.src('./dist/*')
      .pipe(clean({force: true}));
});

// Takes js files moves them to dist minified
gulp.task('minify-js', function() {
  gulp.src(['./app/*.js', '!./app/bower_components/**'])
    .pipe(uglify({ }))
    .pipe(gulp.dest('./dist/'));
	
  gulp.src('./app/views/**/*.js')
    .pipe(uglify({ }))
    .pipe(gulp.dest('./dist/views'));
});

// Moves all bower_components to dist
// Descript: moves any components downloaded by bower into folder so dist
// 			 use them aswell.
gulp.task('copy-bower-components', function () {
  gulp.src('./app/bower_components/**')
    .pipe(gulp.dest('dist/bower_components'));
});

// Move all html files to dist
// Descript: moves all and any html files in app/ or views/** to dist.
gulp.task('copy-html-files', function () {
  gulp.src('./app/views/**/*.html')
    .pipe(gulp.dest('dist/views'));
  gulp.src('./app/*.html')
	.pipe(gulp.dest('dist/'));
});

// Move css file to dist
// Descript: moves single css style sheet to dist/
gulp.task('copy-css-file', function () {
  gulp.src('./app/css/*.css')
    .pipe(gulp.dest('dist/css'));
});


// SERVER's
// -------------------------------------------------
// Brief: Area where the server will be hosted to view. 

// This is the development server
// go to: http://localhost:8888
// runs from app/ directory
gulp.task('connect', function () {
  connect.server({
    root: 'app/',
    port: 8888,
	livereload: true
  });
});

// This is the build server
// go to: http://localhost:9999
// runs from dist/ directory
gulp.task('connectDist', function () {
  connect.server({ //1.
    root: 'dist/',
    port: 9999,
	livereload: true
  });
});

// default task
// This should be run when developing.
gulp.task('default',
  ['lint', 'sass', 'connect']
);


// build task
// ONLY run this task when want to compress project ready for deployment
gulp.task('build',
  ['lint', 'copy-css-file', 'minify-js', 'copy-html-files', 'copy-bower-components', 'connectDist']
);