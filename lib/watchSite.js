import {minify as minifyCode} from "terser";
import CleanCSS from "clean-css";
import fs from "fs";
import path from "path";
import watch from "watch";
import * as babel from "@babel/core";
import config from "./config.js";
import message from "./message.js";
import crypto from "crypto";

const minifyCssInstance=new CleanCSS({compatibility:'ie8'});
// ==========================================
// 工具函数区
// ==========================================
const getFileDir=(_p)=>_p.replace(/[^/]*$/,"");
const ensureDirSync=(dir)=>{
  if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
};
const deleteThis=(_p)=>{
  if(fs.existsSync(_p)){
    fs.unlinkSync(_p);
    message(_p,"delete");
  }
};

function encryptName(name,secretKey){
  const hash=crypto.createHmac('sha256',secretKey).update(name).digest('hex');
  return hash.slice(0,16);
}

// ==========================================
// 核心：基于上下文的智能解析
// ==========================================
function parseFileContext(fileName,contextHint=''){
  let ext='',baseName=fileName,hasExplicitExt=false,inferredExt='';
  const lowerHint=contextHint.toLowerCase();
  let expectedExt='';
  if(lowerHint.includes('js')) expectedExt='.js';
  else if(lowerHint.includes('css')) expectedExt='.css';
  if(expectedExt){
    if(fileName.toLowerCase().endsWith(expectedExt)){
      ext=fileName.slice(-expectedExt.length);
      baseName=fileName.slice(0,-expectedExt.length);
      hasExplicitExt=true;
    }
    else{
      baseName=fileName;
      inferredExt=expectedExt;
    }
  }
  else{
    const dotIdx=fileName.lastIndexOf('.');
    if(dotIdx>0){
      ext=fileName.slice(dotIdx);
      baseName=fileName.slice(0,dotIdx);
      hasExplicitExt=true;
    }
  }
  return {
    baseName,
    ext,
    hasExplicitExt,
    inferredExt
  };
}

// ==========================================
// 加密判断与路径推算
// ==========================================
const canEncrypt=(baseName,ext,inferredExt='')=>{
  const {
    encrypt,
    minify
  }=config.export;
  if(!encrypt.enable || baseName==='index' || !encrypt.key) return false;
  const effectiveExt=ext || inferredExt;
  if(!effectiveExt) return false;
  const typeKey=effectiveExt.slice(1).toLowerCase();
  const normalizedType=typeKey==='htm' ? 'html' : typeKey;
  if(!minify.type.includes(normalizedType)) return false;
  const ignoreList=encrypt.ignoreFileNames || [];
  if(ignoreList.includes(baseName) || ignoreList.includes(`${baseName}${effectiveExt}`)) return false;
  return true;
};
// 推算最终物理输出路径
const getMinPath=function(_path){
  let targetPath=_path.replace(config.root,config.exportRoot);
  const ext=path.extname(targetPath);
  const targetDir=path.dirname(targetPath);
  let baseName=path.basename(targetPath,ext);
  if(canEncrypt(baseName,ext)){
    baseName=encryptName(baseName,config.export.encrypt.key);
  }
  return path.join(targetDir,`${baseName}${ext}`).replace(/\\/g,'/');
};

// HTML 内部路径加密替换
function getEncryptedPath(originalPath,attrName=''){
  const match=originalPath.match(/^([^?#]+)(\?[^#]*)?(#.*)?$/);
  if(!match) return originalPath;
  const urlPath=match[1],query=match[2] || '',hash=match[3] || '';
  const parts=urlPath.split('/');
  const lastPart=parts.pop();
  if(!lastPart) return originalPath;
  const {
    baseName,
    ext,
    hasExplicitExt,
    inferredExt
  }=parseFileContext(lastPart,attrName);
  if(canEncrypt(baseName,ext,inferredExt)){
    const newBase=encryptName(baseName,config.export.encrypt.key);
    parts.push(hasExplicitExt ? `${newBase}${ext}` : newBase);
  }
  else{
    parts.push(lastPart);
  }
  return `${parts.join('/')}${query}${hash}`;
}

// ==========================================
// 核心处理器：HTML 压缩与路径替换
// ==========================================
function processHtmlContent(htmlCode){
  const {
    minify,
    encrypt
  }=config.export;
  const attrs=encrypt.htmlAttributes || [];
  // 1. 路径加密逻辑 (保持不变)
  if(attrs.length>0){
    const regex=new RegExp(`\\b(${attrs.join('|')})=["']([^"']+)["']`,'gi');
    htmlCode=htmlCode.replace(regex,(match,attr,urls)=>{
      const urlArr=urls.split(',').map(u=>u.trim());
      const newUrlArr=urlArr.map(url=>{
        if(!url) return url;
        if(/^(https?:|\/\/|data:|#)/i.test(url)) return url;
        return getEncryptedPath(url,attr);
      });
      return `${attr}="${newUrlArr.join(',')}"`;
    });
  }
  // 2. 智能 HTML 压缩逻辑 (新增保护机制)
  if(minify.type.includes('html')){
    const protectedBlocks=[];
    // 第一步：将敏感标签（pre, textarea, script, style）提取并替换为唯一占位符
    // [\s\S]*? 确保能够跨行匹配
    htmlCode=htmlCode.replace(/<(pre|textarea|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,(match)=>{
      protectedBlocks.push(match);
      return `___PROTECT_BLOCK_${protectedBlocks.length-1}___`;
    });
    // 第二步：执行常规的、残暴的 HTML 空格压缩
    htmlCode=htmlCode.replace(/<!--(?!\[if\s).*?-->/gs,'') // 移除注释
    .replace(/>\s+</g,'><')               // 移除标签之间的空白
    .replace(/\s{2,}/g,' ');              // 将多个空白字符（含换行）合并为一个空格
    // 第三步：将保护的代码块原封不动地还原回去
    htmlCode=htmlCode.replace(/___PROTECT_BLOCK_(\d+)___/g,(match,index)=>{
      return protectedBlocks[index];
    });
  }
  return htmlCode;
}

function createEncryptPlugin(secretKey,targetKeys=[],ignoreFileNames=[],htmlAttributes=[]){
  return function({types:t}){
    function processStringElement(elementPath,keyName=''){
      // 1. 防御重入：如果已经被处理过，直接终止
      if(!elementPath.isStringLiteral() || elementPath.node._encrypted) return;
      const originalStr=elementPath.node.value;
      if(ignoreFileNames.includes(originalStr)) return;
      const urlArr=originalStr.split(',').map(u=>u.trim());
      const newUrlArr=urlArr.map(url=>{
        if(!url) return url;
        // 跳过外部链接和特殊协议
        if(/^(https?:|\/\/|data:|#)/i.test(url)) return url;
        const parts=url.split('/');
        const lastPart=parts.pop();
        if(lastPart){
          const {
            baseName,
            ext,
            hasExplicitExt,
            inferredExt
          }=parseFileContext(lastPart,keyName);
          if(canEncrypt(baseName,ext,inferredExt)){
            const newBase=encryptName(baseName,secretKey);
            parts.push(hasExplicitExt ? `${newBase}${ext}` : newBase);
          }
          else{
            parts.push(lastPart);
          }
        }
        else{
          parts.push(lastPart);
        }
        return parts.join('/');
      });
      const newStr=newUrlArr.join(',');
      // 2. 状态更新与绝对锁定
      if(newStr!==originalStr){
        const newNode=t.stringLiteral(newStr);
        newNode._encrypted=true; // 打上自定义属性标记
        elementPath.replaceWith(newNode);
        elementPath.skip(); // 终极防御：命令 Babel 停止遍历此新替换的节点及其子节点
      }
      else{
        // 即使没有发生变化，也打上标记，防止其他监听器重复检查浪费性能
        elementPath.node._encrypted=true;
      }
    }
    
    function processValue(valuePath,keyName){
      if(valuePath.isArrayExpression()) valuePath.get('elements').forEach(element=>processStringElement(element,keyName));
      else if(valuePath.isStringLiteral()) processStringElement(valuePath,keyName);
    }
    
    return {
      visitor:{
        // === 1. 新增: 捕捉 const dataFile = "../inc/footer.html" ===
        VariableDeclarator(path){
          const id=path.get('id');
          if(id.isIdentifier() && targetKeys.includes(id.node.name)){
            if(path.node.init) processValue(path.get('init'),id.node.name);
          }
        },
        // === 2. 原有: 捕捉 file = { dataFile: "..." } ===
        ObjectProperty(path){
          const keyName=path.node.key.name || path.node.key.value;
          if(targetKeys.includes(keyName)) processValue(path.get('value'),keyName);
        },
        // === 3. 原有: 捕捉 file.dataFile = "..." ===
        AssignmentExpression(path){
          const left=path.get('left');
          if(left.isMemberExpression()){
            const keyName=left.node.property.name || left.node.property.value;
            if(targetKeys.includes(keyName)) processValue(path.get('right'),keyName);
          }
        },
        // === 4. 原有: 捕捉 element.setAttribute('data-file', "...") ===
        CallExpression(path){
          const callee=path.node.callee;
          if(callee.type==='MemberExpression' && callee.property.name==='setAttribute'){
            const args=path.get('arguments');
            if(args.length>=2 && args[0].isStringLiteral()){
              const attrName=args[0].node.value;
              if(htmlAttributes.includes(attrName) || targetKeys.includes(attrName)) processValue(args[1],attrName);
            }
          }
        },
        // === 5. 神级强化: 智能捕捉 initElement("../inc/footer.html") ===
        StringLiteral(path){
          const val=path.node.value;
          // 如果字符串长得像个路径 (包含 / 并且以 .html/htm/js/css 结尾)
          if(/\.(html|htm|js|css)([\?#].*)?$/i.test(val) && val.includes('/')){
            processStringElement(path,'autoDetect');
          }
        }
      }
    };
  };
}

const htmlToJsCssPath=function(_sourcePath){
  const {
    jsCssDir,
    htmlDir
  }=config.export.minify;
  let relPath=_sourcePath.replace(config.root+htmlDir,"");
  let fileExt=path.extname(relPath);
  let samePath=relPath.replace(fileExt,"");
  let jsPath,cssPath;
  if(config.export.minify.buildJsCss===2){
    jsPath=config.root+jsCssDir+'js/'+samePath+".js";
    cssPath=config.root+jsCssDir+'css/'+samePath+".css";
  }
  else{
    jsPath=config.root+jsCssDir+(samePath.includes("/") ? samePath.replace(/^(.*)(\/)(.*)$/,"$1$2js/$3") : 'js/'+samePath)+".js";
    cssPath=config.root+jsCssDir+(samePath.includes("/") ? samePath.replace(/^(.*)(\/)(.*)$/,"$1$2css/$3") : 'css/'+samePath)+".css";
  }
  return {
    "jsPath":jsPath,
    "cssPath":cssPath
  };
};
const processBuildFile=async(_sourcePath,_targetPath,_event)=>{
  const targetDir=getFileDir(_targetPath);
  const fileExt=path.extname(_sourcePath).toLowerCase();
  const event=_event || "write";
  const {
    minify,
    encrypt
  }=config.export;
  try{
    ensureDirSync(targetDir);
    const typeKey=fileExt.slice(1);
    const normalizedType=typeKey==='htm' ? 'html' : typeKey;
    if(!['.js','.css','.html','.htm'].includes(fileExt) || !minify.type.includes(normalizedType)){
      fs.copyFileSync(_sourcePath,_targetPath);
      message(_targetPath,event,"succeeded","[Copied]");
      return;
    }
    let code=fs.readFileSync(_sourcePath,'utf-8').trim();
    const fileName=path.basename(_sourcePath);
    let skipMinify=false;
    if(minify.ignore instanceof RegExp) skipMinify=minify.ignore.test(fileName);
    else if(Array.isArray(minify.ignore)) skipMinify=minify.ignore.includes(fileName);
    if(fileExt===".js"){
      if(minify.useStrict===false) code=code.replace(/(["'])use strict\1;?\s*/g,'');
      else if(!skipMinify && !/(["'])use strict\1/.test(code)) code='"use strict";\n'+code;
      let requiresBabel=minify.isBabel;
      let requiresEncryptPlugin=false;
      // 辅助函数：转义正则特殊字符（建议放在文件顶部的工具函数区）
      const escapeRegExp=(str)=>str.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      if(encrypt.enable){
        if(requiresBabel){
          requiresEncryptPlugin=true;
        }
        else{
          // 1. 提取所有需要嗅探的关键词
          const sniffKeys=[...(encrypt.jsKeys || []),...(encrypt.htmlAttributes || [])];
          // 2. 将数组编译为单条正则表达式 (例如: /baseCss|baseJs|subJs|dataCss|dataJs|dataFile/)
          let hasKeyMatch=false;
          if(sniffKeys.length>0){
            const pattern=sniffKeys.map(escapeRegExp).join('|');
            const keyRegex=new RegExp(pattern);
            // 一次扫描，匹配任意关键词
            hasKeyMatch=keyRegex.test(code);
          }
          // 3. 智能路径探测 (寻找类似 "../inc/footer.html" 的字面量)
          const hasPathMatch=/(['"])[^'"]+\.(html|htm|js|css)([\?#][^'"]*)?\1/i.test(code);
          // 满足任意一种嗅探，即唤醒 Babel 加密插件
          requiresEncryptPlugin=hasKeyMatch || hasPathMatch;
          requiresBabel=requiresEncryptPlugin;
        }
      }
      if(requiresBabel){
        const presets=minify.isBabel ? [['@babel/preset-env',{targets:"defaults"}]] : [];
        const plugins=[];
        if(requiresEncryptPlugin){
          plugins.push(createEncryptPlugin(encrypt.key,encrypt.jsKeys || [],encrypt.ignoreFileNames || [],encrypt.htmlAttributes || []));
        }
        const result=babel.transformSync(code,{
          presets,
          plugins,
          filename:_sourcePath,
          compact:skipMinify ? true : 'auto'
        });
        code=result.code;
      }
      if(!skipMinify){
        const minified=await minifyCode(code,{ecma:2020});
        if(!minified || typeof minified.code==='undefined') throw new Error(`Empty JS result`);
        code=minified.code;
      }
      fs.writeFileSync(_targetPath,code,'utf-8');
      message(_targetPath,event,"succeeded");
    }
    else if(fileExt===".css"){
      if(!skipMinify){
        const minified=minifyCssInstance.minify(code);
        if(minified.errors.length>0) throw new Error(minified.errors[0]);
        code=minified.styles;
      }
      fs.writeFileSync(_targetPath,code,'utf-8');
      message(_targetPath,event,"succeeded");
    }
    else if(fileExt===".html" || fileExt===".htm"){
      code=processHtmlContent(code);
      fs.writeFileSync(_targetPath,code,'utf-8');
      message(_targetPath,event,"succeeded");
    }
  }
  catch(err){
    console.error(`\x1b[91mError processing ${_sourcePath}:\x1b[0m`,err.message);
    message(_targetPath,event,"failed");
  }
};
const thisWatch=function(_dir){
  watch.watchTree(_dir,async function(_filePath,_curr,_prev){
    if(!_filePath || typeof _filePath!=='string') return;
    if(_curr && _prev && _curr.mtimeMs===_prev.mtimeMs) return;
    const sourcePath=path.resolve(_filePath).replace(/\\/g,'/');
    const fileExt=path.extname(sourcePath);
    const {minify}=config.export;
    if(sourcePath.startsWith(config.exportRoot)) return;
    const isHtml=/^\.(htm|html)$/.test(fileExt);
    if(isHtml && sourcePath.includes(minify.htmlDir)){
      const buildMode=minify.buildJsCss;
      if([1,2].includes(buildMode)){
        const linkedPaths=htmlToJsCssPath(sourcePath);
        if(_curr && _curr.nlink===0){
          deleteThis(linkedPaths.jsPath);
          deleteThis(linkedPaths.cssPath);
        }
        else if(_prev===null){
          const createdList=[];
          ensureDirSync(getFileDir(linkedPaths.jsPath));
          if(!fs.existsSync(linkedPaths.jsPath)){
            fs.writeFileSync(linkedPaths.jsPath,'','utf-8');
            createdList.push(linkedPaths.jsPath);
          }
          ensureDirSync(getFileDir(linkedPaths.cssPath));
          if(!fs.existsSync(linkedPaths.cssPath)){
            fs.writeFileSync(linkedPaths.cssPath,'','utf-8');
            createdList.push(linkedPaths.cssPath);
          }
          if(createdList.length>0){
            const displayFiles=createdList.map((p,index)=>`${index===createdList.length-1 ? '└─' : '├─'} ${p}`).join('\n ');
            message(sourcePath,"auto-link","succeeded",`自动同步生成关联源文件:\n ${displayFiles}`);
          }
        }
      }
    }
    if(!minify.realtime) return;
    const thisMiniPath=getMinPath(sourcePath);
    if(_curr && _curr.nlink===0){
      deleteThis(thisMiniPath);
      return;
    }
    await processBuildFile(sourcePath,thisMiniPath,_prev===null ? "create" : "minify");
  });
};
export default {
  watch:thisWatch,
  miniFyCssJs:processBuildFile,
  getMinPath:getMinPath,
  ensureDirSync:ensureDirSync,
  getFileDir:getFileDir
};
