/**
 * local-site 全局配置文件
 * ===================================================================
 * 架构说明：
 * 本系统采用“源代码 (Source)”与“输出代码 (Export)”平行的物理隔离双目录方案。
 * - 源目录（root）：存放可编辑的开发源码，通过 IP / localhost 访问。
 * ===================================================================
 */
// ===================================================================
// 1. 基础路径配置 (Basic Paths)
// ===================================================================
/** 项目源文件根目录 (开发区) */
const root="d:/www/uielf.com/version01/";
/** 自动计算平行的线上输出目录 (无需手动修改) */
const rootTrimmed=root.endsWith('/') ? root.slice(0,-1) : root;
// ===================================================================
// 2. 核心配置导出 (Main Config)
// ===================================================================
export default {
  // -----------------------------------------------------------------
  // 路径与目录设置
  // -----------------------------------------------------------------
  'root':root,
  //  输出目录（exportRoot）：存放编译/压缩/加密后的线上文件，通过绑定域名访问。
  //  输出目录的后缀标识 (例如 root 为 version01/，则 exportRoot 为 version01.min/)
  'exportRoot':`${rootTrimmed}.min/`,
  // -----------------------------------------------------------------
  // HTTP / HTTPS 服务器设置
  // -----------------------------------------------------------------
  'hostname':"127.0.0.1",
  'port':621,
  /**
   * 虚拟根目录映射 (virtualRoot)
   * - 设为字符串或数组，例如 "/html" 或 ["/html", "/views"]，表示该目录下的 HTML 在浏览器中可脱离父级目录，直接作为根路径访问。
   * - 空值 ('', [], null) 表示不创建虚拟根目录。
   */
  'virtualRoot':"/html",
  /**
   * 默认首页文件名列表 (defaultPage)
   * - 当浏览器访问某个目录未指定具体 HTML 文件时，依次按数组顺序查找匹配的默认页面。
   */
  'defaultPage':["index.html","0338fd919e6d5479.html"],
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
     * 压缩与构建控制参数，minify 应用于文件内容
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
      /**
       * HTML 与 JS/CSS 的自动联动创建模式 (autoAssetsIn)
       * - '' / false : 关闭联动创建功能
       * - '.' : 模块化就近原则 (例: 新建 html/about/index.html -> 自动创建 html/about/js/index.js 和 html/about/css/index.css)
       * - '/media' : 集中统一管理原则 (例: 新建 html/about/index.html -> 自动创建 media/js/about/index.js 和 media/css/about/index.css)
       */
      'autoAssetsIn':'/media',
      /** 排除内容压缩的文件名规则 (例如包含 .min 的第三方库不需要二次压缩内容) */
      'ignore':/\.min\.(js|css)$/i
    },
    /**
     * 加密与混淆控制参数，仅对文件名加密，包括文件内容中的文件名
     */
    'encrypt':{
      /** 是否开启文件名与路径加密功能 */
      'enable':true,
      /** 参与加密处理的文件类型列表 */
      'type':['js','css','html','png','jpg'],
      /** 加密混淆的核心密钥 (HMAC-SHA256) */
      'key':'nameKey_2026@localSite',
      /** JS 代码中包含路径、需要被提取替换的变量/属性键名列表 */
      'jsKeys':["baseCss","baseJs","subJs","dataCss","dataJs","dataFile"],
      /** 豁免加密的文件名或关键词白名单 */
      'ignoreFileNames':["_css","_js","favicon","404","baidu_verify_OIjd74mynF","default","sitemap","robots"],
      /** HTML 标签中需要自动加密替换路径的属性名列表 */
      'htmlAttributes':['src','href','data-href','data-js','data-css','data-file']
    }
  }
};
