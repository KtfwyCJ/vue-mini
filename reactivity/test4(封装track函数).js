// ------------------------目标：封装track（追踪）函数------------------------

// --------------------------------实现--------------------------------

const bucket = new WeakMap(); // 使用WeakMap存储effect函数

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
    track(target, key);
    return target[key];
  },
  set(target, key, newVal) {
    // 设置新的值
    target[key] = newVal;
    trigger(target, key);
  },
});

// 在get拦截函数中调用track函数追踪变化
function track(target, key) {
  // 将副作用函数添加到存储副作用的桶中
  if (!activeEffect) return target[key];
  // 根据target从桶中取得depsMap，它是一个Map对象：key --> effects
  let depsMap = bucket.get(target);
  // 如果不存在depsMap，则创建一个新的Map与target相关联
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  //  从depsMap中取得deps, 它是一个Set类型
  // 里面存储着所有和当前key有关的副作用函数
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  // 将副作用函数添加到deps中
  if (activeEffect) {
    deps.add(activeEffect);
  }
}

// 在set函数中触发变化
function trigger(target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key);
  if (!effects) return;
  effects && effects.forEach((fn) => fn());
}

// --------------------------------测试-`--------------------------------
effect(() => {
  console.log("effect run"); // 会打印两次
  document.body.innerHTML = obj.text;
});

setTimeout(() => {
  obj.notExist = "hello world2"; // obj中并不存在此属性，但副作用函数确执行了
}, 2000);

// ---------------------------------结果--------------------------------
// 下一步：考虑分支切换和cleanup
