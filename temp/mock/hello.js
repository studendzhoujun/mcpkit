/*
 * @Author: zhouJun 
 * @Date: 2018-04-25 17:53:44 
 * @Last Modified by: zhouJun
 * @Last Modified time: 2018-04-25 17:57:42
 */
const mock = {
    api:'/api/hello',
    response:function(req,res){
        res.send({
            state:'ok',
            message:'hello world',
            id:'this is mock test'
        })
    }
}
module.exports=mock