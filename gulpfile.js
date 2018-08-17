var gulp = require('gulp');
var sass = require('gulp-sass');
var gutil = require('gulp-util');
var webpackStream = require('webpack-stream');
var webpack = require('webpack');
var preprocess = require('gulp-preprocess');

gulp.task('pre-native', function() {
  return gulp.src(['src/*.js'])
    .pipe(preprocess({context: {NATIVE: true}}))
    .pipe(gulp.dest('src-native'));
});

gulp.task('pre-web', function() {
  return gulp.src(['src/*.js'])
    .pipe(preprocess({context: {WEB: true}}))
    .pipe(gulp.dest('src-web'));
});
gulp.task('webpack', ['pre-web'], function() {
  return gulp.src('src-web/web.js')
    .pipe(webpackStream({
      output: {filename: 'dist.js'},
      plugins: [
        new webpack.DefinePlugin({
          'process.env': {NODE_ENV: "'production'"}
        }),
        new webpack.optimize.UglifyJsPlugin(),
      ],
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
      },
    }, webpack))
    .pipe(gulp.dest('web/'));
});

gulp.task('native', ['pre-native']);
gulp.task('web', ['webpack']);

gulp.task('watch', ['default'], function () {
  return gulp.watch(['src/*.js', 'scss/*.scss'], ['default']);
});

gulp.task('scss', function () {
  return gulp.src('scss/styles.scss')
    .pipe(sass())
    .pipe(gulp.dest('web/'));
});

gulp.task('default', ['native', 'web', 'scss']);
