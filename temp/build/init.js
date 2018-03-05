var fs = require('fs')
var path = require('path')
var ip = require('ip').address()


let files = fs.readdirSync(path.resolve('dist/wxnative/'))
let urlList = []
files.forEach(item=>{
    if(item.includes('.js')){
        urlList.push(item)
    }
})

fs.writeFileSync(path.resolve('config.js'), `var CURRENT_IP = '${ip}'\n var urlList = ${JSON.stringify(urlList)}`)