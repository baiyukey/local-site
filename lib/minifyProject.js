/**
 * Created by baiyu on 2020/03/28.
 */
function run(){
  let config=require('./config');
  let watchSite=require('./watchSite');
  watchSite.watch(config.root);//uglifyCssJs检测到目录中的文件发生改变时触发
  console.clear();
  console.log("\033[2J"+"local-site minify is ready..."+" \ncode link:\nhttps://github.com/baiyukey/local-site.git\n"+"\n"+config.uglifyJsCss.watchDir+"下的css/、js/目录即将执行自动压缩混淆功能（处理css文档需要安装JAVA，如已安装请忽略。https://www.java.com/）。"+"\npress ctrl+c to stop local-site.");
}

exports.run=run;