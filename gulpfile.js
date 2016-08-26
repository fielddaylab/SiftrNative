var gulp = require('gulp');
var cjsx = require('gulp-cjsx');
var gutil = require('gulp-util');
var webpack = require('webpack-stream');

gulp.task('cjsx', function() {
  return gulp.src('src/*.cjsx')
    .pipe(cjsx().on('error', gutil.log))
    .pipe(gulp.dest('src/'));
});

gulp.task('webpack', ['cjsx'], function() {
  return gulp.src('src/web.js')
    .pipe(webpack(require('./webpack.config.js')))
    .pipe(gulp.dest('web/'));
});

gulp.task('watch', function () {
  gulp.watch('src/*.cjsx', ['default']);
});

gulp.task('default', ['cjsx', 'webpack']);
