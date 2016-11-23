'use strict';

var deasync = require('deasync');
var browserify = require('browserify');
var debowerify = require('debowerify');

var babelify = require('babelify');
var urify = require('./urify');
// var stringify = require('./stringify');
var isFis3 = require('./version').isFis3;

module.exports = function (file, settings) {
    var realpath = file.realpath; // 文件的真实路径
    var dirname = file.dirname; // 文件的目录名
    var browerifyOpts = settings.browserify || {};
    var content = '';
    var isDone = false;

    var bundler = browserify(realpath, browerifyOpts);
    bundler.transform(urify(realpath)); // 支持 fis 的 __uri() 资源定位

    if(settings.es2015 && settings.es2015.enable) {
        bundler.transform(babelify.configure({presets: settings.es2015.presets}));
    }

    bundler.on('file', function (depFilePath) {
        // find dependences
        if (depFilePath !== file.realpath) {
            file.cache.addDeps(depFilePath);
        }
    });

    bundler.bundle(function (err, buff) {
        if (err) {
            content = 'console.error(' + JSON.stringify(err.message) + ');' +
                        'console.error(' + JSON.stringify(err.annotated) + ');';
        } else {
            content = buff.toString();
        }
        isDone = true;
    });

    // 使用 deasync 让 browserify 同步输出到 content
    deasync.loopWhile(function (){
        return !isDone;
    });

    return content;
}