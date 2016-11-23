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

// module.exports = function (file, settings) {
//     var realpath = file.realpath; // 文件的真实路径
//     var dirname = file.dirname; // 文件的目录名
//     var opts = settings.browserify || {}; // browerify的配置
//     var content = '';
//     var isDone = false;

//     var bundler = browserify(realpath, opts);

//     // bundler.transform(stringify(['.tpl', '.html'], dirname))
//     //     .transform(urify(realpath)); // 支持 fis 的 __uri() 资源定位
//     bundler.transform(urify(realpath)); // 支持 fis 的 __uri() 资源定位

//     // 如果在配置中启用了bower
//     if(settings.bower) { 
//         bundler.transform(debowerify);
//     }

//     // 启动es2015
//     console.log(settings.es2015);
//     if(settings.es2015.enable) {
//         var opts = [].concat(settings.es2015.presets);
//         bundler.transform(babelify.configure({presets: opts}));
//     }

//     bundler.on('file', function (depFilePath) {
//         // find dependences
//         if (depFilePath !== file.realpath) {
//             file.cache.addDeps(depFilePath);
//         }
//     });

//     bundler.bundle(function (err, buff) {
//         if (err) {
//             content = 'console.error(' + JSON.stringify(err.message) + ');' +
//                         'console.error(' + JSON.stringify(err.annotated) + ');';
//         } else {
//             content = buff.toString();
//         }
//         isDone = true;
//     });

//     // 使用 deasync 让 browserify 同步输出到 content
//     deasync.loopWhile(function (){
//         return !isDone;
//     });

//     return content;


//     // // do browserify
//     // browserify(file.realpath, settings || {})
//     //     .transform(stringify(['.tpl', '.html'], file.dirname)) // 支持 require(tpl/html)
//     //     .transform(debowerify) // 支持 bower
//     //     .transform(urify(file.realpath)) // 支持 fis 的 __uri() 资源定位
//     //     .on('file', function (depFilePath) {
//     //         // find dependences
//     //         if (depFilePath !== file.realpath) {
//     //             file.cache.addDeps(depFilePath);
//     //         }
//     //     })
//     //     .bundle(function (err, buff) {
//     //         if (err) {
//     //             content = 'console.error(' + JSON.stringify(err.message) + ');' +
//     //                       'console.error(' + JSON.stringify(err.annotated) + ');';
//     //         } else {
//     //             content = buff.toString();
//     //         }
//     //         isDone = true;
//     //     });

//     // // 使用 deasync 让 browserify 同步输出到 content
//     // deasync.loopWhile(function (){
//     //     return !isDone;
//     // });
//     // return
//     // fis3 不会处理 `require`
//     // fis2 替换 `require` 为 `rq`，确保不要被 fis2 重定位 require 文件
//     // return isFis3 ? content : content.replace(/\brequire\b/g, 'rq');
// };
