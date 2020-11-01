let thisUglifyJs=require("uglify-es");
let cleanCss=require("clean-css");
let fs=require("fs");
let path=require("path");
let watch=require("watch");
let babel=require("babel-core");
let es2015=require("babel-preset-es2015");
let stage0=require("babel-preset-stage-0");
let removeStrictModePlugin=require("babel-plugin-transform-remove-strict-mode");
let config=require("./config");
let message=require("./message")
let jsCssDir=path.resolve(config.uglifyJsCss.watchDir).replace(/\\/g,'/')+'/';//绝对路径统一用/分隔
let htmlDir=path.resolve(config.elfFrame.watchDir).replace(/\\/g,'/')+'/';
let cssCode='@charset "utf-8";\n';
let jsCode='$(function(){\nlet pageInt=()=>{\n};\npageInt();\n});';
let minifyCss=new cleanCss({
  level:2
});
let getFileDir=function(_path){
  return _path.replace(/^(.*)([\\\/])(.*)$/,"$1");
};
let getMinPath=function(_path){
  return _path.replace(/([\\\/])(js|css)([\\\/])/,"$1$2.min$3").replace(/(\.css|\.js)/,".min$1");
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
let removePath=(_path)=>{
  let thisExtName=path.extname(_path);
  if(thisExtName!==""){//删除文件
    fs.unlink(_path,function(error){
      if(error){
        //message(_path,"delete","failed");
        //return false;
      }
      else{
        message(_path,"delete","succeeded");
        removePath(getFileDir(_path));//所属文件夹如果为空就删除
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
  let event=_event||"write";
  let runThis=function(){
    if(fileExt===".js"){
      new Promise((_resolve,_reject)=>{
        if(config.uglifyJsCss.babel){
          try{
            targetCode=babel.transformFileSync(_sourcePath,{
              "presets":[es2015,stage0],
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
        console.log('\033[91m',targetCode.errors[0],'\033[0m');
      }
      else if(targetCode.warnings.length!==0){
        message(_targetPath,event,"failed");
        console.log('\033[91m',targetCode.warnings[0],'\033[0m');
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
let addCssJs=(_sourcePath)=>{
  let fileExt=path.extname(_sourcePath);
  let samePath=_sourcePath.replace(htmlDir,"").replace(fileExt,"");
  let cssPath=jsCssDir+'css/'+samePath+".css";
  let jsPath=jsCssDir+'js/'+samePath+".js";
  writeCssJs(cssPath,cssCode,"add");
  writeCssJs(jsPath,jsCode,"add");
  writeCssJs(getMinPath(cssPath),cssCode,"add");
  writeCssJs(getMinPath(jsPath),jsCode,"add");
};
let removeCssJs=(_sourcePath)=>{
  let fileExt=path.extname(_sourcePath);
  let samePath=_sourcePath.replace(htmlDir,"").replace(fileExt,"");//返回about/aboutMe
  let cssPath=jsCssDir+'css/'+samePath+".css";
  let jsPath=jsCssDir+'js/'+samePath+".js";
  removePath(cssPath);
  removePath(jsPath);
  removePath(getMinPath(cssPath));
  removePath(getMinPath(jsPath));
};
let executeCssJs=function(_filePath,_curr,_prev){
  let targetPath=getMinPath(_filePath);//目标路径
  if(_prev===null){//填加文件
    miniFyCssJs(_filePath,targetPath,"add");
  }
  else if(_curr.hasOwnProperty("nlink")&&_curr.nlink===0){//删除文件或文件夹
    removePath(targetPath);
  }
  else{//更新文件
    miniFyCssJs(_filePath,targetPath,"minify");
  }
};
let executeHtml=function(_filePath,_curr,_prev){
  if(_prev===null){//填加文件
    console.warn("检测到添加了"+path.basename(_filePath)+"，开始创建elfFrame关联文件...");
    addCssJs(_filePath);
  }
  else if(_curr.hasOwnProperty("nlink")&&_curr.nlink===0){//删除文件或文件夹
    console.warn("检测到删除了"+path.basename(_filePath)+"，开始删除elfFrame关联文件...");
    removeCssJs(_filePath);
  }
  else{//更新文件
  }
};
module.exports.watch=function(_dir){
  let [sourcePath,fileExt]=["",""];
  let FileExtReg=/^[.]((js)|(css)|(htm)|(html))$/;
  watch.watchTree(_dir,function(_filePath,_curr,_prev){//filePath是当前的文件, curr是该文件的当前状态对象，prev是前一个状态对象
    sourcePath=path.resolve(_filePath.toString()).replace(/\\/g,'/');
    fileExt=path.extname(sourcePath);//文件扩展名
    if(config.uglifyJsCss.enable&&FileExtReg.test(fileExt)&&sourcePath.indexOf(jsCssDir)>=0&&sourcePath.indexOf("min"+fileExt)<0){
      executeCssJs(sourcePath,_curr,_prev);
    }
    else if(config.elfFrame.enable&&FileExtReg.test(fileExt)&&sourcePath.indexOf(htmlDir)>=0){
      executeHtml(sourcePath,_curr,_prev);
    }
  });
};
