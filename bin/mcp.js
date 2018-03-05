#!/usr/bin/env node
'use strict';

const program = require('commander')
const log = require('gutil-color-log')
const utils =require('../utils/index.js')
const fs = require('fs')
const path = require('path')

program
.version('1.0.4')
.option('-v, version','list version')
.option('-c, create','create a project')
.parse(process.argv)

if(program.create){
    let destinationPath = program.args.shift() || '.';
    let appName = utils.createAppName(path.resolve(destinationPath)) || 'weex'
    utils.emptyDirectory(destinationPath,(empty)=>{
        if(empty){
            log('green','无此目录，可以创建')
            log('green',appName)
            createApplication(appName,destinationPath)     
        }else{
            log('red','此目录已存在')
        }
    })
}

/**
 * @param {string} app_name
 * @param {string} path
 */
function createApplication(app_name,urlpath){
    utils.exists(path.join(__dirname, '..', 'temp'),urlpath,utils.copy)
    complete()
    function complete() {
        var prompt = utils.launchedFromCmd() ? '>' : '$';
        console.log();
        console.log('   install dependencies:');
        console.log('     %s cd %s && npm install', prompt, urlpath);
        console.log();
        console.log('   run the app:');

            console.log('     %s npm dev');
            console.log('     %s npm serve');            
        

        console.log();
    }

}
