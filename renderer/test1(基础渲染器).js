//  ------------------一个简易版渲染器------------------
const { effect, ref } = VueReactivity;

function renderer(domString, container) {
  container.innerHTML = domString;
}

const count = ref(0);
effect(() => {
  renderer(`<div>${count.value}</div>`, document.getElementById("app"));
});

count.value++;

// ---------------------------------渲染器--------------------------------

function createRenderer() {
  function render(vnode, container) {
    if (vnode) {
      // 将新旧节点进行对比
      patch(container._vnode, vnode, container);
    } else {
      if (container._vnode) {
        // 旧节点存在，新节点不存在，则是卸载(unmount)操作
        container.innerHTML = "";
      }
    }
    // vnode存储在container上，当做旧节点
    container._vnode = vnode;
  }

  function hydrate(vnode, container) {
    // 通常用于服务端渲染
  }
}

const renderer = createRenderer();
// 首次渲染
renderer(oldVNode, document.querySelector("#app"));
// 二次渲染：不能简单的执行挂载，而是试图找到更新点，这个过程是“打补丁”，英文用patch表示
renderer(newVNode, document.querySelector("#app"));
