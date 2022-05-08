// ------------------------目标：嵌套情况------------------------
// 场景：
// effect(() => {
//   obj.foo++;
// });
// 这个操作导致栈溢出：因为副作用还没有执行完就要开始下一次执行，导致无线递归调用自己

// ------实现：如果trigger触发执行的副作用函数与当前正在执行的副作用函数相同，不触发执行--------------------------------

const bucket = new WeakMap(); // 使用WeakMap存储effect函数

// 原始数据
const data = { text: "hello world", ok: true };

// 用一个全局变量存储被注册的副作用函数
let activeEffect;

// effect栈
const effectStack = [];

// effect函数用来注册副作用函数
function effect(fn) {
  const effectFn = () => {
    // 调用cleanup函数完成清除工作
    cleanup(effectFn);
    // 当effect函数被调用时，将其设置为当前激活的副作用函数
    activeEffect = effectFn;

    // 在调用副作用函数之前将当前副作用函数添加到栈中
    effectStack.push(effectFn);
    fn();
    // 当副作用函数执行完毕时，将其从栈中移除，并把activeEffect还原为之前的值
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
  };
  effectFn.deps = [];
  effectFn();
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
  // 从depsMap中取得deps, 它是一个Set类型
  // 里面存储着所有和当前key有关的副作用函数
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  // 将当前副作用函数添加到deps中
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
}

// 在set函数中触发变化
function trigger(target, key) {
  const depsMap = bucket.get(target);

  if (!depsMap) return;
  const effects = depsMap.get(key);

  const effectsToRun = new Set(effects);
  effects &&
    effects.forEach((effectFn) => {
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn);
      }
    });
  effectsToRun.forEach((effectFn) => effectFn());
}

function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i];
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

// --------------------------------测试-`--------------------------------
effect(() => {
  console.log("effect run");
  document.body.innerHTML = obj.ok ? obj.text : "not";
});

setTimeout(() => {
  obj.ok = false; // obj中并不存在此属性，但副作用函数确执行了
}, 2000);
