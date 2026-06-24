import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en-US', 'pt-BR', 'pt-PT', 'es'],
  defaultLocale: 'pt-BR',
  localePrefix: 'as-needed',
})
