// ------------------------目标：响应式的基础实现：对象数据变化时，执行副作用函数------------------------

// set的数据结构特点参考(https://vue3js.cn/es6/dataStructure.html#%E8%83%8C%E6%99%AF)
// Set: 无序集合，元素不可重复，元素唯一性。集合是以[值，值]的形式存储元素,字典(Map)是以[键，值]的形式存储
// 存储副作用函数的桶
const bucket = new Set();

// 原始数据
const data = { text: 'hello world' };

function effect() {
    document.body.innerHTML = data.text;
}

// 对原始数据代理
const obj = new Proxy(data, {
    // 读取操作
    get(target, key) {
        // 将副作用函数添加到存储副作用的桶中
        bucket.add(effect)
        // 返回值
        return target[key];
    },
    set(target, key, newVal) {
        // 设置新的值
        target[key] = newVal;
        // 轮询执行桶中的副作用函数
        bucket.forEach(fn => fn());
    }
})

// --------------------------------测试-`--------------------------------
function effect() {
    document.body.innerHTML = obj.text;
}

effect();

setTimeout(() => {
    obj.text = 'hello world2';
}, 2000)


// ---------------------------------结果--------------------------------
// 直接指定effect函数，硬编码的方式不够灵活，副作用函数的名字可以是多种多样的
// 优化见test2.js
