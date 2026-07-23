/**
 * local-site 独立构建脚本
 * 用于手动将整个源项目深度克隆并编译至物理输出目录 (exportRoot)
 */
import config from './config.js';
import watchSite from './watchSite.js';
import fs from 'fs';
import path from 'path';

async function run(){
  console.clear();
  console.log("\x1b[2J"+"local-site minify is ready..."+" \ncode link:\nhttps://github.com/baiyukey/local-site.git\n");
  // === 新增：构建前强力清空历史输出目录 ===
  if(fs.existsSync(config.exportRoot)){
    fs.rmSync(config.exportRoot,{
      recursive:true,
      force:true
    });
    console.log(`\x1b[32m🧹 [Clean Build] 成功清空历史构建产物: ${config.exportRoot}\x1b[0m\n`);
  }
  console.log(`\x1b[36m[全量构建] 正在扫描: ${config.root}\x1b[0m`);
  console.log(`\x1b[36m[目标目录] 镜像输出: ${config.exportRoot}\x1b[0m\n`);
  let processCount=0;
  let copyCount=0;
  const walkDir=async(dir)=>{
    if(!fs.existsSync(dir)) return;
    const files=fs.readdirSync(dir);
    for(const file of files){
      const filePath=path.join(dir,file).replace(/\\/g,'/');
      // 跳过输出目录(防止死循环嵌套扫描)、版本控制以及依赖文件夹
      if(filePath.startsWith(config.exportRoot) || file==='.git' || file==='node_modules'){
        continue;
      }
      const stats=fs.statSync(filePath);
      if(stats.isDirectory()){
        await walkDir(filePath);
      }
      else if(stats.isFile()){
        const fileExt=path.extname(filePath).toLowerCase();
        const typeKey=fileExt.slice(1)==='htm' ? 'html' : fileExt.slice(1);
        const targetPath=watchSite.getMinPath(filePath);
        // 处理配置名单中的压缩资源
        if(config.export.minify.type.includes(typeKey)){
          await watchSite.miniFyCssJs(filePath,targetPath,"minify");
          processCount++;
        }
        // 否则原样物理克隆 (如：图片，音视频等)
        else{
          watchSite.ensureDirSync(watchSite.getFileDir(targetPath));
          fs.copyFileSync(filePath,targetPath);
          copyCount++;
        }
      }
    }
  };
  try{
    await walkDir(config.root);
    console.log(`\n\x1b[32m✅ 全量构建执行完毕！\x1b[0m`);
    console.log(`   - 编译加密文件数: ${processCount}`);
    console.log(`   - 原样拷贝资源数: ${copyCount}`);
    console.log("\npress ctrl+c to stop local-site.");
  }
  catch(error){
    console.error("\x1b[91m全局构建过程中出现错误:\x1b[0m",error);
  }
}

export default {run};
