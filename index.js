'use strict';

var browserify = require('./src/browserify');

/**
 * Compile 阶段插件接口
 * @param  {string} content     文件内容
 * @param  {File}   file        fis 的 File 对象 [fis3/lib/file.js]
 * @param  {object} settings    插件配置属性
 * @return {string}             处理后的文件内容
 */
module.exports = function (content, file, settings) {
    var opt = settings || {};
    var isFis3 = parseInt(fis.version);
    if(isFis3 === 3) {
        // 只对js类文件进行处理
        if (file.isJsLike) {
            content = browserify(file, opt);
        }
        return content;
    } else {
        console.log('\nSorry,the version of the browserify preprocessor only support Fis3.');
    }
};
