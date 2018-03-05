module.exports = (function(arr){
    var args = {
    	platform: 'app',
    	sdk:      'all'
    }
    arr.forEach(function(arg){
        if(arg.match(/^-[-_\w]+=.+$/)){
            args[arg.split('=')[0].replace('-','')] = arg.split('=')[1]
        }else if(arg.match(/^-[^=.]+$/)){
            args[arg.replace('-','')] = true
        }else{
            args['gulpCommand'] = arg
        }
    })
    return args
})(process.argv.slice(2))