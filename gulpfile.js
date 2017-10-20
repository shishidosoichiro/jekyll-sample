'use strict';

const autoprefixer = require('autoprefixer');
const gulp         = require('gulp');
const postcss      = require('gulp-postcss');
const rimraf       = require('rimraf');
const sass         = require('gulp-sass');
const sourcemaps   = require('gulp-sourcemaps');
const sync         = require('browser-sync').create();
const yaml         = require('js-yaml');
const fs           = require('fs');
const path         = require('path');
const cp           = require('child_process');
const runSequence  = require('run-sequence');

runSequence.use(gulp);
function series(){
  const args = Array.prototype.slice.call(arguments);
  return () => {
    return runSequence.apply(null, args);
  }
}

const config = fs.existsSync('./_config.yml') ? yaml.safeLoad(fs.readFileSync('./_config.yml', 'utf8')) : {};

function resolve(pattern){
  return path.resolve(config.source, pattern);
}

const paths = {
  scss: resolve('scss/main.scss'),
  css: resolve('css'),
  jekyll: [resolve('**/*.html'), resolve('**/*.md')],
}

gulp.task('stylesheet:clean', (done) => {
  rimraf(paths.css, done);
});

gulp.task('stylesheet', () => {
  return gulp.src(paths.scss)
  .pipe(sourcemaps.init())
  .pipe(sass({
    includePaths: './node_modules',
    precision: 6,
    outputStyle: 'expanded'
  }))
  .pipe(postcss([ autoprefixer() ]))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(paths.css))
});

gulp.task('jekyll', (done) => {
  return cp.spawn('jekyll', ['build'], {stdio: 'inherit'}).on('close', done);
});

gulp.task('sync', ()  => {
  sync.init({
    server: {
      baseDir: config.source
    },
    host: 'localhost',
    notify: false
  })
  sync.watch(paths.scss)
    .on('change', series('stylesheet:clean', 'stylesheet', sync.reload));
  sync.watch(paths.jekyll)
    .on('change', series('jekyll', sync.reload));
});

gulp.task('build', series('stylesheet', 'jekyll'));
