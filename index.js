let localSite=require("./lib/index.js");//local-site不在node_module中时
let minifyProject=require("./lib/minifyProject.js");
let arguments=process.argv.slice(2);
if(arguments.length===0) console.log("您可选择的参数有：-service | -minify");
else if (arguments[0]==="-service") localSite.run();
else if(arguments[0]==="-minify") minifyProject.run();