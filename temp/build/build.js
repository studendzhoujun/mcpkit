/*
 * @Author: zhouJun 
 * @Date: 2017-10-09 16:04:32 
 * @Last Modified by: zhouJun
 * @Last Modified time: 2018-02-28 18:14:19
 */
require ('shelljs/global');
rm('-rf', 'dist')
const webpack = require('webpack')
const gulp = require('gulp')
const through2 = require('through2')
const zip = require('gulp-zip')
const log = require('gutil-color-log');
const Vinyl = require('vinyl')
const args = require('../lib/argParser.js')
const rev = require('../lib/revHash.js')
const webConfig = require('./buildconfig.js').webConfig
const weexConfig = require('./buildconfig.js').weexConfig
const fs = require('fs')
const path = require('path')
log('green','webpack starting....')

const rs = fs.createReadStream(path.resolve(__dirname,'../lib/config.json'),'utf-8')


let json = {}
let zipName=''
let zipVersion=''
function addVersion(string){
    let num=parseInt(string.replace(/\./g,''))
    num+=1
    if(num>99){
        return num.toString()[0]+'.'+num.toString()[1]+'.'+num.toString()[2]
    }else if(num>9){
        return '0.'+num.toString()[0]+'.'+num.toString()[1]
    }else{
        return `0.0.${num}`
    }
}

rs.on('data',(chunk)=>{
   json = JSON.parse(chunk)
   json.versionName=addVersion(json.versionName)
   json.pluginVersion=`${~~json.pluginVersion+1}`
   zipName=json.pluginId
   zipVersion=json.pluginVersion
})

rs.on('end',()=>{
    let ws = fs.createWriteStream(path.resolve(__dirname,'../lib/config.json'),'utf-8')
    ws.write(JSON.stringify(json))
    ws.end()
})

// const configJson=fs.readFileSync(path.resolve(__dirname,'../lib/config.json'),'utf8');
// const zipName=JSON.parse(configJson).pluginId
// const zipVersion=JSON.parse(configJson).pluginVersion

webpack([webConfig,weexConfig],(err,stats)=>{
        if( err || stats.hasErrors() ){
            log('red','webpack打包出现了错误')
            log('red',stats.toJson("minimal").errors)
            return
        }
        log('green','web and weex ending....')
        buildZip()
})

//generator pr.mni
//generator config.json
function genHash(){
    log('green','gulp starting....')
    var pr = {}
    gulp.src('dist/**/*')
    .pipe(through2.obj((file,enc,cb)=>{
        if(Buffer.isBuffer(file.contents)){
            const filePath = file.path.replace(file.cwd,'').replace(/\\/g,'/')
            pr[filePath] = rev(file.contents)
        }
        cb()
    },function(cb){
        var file = new Vinyl({
            cwd: '/',
            base: '/',
            path: '/pr.mni',
            contents: new Buffer(JSON.stringify(pr))
        })
        this.push(file)
        cb()
    }))
    .pipe(gulp.dest('dist/'))
    .on('end',()=>{
          gulp.src('dist/**/*')
          .pipe(zip(`weex_wap.zip`))
          .pipe(gulp.dest('dist'))
    })
}
// zip
function buildZip(){
    return gulp.src('dist/**/*')
    .pipe(zip(`${zipName}-${zipVersion}.zip`))
    .pipe(gulp.dest('dist'))
}