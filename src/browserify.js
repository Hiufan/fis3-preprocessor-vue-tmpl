/*!
 * fis3-preprocessor-vueTmpl
 * copyright 2016 Hiufan Zheng
 * email: Hiufan@qq.com
 * Released under the MIT License.
 */

'use strict';

var deasync = require('deasync');
var browserify = require('browserify');
var envify = require('envify/custom');

var babelify = require('babelify');
var embed = require('./embed');

require('babel-preset-es2015');
require('babel-preset-stage-0');
require('babel-preset-stage-1');
require('babel-preset-stage-2');
require('babel-preset-stage-3');

module.exports = function (file, settings) {
    var realpath = file.realpath; // 文件的真实路径
    var dirname = file.dirname; // 文件的目录名
    var browerifyOpts = settings.browserify || {};
    var content = '';
    var isDone = false;

    var bundler = browserify(realpath, browerifyOpts);

    // es2015 babel 转码
    if(settings.es2015 && settings.es2015.enable) {
        bundler.transform(babelify.configure({presets: settings.es2015.presets}));
    }

    // 处理template option和fis的内置语法
    bundler.transform(embed(file));

    // 生产环境下优化vue
    var mediaReg = /pro|prod|product|production/i;
    var isProd = mediaReg.test(fis.project.currentMedia());
    if (isProd) {
        bundler.transform(envify({ 
            _: 'purge',
            NODE_ENV: 'production'
        }), { global: true });
    }

    // 寻找依赖文件
    bundler.on('file', function (depFilePath) {
        if (depFilePath !== file.realpath) {
            file.cache.addDeps(depFilePath);
        }
    });

    bundler.bundle(function (err, buf) {
        if (err) {
            content = 'console.error(' + JSON.stringify(err.message) + ');' +
                        'console.error(' + JSON.stringify(err.annotated) + ');';
        } else {
            content = buf.toString();
        }
        isDone = true;
    });

    // 使用 deasync 让 browserify 同步输出到 content
    deasync.loopWhile(function (){
        return !isDone;
    });

    return content;
}