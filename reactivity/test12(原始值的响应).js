// 原始值：Boolean、Number/BigInt、String、Symbol、undefined、null
// 方案：使用一个非原始值去包裹原始值

function ref(val) {
  const wrapper = {
    value: val,
  };

  return reactive(wrapper);
}

// --------------------------------如何区分refVal和原始值--------------------------------
const refVal1 = ref(1);
const refVal2 = reactive({ value: 1 });
// 有必要区分这两者，因为涉及到自动脱ref能力

// --------------------------------使用__v_isRef属性区分--------------------------------
// __v_isRef不可写只可读
function ref(val) {
  const wrapper = {
    value: val,
  };

  Object.defineProperty(wrapper, "__v_isRef", {
    value: true,
  });

  return reactive(wrapper);
}

// --------------------------------响应丢失--------------------------------
function toRef(obj, key) {
  const wrapper = {
    get value() {
      return obj[key];
    },
    set value(val) {
      obj[key] = val;
    },
  };
  Object.defineProperty(wrapper, "__v_isRef", {
    value: true,
  });
  return wrapper;
}

function toRefs(obj) {
  const ret = {};
  for (const key in obj) {
    ret[key] = toRef(obj[key]);
  }
  return ret;
}

// --------------------------------自动脱ref--------------------------------
function proxyRefs(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      return value.__v_isRef ? value.value : value;
    },
    set(target, key, newValue, receiver) {
        const value = target[key]
        if (value.__v_isRef) {
            value.value = newValue
            return true
        }
        return Reflect.set(target, key, newValue, receiver)
    }
  });
}

const newObj = proxyRefs({ ...toRefs(obj) });

// 使用
const MyComponent = {
  setup() {
    const count = ref(0);

    // 返回的这个对象会传递给proxyRefs
    return { count };
  },
};
