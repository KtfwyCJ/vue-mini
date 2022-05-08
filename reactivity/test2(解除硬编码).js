// ------------------------目标：解除副作用函数的硬编码------------------------

const bucket = new Set();

// 原始数据
const data = { text: "hello world" };

// 用一个全局变量存储被注册的副作用函数
let activeEffect;

// effect函数用来注册副作用函数
function effect(fn) {
  activeEffect = fn;
  fn();
}

// 对原始数据代理
const obj = new Proxy(data, {
  // 读取操作
  get(target, key) {
    // 将副作用函数添加到存储副作用的桶中
    if (activeEffect) {
      bucket.add(activeEffect);
    }
    // 返回值
    return target[key];
  },
  set(target, key, newVal) {
    // 设置新的值
    target[key] = newVal;
    // 轮询执行桶中的副作用函数
    bucket.forEach((fn) => fn());
  },
});

// --------------------------------测试-`--------------------------------
effect(() => {
    console.log('effect run') // 会打印两次
  document.body.innerHTML = obj.text;
});

setTimeout(() => {
  obj.notExist = "hello world2"; // obj中并不存在此属性，但副作用函数确执行了
}, 2000);

// ---------------------------------结果--------------------------------
// obj中并不存在此属性，但副作用函数确执行了，是因为我们没有在副作用函数和目标字段之间建立明确的联系，需要重新设计桶
// 优化见test3.js
