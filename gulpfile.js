var gulp = require('gulp');
var cjsx = require('gulp-cjsx');
var gutil = require('gulp-util');
var webpack = require('webpack-stream');
var preprocess = require('gulp-preprocess');

gulp.task('pre-native', function() {
  return gulp.src('src/*.cjsx')
    .pipe(preprocess({context: {NATIVE: true}, extension: 'coffee'}))
    .pipe(gulp.dest('src-native'));
});
gulp.task('cjsx-native', ['pre-native'], function() {
  return gulp.src('src-native/*.cjsx')
    .pipe(cjsx().on('error', gutil.log))
    .pipe(gulp.dest('src-native/'));
});

gulp.task('pre-web', function() {
  return gulp.src('src/*.cjsx')
    .pipe(preprocess({context: {WEB: true}, extension: 'coffee'}))
    .pipe(gulp.dest('src-web'));
});
gulp.task('cjsx-web', ['pre-web'], function() {
  return gulp.src('src-web/*.cjsx')
    .pipe(cjsx().on('error', gutil.log))
    .pipe(gulp.dest('src-web/'));
});
gulp.task('webpack', ['cjsx-web'], function() {
  return gulp.src('src-web/web.js')
    .pipe(webpack(require('./webpack.config.js')))
    .pipe(gulp.dest('web/'));
});

gulp.task('native', ['cjsx-native']);
gulp.task('web', ['webpack']);

gulp.task('watch', function () {
  gulp.watch('src/*.cjsx', ['default']);
});

gulp.task('default', ['native', 'web']);
