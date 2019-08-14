#!/usr/bin/env node
/*
 * @Author: zhouJun 
 * @Date: 2017-04-19 10:38:24 
 * @Last Modified by: zhouJun
 * @Last Modified time: 2019-08-14 22:16:09
 */
const chalk = require('chalk')
const program = require('commander')
const childProcess = require('child_process')
const path = require('path')
const fs = require('fs')
const stat = fs.stat
const argv = require('yargs').argv
const colors = require('colors')
const request = require('request')
const shell = require('shelljs')
const npmdir = process.env.APPDATA?`${process.env.APPDATA}/npm/node_modules`:'/usr/local/lib/node_modules'
const api = 'http://10.115.0.92:8181/interface'
const selfConfig = String(fs.readFileSync(path.resolve(npmdir, 'autopack/package.json')))
const version = JSON.parse(selfConfig).version
const semver = require('semver')
const stringify = require('json-stable-stringify')

let addNum = 0
let editNum = 0
const yarncmd = process.platform.match(/win/) ? 'yarn.cmd' : 'yarn'
const npmcmd = process.platform.match(/win/) ? 'npm.cmd' : 'npm'
const ENUM = {
    STATUS: {
        INFO: 1,
        ERROR: 2,
        WARRING: 3,
    },
}
const testDepsList =  {
    'istanbul-instrumenter-loader': '3.0.0',
    'karma': '1.7.1',
    'karma-chrome-launcher': '2.2.0',
    'karma-coverage': '1.1.1',
    'karma-coverage-istanbul-reporter': '1.3.0',
    'karma-html-reporter': '0.2.7',
    'karma-jenkins-reporter': '0.0.2',
    'karma-mocha': '1.3.0',
    'karma-mocha-reporter': '2.2.5',
    'karma-phantomjs-launcher': '1.0.4',
    'karma-sinon-chai': '1.3.2',
    'karma-webpack': '2.0.5',
    'mocha': '4.0.1',
    'chai': '4.1.2',
    'sinon': '4.0.2',
    'sinon-chai': '2.14.0',
    'webpack': '2.7.0',
    'babel-loader': '7.1.2',
    'babel-core': '6.26.0',
    'babel-plugin-transform-runtime': '6.23.0',
    'babel-preset-es2015': '6.24.1',
    'babel-preset-stage-0': '6.24.1',
    'babel-runtime': '6.23.0',
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
/*
 * 数组中是否包含某项
 * @param{Array} obj 需要判断的数组
 */
Array.prototype.contains = function (arr) {
    let i = this.length
    while (i--) {
        if (this[i] === arr) {
            return true
        }
    }
    return false
}
/*
 * 定义命令
 */
program
    .version(version)
    .option('-v, --version', 'version', version)
    .option('-i, --init', 'init project', init)
    .option('-s, --server', 'run server', server)
    .option('-h, --help', 'show help', help)
    .option('-n, --update', 'update file', reset)
    .option('-b, --build', 'build project', build)
    .option('-n, --name', 'new fileName')
    .option('-p, --port', 'new port')
    .option('-ct, --config-test', 'config test', configTest)
    .option('-t, --test', 'run unit test', test)
    .parse(process.argv)

if (process.argv.length <= 2) {
    log(`
       autopack -i --init    init project
       autopack -s --server  run server
       autopack -h --help    show help
       autopack -n --update  update file
       autopack -b --build   build project
       autopack -n --name    new fileName
       autopack -p --port    new port
    `)
}

/**
 * 构建项目
 */
function build () {
    if (!checkWorkspace()) {
        return
    }
    const install = childProcess.spawn(npmcmd, ['run', 'build'], {
        stdio: 'inherit',
    })
}
/**
 * 检测工作目录是否是autopack认证的
 */
function checkWorkspace (commonConfig = false) {
    const nodeSassChecker = childProcess.spawn(npmcmd, ['node-sass', '-v'])
    if (!fs.existsSync('./package.json')) {
        log('请先切换到一个有效的npm工作目录', ENUM.STATUS.ERROR)
        process.exit()
        return false
    }
    if (commonConfig === true) {
        return true
    }
    const proName = path.basename(process.cwd())
    const pkgsJson = JSON.parse(fs.readFileSync('./package.json'))
    if (pkgsJson.name != proName) {
        log('工作目录名和package.json中的name不一致，请检查', ENUM.STATUS.ERROR)
        process.exit()
        return false
    }
    return true
}
/**
 * 设置测试的配置
 */
function configTest () {
    log('配置或更新单测的配置文件')
    checkWorkspace(true)
    shell.mkdir('-p', 'test')
    const content = String(fs.readFileSync(path.resolve(`${npmdir}/autopack`, '_template/karma.conf.js')))
    fs.writeFileSync('karma.conf.js', content)
    const pkgJSON = JSON.parse(String(fs.readFileSync('./package.json')))
    let isNeedUpdatePkgJSON = false
    if (!pkgJSON.devDependencies) {
        pkgJSON.devDependencies = {}
    }
    for (const key in testDepsList) {
        if (!pkgJSON.devDependencies[key]) {
            log(`检测到缺少依赖${key},添加${key}: ${testDepsList[key]}\n`)
            pkgJSON.devDependencies[key] = testDepsList[key]
            isNeedUpdatePkgJSON = true
        }
    }
    if (!pkgJSON.scripts.test || pkgJSON.scripts.test != 'karma start') {
        log('检测到没有配置test启动脚本，添加test启动脚本')
        pkgJSON.scripts.test = 'karma start'
        isNeedUpdatePkgJSON = true
    }
    if (isNeedUpdatePkgJSON) {
        log('重新生成package.json文件')
        fs.writeFileSync('package.json', stringify(pkgJSON, {space: 4}))
        log('安装新依赖')
        childProcess.spawn(yarncmd, ['install'], {
            stdio: 'inherit',
        })
    }
}
/**
 * 创建 .gitignore 文件
 * @param{String} fileName 文件夹名字
 * @param fileName 
 */
function createGitIgnore(fileName) {
    const ignoreContent = `
node_modules/
*.log.*
*.log
coverage
karma_html
    `
    setTimeout(function() {
        fs.writeFile(`${fileName  }/.gitignore`, ignoreContent, function(err) {
            if (!err) {
                // log("写入成功！");
            } else {
                log(`gitignore写入出错!${  err}`, ENUM.STATUS.ERROR)
            }
        })
    }, 1500)
}
/**
 * 处理package.json
 * @param filename 
 * @param proName 
 */
function dealWithPck(filename, proName) {
    const pkgsJson = JSON.parse(fs.readFileSync(filename))
    pkgsJson.name = proName
    pkgsJson.dependencies = {}
    fs.writeFileSync(filename, JSON.stringify(pkgsJson, null, 2))
}
/**
 * 验证文件夹名/:*!@#$%^&?( )\\"<> 都不符合文件夹名规则
 * @param{String} str 文件夹名字
 */
function exgFileName(str) {
    // 转义 \ 符号也不行
    const reg = new RegExp('^[^\\\\\\/:*!@#$%^&?( )\\"<>|]+$')
    return reg.test(str)
}
/**
 * 帮助
 */
function help() {
    log(`
新建项目: 
    autopack --init <project_name>
开发:
    cd <project_folder>
    autopack --server [--port <port>]
编译:
    cd <project_folder>
    autopack --build
    `)
}
/**
 * 初始化项目，创建模板文件目录结构
 */
function init() {
    let fileName = argv.init
    !fileName ? fileName = 'default' : fileName
    if (!exgFileName(fileName)) {
        log('请输入正确的文件名！')
        process.exit()
    }
    const booExist = fs.existsSync(`./${fileName}`)
    if (booExist) {
        log(`文件名:  ${fileName}  已被占用，请换个名字重新创建项目！`)
        process.exit()
    }
    shell.cp('-R', `${npmdir}/autopack/template`, `./${  fileName}`)
    // 特殊处理
    shell.mv(`./${fileName}/npmrc`, `./${fileName}/.npmrc`)
    shell.mv(`./${fileName}/vscode`, `./${fileName}/.vscode`)
    createGitIgnore(`./${  fileName}`)
    dealWithPck(`./${  fileName  }/package.json`, fileName)
    updateVersion(`./${  fileName}`)
    log(`Create ${  fileName  } project complete!`)
    log(`cd ${fileName} && yarn install`)
    log(`autopack --server`)
}
/**
 * 更新本地项目
 */
function reset() {
    const proName = path.basename(process.cwd())
    if (!checkWorkspace()) {
        return
    }
    const editList = ['bin', 'lib', 'server', '.npmrc', '.babelrc', '.eslintignore', '.eslintrc.js', '.gitignore', 'package.json', 'webpack.config.js', '.vscode']
    // rm files
    editList.forEach(item => {
        shell.rm('-rf', `${process.cwd()  }/${item}`)
    })
    // cp files from new version
    editList.forEach(item => {
        if (item != '.gitignore' && item != '.vscode' && item != '.npmrc')
            shell.cp('-R', `${npmdir}/autopack/template/${item}`, `./${item}`)
        else if (item == '.vscode') {
            shell.cp('-R', `${npmdir}/autopack/template/vscode`, `./.vscode`)
        } else if (item == '.npmrc') {
            shell.cp('-R', `${npmdir}/autopack/template/npmrc`, `./.npmrc`)
        }
    })
    // 更新package.json
    dealWithPck('./package.json', proName)
    // 创建.gitignore
    createGitIgnore('./')
    // 更新package.json里的currentVersion版本
    updateVersion('.')
    log('更新本地项目完成')
    log('开始更新依赖包')
    childProcess.exec('yarn config set sass-binary-site http://npm.taobao.org/mirrors/node-sass')
    childProcess.exec('yarn config set phantomjs_cdnurl=https://npm.taobao.org/mirrors/phantomjs/')
    typeof (port) != 'number' ? port = 3000 : port
    const url = `${api}/getAutopackVersion`
    request(url, function(error, response, body) {
        if (!error && JSON.parse(body).success) {
            updatePckDpsFun(function() {
                const install = childProcess.spawn(yarncmd, ['install'], {
                    stdio: 'inherit',
                })
                install.on('close', () => {
                    log('依赖包更新完成')
                })
            })
        }
    })
}
/**
 * 1.检查更新对应的依赖
 * 2.如有更新则 npm install 依赖资源
 * 3.开启server服务
 */
function server() {
    if (!checkWorkspace()) {
        return
    }
    // if (!fs.existsSync(path.resolve(process.cwd(), 'node_modules'))) {
    //     log('请先运行npm install')
    //     process.exit()
    //     return
    // }
    // JSON.parse(String(fs.readFileSync(path.resolve(process.cwd(), '.entryrc.js'))))
    const entryrc = require(path.resolve(process.cwd(), '.entryrc.js'))
    if (!entryrc.domain) {
        log('.entryrc.js在1.0.67后新增配置项domain，请自行配置domain变量', ENUM.STATUS.WARRING)
        log('domain变量命名规则，例：仓库名为plus-shop-js，则domain: "shop"', ENUM.STATUS.WARRING)
        log(`
        例:
            module.exports = {
                domain: 'shop',
                //下面是以前的配置，在此忽略
            }
        `, ENUM.STATUS.WARRING)
        return
    }
    let port = argv.port
    typeof (port) != 'number' ? port = 3000 : port
    const url = `${api}/getAutopackVersion`
    request(url, function(error, response, body) {
        log('调用后台接口，检测依赖库版本')
        if (!error) {
            if (JSON.parse(body).success) {
                const autopackPkgsJson = JSON.parse(fs.readFileSync(`${npmdir}/autopack/package.json`))
                const curPkgsJson = JSON.parse(fs.readFileSync('./package.json'))
                if (semver.gt(JSON.parse(body).version, version)) {
                    log('检测到 autopack 版本升级！', ENUM.STATUS.WARRING)
                    log(`请安装最新版 autopack@${  JSON.parse(body).version}`, ENUM.STATUS.WARRING)
                    log('请输入命令 $ npm uninstall autopack -g && npm install autopack -g', ENUM.STATUS.WARRING)
                    log('然后重新你的操作！', ENUM.STATUS.WARRING)
                    process.exit()
                } else if (autopackPkgsJson.version != curPkgsJson.currentVersion) {
                    log('发现你的工程的autopack版需要更新！', ENUM.STATUS.WARRING)
                    log('请输入命令 $ autopack --update', ENUM.STATUS.WARRING)
                    log('执行命令完成后，重新你的操作！', ENUM.STATUS.WARRING)
                    process.exit()
                } else {
                    updatePckDpsFun(function() {
                        const install = childProcess.spawn(yarncmd, ['install'], {
                            stdio: 'inherit',
                        })
                        install.on('close', () => {
                            childProcess.spawn(npmcmd, ['run', 'dev', '--', '--port', port], {
                                stdio: 'inherit',
                            })
                        })
                    })
                }
            } else {
                log('检测autopack版本出错', ENUM.STATUS.ERROR)
                process.exit()
            }
        } else {
            log(error, ENUM.STATUS.ERROR)
            process.exit()
        }
    })
}
/**
 * 单元测试
 */
function test () {
    checkWorkspace()
    if (!fs.readFileSync('./karma.conf.js')) {
        log('本地没有karma配置文件，请先执行autopack --config-test')
    }
    log('开始单元测试')
    childProcess.spawn(npmcmd, ['run', 'test'], {
        stdio: 'inherit',
    })
}
/**
 * 1.读取本地项目package.json中的dependencies
 * 2.本地的 package.json dependencies 和 稳定版本对比，没有添加，版本升级则更新
 * @param{function} callback
 */
function updatePckDpsFun(callback) {
    log('从autopack控制台读取此应用信息...')
    if (!fs.existsSync('./package.json')) {
        log('没有检测到package.json，请确认工作目录是否正确', ENUM.STATUS.ERROR)
        process.exit()
    }
    const proName = path.basename(process.cwd())
    const url = `${api}/getDepsJson?pname=${proName}`
    request(url, function(error, response, body) {
        if (!error) {
            if (!JSON.parse(body).success) {
                log(`从后台获取稳定版依赖发生错误！错误信息:${  JSON.parse(body).msg  }`, ENUM.STATUS.ERROR)
                log('请进入控制台添加应用')
                process.exit()
            }
            const loPkgsJson = JSON.parse(fs.readFileSync('./package.json'))
            const loPkgs = JSON.parse(fs.readFileSync('./package.json')).dependencies
            const stPkgs = JSON.parse(body).dependencies
            const loKeysArr = Object.keys(loPkgs)
            const stKeysArr = Object.keys(stPkgs)

            if (stPkgs.length <= 0) {
                log('没有在服务器获取到依赖文件', ENUM.STATUS.ERROR)
            }
            for (let i = 0; i < stKeysArr.length; i++) {
                if (loKeysArr.contains(stKeysArr[i])) {
                    if (stPkgs[stKeysArr[i]] != loPkgs[stKeysArr[i]]) {
                        loPkgs[stKeysArr[i]] = stPkgs[stKeysArr[i]]
                        editNum++
                    }
                } else {
                    loPkgs[stKeysArr[i]] = stPkgs[stKeysArr[i]]
                    addNum++
                }
            }
            // loPkgsJson.dependencies = loPkgs
            loPkgsJson.dependencies = stPkgs
            fs.writeFileSync('./package.json', JSON.stringify(loPkgsJson, null, 2))
            if (addNum + editNum > 0) {
                log(`npm依赖包新增:  ${  addNum  }个,更新:  ${  editNum  }个`)
            }
            callback()
        } else {
            log(error)
            log('请检查网络是否通畅', ENUM.STATUS.ERROR)
            process.exit()
        }
    })
}
/**
 * 更新当前的版本
 * @param url {string} 服务接口
 */
function updateVersion(url) {
    const autopackPkgsJson = JSON.parse(fs.readFileSync(`${npmdir}/autopack/package.json`))
    const curPkgsJson = JSON.parse(fs.readFileSync(`${url  }/package.json`))
    curPkgsJson.currentVersion = autopackPkgsJson.version
    fs.writeFileSync(`${url}/package.json`, JSON.stringify(curPkgsJson, null, 4))
}