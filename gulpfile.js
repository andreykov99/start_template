const { src, dest, parallel, series } = require('gulp');
const gulp = require('gulp');

const fs = require('fs');

const browsersync = require('browser-sync').create(),
    fileinclude = require('gulp-file-include'),
    scss = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    gcmq = require('gulp-group-css-media-queries'),
    cleanCSS = require('gulp-clean-css'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify-es').default,
    imagemin = require('gulp-imagemin'),
    svgSprite = require('gulp-svg-sprite'),
    ttf2woff = require('gulp-ttf2woff'),
    ttf2woff2 = require('gulp-ttf2woff2'),
    fonter = require('gulp-fonter'),
    del = require('del');

// webp = require('gulp-webp'),
// webphtml = require('gulp-webp-html'),
// webpcss = require("gulp-webpcss"),

const srcDir = 'app';
const dstDir = require('path').basename(__dirname);
const path = {
    build: {
        html: `${dstDir}/`,
        css: `${dstDir}/css/`,
        js: `${dstDir}/js/`,
        favicon: `${srcDir}/img/favicon.{jpg,png,svg,gif,ico,webp}`,
        img: `${dstDir}/img/`,
        fonts: `${dstDir}/fonts/`,
    },
    src: {
        html: [`${srcDir}/*.html`, `!${srcDir}/_*.html`],
        css: `${srcDir}/scss/style.scss`,
        js: `${srcDir}/js/main.js`,
        img: `${srcDir}/img/**/*.{jpg,png,svg,gif,ico,webp}`,
        fonts: `${srcDir}/fonts/*.ttf`,
    },
    watch: {
        html: `${srcDir}/**/*.html`,
        css: `${srcDir}/scss/**/*.scss`,
        js: `${srcDir}/js/**/*.js`,
        img: `${srcDir}/img/**/*.{jpg,png,svg,gif,ico,webp}`,
    },
    clean: `./${dstDir}/`
};

function browserSync() {
    browsersync.init({
        server: {
            baseDir: path.clean
        },
        notify: false
    })
}

function html() {
    return src(path.src.html)
        .pipe(fileinclude())
        // .pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream())
}

function clean() {
    return del(path.clean);
}

function images() {
    return src(path.src.img)
        // .pipe(webp({
        //     quality: 70
        // }))
        // .pipe(dest(path.build.img))
        // .pipe(src(path.src.img))
        .pipe(imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.mozjpeg({ quality: 75, progressive: true }),
            imagemin.optipng({ optimizationLevel: 3 }),
            imagemin.svgo({
                plugins: [
                    { removeViewBox: false },
                    { cleanupIDs: false }
                ]
            })
        ]))
        .pipe(dest(path.build.img))
}

function js() {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(dest(path.build.js))
        .pipe(concat('main.min.js'))
        .pipe(uglify())
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}

function fontsStyle(params) {

    let file_content = fs.readFileSync(srcDir + '/scss/_fonts.scss');
    if (file_content == '') {
        fs.writeFile(srcDir + '/scss/_fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(srcDir + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}
function cb() { }

function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: 'expanded'
            })
        )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ['last 5 version'],
                cascade: true
            })
        )
        .pipe(gcmq())
        // .pipe(webpcss({
        //     webpClass: '.webp',
        //     noWebpClass: '.no-webp'
        // }))
        .pipe(dest(path.build.css))
        .pipe(cleanCSS())
        .pipe(concat('style.min.css'))
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts));
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts));
}

gulp.task('svgSprite', function () {
    return gulp.src(`${srcDir}/iconsprite/*.svg`)
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../icons/icons.svg',
                    example: true
                }
            }
        }))
        .pipe(dest(path.build.img))
})

gulp.task('otf2ttf', function () {
    return src(`${srcDir}/fontts/*.otf`)
        .pipe(fonter({
            fotmats: ['ttf']
        }))
        .pipe(dest(`${srcDir}/fonts/`))
})

function watchFiles() {
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.img], images);

}

let build = series(clean, parallel(js, css, html, images, fonts), fontsStyle);
let watch = parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
