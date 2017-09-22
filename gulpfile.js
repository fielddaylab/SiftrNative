var gulp = require('gulp');
var grinder = require('gulp-coffee');
var coffee2 = require('coffeescript');
var sass = require('gulp-sass');
var gutil = require('gulp-util');
var webpack = require('webpack-stream');
var preprocess = require('gulp-preprocess');

gulp.task('pre-native', function() {
  return gulp.src(['src/*.coffee', 'src/*.js'])
    .pipe(preprocess({context: {NATIVE: true}}))
    .pipe(gulp.dest('src-native'));
});
gulp.task('coffee-native', ['pre-native'], function() {
  return gulp.src('src-native/*.coffee')
    .pipe(grinder({coffee: coffee2}))
    .pipe(gulp.dest('src-native/'));
});

gulp.task('pre-web', function() {
  return gulp.src(['src/*.coffee', 'src/*.js'])
    .pipe(preprocess({context: {WEB: true}}))
    .pipe(gulp.dest('src-web'));
});
gulp.task('coffee-web', ['pre-web'], function() {
  return gulp.src('src-web/*.coffee')
    .pipe(grinder({coffee: coffee2}))
    .pipe(gulp.dest('src-web/'));
});
gulp.task('webpack', ['coffee-web'], function() {
  return gulp.src('src-web/web.js')
    .pipe(webpack({
      output: {filename: 'dist.js'},
      module: {
        loaders: [
          {
            test: /.jsx?$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            query: {
              presets: ['es2015', 'react']
            }
          }
        ]
      }
    }))
    .pipe(gulp.dest('web/'));
});

gulp.task('native', ['coffee-native']);
gulp.task('web', ['webpack']);

gulp.task('watch', ['default'], function () {
  return gulp.watch(['src/*.coffee', 'src/*.js', 'scss/*.scss'], ['default']);
});

gulp.task('scss', function () {
  return gulp.src('scss/styles.scss')
    .pipe(sass())
    .pipe(gulp.dest('web/'));
});

gulp.task('default', ['native', 'web', 'scss']);
