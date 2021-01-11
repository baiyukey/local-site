import thisUglifyJs from "uglify-es";
import cleanCss from "clean-css";
import fs from "fs";
import path from "path";
import watch from "watch";
import babel from "babel-core";
import es2017 from "babel-preset-es2017";
import stage0 from "babel-preset-stage-0";
import removeStrictModePlugin from "babel-plugin-transform-remove-strict-mode";
import config from "./config.js";
import message from "./message.js";

let jsCssSourceDir=path.resolve(config.jsCss.sourceDir).replace(/\\/g,'/')+'/';//绝对路径统一用/分隔
let jsCssExportDir=path.resolve(config.jsCss.exportDir).replace(/\\/g,'/')+'/';//绝对路径统一用/分隔
let htmlDir=path.resolve(config.html.sourceDir).replace(/\\/g,'/')+'/';
let cssCode='@charset "utf-8";\n';
let jsCode='$(function(){\nlet pageInt=()=>{\n};\npageInt();\n});';
let minifyCss=new cleanCss({
  level:2
});
let getFileDir=_path=>_path.replace(/^(.*)([\\\/])(.*)$/,"$1");// /a/b/c.js ==> /a/b/c
let getMinPath=function(_path){
  /**
   * 通过config的配置项将js或css的路径转换为编译后的文件路径
   * 如果sourceDir!=targetDir时，那么两个目录下的子目录树保持一致 例如/media/js/a/index.js输出为/media2/js/a/index.min.js
   * 如果sourceDir===exportDir，即为同一目录时，那么该目录下的“js/”目录编译到"js.min/"目录中(没有“js/”目录忽略此步)，用以区分管理，CSS同理。例如/media/js/a/index.js输出为/media/js.min/a/index.min.js
   */
  if(jsCssSourceDir!==jsCssExportDir){
    return _path.replace(jsCssSourceDir,jsCssExportDir).replace(/(\.css|\.js)$/,`${config.jsCss.extend}$1`);//目标路径
  }
  else{
    return _path.replace(/\/(js|css)\//,"\/$1.min\/").replace(/(\.css|\.js)$/,`${config.jsCss.extend}$1`);//目标路径
  }
};
let ensureDir=(_path)=>{
  return function(_resolve,_reject){
    const pathArr=_path.split(/[\\\/]/);
    let i=-1;
    let thisDir='';
    let checkThis=function(){
      i++;
      if(i===pathArr.length){
        _resolve("dir success");
        return false;
      }
      thisDir+=(pathArr[i]+'/');
      fs.exists(thisDir,function(_exists){
        if(!_exists){
          fs.mkdir(thisDir,checkThis);
        }
        else{
          checkThis();
        }
      });
    };
    checkThis();
  };
};
let deleteThis=(_path)=>{
  let thisExtName=path.extname(_path);
  if(thisExtName!==""){//删除文件
    fs.unlink(_path,function(error){
      if(error){
        message(_path,"delete","failed");
        //return false;
      }
      else{
        message(_path,"delete","succeeded");
        deleteThis(getFileDir(_path));//所属文件夹如果为空就删除
      }
    });
  }
  else{//删除目录
    fs.rmdir(_path,function(error){
      if(error){
        //目录中有文件时会报错
      }
      else{
        message(_path,"delete","succeeded");
      }
    });
  }
};
let miniFyCssJs=(_sourcePath,_targetPath,_event)=>{
  let targetDir=getFileDir(_targetPath);
  let fileExt=path.extname(_sourcePath);
  let targetCode='';
  let event=_event || "write";
  let runThis=function(){
    if(fileExt===".js"){
      new Promise((_resolve,_reject)=>{
        if(config.jsCss.isBabel){
          try{
            targetCode=babel.transformFileSync(_sourcePath,{
              "presets":[es2017,stage0],
              "plugins":[removeStrictModePlugin]//去除"use strict"
            }).code;
            _resolve("success");
          }
          catch(_err){
            _reject(_err);
          }
        }
        else{
          targetCode=fs.readFileSync(_sourcePath,'utf-8');
          _resolve("success");
        }
      }).then(()=>{
        targetCode=thisUglifyJs["minify"](targetCode).code;
        writeCssJs(_targetPath,targetCode,event);
      }).catch((err)=>{
        console.debug(err);
        message(_targetPath,event,"failed");
      });
    }
    else if(fileExt===".css"){
      targetCode=fs.readFileSync(_sourcePath,'utf-8');
      targetCode=minifyCss.minify(targetCode);
      if(targetCode.errors.length!==0){
        message(_targetPath,event,"failed");
        console.log('\x1b[91m',targetCode.errors[0],'\x1b[0m');
      }
      else if(targetCode.warnings.length!==0){
        message(_targetPath,event,"failed");
        console.log('\x1b[91m',targetCode.warnings[0],'\x1b[0m');
      }
      else{
        fs.writeFileSync(_targetPath,targetCode.styles);
        message(_targetPath,event,"succeeded");
      }
    }
  };
  new Promise(ensureDir(targetDir)).then(runThis);
};
let writeCssJs=function(_path,_code,_event){
  let thisDir=getFileDir(_path);//.replace(/(.*\\)(.*)/,"$1");
  new Promise(ensureDir(thisDir)).then(()=>{
    fs.writeFile(_path,_code,function(_err){
      if(_err){
        message(_path,_event,"failed");
      }
      else{
        message(_path,_event,"succeeded");
      }
    });
  }).catch((_err)=>{
    console.debug(_err);
  });
};
//通过html路径获取计算后的CSS，JS路径
let htmlToJsCssPath=function(_sourcePath){
  //例如_sourcePath=d:/www/uielf.com/html/a/index.html
  let fileExt=path.extname(_sourcePath);//返回.html
  let samePath=_sourcePath.replace(htmlDir,"").replace(fileExt,"");//返回 a/index
  let jsPath,cssPath;
  if(config.html.buildJsCss===2){
    jsPath=jsCssSourceDir+'js/'+samePath+".js";//返回d:/www/uielf.com/media/js/a/index.js
    cssPath=jsCssSourceDir+'css/'+samePath+".css";//返回d:/www/uielf.com/media/css/a/index.css
  }
  else if(config.html.buildJsCss===1){
    jsPath=jsCssSourceDir+(samePath.includes("/") ? samePath.replace(/^(.*)(\/)(.*)$/,"$1$2js/$3") : 'js/'+samePath)+".js";//返回d:/www/uielf.com/media/a/js/index.js
    cssPath=jsCssSourceDir+(samePath.includes("/") ? samePath.replace(/^(.*)(\/)(.*)$/,"$1$2css/$3") : 'css/'+samePath)+".css";//返回d:/www/uielf.com/media/a/css/index.css
  }
  return {
    "jsPath":jsPath,
    "cssPath":cssPath
  };
};
let createCssJs=(_sourcePath)=>{
  let thisPath=htmlToJsCssPath(_sourcePath);
  writeCssJs(thisPath.cssPath,cssCode,"create");
  writeCssJs(thisPath.jsPath,jsCode,"create");
  if(config.jsCss.isUglify){
    writeCssJs(getMinPath(thisPath.cssPath),cssCode,"create");
    writeCssJs(getMinPath(thisPath.jsPath),jsCode,"create");
  }
};
let deleteCssJs=(_sourcePath)=>{
  let thisPath=htmlToJsCssPath(_sourcePath);
  deleteThis(thisPath.cssPath);
  deleteThis(thisPath.jsPath);
  if(config.jsCss.isUglify){
    deleteThis(getMinPath(thisPath.cssPath));
    deleteThis(getMinPath(thisPath.jsPath));
  }
};
let executeCssJs=function(_filePath,_curr,_prev){
  let thisMiniPath=getMinPath(_filePath);//目标路径
  if(_prev===null){//填加文件
    miniFyCssJs(_filePath,thisMiniPath,"create");
  }
  else if(_curr.hasOwnProperty("nlink") && _curr.nlink===0){//删除文件或文件夹
    deleteThis(thisMiniPath);
  }
  else{//更新文件
    miniFyCssJs(_filePath,thisMiniPath,"minify");
  }
};
let executeHtml=function(_filePath,_curr,_prev){
  if(_prev===null){//填加文件
    console.warn("检测到添加了"+path.basename(_filePath)+"，开始创建html关联文件...");
    createCssJs(_filePath);
  }
  else if(_curr.hasOwnProperty("nlink") && _curr.nlink===0){//删除文件或文件夹
    console.warn("检测到删除了"+path.basename(_filePath)+"，开始删除html关联文件...");
    deleteCssJs(_filePath);
  }
  else{//更新文件
  }
};
let thisWatch=function(_dir){
  let [sourcePath,fileExt]=["",""];
  let jsCssExtReg=/^[.]((js)|(css))$/;
  let htmlExtReg=/^[.]((htm)|(html))$/;
  watch.watchTree(_dir,function(_filePath,_curr,_prev){//filePath是当前的文件, curr是该文件的当前状态对象，prev是前一个状态对象
    sourcePath=path.resolve(_filePath.toString()).replace(/\\/g,'/');
    fileExt=path.extname(sourcePath);//文件扩展名
    if(config.jsCss.isUglify && jsCssExtReg.test(fileExt) && sourcePath.includes(jsCssSourceDir) && !sourcePath.includes(`min${fileExt}`)){
      executeCssJs(sourcePath,_curr,_prev);
    }
    else if([1,2].includes(config.html.buildJsCss) && htmlExtReg.test(fileExt) && sourcePath.indexOf(htmlDir)>=0){
      executeHtml(sourcePath,_curr,_prev);
    }
  });
};
export default {watch:thisWatch};
