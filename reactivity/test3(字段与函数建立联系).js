// ------------------------目标：在副作用函数和目标字段之间建立明确的联系------------------------
// 即target -> field ->  effect关系明确
// 可能出现的情况：一个key可能有一个副作用函数，也可能有多个副作用函数
// target -> key -> effect

// target -> key -> effect1
//               -> effect2
// 比如：
// effect(function effect1() {
//   obj.text;
// });
// effect(function effect2() {
//   obj.text;
// });


// --------------------------------实现--------------------------------
// WeakMap由target --> Map组成
// Map由key --> Set组成


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
    // 返回值
    return target[key];
  },
  set(target, key, newVal) {
    // 设置新的值
    target[key] = newVal;
    const depsMap = bucket.get(target);
    if (!depsMap) return;
    const effects = depsMap.get(key);
    if (!effects) return;
    effects && effects.forEach((fn) => fn());
  },
});

// --------------------------------测试-`--------------------------------
effect(() => {
  console.log("effect run"); // 会打印两次
  document.body.innerHTML = obj.text;
});

setTimeout(() => {
  obj.notExist = "hello world2"; // obj中并不存在此属性，但副作用函数确执行了
}, 2000);

// ---------------------------------结果--------------------------------
// 已经正确建立副作用与字段之间的联系
// 下一步：优化代码，封装track函数


// ---------------------------------解读--------------------------------
// 1. 为什么要使用WeakMap存储target --> Map组成的关系？
// WeakMap 对象是一组键值对的集合，其中的键是 弱引用 的。其键必须是 对象，而值可以是任意的。WeakMap 的键所指向的对象，不计入垃圾回收机制。如果你要往对象上添加数据，又不想干扰垃圾回收机制，就可以使用 WeakMap。Vue 3 之所以使用 WeakMap 来作为缓冲区就是为了能将 不再使用的数据进行正确的垃圾回收。

// 2. 什么是弱引用
// 在计算机程序设计中，弱引用 与 强引用 相对，是指不能确保其引用的对象不会被垃圾回收器回收的引用。一个对象若只被弱引用所引用，则被认为是不可访问（或弱可访问）的，并因此 可能在任何时刻被回收。
