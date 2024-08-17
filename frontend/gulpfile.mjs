import gulp from 'gulp';
import ts from 'gulp-typescript';
import { sync as globSync } from 'glob';
import path from 'path';

// Load each tsconfig file
const tsProjectApp = ts.createProject('config/ts/tsconfig.app.json');
const tsProjectPages = ts.createProject('config/ts/tsconfig.pages.json');
const tsProjectModules = ts.createProject('config/ts/tsconfig.modules.json');
const tsProjectUtils = ts.createProject('config/ts/tsconfig.utils.json');
const tsProjectDom = ts.createProject('config/ts/tsconfig.dom.json');

// Helper function to check if there are files to compile
const hasFilesToCompile = (tsProject) => {
  const includePatterns = tsProject.config.include || [];
  const excludePatterns = tsProject.config.exclude || [];
  const files = includePatterns.flatMap(pattern => globSync(pattern, { ignore: excludePatterns }));
  console.log(`Files to compile for ${tsProject.configFileName}:`, files);
  return files.length > 0;
};

// Define tasks for each tsconfig
export const compileApp = () => {
  if (!hasFilesToCompile(tsProjectApp)) {
    console.log('No files to compile for compileApp');
    return Promise.resolve();
  }
  return tsProjectApp.src()
    .pipe(tsProjectApp())
    .on('error', (err) => {
      console.error('Error in compileApp task', err.toString());
    })
    .pipe(gulp.dest(tsProjectApp.options.outDir))
    .on('end', () => {
      console.log(`Files compiled for compileApp and saved to ${tsProjectApp.options.outDir}`);
    });
};

export const compilePages = () => {
  if (!hasFilesToCompile(tsProjectPages)) {
    console.log('No files to compile for compilePages');
    return Promise.resolve();
  }
  return tsProjectPages.src()
    .pipe(tsProjectPages())
    .on('error', (err) => {
      console.error('Error in compilePages task', err.toString());
    })
    .pipe(gulp.dest(tsProjectPages.options.outDir))
    .on('end', () => {
      console.log(`Files compiled for compilePages and saved to ${tsProjectPages.options.outDir}`);
    });
};

// Repeat the same pattern for other tasks
export const compileModules = () => {
  if (!hasFilesToCompile(tsProjectModules)) {
    console.log('No files to compile for compileModules');
    return Promise.resolve();
  }
  return tsProjectModules.src()
    .pipe(tsProjectModules())
    .on('error', (err) => {
      console.error('Error in compileModules task', err.toString());
    })
    .pipe(gulp.dest(tsProjectModules.options.outDir))
    .on('end', () => {
      console.log(`Files compiled for compileModules and saved to ${tsProjectModules.options.outDir}`);
    });
};

export const compileUtils = () => {
  if (!hasFilesToCompile(tsProjectUtils)) {
    console.log('No files to compile for compileUtils');
    return Promise.resolve();
  }
  return tsProjectUtils.src()
    .pipe(tsProjectUtils())
    .on('error', (err) => {
      console.error('Error in compileUtils task', err.toString());
    })
    .pipe(gulp.dest(tsProjectUtils.options.outDir))
    .on('end', () => {
      console.log(`Files compiled for compileUtils and saved to ${tsProjectUtils.options.outDir}`);
    });
};

export const compileDom = () => {
  if (!hasFilesToCompile(tsProjectDom)) {
    console.log('No files to compile for compileDom');
    return Promise.resolve();
  }
  return tsProjectDom.src()
    .pipe(tsProjectDom())
    .on('error', (err) => {
      console.error('Error in compileDom task', err.toString());
    })
    .pipe(gulp.dest(tsProjectDom.options.outDir))
    .on('end', () => {
      console.log(`Files compiled for compileDom and saved to ${tsProjectDom.options.outDir}`);
    });
};

// Default task
export default gulp.series(compileApp, compilePages, compileModules, compileUtils, compileDom);
