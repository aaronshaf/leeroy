const gulp = require('gulp')
const gutil = require('gulp-util')
const eslint = require('gulp-eslint')
const react = require('gulp-react')
const eslintConfig = require('./eslint.json')
const uglify = require('gulp-uglify')
const browserify = require('browserify')
const source = require('vinyl-source-stream')
const sass = require('gulp-sass')
const cache = require('gulp-cached')
const connect = require('gulp-connect')
const buffer = require('vinyl-buffer')
const sourcemaps = require('gulp-sourcemaps')
const es6ify = require('es6ify')

gulp.task('jsx', function() {
  return gulp.src(['app/**/*.js'])
    .pipe(cache('jsx'))
    .pipe(react())
    .pipe(gulp.dest('tmp/jsx'))
})

gulp.task('browserify', ['jsx'], function() {
  return browserify({
      entries: ['./tmp/jsx/main.js'],
      debug: true
    })
    .transform(es6ify)    
    .bundle()
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./dist'))
})

// TODO: include this by default
gulp.task('uglify', ['browserify'], function () {
  return gulp.src(['dist/main.js'])
    .pipe(uglify({
      output: {
        beautify: true
      }
    }))
    .pipe(gulp.dest('dist'))
})

gulp.task('assets', function () {
  return gulp.src(['assets/**/*'])
    .pipe(gulp.dest('dist'))
})

// See: https://github.com/sindresorhus/gulp-ruby-sass/issues/74
gulp.task('sass', function() {
  return gulp.src('./stylesheets/main.scss')
    .pipe(sass({
      outputStyle: 'compressed'
    }))
    .on('error', function (err) { gutil.log(err.message, err) })
    .pipe(gulp.dest('dist'))
})

gulp.task('lint', function () {
  return gulp.src(['app/**/*.js'])
    .pipe(cache('linting'))
    .pipe(react())
    .pipe(eslint(eslintConfig))
    .pipe(eslint.format())
})

gulp.task('default', ['assets', 'sass', 'uglify'])

gulp.task('dev', ['assets', 'sass', 'browserify', 'lint'],
  function() {
    gulp.watch([
      'assets/**/*'
    ], ['assets'])

    gulp.watch([
      'stylesheets/**/*'
    ], ['sass'])

    gulp.watch([
      'app/**/*.js'
    ], ['lint', 'browserify'])
  }
)

