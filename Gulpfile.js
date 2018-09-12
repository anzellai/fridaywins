/* eslint-disable */
"use strict";

let path = require("path");
let spawn = require("child_process").spawn;
let gulp = require("gulp");
let concat = require("gulp-concat");
let del = require("del");
let sass = require("gulp-sass");
let cleanCSS = require("gulp-clean-css");
let autoprefixer = require("gulp-autoprefixer");
let sourcemaps = require("gulp-sourcemaps");
let uglify = require("gulp-uglify");
let postcss = require("gulp-postcss");
let cssmin = require("gulp-cssmin");
let uncss = require("postcss-uncss");
let plumber = require("gulp-plumber");
let devServer;

let paths = {
    scripts: [
        path.normalize("./assets/js/*.js"),
        path.normalize("./assets/js/**/*.js")
    ],
    styles: [
        path.normalize("./assets/styles/*.scss"),
        path.normalize("./assets/styles/**/*.scss")
    ],
    templates: [
        path.normalize("./public/templates/*.html"),
        path.normalize("./public/templates/**/*.html"),
    ],
    images: path.normalize("./assets/images/**/*.*"),
    videos: path.normalize("./assets/videos/**/*.*"),
    vendor: path.normalize("./assets/vendor/**/*.*"),
    builds: path.normalize("./public/static/")
};

let onError = function(err) {
    console.log(err);
};

let debounce = function(fn) {
    let timer = null;
    return function() {
        let context = this,
            args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function() {
            fn.apply(context, args);
        }, 3000);
    };
};

gulp.task("clean:fonts", function() {
    return del(path.normalize(paths.builds + "fonts"));
});

gulp.task("clean:images", function() {
    return del(path.normalize(paths.builds + "images"));
});

gulp.task("clean:videos", function() {
    return del(path.normalize(paths.builds + "videos"));
});

gulp.task("clean:vendor", function() {
    del(path.normalize(paths.builds + "*.png"));
    return del(path.normalize(paths.builds + "vendor"));
});

gulp.task("clean:scripts", function() {
    return del(path.normalize(paths.builds + "js"));
});

gulp.task("clean:styles", function() {
    return del(path.normalize(paths.builds + "css"));
});

gulp.task("clean", function() {
    gulp.task("cleanall", [
        "clean:images", "clean:videos", "clean:vendor",
        "clean:scripts", "clean:styles"
    ]);
});

gulp.task("images", ["clean:images"], function() {
    return gulp.src(paths.images)
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(gulp.dest(path.normalize(paths.builds + "images")));
});

gulp.task("videos", ["clean:videos"], function() {
    return gulp.src(paths.videos)
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(gulp.dest(path.normalize(paths.builds + "videos")));
});

gulp.task("vendor", ["clean:vendor"], function() {
    gulp.src("./assets/*.png")
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(gulp.dest(path.normalize(paths.builds)));
    return gulp.src(paths.vendor)
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(gulp.dest(path.normalize(paths.builds + "vendor")));
});

gulp.task("scripts", ["clean:scripts"], function() {
    return gulp.src(paths.scripts)
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(concat("app.min.js"))
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest(path.normalize(paths.builds + "js")));
});

gulp.task("build:scripts", ["clean:scripts"], function() {
    return gulp.src(paths.scripts)
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(uglify())
        .pipe(concat("app.min.js"))
        .pipe(gulp.dest(path.normalize(paths.builds + "js")));
});

gulp.task("styles", function() {
    gulp.src(paths.styles)
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefixer())
        .pipe(sourcemaps.init())
        .pipe(cleanCSS({
            compatibility: "ie8"
        }))
        .pipe(cssmin())
        .pipe(sourcemaps.write("./"))
        .pipe(concat("app.min.css"))
        .pipe(gulp.dest(path.normalize(paths.builds + "css")));
});

gulp.task("build:styles", function() {
    let plugins = [
        uncss({
            html: paths.templates
        }),
    ];
    gulp.src(paths.styles)
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefixer())
        .pipe(cleanCSS({
            compatibility: "ie8"
        }))
        .pipe(cssmin())
        .pipe(concat("app.min.css"))
        // .pipe(postcss(plugins))
        .pipe(gulp.dest(path.normalize(paths.builds + "css")));
});

gulp.task("backend", [], debounce(function() {
    if (!devServer) {
        devServer = spawn("PORT=8081 gin", [
            "-p", "8080",
            "-a", "8081",
            "-b", "main",
            "run", "main.go"
        ], {
            stdio: "inherit",
            shell: true,
        });

        devServer.on("error", function() {
            devServer.kill();
            del(path.normalize("./main"));
        });
    }
}));

gulp.task("watch", function() {
    // generic tasks
    gulp.watch(["./assets/js/*.*", "./assets/js/**/*.*"], ["scripts"]);
    gulp.watch(["./assets/styles/*.*", "./assets/styles/**/*.*"], ["styles"]);
    gulp.watch(paths.images, ["images"]);
    gulp.watch(paths.videos, ["videos"]);
    gulp.watch(["./assets/vendor/**/*", "./assets/*.png"], ["vendor"]);
    gulp.watch([
        "./main.go",
        "./src/*.go",
        "./src/**/*.go",
    ], ["backend"]);
});

gulp.task("build", [
    "images", "videos", "vendor",
    "build:scripts", "build:styles",
]);

gulp.task("default", [
    "backend", "images", "videos", "vendor",
    "scripts", "styles", "watch",
]);

gulp.task("dev", [
    "backend", "scripts", "styles", "watch",
]);
