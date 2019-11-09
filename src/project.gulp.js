/* eslint-disable @typescript-eslint/explicit-function-return-type */
const gulp = require(`gulp`);
const ts = require(`gulp-typescript`);
const eslint = require(`gulp-eslint`);
const mocha = require(`gulp-mocha`);
const del = require(`del`);

const sourceFolder = `./src`;
const distFolder = `./dist`;
const startFile = `index.js`;

exports[`clean:dist`] = async function cleanDist () {
  const delResult = await del(`${distFolder}/*`, { force: true });
  return delResult;
};

/*
 * Start
 */

const spawn = require(`child_process`).spawn;
let node;

exports[`start:prod`] = function startProd (done) {
  node = spawn(`node`, [`${distFolder}/${startFile}`], { stdio: `inherit` });
  done();
};

exports[`start:dev`] = function startDev (done) {
  // eslint-disable-next-line
  if (node) {
    node.kill();
  }
  node = spawn(`node`, [`${distFolder}/${startFile}`], { stdio: `inherit` });
  node.on(`close`, function (code) {
    if (code === 8) {
      gulp.log(`Error detected, waiting for changes...`);
    }
  });
  done();
};

process.on(`exit`, function () {
  // eslint-disable-next-line
  if (node) {
    node.kill();
  }
});

/**
 * ES Lint
 */

exports[`eslint`] = function eslintProd () {
  return gulp.src(`${sourceFolder}/**/*.ts`)
    .pipe(eslint())
    .pipe(eslint.format());
};

/**
 * TS Compilator
 */

const prodTSConfig = ts.createProject(`./tsconfig.prod.json`);
const devTSConfig = ts.createProject(`./tsconfig.json`);

exports[`move:jts`] = function moveJTS () {
  return gulp.src([
    `${sourceFolder}/**/*.js`,
    `${sourceFolder}/**/*.d.ts`,
    `${sourceFolder}/**/*.json`,
  ])
    .pipe(gulp.dest(`${distFolder}`));
};

exports[`build:ts:prod`] = function buildTSProd () {
  return gulp.src(`${sourceFolder}/**/*.ts`)
    .pipe(prodTSConfig())
    .pipe(gulp.dest(`${distFolder}`));
};
exports[`build:ts:dev`] = function buildTSDev () {
  return gulp.src(`${sourceFolder}/**/*.ts`)
    .pipe(devTSConfig())
    .pipe(gulp.dest(`${distFolder}`));
};

exports[`build:src:prod`] = gulp.series(
  exports[`build:ts:prod`],
  exports[`move:jts`],
);
exports[`build:src:dev`] = gulp.series(
  exports[`build:ts:dev`],
  exports[`move:jts`],
);

exports[`build:prod`] = gulp.series(
  exports[`eslint`],
  exports[`clean:dist`],
  exports[`build:src:prod`],
);
exports[`build:dev`] = gulp.series(
  exports[`eslint`],
  exports[`build:src:dev`],
);

exports[`build:watch`] = gulp.series(
  exports[`clean:dist`] ,
  exports[`build:dev`],
  exports[`start:dev`],
  function buildWatch () {
    return gulp.watch([
      `${sourceFolder}/**/*.ts`,
      `${sourceFolder}/**/*.js`,
      `${sourceFolder}/**/*.json`,
    ], gulp.series(exports[`build:dev`], exports[`start:dev`]));
  },
);

/**
 * Tests
 */

exports[`test:start`] = function test () {
  return gulp.src(`${distFolder}/**/*.spec.js`)
    .pipe(mocha({ reporter: 'spec', exit: true }))
    .once('error', (error) => {
      console.error(error);
    });
};

exports[`test:watch`] = gulp.series(
  exports[`test:start`],
  function testWatch () {
    return gulp.watch([
      `${distFolder}/**/*.js`,
    ], gulp.series(exports[`test:start`]));
  },
);
