<script lang="ts">
import { defineComponent, h, toValue } from 'vue';
import { useMarkdownContext } from '../MarkdownProvider';
import CodeBlock from '../CodeBlock/index.vue';
import CodeLine from '../CodeLine/index.vue';
import Mermaid from '../Mermaid/index.vue';
export default defineComponent({
  props: {
    raw: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const context = useMarkdownContext();
    const { codeXRender } = toValue(context);
    return (): ReturnType<typeof h> | null => {
      if (props.raw.inline) {
        if (codeXRender && codeXRender.inline) {
          const renderer = codeXRender.inline;
          if (typeof renderer === 'function') {
            return renderer(props);
          }
          return h(renderer, props);
        }
        return h(CodeLine, { raw: props.raw });
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

      return h(CodeBlock, props);
    };
  }
});
</script>
