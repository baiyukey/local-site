import localSite from "./lib/index.js";
import minifyProject from "./lib/minifyProject.js";

let _arguments=process.argv.slice(2);
// 修复：将提示信息中的 -service 修正为 -serve，保持与下方逻辑一致
if(_arguments.length===0) console.log("您可选择的参数有：-serve | -minify");
else if(_arguments[0]==="-serve") localSite.run(); // 启动 local-site 服务
else if(_arguments[0]==="-minify") minifyProject.run(); // 整个项目强制 minify
