/**
 * Created by baiyu on 2019/07/02.
 */
import thisUglifyJs from "uglify-es";
import cleanCss from "clean-css";
import fs from "fs";
import watch from "watch";
import message from "./message";
import babel from "babel-core";
import es2015 from "babel-preset-es2015";
import stage0 from "babel-preset-stage-0";
import removeStrictModePlugin from "babel-plugin-transform-remove-strict-mode";
import config from "./config.js";

let minifyCss=new cleanCss({
  level:2
});
let [filePath,targetDir,targetPath,fileExt,event]=["源路径","目标目录","目标路径","源文件扩展名","事件"];
let targetCode=null;//输出代码，即目标文件代码
let ensurePath=(_path)=>{
  const pathArr=_path.split('\\');
  let path='';
  return (_resolve,_reject)=>{
    for(let i=0; i<pathArr.length; i++){
      if(pathArr[i]){
        path+=`${pathArr[i]}\\`;
        if(pathArr[i]!==".." && !fs.existsSync(path)){
          fs.mkdirSync(path);
        }
      }
    }
    _resolve("mkdir success!");
  };
};
let remove=()=>{
  if(/[^\\]+\.min\.(css|js)$/.test(targetPath)){//删除文件
    fs.unlink(targetPath,function(error){
      if(error){
        message(targetPath,"remove","failed");
        //console.log(error);
        return false;
      }
      message(targetPath,"remove","succeeded");
    });
  }
  else{//删除目录
    fs.rmdir(targetDir,function(error){
      if(error){
        message(targetDir,"remove","failed");
        return false;
      }
      message(targetDir,"remove","succeeded");
    });
  }
};
let change=()=>{
  new Promise(ensurePath(targetDir)).then(()=>{
    fileExt=filePath.split(".").pop();
    if(fileExt==="js"){
      new Promise((_resolve,_reject)=>{
        if(config.jsCss.isBabel){
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
        message(targetPath,"change","succeeded");
      }).catch((err)=>{
        console.log(err);
        message(targetPath,"change","failed");
      });
    }
    else if(fileExt===".css"){
      targetCode=fs.readFileSync(filePath,'utf-8');
      targetCode=minifyCss.minify(targetCode);
      if(targetCode.errors.length!==0){
        message(filePath,"change","failed");
        console.log('\x1b[91m',targetCode.errors[0],'\x1b[0m');
      }
      else if(targetCode.warnings.length!==0){
        message(filePath,"change","failed");
        console.log('\x1b[91m',targetCode.warnings[0],'\x1b[0m');
      }
      else{
        fs.writeFileSync(filePath,targetCode.styles);
        message(filePath,"change","succeeded");
      }
    }
  });
};
module.exports.watch=function(_dir){
  watch.watchTree(_dir,function(_filePath,_curr,_prev){//_filePath是修改过的文件。 _curr是该文件的当前状态对象，_prev是前一个状态对象。
    if(/(\\css\\)|(\\js\\)/.test(_filePath)===false) return false;//仅js,css目录才处理
    filePath=_filePath;
    if(config.jsCss.sourceDir===config.jsCss.exportDir){
      //如果sourceDir===exportDir，即为同一目录时，那么该目录下的“js/”目录编译到"js.min/"目录中，用以区分管理，CSS同理
      targetPath=filePath.replace(/\\(js|css)\\/,"\\$1.min\\").replace(/(\.css|\.js)$/,`${config.jsCss.extend}$1`);//目标路径
    }
    else{
      //如果sourceDir!=exportDir，那么两个目录下的子目录树保持一致
      targetPath=filePath.replace(config.jsCss.sourceDir,config.jsCss.exportDir).replace(/(\.css|\.js)$/,`${config.jsCss.extend}$1`);//目标路径
    }
    targetDir=targetPath.replace(/(.*)\\.*$/g,"$1");
    targetCode=null;//目标文件代码
    if(typeof filePath=="object" && _prev===null && _curr===null){
      // Finished walking the tree
    }
    else if(_prev===null){//创建文件
      event="create";
      change();
    }
    else if(_curr.hasOwnProperty("nlink") && _curr.nlink===0){//删除文件或文件夹
      event="remove";
      remove();
    }
    else{//更新文件
      event="update";
      change();
    }
  });
};
