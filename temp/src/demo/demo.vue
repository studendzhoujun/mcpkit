/*
 * @Author: zhouJun 
 * @Date: 2018-01-03 13:54:09 
 * @Last Modified by: zhouJun
 * @Last Modified time: 2019-08-15 15:36:00
 */

<template>
   <div :style="objstyle" class="box">
     <text :class="['col',isweb?'text':'']">hello</text>
   </div>  
</template>
<style scoped>
.box{
    background-image:linear-gradient(to top left,#ffffff,#111111);
    justify-content: center;
    align-items: center;
}
.col{
    color:#fff;
    font-size:40px;
}
.text{
    font-size:40px;
    color:#fff;
    position: fixed;
    z-index: 999999999;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image:linear-gradient(to top left,#ffffff,#111111);
    justify-content: center;
    align-items: center;
}
</style>
<script>
  const modal = weex.requireModule('modal')
  export default {
    data () {
      return {
          objstyle:{
              width:'750px',
              height:'300px'
          },
          isweb:true
      }
    },
    created(){
        if(weex.config.env.platform == 'Web'){
           this.isweb=true
         }else{
           this.isweb=false
        }
    },
    mounted(){
      this.objstyle.height=weex.config.env.deviceHeight+'px'
    },
    components:{
    },
    methods:{
      
    }
  }
</script>
