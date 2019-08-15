/*
 * @Author: zhouJun 
 * @Date: 2017-12-06 16:43:45 
 * @Last Modified by: zhouJun
 * @Last Modified time: 2019-08-15 15:35:08
 */

const path = require('path')
const glob = require('glob')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const log = require('gutil-color-log');

const bannerPlugin = new webpack.BannerPlugin(
  '// { "framework": "Vue" }\n',
  { raw: true }
)
const websourcePlugin = new CopyWebpackPlugin([
  {
    from: path.resolve(__dirname, '../node_modules/vue/dist/vue.runtime.min.js'),
    to: 'assets/vue.runtime.js',
  },
  {
    from: path.resolve(__dirname, '../node_modules/weex-vue-render/dist/index.min.js'),
    to: 'assets/index.min.js',
  },
  // {
  //   from: path.resolve(__dirname, '../node_modules/weexmodule/dist/weexModule.js'),
  //   to: 'assets/weexmodule.js',
  // },
   {
    from: path.resolve(__dirname, '../lib/config.json'),
    to: '../',
  }
])
//获取入口
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
 log('green','入口:')
 log('green',JSON.stringify(entries))

//基本config
function getBaseConfig () {
  var config = {
    entry: {
    },
    output: {
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: 'babel',
          exclude: /node_modules/
        }, {
          test: /\.vue(\?[^?]+)?$/,
          loaders: []
        },{
          test: /\.less$/,
          loaders: ['less-loader']
        },
        {
          test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
          loader: 'url-loader?name=[name].[ext]?v=[hash]&outputPath=./img/&limit=1000',
        },
      ]
    },
    vue: {
      optimizeSSR: false,
      compilerModules: [
        {
          postTransformNode: el => {
            // to convert vnode for weex components.
            require('weex-vue-precompiler')()(el)
          }
        }
      ]
    },
    plugins: [
      new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false
        }
      }),
      bannerPlugin,
    ]
  }

  Object.keys(entries).forEach(function(name) {
    // 每个页面生成一个entry，如果需要HotUpdate，在这里修改entry
    config.entry[name] = entries[name];
  })
    return config
}

var webConfig = getBaseConfig()
webConfig.output.filename = '[name].web.js'
webConfig.output.path = 'dist/wxwap/'
webConfig.module.loaders[1].loaders.push('vue')
webConfig.plugins.push(websourcePlugin)
webConfig.vue.postcss = [
  // to convert weex exclusive styles.
  require('postcss-plugin-weex')(),
  require('autoprefixer')({
    browsers: ['> 0.1%', 'ios >= 8', 'not ie < 12']
  }),
  require('postcss-plugin-px2rem')({
    // base on 750px standard.
    rootValue: 75,
    // to leave 1px alone.
    minPixelValue: 1.01
  })
];
Object.keys(entries).forEach(function(name) {
  // 每个页面生成一个html
  var plugin = new HtmlWebpackPlugin({
      // 生成出来的html文件名
      filename: name + '.html',
      // 每个html的模版，这里多个页面使用同一个模版
      template: path.resolve(__dirname,'../html/temp.html'),
      // 自动将引用插入html
      inject: true,
      // 每个html引用的js模块，也可以在这里加上vendor等公用模块
      chunks: [name],
      title:name
  });
  webConfig.plugins.push(plugin);
})

var weexConfig = getBaseConfig()
weexConfig.output.filename = '[name].js'
weexConfig.output.path = 'dist/wxnative/'
weexConfig.module.loaders[1].loaders.push('weex')

module.exports = {webConfig,weexConfig}

