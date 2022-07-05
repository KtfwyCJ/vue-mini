1. 渲染器是什么？
> 将虚拟DOM（vitual DOM -> vdom）渲染为特定平台上的真实元素。虚拟DOM是一个个节点组成的树形结构，节点又称为虚拟Node,即vnode。虚拟DOM节点转为真实DOM节点的过程叫**挂载**（mount）。mounted钩子在挂载完成时触发。渲染器接收一个挂载点作为容器(container)，接收DOM元素