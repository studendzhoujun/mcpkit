/*
 * @Author: zhouJun 
 * @Date: 2018-03-02 16:06:12 
 * @Last Modified by: zhouJun
 * @Last Modified time: 2018-03-02 16:56:23
 */

 const fs = require('fs')
 const path = require('path')
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
    console.log('   create: '.rainbow + path.green);
}

function cons(){
    console.log('hsldlfalsdjflasdkfasdf')
}
module.exports={launchedFromCmd,emptyDirectory,confirm,loadTemplate,write,cons}