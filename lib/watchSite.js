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
let jsCssDir=config.uglifyJsCss.watchDir.replace(/[\/\\]/g,"\\");
let htmlDir=config.elfFrame.watchDir.replace(/[\/\\]/g,"\\");
let cssCode='@charset "utf-8";\n';
let jsCode='$(function(){\nlet pageInt=()=>{\n};\npageInt();\n});';
let getFileExt=function(_path){
  let thisExt=_path.replace(/^(.*\\.*\.)(.*)$/,"$2");
  return thisExt===_path ? "" : thisExt;
};
let getFileDir=function(_path){
  return _path.replace(/^(.*\\)(.*)$/,"$1");
};
let getFileName=function(_path){
  let thisName= _path.replace(/^(.*\\)(.*)$/,"$2");
  return thisName===_path ? "" : thisName;
};
let message=(_target,_event,_resolve)=>{
  let thisFileExt=getFileExt(_target);
  let resolve=_resolve||"succeeded";
  console.log((resolve==='succeeded' ? '\033[96m' : '\033[91m')+'['+new Date().toLocaleTimeString()+']['+_event+'_'+thisFileExt+'_'+resolve+']'+'\033[0m'+_target);
};
let ensureDir=(_path)=>{
  const pathArr=_path.split(/[\\\/]/);
  let path='';
  return (_resolve)=>{
    for(let i=0; i<pathArr.length; i++){
      if(pathArr[i]){
        path+=`${pathArr[i]}\\`;
        if(pathArr[i]!==".."&& !fs.existsSync(path)){
          fs.mkdirSync(path);
        }
      }
    }
    _resolve("mkdir success!");
    /*if(i===(pathArr.length-1)){
     _resolve("mkdir success!");
     }
     else{
     _reject("mkdir failed!");
     }*/
  };
};
let removePath=(_path)=>{
  if(_path.replace(/^.*\\(.*)$/,"$1")!==""){//删除文件
    fs.unlink(_path,function(error){
      if(error){
        message(_path,"delete","failed");
        return false;
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
  //targetCode=null;//目标文件代码
  let targetDir=_targetPath.replace(/(.*\\)(.*)/,"$1");//目标目录
  let fileExt=getFileExt(_sourcePath);
  let targetCode='';
  let event=_event||"write";
  let runThis=function(){
    if(fileExt==="js"){
      new Promise((_resolve,_reject)=>{
        if(config.uglifyJsCss.babel){
          //targetCode=fs.readFileSync(sourcePath,'utf-8');
          try{
            targetCode=babel.transformFileSync(_sourcePath,{
              "presets":[es2015,stage0],
              "plugins":[removeStrictModePlugin]//去除"use strict"
            }).code;
            _resolve("success");
          }
          catch(_err){
            //console.log(_err);
            _reject(_err);
          }
        }
        else{
          targetCode=fs.readFileSync(_sourcePath,'utf-8');
          _resolve("success");
        }
      }).then(()=>{
        targetCode=thisUglifyJs["minify"](targetCode).code;
        writeFile(_targetPath,targetCode,event);
        /*fs.writeFileSync(targetPath,targetCode.code,'utf-8');*/
      }).catch((err)=>{
        console.debug(err);
        message(_targetPath,_event,"failed");
      });
    }
    else if(fileExt==="css"){
      targetCode=fs.readFileSync(_sourcePath,'utf-8');
      //java -version 检查是否安装了java，否则下面不能顺利执行
      thisUglifyCss.compress(targetCode,{
        "nomunge":true,//只进行mini压缩（去注释，去空格），不进行混淆（把函数命名也进行压缩）。默认为false
        "charset":'utf8',
        "type":'css'//默认'js'
      },function(_err,_data){
        //err   If compressor encounters an error, it's stderr will be here
        //data  The compressed string, you write it out where you want it
        //extra The stderr (warnings are printed here in case you want to echo them
        if(_err){
          message(_targetPath,_event,"failed");
          console.debug(_err);
        }
        else{
          writeFile(_targetPath,_data,event);
          //fs.writeFileSync(targetPath,_data); 
        }
      });
    }
  };
  new Promise(ensureDir(targetDir)).then(runThis);
};
let writeFile=function(_path,_code,_event){
  let thisDir=getFileDir(_path);//.replace(/(.*\\)(.*)/,"$1");
  new Promise(ensureDir(thisDir)).then(()=>{
    //fs.writeFileSync(_path,_code,'utf-8');
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
  let fileExt=getFileExt(_sourcePath);
  let samePath=_sourcePath.replace(/[\\\/]/g,"\\").replace(htmlDir,"").replace("."+fileExt,"");
  writeFile(jsCssDir+'css\\'+samePath+".css",cssCode,"add");//返回类似../media/user/css/index/index.css
  writeFile(jsCssDir+'js\\'+samePath+".js",jsCode,"add");
};
let removeCssJs=(_sourcePath)=>{
  let fileExt=getFileExt(_sourcePath);
  let samePath=_sourcePath.replace(/[\\\/]/g,"\\").replace(htmlDir,"").replace("."+fileExt,"");
  removePath(jsCssDir+'css\\'+samePath+".css");
  removePath(jsCssDir+'js\\'+samePath+".js");
};
let executeCssJs=function(_filePath,_curr,_prev){
  let sourcePath=_filePath.toString();
  let targetPath=sourcePath.replace(/\\(js|css)\\/,"\\$1.min\\").replace(/(\.css|\.js)/,".min$1");//目标路径
  if(typeof _filePath=="object"&&_prev===null&&_curr===null){
    // Finished walking the tree
    console.log('typeof _filePath=="object"&&_prev===null&&_curr===null');
  }
  else if(_prev===null){//填加文件
    miniFyCssJs(sourcePath,targetPath,"add");
  }
  else if(_curr.hasOwnProperty("nlink")&&_curr.nlink===0){//删除文件或文件夹
    removePath(targetPath);
  }
  else{//更新文件
    miniFyCssJs(sourcePath,targetPath,"minify");
  }
};
let executeHtml=function(_filePath,_curr,_prev){
  let sourcePath=_filePath.toString();
  if(typeof _filePath=="object"&&_prev===null&&_curr===null){
    // Finished walking the tree
    console.log('typeof filePath=="object"&&_prev===null&&_curr===null');
  }
  else if(_prev===null){//填加文件
    console.warn("检测到添加了"+getFileName(sourcePath)+"，开始创建elfFrame关联文件...");
    addCssJs(sourcePath);
  }
  else if(_curr.hasOwnProperty("nlink")&&_curr.nlink===0){//删除文件或文件夹
    console.warn("检测到删除了"+getFileName(sourcePath)+"，开始删除elfFrame关联文件...");
    removeCssJs(sourcePath);
  }
  else{//更新文件
    //addCssJs();//仅测试用，实际不需要
    //upgradeHtml();
  }
};
module.exports.watch=function(_dir){
  let [sourcePath,fileExt]=["",""];
  let FileExtReg=/^((js)|(css)|(htm)|(html))$/;
  watch.watchTree(_dir,function(_filePath,_curr,_prev){//filePath是当前的文件, curr是该文件的当前状态对象，prev是前一个状态对象
    sourcePath=_filePath.toString();
    fileExt=getFileExt(sourcePath);//文件扩展名
    //    if(/^((js)|(css)|(html))$/.test(fileExt)===false) return false;
    if(config.uglifyJsCss.enable&&FileExtReg.test(fileExt)&&sourcePath.indexOf(jsCssDir)>=0&&sourcePath.indexOf("min."+fileExt)<0){
      executeCssJs(_filePath,_curr,_prev);
    }
    else if(config.elfFrame.enable&&FileExtReg.test(fileExt)&&sourcePath.indexOf(htmlDir)>=0){
      executeHtml(_filePath,_curr,_prev);
    }
  });
};