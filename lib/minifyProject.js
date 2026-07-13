/**
 * Created by baiyu on 2020/03/28.
 * Modified to support full project one-click minification.
 */
import config from './config.js';
import watchSite from './watchSite.js';
import fs from 'fs';
import path from 'path';

async function run(){
  console.clear();
  console.log("\x1b[2J"+"local-site minify is ready..."+" \ncode link:\nhttps://github.com/baiyukey/local-site.git\n");
  console.log(`正在全量扫描并压缩源目录下的 CSS/JS 文件...\n`);
  // 获取统一格式的绝对路径
  const jsCssSourceDir=path.resolve(config.jsCss.sourceDir).replace(/\\/g,'/')+'/';
  const jsCssExtReg=/^\.(js|css)$/;
  let processCount=0;
  // 递归遍历文件目录
  const walkDir=async(dir)=>{
    if(!fs.existsSync(dir)){
      console.log(`\x1b[91m[警告] 目录不存在: ${dir}\x1b[0m`);
      return;
    }
    const files=fs.readdirSync(dir);
    for(const file of files){
      const filePath=path.join(dir,file).replace(/\\/g,'/');
      const stats=fs.statSync(filePath);
      if(stats.isDirectory()){
        // 如果是文件夹，继续向下递归
        await walkDir(filePath);
      }
      else if(stats.isFile()){
        const fileExt=path.extname(filePath);
        // 匹配 js 和 css，并且排除名字里已经带有 .min 的文件，防止二次压缩或覆盖
        if(jsCssExtReg.test(fileExt) && !filePath.includes(`min${fileExt}`)){
          // 通过 watchSite 暴露的方法获取对应的目标路径
          const targetPath=watchSite.getMinPath(filePath);
          // 调用核心压缩逻辑 (使用 await 防止大项目同时写入过多导致内存溢出)
          await watchSite.miniFyCssJs(filePath,targetPath,"minify");
          processCount++;
        }
      }
    }
  };
  try{
    await walkDir(jsCssSourceDir);
    console.log(`\n\x1b[32m主动压缩指令执行完毕，共成功处理了 ${processCount} 个文件。\x1b[0m`);
    console.log("press ctrl+c to stop local-site.");
  }
  catch(error){
    console.error("\x1b[91m全局压缩过程中出现错误:\x1b[0m",error);
  }
}

export default {run};
