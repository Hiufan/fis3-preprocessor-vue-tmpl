'use strict';

var path = require('path');
var through = require('through2');

var URI_REG = /\b(__uri)\(\s*('|")([^'"]+)\2\s*\)/g; 

// 功能：兼容fis3的__uri
// sourceFilePath: 入口文件路径
// inputFileRealPath: 其它引用文件的路径
module.exports = function (sourceFilePath) {
    return function (inputFileRealPath) {
        var data = [];

        var transformFn = function (chunk, enc, cb) {
            data.push(chunk);
            cb && cb();
        };

        var flushFn = function (cb) {
            var replacer = function (match, embedFn, quote, depFileName) {
                var depFileRealPath = path.resolve(path.dirname(inputFileRealPath), depFileName);
                var depFileRelativePath = path.relative(path.dirname(sourceFilePath), depFileRealPath).replace(/\\/g, '/');
                return embedFn + '(' + quote + depFileRelativePath + quote + ')';                
            };

            var contents = Buffer.concat(data).toString('utf8').replace(URI_REG, replacer);

            this.push(contents);

            cb();
        };

        return through(transformFn, flushFn);
    };
};