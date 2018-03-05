/*
 * @Author: zhouJun 
 * @Date: 2018-03-02 16:06:12 
 * @Last Modified by: zhouJun
 * @Last Modified time: 2018-03-05 16:17:16
 */

 const fs = require('fs')
 const path = require('path')
 const mkdirp = require('mkdirp')
 const stat = fs.stat
 /**
 * Determine if launched from cmd.exe
 */

function launchedFromCmd() {
    return process.platform === 'win32'
        && process.env._ === undefined;
}
/**
 * Check if the given directory `path` is empty.
 *
 * @param {String} path
 * @param {Function} fn
 */

function emptyDirectory(path, fn) {
    console.log('path:',path)
    fs.readdir(path, function (err, files) {
        if (err && err.code !== 'ENOENT') throw err
        fn(!files || !files.length)
    })
}
/**
 * Prompt for confirmation on STDOUT/STDIN
 */

function confirm(msg, callback) {
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question(msg, function (input) {
        rl.close();
        callback(/^y|yes|ok|true$/i.test(input));
    });
}
/**
 * Load template file.
 */

function loadTemplate(name) {
    return fs.readFileSync(path.join(__dirname, '..', 'temp', name), 'utf-8');
}
/**
 * echo str > path.
 *
 * @param {String} path
 * @param {String} str
 */

function write(path, str, mode) {
    fs.writeFileSync(path, str, { mode: mode || 0666 });
}

/**
 * 
 * @param {string} pathName 
 */
function createAppName(pathName) {
    return path.basename(pathName)
        .replace(/[^A-Za-z0-9\.()!~*'-]+/g, '-')
        .replace(/^[-_\.]+|-+$/g, '')
        .toLowerCase()
}

/**
 * Mkdir -p.
 *
 * @param {String} path
 * @param {Function} fn
 */

function mkdir(path, fn) {
    mkdirp(path, 0755, function (err) {
        if (err) throw err;
        fn && fn();
    });
}



/*
 * 复制目录中的所有文件包括子目录
 * @param{ String } 需要复制的目录
 * @param{ String } 复制到指定的目录
 */
let copy = function( src, dst ){
    // 读取目录中的所有文件/目录
    fs.readdir( src, function( err, paths ){
        if( err ){
            throw err;
        }
        paths.forEach(function( path ){
            var _src = src + '/' + path,
                _dst = dst + '/' + path,
                readable, writable;       

            stat( _src, function( err, st ){
                if( err ){
                    throw err;
                }

                // 判断是否为文件
                if( st.isFile() ){
                    // 创建读取流
                    readable = fs.createReadStream( _src );
                    // 创建写入流
                    writable = fs.createWriteStream( _dst );   
                    // 通过管道来传输流
                    readable.pipe( writable );
                }
                // 如果是目录则递归调用自身
                else if( st.isDirectory() ){
                    exists( _src, _dst, copy );
                }
            });
        });
    });
};

// 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
let exists = function( src, dst, callback ){
    fs.exists( dst, function( exists ){
        // 已存在
        if( exists ){
            callback( src, dst );
        }
        // 不存在
        else{
            fs.mkdir( dst, function(){
                callback( src, dst );
            });
        }
    });
};

module.exports={launchedFromCmd,emptyDirectory,confirm,loadTemplate,write,createAppName,mkdir,copy,exists}