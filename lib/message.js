import path from "path";

let o=new Intl.DateTimeFormat("zh-CN",{
  hour12:false,
  timeStyle:"short",
  dateStyle:"short"
});
/**
 * 用于处理文件后返回的信息
 * @param {string} [_target] - 编译输出的目标文件路径
 * @param {string} [_event] - 事件名称
 * @param {string} [_resolve] - 执行结果 (succeeded / failed)
 * @param {string} [_more] - 附加信息
 * @param {string} [_source] - 原始未加密文件路径
 */
let message=(_target,_event,_resolve,_more,_source)=>{
  let thisFileExt=path.extname(_target || '').slice(1);
  let resolve=_resolve || "succeeded";
  let displaySource=_source || _target;
  let fileName=displaySource ? path.basename(displaySource) : "unknown";
  // 只保留 :1 (代表第1行)，整个路径加后缀会完整高亮下划线
  let cleanTarget=_target
    ? path.normalize(_target)+':1'
    : '';
  console.log(
    (resolve==='succeeded' ? '\x1b[0m' : '\x1b[91m'),
    `${o.format(new Date())} │ ${fileName} │ ${_event} |  ${thisFileExt || "dir"} | ${resolve} ${_more ? "| "+_more : ""} \n ${cleanTarget}`,
    '\x1b[0m'
  );
};
export default message;
