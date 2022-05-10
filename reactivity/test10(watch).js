// ------------------------目标：watch------------------------
// 场景：
// watch: 观测响应式数据，数据变化通知并执行回调函数
// watch(obj, () => {
//     console.log("obj发生变化");
// })

// -----------------------------实现--------------------------------

const bucket = new WeakMap(); // 使用WeakMap存储effect函数

// 原始数据
const data = { foo: 0, bar: 1 };

// 用一个全局变量存储被注册的副作用函数
let activeEffect;

// effect栈
const effectStack = [];

// effect函数用来注册副作用函数
function effect(fn, options = {}) {
  const effectFn = () => {
    // 调用cleanup函数完成清除工作
    cleanup(effectFn);
    // 当effect函数被调用时，将其设置为当前激活的副作用函数
    activeEffect = effectFn;

    // 在调用副作用函数之前将当前副作用函数添加到栈中
    effectStack.push(effectFn);
    // 将fn的执行结果存储在res中
    const res = fn();
    // 当副作用函数执行完毕时，将其从栈中移除，并把activeEffect还原为之前的值
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    return res;
  };
  effectFn.options = options;
  effectFn.deps = [];
  if (!options.lazy) {
    effectFn();
  }
  //   将副作用函数作为返回值返回
  return effectFn;
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
  effectsToRun.forEach((effectFn) => {
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn);
    } else {
      effectFn();
    }
  });
}

function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i];
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

function watch(source, cb) {
  let getter;
  // 如果source是一个对象，说明用户传递的是getter，则直接把source赋值给getter
  if (typeof source === "function") {
    getter = source;
  } else {
    getter = () => traverse(source);
  }
  //   定义旧值和新值
  let oldValue, newValue;

  const effectFn = effect(
    // 调用traverse递归的读取
    () => getter(),
    {
      lazy: true,
      scheduler() {
        //   在scheduler函数中重新执行副作用函数，得到的是新值
        newValue = effectFn();
        // 将旧值和新值作为回调函数的参数
        cb(newValue, oldValue);
        // 更新旧值，不然下一次会得到错误的旧值
        oldValue = newValue;
      },
    }
  );
  //   手动调用副作用函数，拿到的是旧值
  oldValue = effectFn();
}

function traverse(value, seen = new Set()) {
  // 如果要读取的是原始值，或者已经被读取过了，那么什么都不做
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  // 将数据添加到seen中，代表遍历的读取过了，避免循环引用引起的死循环
  seen.add(value);
  // 假设value是对象，使用for in读取对象的每个值，并递归的调用traverse处理

  for (const key in value) {
    traverse(value[key], seen);
  }
  return value;
}

// --------------------------------测试-`--------------------------------

const sumRes = computed(() => obj.foo + obj.bar);

console.log(sumRes.value); // 1
