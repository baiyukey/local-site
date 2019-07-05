/**
 * Created by baiyu on 2019/07/02.
 */
let thisUglifyJs=require("uglify-es");
let thisUglifyCss=require("yuicompressor");
let fs=require("fs");
let watch=require("watch");
let babel=require("babel-core");
let es2015=require("babel-preset-es2015");
let stage0=require("babel-preset-stage-0");
let removeStrictModePlugin=require("babel-plugin-transform-remove-strict-mode");
let config=require("./config");
let [filePath,targetDir,targetPath,fileExt,event]=["源路径","目标路径","目标目录","源文件扩展名","事件"];
let targetCode=null;//输出代码，即目标文件代码
let ensurePath=(_path)=>{
  const pathArr=_path.split('\\');
  let path='';
  return (_resolve,_reject)=>{
    for(let i=0; i<pathArr.length; i++){
      if(pathArr[i]){
        path+=`${pathArr[i]}\\`;
        if(pathArr[i]!==".."&& !fs.existsSync(path)){
          fs.mkdirSync(path);
        }
      }
    }
    _resolve("mkdir success!");
  };
};
let message=(_target,_resolve)=>{
  console.log((_resolve==='succeeded' ? '\033[96m' : '\033[91m')+'['+new Date().toLocaleTimeString()+']['+event+']['+_resolve+']'+'\033[0m'+_target);
};
let remove=()=>{
  if(/[^\\]+\.min\.(css|js)$/.test(targetPath)){//删除文件
    fs.unlink(targetPath,function(error){
      if(error){
        message(targetPath,"failed");
        //console.log(error);
        return false;
      }
      message(targetPath,"succeeded");
    });
  }
  else{//删除目录
    fs.rmdir(targetDir,function(error){
      if(error){
        message(targetDir,"failed");
        return false;
      }
      message(targetDir,"succeeded");
    });
  }
};
let change=()=>{
  new Promise(ensurePath(targetDir)).then(()=>{
    fileExt=filePath.split(".").pop();
    if(fileExt==="js"){
      new Promise((_resolve,_reject)=>{
        if(config.uglifyJsCss.babel){
          //targetCode=fs.readFileSync(filePath,'utf-8');
          try{
            targetCode=babel.transformFileSync(filePath,{
              "presets":[es2015,stage0],
              "plugins":[removeStrictModePlugin]//去除"use strict"
            }).code;
            _resolve("success");
          }
          catch(_err){
            console.log(_err);
            _reject("failed");
          }
        }
        else{
          targetCode=fs.readFileSync(filePath,'utf-8');
          _resolve("success");
        }
      }).then(()=>{
        targetCode=thisUglifyJs.minify(targetCode);
        fs.writeFileSync(targetPath,targetCode.code,'utf-8');
        message(targetPath,"succeeded");
      }).catch((err)=>{
        console.log(err);
        message(targetPath,"failed");
      });
    }
    else if(fileExt==="css"){
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
        if(err){
          message(targetPath,"failed");
          console.log(err);
          return false;
        }
        fs.writeFileSync(targetPath,data);
        message(targetPath,"succeeded");
      });
    }
  });
};
module.exports.watch=function(_dir){
  watch.watchTree(_dir,function(_filePath,_curr,_prev){//filePath是修改过的文件。 curr是该文件的当前状态对象，prev是前一个状态对象。
    filePath=_filePath;
    if(/(\\css\\)|(\\js\\)/.test(filePath)===false) return false;//仅js,css目录才处理
    targetPath=filePath.replace(/\\(js|css)\\/,"\\$1.min\\").replace(/(\.css|\.js)/,".min$1");//目标路径
    targetDir=targetPath.replace(/\\[^\\]+min\.(css|js)$/g,"");
    targetCode=null;//目标文件代码
    if(typeof filePath=="object"&&_prev===null&&_curr===null){
      // Finished walking the tree
    }
    else if(_prev===null){//填加文件
      event="create";
      change();
    }
    else if(_curr.hasOwnProperty("nlink")&&_curr.nlink===0){//删除文件或文件夹
      event="remove";
      remove();
    }
    else{//更新文件
      event="update";
      change();
    }
  });
};