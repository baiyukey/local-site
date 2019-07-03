/**
 * Created by baiyu on 2019/07/02.
 */
let thisUglifyJs=require("uglify-es");
let thisUglifyCss=require("yuicompressor");
let fs=require("fs");
let watch=require("watch");
module.exports.watch=function(_dir){
  /*let fsWatcher=fs.watch(dir,(event,filename)=>{
   console.log(dir+filename);
   });
   fsWatcher.on("change",(event,filename)=>{
   console.log(dir+filename);
   });*/
  watch.watchTree(_dir,function(filePath,curr,prev){
    if(/(\\css\\)|(\\js\\)/.test(filePath)===false) return false;//仅js,css目录才处理
    let fileExt=filePath.split(".").pop();
    let targetPath='';
    let targetCode=null;
    if(typeof filePath=="object"&&prev===null&&curr===null){
      // Finished walking the tree
    }
    else if(prev===null){
      // f is a new file
    }
    else if(curr.nlink===0){
      // f was removed
    }
    else{
      if(fileExt==="js"){
        targetCode=fs.readFileSync(filePath,'utf-8');
        targetCode=thisUglifyJs.minify(targetCode);
        targetPath=filePath.replace("\\js\\","\\js.min\\").replace(".js",".min.js");
        fs.writeFileSync(targetPath,targetCode.code,'utf-8');
      }
      else if(fileExt==="css"){
        targetPath=filePath.replace("\\css\\","\\css.min\\").replace(".css",".min.css");
        targetCode=fs.readFileSync(filePath,'utf-8');
        //java -version 检查是否安装了java，否则下面不能顺利执行
        thisUglifyCss.compress(targetCode,{
          "nomunge":true,//只进行mini压缩（去注释，去空格），不进行混淆（把函数命名也进行压缩）。默认为false
          "charset":'utf8',
          "type":'css'//默认'js'
        },function(err,data,extra){
          //err   If compressor encounters an error, it's stderr will be here
          //data  The compressed string, you write it out where you want it
          //extra The stderr (warnings are printed here in case you want to echo them
          fs.writeFileSync(targetPath,data);
        });
      }
      console.log('\033[33m'+'['+new Date().toLocaleTimeString()+']'+'\033[0m'+targetPath+' changed');
      // f was changed
    }
  });
};