🚀 local-site
local-site 是一个轻量、极速且功能强大的本地 Web 站点服务工具。它不仅仅是一个静态服务器，更是一个集成了实时代理、代码压缩编译、双层路径加密防盗、以及自动化资源管理的前端构建工作流引擎。

无论你是想快速启动一个本地测试服务，还是需要一套强大的工具来保护和打包你的前端产物，local-site 都能开箱即用。<br>
✨ 核心特性<br>
⚡ 极速本地服务：支持 HTTP/HTTPS 双协议无缝切换，支持多级虚拟根目录映射。<br>
🔄 实时镜像构建：监听源码改动，实时压缩 HTML/CSS/JS 代码并同步到指定的输出目录。<br>
🛡️ 军工级双层加密：支持物理文件加密与代码内引用加密（AST 深度解析），无死角保护你的核心资产，且完全不破坏浏览器识别。<br>
🤖 自动化资源关联：新建 HTML 页面时，自动为你生成并关联同名或同路径的 JS 和 CSS 文件。<br>
🔌 无缝 API 代理：轻松解决本地开发时的跨域问题，支持目标路径重写。<br>
&nbsp;
##### 📦 安装<br>
注意： 如果你要升级已有的 local-site，请务必先备份项目中的 lib/config.js 配置文件。<br>
方法一，NPM方式 (推荐)：
```Bash
npm i local-site
```
方法二，github克隆方式 :<br>
```Bash
git clone https://github.com/baiyukey/local-site.git
```
&nbsp;
##### 🕹️ 快速启动<br>
如果采用了NPM安装方式，local-site在node_modules下，<br>
如果采用了项目克隆安装方式，node_modules在local-site目录下,<br>
不论何种方式，都不影响程序运行启动，需要注意的是在不同的目录下命令稍有不同。<br>

或者，在node_modules目录下执行:
```Bash
# 启动 Web 服务及实时监听
node . -serve

# 仅执行一次全量压缩构建 (不启动实时监听)
npm run minify
# 或者
node . -minify
```

##### ★ 如果你全局或局部安装了模块，也可以在代码中作为实例方法启动：
```javascript
let localSite=require("local-site");
localSite.run();
```

##### ★ local-site启动成功信息:
```Bash
    ========================================================
    � local-site HTTP Server is running!
    � Code link: https://github.com/baiyukey/local-site.git
    ========================================================
    
    � [Parallel Output Engine Activated]
       - IP/Localhost (Source)  -> d:/www/uielf.com/version01/
       - Custom Domain (Export) -> d:/www/uielf.com/version01.min/
       - Realtime Watcher: ON
    
    � Welcome Pages:
       - HTTP : http://127.0.0.1:621/index.html
       - HTTPS: https://127.0.0.1:443/index.html
    
    Press Ctrl+C to stop local-site.

```

&nbsp;
##### ⚙️ 核心配置详解 (config.js)<br>
local-site 的强大之处在于其高度可定制的配置文件。以下是最新版 config.js 的完整结构及注释说明：
```javascript
    const root = "d:/www/local-site/test/webFile/"; // 源码所在的项目根目录
    
    export default {
      // ==========================================
      // 1. 基础服务配置
      // ==========================================
      hostname: 'localhost',       // 主机名，也可设置为本机 IP
      port: 621,                   // HTTP 协议服务端口
      defaultPage: ['index.html'], // 默认欢迎页
      
      https: {
        enable: true,              // 是否开启 HTTPS 服务
        port: 1978,                // HTTPS 协议端口号
        key: './ssl/privatekey.pem', // 自动生成或手动指定的私钥路径
        cert: './ssl/certificate.pem'// 自动生成或手动指定的公钥路径
      },
      
      // ==========================================
      // 2. 目录与路由配置
      // ==========================================
      root: root,
      exportRoot: `${root}dist/`,  // 编译与加密后的最终输出目录 (站点实际运行加载的物理根目录)
      virtualRoot: [`${root}html/`], // 虚拟根目录：可以直接通过 "/" 访问该数组中定义的物理路径层级
      apiDir: './api/',            // 本地私有 API 目录
      
      // ==========================================
      // 3. 代理服务器配置 (解决跨域)
      // ==========================================
      apiProxy: {
        watchUrl: "/api/",         // 拦截前缀：当请求 URL 包含此路径时，触发代理转发
        target: 'http://8.8.8.8:8888', // 目标代理服务器地址
        logShow: false             // 是否在控制台打印代理请求日志
      },
      
      // ==========================================
      // 4. 构建与加密引擎配置 (核心)
      // ==========================================
      export: {
        // --- 压缩与构建逻辑 ---
        minify: {
          type: ['js', 'css', 'html'], // 允许进行压缩处理的文件扩展名白名单
          ignore: /\.min\.(js|css)$/,  // 忽略压缩的文件匹配规则 (正则或字符串数组)
          isBabel: true,               // 是否开启 Babel 转换 (ES6+ 转 ES5)
          useStrict: false,            // JS 代码是否强制注入或保留 'use strict'
          realtime: true,              // 是否开启实时监听编译
          autoAssetsIn: "."            // 自动资源关联模式：
                                       // - "." : 在 HTML 同级目录自动生成 js/css 文件夹及同名文件
                                       // - "/media": 在指定的 media 目录内按 HTML 层级生成同名文件
                                       // - "": 关闭此功能
        },
        
        // --- 双层防盗加密逻辑 ---
        encrypt: {
          enable: true,                // 是否开启文件路径与名称加密
          key: "my_super_secret_key",  // 加密密钥 (更改此密钥将改变所有加密后的文件名)
          type: ['js', 'css', 'png'],  // 允许被加密的真实文件扩展名 (在此列表外的文件将被原样保留)
          ignoreFileNames: ['jquery.min', 'core'], // 全局豁免名单：包含这些词的文件名绝对不被加密
          
          // 深度引用追踪：告诉引擎在哪里寻找需要替换的路径
          htmlAttributes: ['data-file', 'data-custom-url'], // 额外监控的 HTML 自定义属性 (标准属性如 src, href 会自动监控)
          jsKeys: ['baseJs', 'themeUrl', 'elf.alertInfo']   // 监控 JS 中的特定变量名、对象键或方法参数
        }
      }
    };
```
&nbsp;
##### 🛡️ 深入理解：构建与双层加密引擎

local-site 拥有极其独特且强大的产物保护机制。开启 export.encrypt.enable 后，引擎将执行物理层与引用层的双重加密，确保你的项目既能被浏览器正常运行，又极难被他人直接盗用。
<br>
1. 物理加密 (输出落盘)<br>
   当源码从 root 目录向 exportRoot 构建时，系统会校验文件的扩展名是否在 encrypt.type 中。如果是，该文件在落盘时会被 HMAC-SHA256 算法重命名（例如 app.js 变成 8aff55350d10e0cb.js）。扩展名会被严格保留，确保 MIME 类型不受影响。
   
2. 引用加密 (AST 深度探针)<br>
    仅仅改了物理文件名是不够的，代码里的引用路径也会断掉。local-site 提供了极度智能的文本与 AST 解析能力：
   
   ① HTML & CSS 嗅探：全面接管 HTML 中的 src, href 等标准路径，以及 CSS 中的 url() 和 @import，自动将其中的路径与物理加密后的哈希值对齐。
   
   ②JS 深度追踪 (jsKeys)：对于 JavaScript，系统启用了 Babel AST 语法树遍历。你可以通过配置 jsKeys: ['myVar']，精准告诉引擎：“如果发现 const myVar = "libs/myCode"，请顺藤摸瓜将里面的字符串替换为加密后的路径”。系统甚至能智能识别包含真实扩展名（如 .png）的独立字符串并自动转换。

    ③智能防误伤：你可以通过 encrypt.ignoreFileNames 设置白名单，防止第三方库（如 jquery.min.js）被错误加密，保证系统的绝对稳定。<br>

✨ 深入理解：自动资源关联 (Auto-Assets)

前端开发中，新建页面的高频痛点是需要反复手动创建对应的 .js 和 .css 文件。local-site 提供了 autoAssetsIn 功能：<br>
    当你配置 autoAssetsIn: "."，并在监听目录中新建 about.html 时，引擎会静默为你创建：<br>
    ./js/about.js<br>
    ./css/about.css<br>
    当你删除 about.html 时，关联的空资源文件也会被联动清理。让开发者彻底聚焦于代码本身。
