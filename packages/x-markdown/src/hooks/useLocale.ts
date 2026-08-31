import { computed, inject, provide, toValue, type ComputedRef, type InjectionKey, type MaybeRefOrGetter } from 'vue'
import { defaultLocale, mergeLocale, type MarkdownLocale, type MarkdownLocalePartial } from '../locale'

export const MarkdownLocaleKey: InjectionKey<ComputedRef<MarkdownLocale>> = Symbol('x-markdown-locale')

const fallbackLocale = computed(() => defaultLocale)

export function provideMarkdownLocale(locale: MaybeRefOrGetter<MarkdownLocalePartial | undefined>) {
  const merged = computed(() => mergeLocale(toValue(locale)))
  provide(MarkdownLocaleKey, merged)
  return merged
}

export function useLocale(): ComputedRef<MarkdownLocale> {
  return inject(MarkdownLocaleKey, fallbackLocale)
}
