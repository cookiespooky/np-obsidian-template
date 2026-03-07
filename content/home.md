---
type: home
slug: home
title: Сайт из Obsidian
description: Без хостинга, сервера, баз данных, CMS и админок. SEO настроено по умолчанию.
image: /media/notepub.svg
---
# Этот сайт сделан из Obsidian

Все страницы — обычные заметки.  
Вы пишете в vault → получаете сайт.

>Без хостинга, сервера, баз данных, CMS и админок. SEO настроено по умолчанию.

## Как это работает

1. Вы пишете заметки в Obsidian
2. Push через Git plugin
3. Notepub собирает сайт из вашего vault

Как заметка становится страницей сайта:

![Notepub-demo](/media/demo.mp4)

## Подходит для
  
• личного сайта  
• digital garden  
• документации  
• базы знаний  
• SEO-блога

---
## Как сделать свой сайт из Obsidian

Этот шаблон доступен для свободного использования.
Из него можно сделать сайт за несколько минут.
Настраивается 1 раз, публикуется в 1 клик.

1. Нажать **Use this template**
2. Клонировать репозиторий
3. Открыть папку как vault в Obsidian и изменить тексты в `/content`
4. Сделать commit и push через Git plugin

После этого GitHub автоматически соберёт и обновит сайт.

[**→ Use this template**](https://github.com/np-obsidian-template)

[[instructions|→ Инструкция со скриншотами]]

---
## Как выглядит структура

Структура этого сайта:

```shell
# Не отображаются в Obsidian
.github/workflows
	deploy.yml
.np/

# Отображаются в Obsidian
content/
	about.md  
	projects.md  
	blog/  
		first-post.md
media/
	demo.mp4
	notepub.svg
```

Каждый `.md` файл становится страницей сайта.

Внутренние ссылки Obsidian превращаются в обычные ссылки сайта.

---

## Движок сайта

Сайт собирается open source движком Notepub.

Он превращает markdown из Obsidian в полноценный сайт:

- заметки → страницы  
- ссылки → навигация  
- vault → сайт

[→ **GitHub проекта**](https://github.com/cookiespooky/notepub)


