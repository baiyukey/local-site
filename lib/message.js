import path from "path";

let o=new Intl.DateTimeFormat("zh-CN",{
  hour12:false,
  timeStyle:"short",
  dateStyle:"short"
});
/**
 * 用于处理文件后返回的信息
 * @param {string} [_target] -文件路径
 * @param {string} [_event] -事件 例如"minify"或者"delete"等等
 * @param {string} [_resolve] -结果，例如"success"或者"fail"
 * @param {string} [_more] -附加信息
 */
let message=(_target,_event,_resolve,_more)=>{
  // 替换废弃的 substr 为 slice
  let thisFileExt=path.extname(_target).slice(1);
  let resolve=_resolve || "succeeded";
  console.log(
    (resolve==='succeeded' ? '\x1b[0m' : '\x1b[91m'),
    `${o.format(new Date())} │ ${_event} |  ${thisFileExt || "dir"} | ${resolve} ${_more ? "| "+_more : ""} \n ${_target}`,
    '\x1b[0m'
  );
};
export default message;
