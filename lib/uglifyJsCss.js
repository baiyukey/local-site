/**
 * Created by baiyu on 2019/07/02.
 * Refactored for modern high-performance execution and robustness.
 */
import {minify} from "terser";
import CleanCSS from "clean-css";
import fs from "fs";
import path from "path";
import watch from "watch";
import message from "./message";
import babel from "@babel/core";
import config from "./config.js";

const minifyCss=new CleanCSS({
  level:{1:{all:false}}
});
// 稳健升级 1：利用原生 API 替代复杂的字符串拼接与手动递归循环
const ensureDirSync=(targetDir)=>{
  if(!fs.existsSync(targetDir)){
    fs.mkdirSync(targetDir,{recursive:true});
  }
};
const remove=(targetPath,targetDir)=>{
  try{
    // 判断是否为具体文件
    if(/[^\/\\]+\.min\.(css|js)$/.test(targetPath)){
      if(fs.existsSync(targetPath)){
        fs.unlinkSync(targetPath);
        message(targetPath,"remove","succeeded");
      }
    }
    else{
      // 稳健升级 2：使用现代 rmSync 确保目录及内部文件被干净移除
      if(fs.existsSync(targetDir)){
        fs.rmSync(targetDir,{
          recursive:true,
          force:true
        });
        message(targetDir,"remove","succeeded");
      }
    }
  }
  catch(error){
    message(targetPath || targetDir,"remove","failed");
    console.error("Remove Error:",error);
  }
};
const processJs=async(filePath,targetPath)=>{
  try{
    let code=fs.readFileSync(filePath,'utf-8');
    if(config.jsCss.isBabel){
      // 稳健升级 3：精准控制 Babel 编译目标，保留 async/await 等现代语法
      const transformed=babel.transformSync(code,{
        filename:filePath,
        presets:[
          ['@babel/preset-env',{
            targets:"defaults and not dead, > 1%", // 针对现代浏览器环境
            modules:false
          }]
        ]
      });
      code=transformed.code;
    }
    // 稳健升级 4：使用 Terser 压缩，明确宣告保留现代语法规范
    const minified=await minify(code,{
      ecma:2020,
      compress:{passes:2},
      format:{comments:false}
    });
    fs.writeFileSync(targetPath,minified.code,'utf-8');
    message(targetPath,"change","succeeded");
  }
  catch(error){
    console.error("JS Processing Error:",error);
    message(targetPath,"change","failed");
  }
};
const processCss=(filePath,targetPath)=>{
  try{
    const code=fs.readFileSync(filePath,'utf-8');
    const minified=minifyCss.minify(code);
    if(minified.errors.length!==0){
      message(filePath,"change","failed");
      console.error('\x1b[91m',minified.errors[0],'\x1b[0m');
      return;
    }
    if(minified.warnings.length!==0){
      message(filePath,"change","failed");
      console.warn('\x1b[93m',minified.warnings[0],'\x1b[0m');
    }
    // 稳健升级 5：修正了原代码中 CSS 可能覆盖源文件的潜在风险，确保写入 targetPath
    fs.writeFileSync(targetPath,minified.styles,'utf-8');
    message(targetPath,"change","succeeded",minified.stats.minifiedSize);
  }
  catch(error){
    console.error("CSS Processing Error:",error);
    message(filePath,"change","failed");
  }
};
module.exports.watch=function(_dir){
  watch.watchTree(_dir,async function(_filePath,_curr,_prev){
    // 兼容跨平台路径（Windows 的 \\ 与 Mac/Linux 的 /）
    if(!/(\\|\/)(css|js)(\\|\/)/.test(_filePath)) return false;
    const filePath=_filePath;
    let targetPath='';
    if(config.jsCss.sourceDir===config.jsCss.exportDir){
      targetPath=filePath.replace(/(\\|\/)(js|css)(\\|\/)/,"$1$2.min$3").replace(/(\.css|\.js)$/,`${config.jsCss.extend}$1`);
    }
    else{
      targetPath=filePath.replace(config.jsCss.sourceDir,config.jsCss.exportDir).replace(/(\.css|\.js)$/,`${config.jsCss.extend}$1`);
    }
    // 使用原生 path 模块精准获取目录
    const targetDir=path.dirname(targetPath);
    if(typeof filePath==="object" && _prev===null && _curr===null){
      // 遍历完成
      return;
    }
    // 判断是删除操作还是变更/创建操作
    if(_curr && _curr.hasOwnProperty("nlink") && _curr.nlink===0){
      remove(targetPath,targetDir);
    }
    else{
      ensureDirSync(targetDir);
      const fileExt=path.extname(filePath).toLowerCase();
      if(fileExt==='.js'){
        await processJs(filePath,targetPath);
      }
      else if(fileExt==='.css'){
        processCss(filePath,targetPath);
      }
    }
  });
};
