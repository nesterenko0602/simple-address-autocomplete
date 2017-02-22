var gulp = require('gulp'); // Сообственно Gulp JS

var livereload = require('gulp-livereload'), // Livereload для Gulp
    less = require('gulp-less'),
    csso = require('gulp-csso'), // Минификация CSS
    autoprefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'), // Минификация JS
    babel = require("gulp-babel"),
    rename = require("gulp-rename"),
    concat = require('gulp-concat'),
    base64 = require('gulp-base64-inline');

var paths = {
    css: './src/less/*.less',
    js: './src/js/*.js'
}

gulp.task('css', function () {
    return (gulp.src(paths.css)
        .pipe(less())
        .pipe(base64('../img'))
        .pipe(autoprefixer({
            browsers: ['> 1%', 'IE 8', 'last 20 versions']
        }))
        .pipe(csso())
        .pipe(gulp.dest('./dist'))).on('error', swallowError);
});

gulp.task('js', function (cb) {
    return gulp.src(paths.js)
        .pipe(babel({
            presets: ['es2015']
        })).on('error', swallowError)
        // .pipe(uglify())
        .pipe(gulp.dest('./dist'))
});

gulp.task('default', function() {
    livereload.listen();

    gulp.watch(paths.css, ['css']).on('change', livereload.changed);
    gulp.watch(paths.js, ['js']).on('change', livereload.changed);
});

function swallowError (error) {
  console.log(error.toString())
  this.emit('end')
}
