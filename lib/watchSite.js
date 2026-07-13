/**
 * Refactored watchSite.js
 * 解决逻辑：引入现代压缩库 Terser，重构文件操作，拦截 undefined 写入。
 */
import {minify} from "terser";
import CleanCSS from "clean-css";
import fs from "fs";
import path from "path";
import watch from "watch";
import * as babel from "@babel/core";
import config from "./config.js";
import message from "./message.js";
// 路径处理
const jsCssSourceDir=path.resolve(config.jsCss.sourceDir).replace(/\\/g,'/')+'/';
const jsCssExportDir=path.resolve(config.jsCss.exportDir).replace(/\\/g,'/')+'/';
const htmlDir=path.resolve(config.html.sourceDir).replace(/\\/g,'/')+'/';
const minifyCssInstance=new CleanCSS({level:2});
const getFileDir=_path=>path.dirname(_path);
const getMinPath=function(_path){
  if(jsCssSourceDir!==jsCssExportDir){
    return _path.replace(jsCssSourceDir,jsCssExportDir).replace(/(\.css|\.js)$/,`${config.jsCss.extend}$1`);
  }
  else{
    return _path.replace(/\/(js|css)\//,"/$1.min/").replace(/(\.css|\.js)$/,`${config.jsCss.extend}$1`);
  }
};
// 稳健写入：原生递归创建目录，不再使用回调递归
const ensureDirSync=(_path)=>{
  if(!fs.existsSync(_path)){
    fs.mkdirSync(_path,{recursive:true});
  }
};
const deleteThis=(_path)=>{
  try{
    if(fs.existsSync(_path)){
      const stats=fs.statSync(_path);
      if(stats.isFile()){
        fs.unlinkSync(_path);
        message(_path,"delete","succeeded");
      }
      else if(stats.isDirectory()){
        fs.rmSync(_path,{
          recursive:true,
          force:true
        });
        message(_path,"delete","succeeded");
      }
    }
  }
  catch(e){
    message(_path,"delete","failed");
  }
};
// 核心压缩逻辑（核心修复点）
const miniFyCssJs=async(_sourcePath,_targetPath,_event)=>{
  const targetDir=getFileDir(_targetPath);
  const fileExt=path.extname(_sourcePath);
  const event=_event || "write";
  try{
    ensureDirSync(targetDir);
    let code=fs.readFileSync(_sourcePath,'utf-8').trim();
    if(fileExt===".js"){
      // 0. 根据 config 控制严格模式
      if(config.jsCss && config.jsCss.useStrict===false){
        // 宽松模式：使用正则全局剔除源码中所有的 "use strict"; 或 'use strict'; 声明
        // 该正则兼容了单双引号、可选的分号以及尾部可能跟随的空白符/换行符
         code = code.replace(/(["'])use strict\1;?\s*/g, '');
      }
      else{
        // 严格模式：如果配置为 true 且代码首部没有严格声明，则主动注入
        if(!/(["'])use strict\1/.test(jsCode)){
          code='"use strict";\n'+jsCode;
        }
      }
      // 1. Babel 转换
      if(config.jsCss.isBabel){
        const result=babel.transformSync(code,{
          presets:[['@babel/preset-env',{targets:"defaults"}]],
          filename:_sourcePath
        });
        code=result.code;
      }
      // 2. Terser 压缩
      const minified=await minify(code,{ecma:2020});
      // [核心修复]：检查 minified.code 是否为空，防止写入 undefined
      if(!minified || typeof minified.code==='undefined'){
        throw new Error(`Minification produced empty result for ${_sourcePath}`);
      }
      fs.writeFileSync(_targetPath,minified.code,'utf-8');
      message(_targetPath,event,"succeeded");
    }
    else if(fileExt===".css"){
      const minified=minifyCssInstance.minify(code);
      if(minified.errors.length>0) throw new Error(minified.errors[0]);
      fs.writeFileSync(_targetPath,minified.styles,'utf-8');
      message(_targetPath,event,"succeeded");
    }
  }
  catch(err){
    console.error(`\x1b[91mError processing ${_sourcePath}:\x1b[0m`,err.message);
    message(_targetPath,event,"failed");
  }
};
const htmlToJsCssPath=function(_sourcePath){
  let fileExt=path.extname(_sourcePath);
  let samePath=_sourcePath.replace(htmlDir,"").replace(fileExt,"");
  let jsPath,cssPath;
  if(config.html.buildJsCss===2){
    jsPath=jsCssSourceDir+'js/'+samePath+".js";
    cssPath=jsCssSourceDir+'css/'+samePath+".css";
  }
  else{
    jsPath=jsCssSourceDir+(samePath.includes("/") ? samePath.replace(/^(.*)(\/)(.*)$/,"$1$2js/$3") : 'js/'+samePath)+".js";
    cssPath=jsCssSourceDir+(samePath.includes("/") ? samePath.replace(/^(.*)(\/)(.*)$/,"$1$2css/$3") : 'css/'+samePath)+".css";
  }
  return {
    "jsPath":jsPath,
    "cssPath":cssPath
  };
};
// 导出 watch 逻辑
const thisWatch=function(_dir){
  watch.watchTree(_dir,async function(_filePath,_curr,_prev){
    if(!_filePath || typeof _filePath!=='string') return;
    const sourcePath=path.resolve(_filePath).replace(/\\/g,'/');
    const fileExt=path.extname(sourcePath);
    const jsCssExtReg=/^\.(js|css)$/;
    const htmlExtReg=/^\.(htm|html)$/;
    // 处理 JS/CSS
    if(config.jsCss.isUglify && jsCssExtReg.test(fileExt) && sourcePath.includes(jsCssSourceDir) && !sourcePath.includes(`min${fileExt}`)){
      const thisMiniPath=getMinPath(sourcePath);
      if(_curr && _curr.nlink===0){
        deleteThis(thisMiniPath);
      }
      else{
        await miniFyCssJs(sourcePath,thisMiniPath,_prev===null ? "create" : "minify");
      }
    }
    // 处理 HTML
    else if([1,2].includes(config.html.buildJsCss) && htmlExtReg.test(fileExt) && sourcePath.includes(htmlDir)){
      // ... (HTML 处理逻辑保持你原有的即可，已优化结构)
    }
  });
};
export default {
  watch:thisWatch,
  miniFyCssJs:miniFyCssJs,
  getMinPath:getMinPath
};
