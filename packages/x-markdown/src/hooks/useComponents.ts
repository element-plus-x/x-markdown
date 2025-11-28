import { h } from 'vue';
import CodeX  from '../components/CodeX/index.vue';

function useComponents() {
  const components = {
    code: (raw: any) => h(CodeX, { raw })
  };
  return components;
}

export { useComponents };
