/**
 * Created by baiyu on 2020/03/28.
 */
import config from './config.js'
import watchSite from './watchSite.js'
function run(){
  watchSite.watch(config.root);//uglifyCssJs检测到目录中的文件发生改变时触发
  console.clear();
  console.log("\x1b[2J"+"local-site minify is ready..."+" \ncode link:\nhttps://github.com/baiyukey/local-site.git\n"+"\n"+config.uglifyJsCss.watchDir+"下的css/、js/目录即将执行自动压缩混淆功能"+"\npress ctrl+c to stop local-site.");
}

export default run;
