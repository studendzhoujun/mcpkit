#!/usr/bin/env node
'use strict';

const program = require('commander')
// const log = require('gutil-color-log')
const utils =require('../utils/index.js')
const fs = require('fs')
const path = require('path')
const colors = require('colors')
const childProcess = require('child_process')
const yarncmd = process.platform.match(/win/) ? 'yarn.cmd' : 'yarn'
const npmcmd = process.platform.match(/win/) ? 'npm.cmd' : 'npm'
const ENUM = {
    STATUS: {
        INFO: 1,
        ERROR: 2,
        WARRING: 3,
    },
}
program
.version(require('../package.json').version)
.option('-v, version','list version')
.option('-c, create','create a project')
.option('-s, start', 'run server')
.parse(process.argv)

if (process.argv.length <= 2) {
    log(`
       mcp -v --version     list version
       mcp -c --create      create project
       mcp -s --start       start project
    `)
}


if(program.create){
    let destinationPath = program.args.shift() || '.';
    let appName = utils.createAppName(path.resolve(destinationPath)) || 'weex'
    utils.emptyDirectory(destinationPath,(empty)=>{
        if(empty){
            log('无此目录，可以创建')
            log(appName)
            createApplication(appName,destinationPath)     
        }else{
            log('此目录已存在',ENUM.STATUS.WARRING)
        }
    })
}
if(program.start){
    const install = childProcess.spawn(npmcmd, ['run', 'start'], {
        stdio: 'inherit',
    })
}
/**
 * log
 */
function log (str, status = ENUM.STATUS.INFO) {
    let logStatus = ''
    let colorFN = null
    switch (status) {
        case ENUM.STATUS.INFO:
            logStatus = 'INFO: '
            colorFN = colors.rainbow
            break
        case ENUM.STATUS.ERROR:
            logStatus = 'ERROR: '
            colorFN = colors.bgRed.white
            break
        case ENUM.STATUS.WARRING:
            logStatus = 'WARRING: '
            colorFN = colors.yellow
            break
    }
    console.log(colorFN(logStatus + str))
}
/**
 * @param {string} app_name
 * @param {string} path
 */
function createApplication(app_name,urlpath){
    utils.exists(path.join(__dirname, '..', 'temp'),urlpath,utils.copy)
    complete()
    function complete() {
        log(`
            =====install dependencies:=====
            cd ${urlpath} && npm install
            =====run the app:==============
            npm run start
        `)
    }

}
