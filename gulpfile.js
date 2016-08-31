var gulp = require('gulp');
var cjsx = require('gulp-cjsx');
var sass = require('gulp-sass');
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
    .pipe(webpack({output: {filename: 'dist.js'}}))
    .pipe(gulp.dest('web/'));
});

gulp.task('native', ['cjsx-native']);
gulp.task('web', ['webpack']);

gulp.task('watch', ['default'], function () {
  return gulp.watch(['src/*.cjsx', 'scss/*.scss'], ['default']);
});

gulp.task('scss', function () {
  return gulp.src('scss/styles.scss')
    .pipe(sass())
    .pipe(gulp.dest('web/'));
});

gulp.task('default', ['native', 'web', 'scss']);
