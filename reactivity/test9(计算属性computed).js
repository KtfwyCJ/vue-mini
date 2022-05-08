// ------------------------目标：computed------------------------
// 场景：
// computed：懒执行的effect(lazy)，只有当读取value值时，才会执行effectFn并将其结果作为返回值返回
// computed(obj) -> value -> effectFn

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

function computed(getter) {
  // value用来缓存上一次计算的值
  let value;
  // dirty标志，用来标识是否需要重新计算，为true意为脏，需要重新计算
  let dirty = true;
  // 把getter作为副作用函数，创建一个lazy的effect
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      // 添加调度器，在调度器中将dirty标志设置为true
      dirty = true;
    },
  });

  const obj = {
    get value() {
      // 只有脏时才需要计算值
      if (dirty) {
        value = effectFn();
        dirty = false;
      }
      track(obj, "value");
      return value;
    },
  };

  return obj;
}

// --------------------------------测试-`--------------------------------

const sumRes = computed(() => obj.foo + obj.bar);

console.log(sumRes.value); // 1
