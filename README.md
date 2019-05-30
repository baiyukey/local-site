# local-site<br>
创建一个本地web站点服务（create a new local Web site）
##### NPM install 安装命令
npm i local-site<br><br>
##### 配置文件(lib/config.js):
module.exports={<br>
  'hostname':'localhost',//主机名<br>
    'port':999,//http协议服务端口<br>
    'https':{//https相关配置<br>
      'enable':true,//是否开启https服务<br>
      'port':9999,//https协议服务端口号<br>
      'key':'./ssl/privatekey.pem',//https协议服务需要的私有证书<br>
      'cert':'./ssl/certificate.pem',//https协议服务需要的公有证书<br>
    },//https相关配置<br>
    'mediaDir':'../../qssystem/',//根目录,用于存放js,css目录<br>
    'templateDir':'../../qssystem/template/',//根目录,用于存放html文件<br>
    'apiDir':'./api/',//后台程序,api接口目录<br>
    'apiTarget':'http:\/\/10.10.10.34:8888',\/\/Create an HTTP proxy server with an HTTP target<br>
    /\*'apiTarget':{//Create an HTTP proxy server with an HTTPS target<br>
     protocol: 'https:',<br>
     host: 'my-domain-name',<br>
     port: 443,<br>
     pfx: fs.readFileSync('path/to/certificate.p12'),<br>
     passphrase: 'password',<br>
     },\*/<br>
    'apiLogShow':false<br>
  }<br><br>
##### 启动web服务命令:
let service=require("local-site");<br>
service.run();<br>
