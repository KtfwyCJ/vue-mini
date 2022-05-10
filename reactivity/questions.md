## 响应式相关问题
1. 说说Set、Map、WeakSet、WeakMap

**Set**是一种叫做集合的数据结构，**Map**是一种叫做字典的数据结构.
* 集合，是由一堆无序的、相关联的，且不重复的内存结构【数学中称为元素】组成的组合
* 字典（dictionary）是一些元素的集合。每个元素有一个称作key 的域，不同元素的key 各不相同

共同点：集合、字典都可以存储不重复的值
不同点：集合是以[值，值]的形式存储元素，字典是以[键，值]的形式存储
#
**Set**

> Set 对象允许你存储任何类型的唯一值，无论是原始值或者是对象引用，**Set对象是值的集合**，你可以按照插入的顺序迭代它的元素。

> `new Set([iterable])`接收一个数组（或具有iterable的其他数据结构），可以去除数组中的重复元素。

```JavaScript
let set = new Set([1,2,3,4]);

//set只有键值，没有键名，所以keys() values()行为完全一致
console.log(Array.from(set.keys())) // [1,2,3,4]
console.log(Array.from(set.values())) // [1,2,3,4]
```

**WeakSet**
WeakSet 的出现主要解决弱引用对象存储的场景, 其结构与Set类似
与Set的区别

* 与Set相比，WeakSet 只能是对象的集合，而不能是任何类型的任意值
* WeakSet集合中对象的引用为弱引用。 如果没有其他的对WeakSet中对象的引用，那么这些对象会被当成垃圾回收掉。 这也意味着WeakSet中没有存储当前对象的列表。 正因为这样，WeakSet 是不可枚举的。

**Map**
> Map 对象保存键值对，并且能够记住键的原始插入顺序

```JavaScript
let map = new Map()
map.set('name','vue3js.cn')
map.set('age','18')

console.log([...map.keys()])  // ["name", "age"]
console.log([...map.values()])  // ["vue3js.cn", "18"]
```

**WeakMap**
与Map的区别：
* Map 的键可以是任意类型，WeakMap 的键只能是对象类型
* WeakMap 键名所指向的对象，不计入垃圾回收机制


2. 什么是弱引用？
> 强引用被{name:"alex"}这个引用认可为一个“连接”，而弱引用不被认可。即该引用并不知道它被ws实例所引用。造成的后果就是该引用并不知道自己被ws实例所引用，这说明垃圾回收也不知道该引用被ws实例所引用。那么如果该引用的所有强引用连接都被断开了（变量被赋值为null或其他情况），那么该引用会被当作垃圾销毁，即使ws实例还在引用着该引用。

``` JavaScript
// 还是刚才那种定义
const user = {name:"alex"}
const user2 = user
​
// 我们使用WeakSet来创建一个WeakSet实例
const ws = new WeakSet()
// 我们为由WeakSet构造出的实例ws添加一个数据：user2
ws.add(user2)
user = null // 强引用断开
user2 = null
console.log(ws) // {}

```
> 因为所有的强引用都断开了，那么垃圾回收认为该引用{name:"alex"}不需要了，就会将他销毁。那么对应的ws实例所用到的该引用也都不复存在了，即使ws实例还在使用着该引用

[参考文档](https://juejin.cn/post/7039678880071827463)