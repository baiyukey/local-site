import localSite from "./lib/index.js"
import minifyProject from "./lib/minifyProject.js"

let _arguments=process.argv.slice(2);
if(_arguments.length===0) console.log("您可选择的参数有：-service | -minify");
else if (_arguments[0]==="-service") localSite.run();//启动local-site服务
else if(_arguments[0]==="-minify") minifyProject.run();//整个项目强制minify
