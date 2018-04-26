/*
 * @Author: zhouJun 
 * @Date: 2018-04-25 16:05:15 
 * @Last Modified by: zhouJun
 * @Last Modified time: 2018-04-26 14:32:55
 */
const express = require('express')
const path = require('path')
const fs = require('fs')
const argv = require('optimist').argv
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const webpackDevConfig = require('../webpack.config.js')
const log = require('gutil-color-log')
const app = express()
const compiler = webpack(webpackDevConfig)
const glob = require('glob')
const publicPath = '/'
const port = process.env.npm_package_server_PORT || 3333
//获取src入口文件
const ip = require('ip').address()
let urlList = []
function getEntries(globPath) {
    var files = glob.sync(globPath);
    var entries = {};
    files.forEach(function(filepath) {
        // 取倒数第二层(view下面的文件夹)做包名
        var split = filepath.split('/');
        var name = split[split.length - 2];
  
        entries[name] = './' + filepath;
    });
  
    return entries;
  }
  
   //约定每个项目的入口文件名为app.js
   var entries = getEntries('src/**/app.js')
   Object.keys(entries).forEach(item=>{
       urlList.push(item)
   })
   fs.writeFileSync(path.resolve('./static/config.js'), `var CURRENT_IP = '${ip}'\n var urlList = ${JSON.stringify(urlList)}`)
//webpack compiler
app.use(webpackDevMiddleware(compiler,{
    publicPath:publicPath,
    stats:{
        colors:true,
        chunks:false
    }
}))
// mock/proxy api requests
let mockDir = path.resolve(__dirname,'../mock');
;;(function(mockDir){
   fs.readdirSync(mockDir).forEach((file)=>{
       let filePath = path.resolve(mockDir,file)
       let mock;
       // 递归
       if(fs.statSync(filePath).isDirectory()){
           setMock(filePath)
       }else{
           mock=require(filePath);
           app.use(mock.api, argv.proxy ? proxyMiddleware({target: 'http://' + argv.proxy}) : mock.response);
       }
   })
})(mockDir)

// webpack hot compiler
// app.use(webpackHotMiddleware(compiler))

// 启动服务
app.use(express.static('static'))
app.listen(port,(err)=>{
   if(err){
       log('red',err)
       return
   }
   let url = 'http://localhost:'+port
   log('green',`developing server listening at ${url} `)
})