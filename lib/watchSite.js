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
// 全局常量定义
// ==========================================
/**
 * 常见的真实网络资源扩展名集合 (包含需加密的核心代码，以及可能需豁免或全面检测的静态资源)
 * 用于在字符串中区分“真实扩展名”和“伪扩展名(如 .min)”
 */
const COMMON_REAL_EXTS=[
  '.js','.css','.html','.htm',
  '.png','.jpg','.jpeg','.gif','.svg','.webp','.ico',
  '.mp3','.mp4','.webm','.woff','.woff2','.ttf','.eot',
  '.json','.xml','.txt','.pdf','.csv'
];
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
const escapeRegExp=(str)=>str.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

/**
 * 核心哈希算法：对文件名进行 HMAC-SHA256 加密并截取前16位
 * @param {string} name - 原始文件名(无扩展名)
 * @param {string} secretKey - config中的加密密钥
 * @returns {string} 16位哈希字符串
 */
function encryptName(name,secretKey){
  const hash=crypto.createHmac('sha256',secretKey).update(name).digest('hex');
  return hash.slice(0,16);
}

// 统一读取配置项，处理缺省值
const getMergedConfig=()=>{
  const exp=config.export || {};
  const min=exp.minify || {};
  return {
    autoAssetsIn:exp.autoAssetsIn ?? min.autoAssetsIn ?? '',
    virtualRoot:config.virtualRoot ?? exp.virtualRoot ?? min.virtualRoot ?? [],
    defaultPage:config.defaultPage ?? ["index.html"]
  };
};
// ==========================================
// 文件名与扩展名智能解析器
// ==========================================
/**
 * 极其干净的文件解析：区分真实扩展名与伪扩展名
 * @param {string} fileName - 需要解析的完整文件名或代码中的字符串短语
 * @returns {Object} 包含 baseName(纯文件名), ext(真实扩展名), hasExplicitExt(是否显式包含)
 */
function parseFileContext(fileName){
  let ext='',baseName=fileName,hasExplicitExt=false;
  const dotIdx=fileName.lastIndexOf('.');
  if(dotIdx>0){
    const tempExt=fileName.slice(dotIdx).toLowerCase();
    // 只有当后缀是常见真实扩展名时，才将其作为 ext 剥离。
    // 否则 (如 .min, .smooth) 统统视为 baseName 的一部分，防止丢失。
    if(COMMON_REAL_EXTS.includes(tempExt)){
      ext=fileName.slice(dotIdx);
      baseName=fileName.slice(0,dotIdx);
      hasExplicitExt=true;
    }
  }
  return {
    baseName,
    ext,
    hasExplicitExt
  };
}

// ==========================================
// 核心总控：加密合法性校验 (连接物理与引用)
// ==========================================
/**
 * 判断一个目标是否符合加密条件
 * @param {string} baseName - 剥离扩展名后的核心文件名
 * @param {string} ext - 真实扩展名 (带点)
 * @param {boolean} isTargeted - 标识是否为“引用加密(true)”或“物理加密(false)”
 * @param {string} contextKey - 触发扫描的上下文键名 (如 html属性名, js变量名)
 * @returns {boolean} 是否允许加密
 */
const canEncrypt=(baseName,ext,isTargeted=false,contextKey='')=>{
  const {
    encrypt,
    minify
  }=config.export;
  if(!encrypt.enable || !encrypt.key) return false;
  const allowedTypes=encrypt.type || minify.type || ['js','css','html'];
  if(ext){
    // Rule 1: 有扩展名时，严格比对 config 中配置的允许加密 type 列表
    const typeKey=ext.slice(1).toLowerCase();
    const normalizedType=typeKey==='htm' ? 'html' : typeKey;
    if(!allowedTypes.includes(normalizedType)) return false;
  }
  else{
    // Rule 2: 无扩展名时
    if(!isTargeted) return false; // 物理文件通常必有扩展名，此处防止误伤系统级无后缀文件
    // 🛡️ 路由保护：标准路径属性如果无扩展名（如 /about），视为目录，豁免加密，交由系统补全 defaultPage
    if(['href','src','data-href','action'].includes(contextKey)){
      return false;
    }
    // 其余情况 (如 jsKeys 中定义的特定变量)，即使无扩展名也强制放行加密
  }
  // 终极防误伤安全网：检测 config 中的白名单 ignoreFileNames
  const ignoreList=encrypt.ignoreFileNames || [];
  if(ignoreList.includes(baseName) || (ext && ignoreList.includes(`${baseName}${ext}`))) return false;
  return true;
};
// ==========================================
// 1. 物理加密逻辑 (输出文件落盘前)
// ==========================================
/**
 * 推算源文件在 exportRoot 中的最终物理输出路径
 * @param {string} _path - 原始物理源路径
 * @returns {string} 加密/转换后的目标物理路径
 */
const getMinPath=function(_path){
  let targetPath=_path.replace(config.root,config.exportRoot);
  const ext=path.extname(targetPath);
  const targetDir=path.dirname(targetPath);
  let baseName=path.basename(targetPath,ext);
  // 触发物理加密校验
  if(canEncrypt(baseName,ext,false)){
    baseName=encryptName(baseName,config.export.encrypt.key);
  }
  return path.join(targetDir,`${baseName}${ext}`).replace(/\\/g,'/');
};
// ==========================================
// 2. 引用加密逻辑 (替换文件内部的内容)
// ==========================================
/**
 * 对文件内容中提取出的具体 URL 路径进行加密替换
 * @param {string} originalPath - 原始 URL (包含可能存在的 ?query 或 #hash)
 * @param {string} attrName - 触发该路径替换的上下文属性名 (用于路由保护判定)
 * @returns {string} 替换后的 URL
 */
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
    hasExplicitExt
  }=parseFileContext(lastPart);
  // 触发引用加密校验
  if(canEncrypt(baseName,ext,true,attrName)){
    const newBase=encryptName(baseName,config.export.encrypt.key);
    // 将加密后的 hash 拼回原有扩展名
    parts.push(hasExplicitExt ? `${newBase}${ext}` : newBase);
  }
  else{
    parts.push(lastPart);
  }
  return `${parts.join('/')}${query}${hash}`;
}

/**
 * [HTML 处理器] 全面监测 + htmlAttributes 属性替换
 */
function processHtmlContent(htmlCode){
  const {
    minify,
    encrypt
  }=config.export;
  // 将用户自定义的 htmlAttributes 与 W3C 标准路径属性结合，实现 HTML 全面监测
  const standardAttrs=['src','href','action','poster','background','data-src'];
  const customAttrs=encrypt.htmlAttributes || [];
  const allTargetAttrs=[...new Set([...standardAttrs,...customAttrs])];
  if(allTargetAttrs.length>0){
    const regex=new RegExp(`\\b(${allTargetAttrs.join('|')})=["']([^"']+)["']`,'gi');
    htmlCode=htmlCode.replace(regex,(match,attr,urls)=>{
      // 兼容某些包含多个用逗号分隔 url 的特殊属性 (如 srcset)
      const urlArr=urls.split(',').map(u=>u.trim());
      const newUrlArr=urlArr.map(url=>{
        if(!url) return url;
        // 排除绝对路径、协议路径、Base64和锚点
        if(/^(https?:|\/\/|data:|#)/i.test(url)) return url;
        return getEncryptedPath(url,attr);
      });
      return `${attr}="${newUrlArr.join(',')}"`;
    });
  }
  // HTML 结构级压缩与保护
  if(minify.type.includes('html')){
    const protectedBlocks=[];
    htmlCode=htmlCode.replace(/<(pre|textarea|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,(match)=>{
      protectedBlocks.push(match);
      return `___PROTECT_BLOCK_${protectedBlocks.length-1}___`;
    });
    htmlCode=htmlCode.replace(/<!--(?!\[if\s).*?-->/gs,'').replace(/>\s+</g,'><').replace(/\s{2,}/g,' ');
    htmlCode=htmlCode.replace(/___PROTECT_BLOCK_(\d+)___/g,(match,index)=>{
      return protectedBlocks[index];
    });
  }
  return htmlCode;
}

/**
 * [CSS 处理器] 全面检测标准语法 url() 和 @import
 */
function processCssContent(cssCode){
  const {encrypt}=config.export;
  if(!encrypt.enable || !encrypt.key) return cssCode;
  // 匹配 background: url("path") 语法
  cssCode=cssCode.replace(/url\((['"]?)(.*?)\1\)/gi,(match,quote,url)=>{
    if(!url || /^(https?:|\/\/|data:|#)/i.test(url)) return match;
    return `url(${quote}${getEncryptedPath(url,'cssUrl')}${quote})`;
  });
  // 匹配 @import "path" 语法
  cssCode=cssCode.replace(/@import\s+(['"])(.*?)\1/gi,(match,quote,url)=>{
    if(!url || /^(https?:|\/\/|data:|#)/i.test(url)) return match;
    return `@import ${quote}${getEncryptedPath(url,'cssImport')}${quote}`;
  });
  return cssCode;
}

/**
 * [JS 处理器] Babel AST 语法树遍历插件
 * 实现: jsKeys定义 + htmlAttributes定义 + 字符串全面检测
 */
function createEncryptPlugin(secretKey,targetKeys=[],ignoreFileNames=[],htmlAttributes=[]){
  return function({types:t}){
    // 字符串节点核心替换函数
    function processStringElement(elementPath,keyName=''){
      if(!elementPath.isStringLiteral() || elementPath.node._encrypted) return;
      const originalStr=elementPath.node.value;
      if(ignoreFileNames.includes(originalStr)) return;
      const urlArr=originalStr.split(',').map(u=>u.trim());
      const newUrlArr=urlArr.map(url=>{
        if(!url) return url;
        if(/^(https?:|\/\/|data:|#)/i.test(url)) return url;
        const parts=url.split('/');
        const lastPart=parts.pop();
        if(lastPart){
          const {
            baseName,
            ext,
            hasExplicitExt
          }=parseFileContext(lastPart);
          if(canEncrypt(baseName,ext,true,keyName)){
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
      if(newStr!==originalStr){
        const newNode=t.stringLiteral(newStr);
        newNode._encrypted=true; // 标记节点已加密，防止无限死循环处理
        elementPath.replaceWith(newNode);
        elementPath.skip();
      }
      else{
        elementPath.node._encrypted=true;
      }
    }
    
    // 处理各种语法结构中的值 (数组或单个字符串)
    function processValue(valuePath,keyName){
      if(valuePath.isArrayExpression()){
        valuePath.get('elements').forEach(element=>processStringElement(element,keyName));
      }
      else if(valuePath.isStringLiteral()){
        processStringElement(valuePath,keyName);
      }
    }
    
    return {
      visitor:{
        // 捕获: const baseJs = "libs/..."
        VariableDeclarator(path){
          const id=path.get('id');
          if(id.isIdentifier() && targetKeys.includes(id.node.name)){
            if(path.node.init) processValue(path.get('init'),id.node.name);
          }
        },
        // 捕获 JSON/对象: { baseJs: "libs/..." }
        ObjectProperty(path){
          const keyName=path.node.key.name || path.node.key.value;
          if(targetKeys.includes(keyName)) processValue(path.get('value'),keyName);
        },
        // 捕获赋值: this.baseJs = "libs/..."
        AssignmentExpression(path){
          const left=path.get('left');
          if(left.isMemberExpression()){
            const keyName=left.node.property.name || left.node.property.value;
            if(targetKeys.includes(keyName)) processValue(path.get('right'),keyName);
          }
        },
        // 捕获动态设值: element.setAttribute('data-file', '...')
        CallExpression(path){
          const callee=path.node.callee;
          if(callee.type==='MemberExpression' && callee.property.name==='setAttribute'){
            const args=path.get('arguments');
            if(args.length>=2 && args[0].isStringLiteral()){
              const attrName=args[0].node.value;
              if(htmlAttributes.includes(attrName) || targetKeys.includes(attrName)){
                processValue(args[1],attrName);
              }
            }
          }
        },
        // [核心：JS 字符串全面检测] 嗅探任何包含 '/' 且以已知扩展名结尾的独立字符串
        StringLiteral(path){
          const val=path.node.value;
          // 动态生成正则，匹配 COMMON_REAL_EXTS 中定义的任何类型
          const extPattern=COMMON_REAL_EXTS.map(e=>e.slice(1)).join('|');
          const sniffRegex=new RegExp(`\\.(${extPattern})([\\?#].*)?$`,'i');
          if(sniffRegex.test(val) && val.includes('/')){
            processStringElement(path,'autoDetect');
          }
        }
      }
    };
  };
}

// ==========================================
// 虚拟根目录与自动资源关联算法
// ==========================================
const getVirtualPathInfo=(_sourcePath)=>{
  let relPath=_sourcePath.replace(config.root,"");
  if(relPath.startsWith("/")) relPath=relPath.slice(1);
  let {virtualRoot}=getMergedConfig();
  if(!virtualRoot) return relPath;
  const vRoots=Array.isArray(virtualRoot) ? virtualRoot : [virtualRoot];
  for(let vRoot of vRoots){
    if(typeof vRoot!=='string' || !vRoot) continue;
    let cleanVRoot=vRoot.startsWith("/") ? vRoot.slice(1) : vRoot;
    if(cleanVRoot && !cleanVRoot.endsWith("/")) cleanVRoot+="/";
    if(cleanVRoot && relPath.startsWith(cleanVRoot)){
      return relPath.slice(cleanVRoot.length);
    }
  }
  return relPath;
};
const htmlToJsCssPath=function(_sourcePath){
  const {autoAssetsIn}=getMergedConfig();
  if(!autoAssetsIn) return null;
  const fileExt=path.extname(_sourcePath);
  const baseName=path.basename(_sourcePath,fileExt);
  let jsPath,cssPath;
  if(autoAssetsIn==="."){
    const targetDir=getFileDir(_sourcePath);
    jsPath=path.join(targetDir,"js",`${baseName}.js`).replace(/\\/g,'/');
    cssPath=path.join(targetDir,"css",`${baseName}.css`).replace(/\\/g,'/');
  }
  else{
    const relativeHtmlPath=getVirtualPathInfo(_sourcePath);
    const relativeDir=getFileDir(relativeHtmlPath);
    let assetBase=autoAssetsIn.startsWith("/") ? autoAssetsIn.slice(1) : autoAssetsIn;
    jsPath=path.join(config.root,assetBase,"js",relativeDir,`${baseName}.js`).replace(/\\/g,'/');
    cssPath=path.join(config.root,assetBase,"css",relativeDir,`${baseName}.css`).replace(/\\/g,'/');
  }
  return {
    jsPath,
    cssPath
  };
};
// ==========================================
// 引擎主线程：文件处理与分发调度
// ==========================================
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
    // 如果不在压缩处理名单内，原样复制物理文件
    if(!['.js','.css','.html','.htm'].includes(fileExt) || !minify.type.includes(normalizedType)){
      fs.copyFileSync(_sourcePath,_targetPath);
      message(_targetPath,event,"succeeded","[Copied]");
      return;
    }
    let code=fs.readFileSync(_sourcePath,'utf-8').trim();
    const fileName=path.basename(_sourcePath);
    let skipMinify=false;
    // 判断内容是否跳过压缩 (如 .min.js)
    if(minify.ignore instanceof RegExp) skipMinify=minify.ignore.test(fileName);
    else if(Array.isArray(minify.ignore)) skipMinify=minify.ignore.includes(fileName);
    // --- JS 处理分支 ---
    if(fileExt===".js"){
      if(minify.useStrict===false) code=code.replace(/(["'])use strict\1;?\s*/g,'');
      else if(!skipMinify && !/(["'])use strict\1/.test(code)) code='"use strict";\n'+code;
      let requiresBabel=minify.isBabel;
      let requiresEncryptPlugin=false;
      if(encrypt.enable){
        if(requiresBabel){
          requiresEncryptPlugin=true;
        }
        else{
          // 轻量级嗅探，决定是否需要启动沉重的 Babel AST
          const sniffKeys=[...(encrypt.jsKeys || []),...(encrypt.htmlAttributes || [])];
          let hasKeyMatch=false;
          if(sniffKeys.length>0){
            const pattern=`(?:${sniffKeys.map(escapeRegExp).join('|')})`;
            hasKeyMatch=new RegExp(pattern).test(code);
          }
          const extPattern=COMMON_REAL_EXTS.map(e=>e.slice(1)).join('|');
          const hasPathMatch=new RegExp(`(['"])[^'"]+\\.(${extPattern})([\\?#][^'"]*)?\\1`,'i').test(code);
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
    // --- CSS 处理分支 ---
    else if(fileExt===".css"){
      // 触发 CSS 内部的全面引用加密检测
      code=processCssContent(code);
      if(!skipMinify){
        const minified=minifyCssInstance.minify(code);
        if(minified.errors.length>0) throw new Error(minified.errors[0]);
        code=minified.styles;
      }
      fs.writeFileSync(_targetPath,code,'utf-8');
      message(_targetPath,event,"succeeded");
    }
    // --- HTML 处理分支 ---
    else if(fileExt===".html" || fileExt===".htm"){
      // 触发 HTML 内部的全面引用加密检测与压缩
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
    const {autoAssetsIn}=getMergedConfig();
    if(isHtml){
      if(autoAssetsIn){
        const linkedPaths=htmlToJsCssPath(sourcePath);
        if(linkedPaths){
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
