import type { Ref } from 'vue';

import type { MarkdownContext } from '../../types';
import deepmerge from 'deepmerge';

import { computed, defineComponent, h, inject, provide, toValue } from 'vue';
import {
  usePlugins,
  useProcessMarkdown
} from '../../hooks';
import { MARKDOWN_PROVIDER_KEY, MARKDOWN_CORE_PROPS } from '../../shared';


const MarkdownProvider = defineComponent({
  name: 'MarkdownProvider',
  props: MARKDOWN_CORE_PROPS,
  setup(props, { slots, attrs }) {
    const { rehypePlugins, remarkPlugins } = usePlugins(props);
    const markdown = computed(() => {
      if (props.enableLatex) {
        return useProcessMarkdown(props.markdown);
      } else {
        return props.markdown;
      }
    });
    const processProps = computed(() => {
      return {
        ...props,
        codeXProps: Object.assign(
          {},
          MARKDOWN_CORE_PROPS.codeXProps.default(),
          props.codeXProps
        ),
        markdown: markdown.value
      };
    });

    const contextProps = computed(() => {
      return deepmerge(
        {
          rehypePlugins: toValue(rehypePlugins),
          remarkPlugins: toValue(remarkPlugins),
        },
        processProps.value
      );
    });
    provide(MARKDOWN_PROVIDER_KEY, contextProps);
    return () =>
      h(
        'div',
        { class: 'elx-xmarkdown-provider', ...attrs },
        slots.default && slots.default()
      );
  }
});

function useMarkdownContext(): Ref<MarkdownContext> {
  const context = inject<Ref<MarkdownContext>>(
    MARKDOWN_PROVIDER_KEY,
    computed(() => ({}))
  );
  if (!context) {
    return computed(() => ({})) as unknown as Ref<MarkdownContext>;
  }
  return context;
}
export { MarkdownProvider, useMarkdownContext };
