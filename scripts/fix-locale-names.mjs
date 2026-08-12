import { readFileSync, writeFileSync } from 'node:fs';

const localeNamesBlock = `  localeNames: {
    en: 'English',
    'zh-CN': '\u7b80\u4f53\u4e2d\u6587',
    'zh-TW': '\u7e41\u9ad4\u4e2d\u6587',
    ko: '\ud55c\uad6d\uc5b4',
    ja: '\u65e5\u672c\u8a9e',
    es: 'Espa\u00f1ol',
    fr: 'Fran\u00e7ais',
    de: 'Deutsch',
  },`;

for (const locale of ['es', 'fr', 'de', 'en', 'zh-CN', 'zh-TW', 'ja', 'ko']) {
  const path = `src/i18n/messages/${locale}.ts`;
  let source = readFileSync(path, 'utf8');
  source = source.replace(/  localeNames: \{[\s\S]*?\n  \},/, localeNamesBlock);
  writeFileSync(path, source, 'utf8');
}

console.log('localeNames fixed in all message files');
