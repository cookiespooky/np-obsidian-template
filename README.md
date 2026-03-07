# NP Obsidian Template

Шаблон для сценария:
1. `Use this template` в GitHub
2. `git clone` себе на компьютер
3. открыть папку как Obsidian Vault
4. писать контент в `content/`
5. пушить изменения, а сайт собирается через GitHub Actions и публикуется в GitHub Pages

## Структура

- `.github/` — CI/CD (сборка и деплой на Pages)
- `content/` — заметки и медиа для Obsidian
- `.np/` — вся техничка Notepub (config, rules, theme, scripts)

## Быстрый старт

1. В репозитории GitHub включите Pages: `Settings -> Pages -> Source: GitHub Actions`.
2. Отредактируйте Markdown в `content/`.
3. Сделайте commit/push в `main`.

## Локальная сборка (опционально)

```bash
./.np/scripts/build.sh
```

Если бинарника `.np/bin/notepub` нет, укажите путь:

```bash
NOTEPUB_BIN=/path/to/notepub ./.np/scripts/build.sh
```

Результат сборки: `.np/dist/`.

## Где что настраивается

- сайт: `.np/config.yaml`
- правила роутинга/коллекций: `.np/rules.yaml`
- шаблоны и стили: `.np/theme/`
- workflow: `.github/workflows/deploy.yml`

## Важно

- Контент для пользователя хранится только в `content/`.
- Технические файлы изолированы в `.np/`.
- Workflow автоматически ставит корректный `base_url` для GitHub Pages.
