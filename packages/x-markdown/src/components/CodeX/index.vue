<script lang="ts">
import { defineComponent, h, type PropType, type VNode } from 'vue';
import type { BuiltinTheme } from 'shiki';
// @ts-ignore
import CodeBlock from '../CodeBlock/index.vue';
// @ts-ignore
import CodeLine from '../CodeLine/index.vue';
import Mermaid from '../Mermaid/index.vue';

type SlotFn = (props: any) => VNode | VNode[];

export default defineComponent({
  props: {
    raw: {
      type: Object,
      default: () => ({})
    },
    codeXRender: {
      type: Object,
      default: () => ({})
    },
    codeXSlots: {
      type: Object as PropType<Record<string, SlotFn>>,
      default: () => ({})
    },
    isDark: {
      type: Boolean,
      default: false
    },
    codeLightTheme: {
      type: String as PropType<BuiltinTheme>,
      default: 'vitesse-light'
    },
    codeDarkTheme: {
      type: String as PropType<BuiltinTheme>,
      default: 'vitesse-dark'
    }
  },
  setup(props) {
    const { codeXRender } = props;
    return (): ReturnType<typeof h> | null => {
      if (props.raw.inline) {
        if (codeXRender && codeXRender.inline) {
          const renderer = codeXRender.inline;
          if (typeof renderer === 'function') {
            return renderer(props);
          }
          return h(renderer, props);
        }
        return h(CodeLine, props);
      }

      const { language } = props.raw;

      if (codeXRender && codeXRender[language]) {
        const renderer = codeXRender[language];
        if (typeof renderer === 'function') {
          return renderer(props);
        }
        return h(renderer, props);
      }

      if (language === 'mermaid') {
        return h(Mermaid, props);
      }

      return h(CodeBlock, {
        code: props.raw.content || '',
        language: props.raw.language || 'text',
        isDark: props.isDark,
        lightTheme: props.codeLightTheme,
        darkTheme: props.codeDarkTheme
      }, props.codeXSlots);
    };
  }
});
</script>
