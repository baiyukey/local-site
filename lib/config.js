/**
 * local-site 全局配置文件
 * ===================================================================
 * 架构说明：
 * 本系统采用“源代码 (Source)”与“输出代码 (Export)”平行的物理隔离双目录方案。
 * - 源目录（root）：存放可编辑的开发源码，通过 IP / localhost 访问。
 * - 输出目录（exportRoot）：存放编译/压缩/加密后的线上文件，通过绑定域名访问。
 * ===================================================================
 */
// ===================================================================
// 1. 基础路径配置 (Basic Paths)
// ===================================================================
/** 项目源文件根目录 (开发区) */
const root="d:/www/uielf.com/version01/";
/** 输出目录的后缀标识 (例如 root 为 version01/，则 exportRoot 为 version01.min/) */
const extendName=".min";
/** 自动计算平行的线上输出目录 (无需手动修改) */
const rootTrimmed=root.endsWith('/') ? root.slice(0,-1) : root;
const exportRoot=`${rootTrimmed}${extendName}/`;
/**
 * 虚拟根目录 (virtualRoot)
 * - 用于在 Web 根目录下叠加一层相对子目录。
 * - 留空 "" 时：HTTP 服务直接以 root 或 exportRoot 为 Web 根目录。
 * - 填写如 "html/" 时：HTTP 服务将以 root/html/ 或 exportRoot/html/ 为 Web 根目录。
 */
const virtualRoot="";
// ===================================================================
// 2. 核心配置导出 (Main Config)
// ===================================================================
export default {
  // -----------------------------------------------------------------
  // 路径与目录设置
  // -----------------------------------------------------------------
  'root':root,
  'exportRoot':exportRoot,
  'virtualRoot':virtualRoot,
  // -----------------------------------------------------------------
  // HTTP / HTTPS 服务器设置
  // -----------------------------------------------------------------
  'hostname':"127.0.0.1",
  'port':621,
  'homePage':"/index.html",
  'https':{
    'enable':true,
    'port':443,
    'key':"ssl/privatekey.pem",
    'cert':"ssl/certificate.pem"
  },
  // -----------------------------------------------------------------
  // API 接口代理设置
  // -----------------------------------------------------------------
  'apiProxy':{
    'logShow':true,
    'watchUrl':'/api/',
    'target':'http://127.0.0.1:8081'
  },
  // -----------------------------------------------------------------
  // 编译、加密与构建设置
  // -----------------------------------------------------------------
  'export':{
    /**
     * 压缩与构建控制参数，minify应用于文件内容
     */
    'minify':{
      /**
       * 实时编译开关 (realtime)
       * - true : 保存源文件时，实时编译/复制到输出目录 (exportRoot)
       * - false: 暂停实时编译，但【不影响】新建 HTML 时 JS/CSS 的自动联动创建
       */
      'realtime':true,
      /** 参与压缩/处理的文件类型列表 */
      'type':['js','css','html'],
      /** 是否开启 Babel 语法转换 (将 ES6+ 转为 ES5) */
      'isBabel':false,
      /** 是否强制为 JS 文件注入/移除 "use strict" */
      'useStrict':false,
      /** 用于“HTML 联动创建”路径推算的相对目录：媒体/静态资源目录 */
      'jsCssDir':'media/',
      /** 用于“HTML 联动创建”路径推算的相对目录：HTML 页面目录 */
      'htmlDir':'html/',
      /**
       * HTML 与 JS/CSS 的自动联动创建模式 (buildJsCss)
       * - 0 / false : 关闭联动创建功能
       * - 1 : 模块化就近原则 (例: 新建 html/about/index.html -> 自动创建 media/about/js/index.js)
       * - 2 : 集中统一管理原则 (例: 新建 html/about/index.html -> 自动创建 media/js/about/index.js)
       */
      'buildJsCss':2,
      /** 排除内容压缩的文件名规则 (例如包含 .min 的第三方库不需要二次压缩内容) */
      'ignore':/\.min\.(js|css)$/i
    },
    /**
     * 加密与混淆控制参数，仅对文件名加密，包括文件内容中的文件名
     */
    'encrypt':{
      /** 是否开启文件名与路径加密功能 */
      'enable':true,
      /** 加密混淆的核心密钥 (HMAC-SHA256) */
      'key':'nameKey_2026@localSite',
      /** JS 代码中包含路径、需要被提取替换的变量/属性键名列表 */
      'jsKeys':["baseCss","baseJs","subJs","dataCss","dataJs","dataFile"],
      /** 豁免加密的文件名或关键词白名单 */
      'ignoreFileNames':["_css","_js","index","favicon","404","baidu_verify_OIjd74mynF","default","sitemap","robots"],
      /** HTML 标签中需要自动加密替换路径的属性名列表 */
      'htmlAttributes':['src','href','data-href','data-js','data-css','data-file']
    }
  }
};
