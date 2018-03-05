#!/usr/bin/env node
'use strict';

const program = require('commander')
const log = require('gutil-color-log')
const utils =require('../utils/index.js')
const fs = require('fs')
const path = require('path')

function say(){
    log('green','hello everyone')
}
function createProject(name){
    log('green',`create project ${name}`)
    console.log(__dirname)
    let destinationPath = path.join(__dirname,name)
    utils.emptyDirectory(destinationPath,(empty)=>{
        console.log(empty)
    })
}
let myCommand = program.version('0.0.2','-v, --version')

myCommand.command('say <name>').action((name)=>{
    log('green',`${name}`)
    say()
})

myCommand.command('create <name>').action((name)=>{
    log('green',`${__dirname}`)
    createProject(name)
})
program.parse(process.argv)