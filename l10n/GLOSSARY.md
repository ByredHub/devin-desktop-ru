# Глоссарий и правила перевода Devin Desktop → русский

## Общие правила
- Интерфейс, а не литература: коротко, естественно, без канцелярита («осуществить», «данный», «является»). Длина ≈ как в оригинале.
- Обращение к пользователю на «вы» (со строчной). Devin — «он» (мужской род: «Devin завершил», «Devin думает…»).
- Кнопки, пункты меню, команды — инфинитив: «Открыть», «Сохранить изменения», «Повторить». Заголовки — существительные: «Настройки оплаты».
- Регистр как в русском UI: заглавная только первая буква («Open Pull Request» → «Открыть пул-реквест»), кроме имён собственных.
- Кавычки в русском тексте — «ёлочки». Кавычки/апострофы внутри кода, команд, JSON — не трогать.
- Многоточие и пунктуацию сохранять (… остаётся …). Пробелы в начале/конце строки и переводы строк сохранять как в оригинале.
- Если строка — это код, путь, URL, имя переменной, ключ, шорткат, единица (`ms`, `MB`), оставить как есть.

## Не переводить (никогда)
- Плейсхолдеры: `{{name}}`, `{{count}}`, `{{x, list}}`, `{0}`, `{1}`, `{name}`, `%s`, `%d`, `$(icon-name)`, `$t(...)`. Внутри `{{ }}` ничего не менять.
- Теги разметки: `<0>…</0>`, `<bold>…</bold>`, `<link>…</link>`, `<br/>`, `<code>` — имена и количество те же, текст внутри переводить.
- Markdown: `**жирный**`, `` `код` `` (содержимое бэктиков не переводить), `[текст](url)` — переводить только «текст».
- Мнемоники VS Code `&&` (например `&&File` → `&&Файл`) — `&&` оставить, поставить перед подходящей русской буквой.
- Названия: Devin, Devin Desktop, Devin Review, DeepWiki, Ask Devin, Cascade, Windsurf, Codeium, Cognition, VS Code, Copilot, Claude, GPT, GitHub, GitLab, Bitbucket, Azure DevOps, Slack, Microsoft Teams, Jira, Linear, Notion, Datadog, Sentry, Unleash, Stripe, Okta, SAML, SSO, SCIM, OAuth, API, CLI, SDK, MCP, ACU, PR, CI, CD, SSH, WSL, IDE, URL, JSON, YAML, Markdown, Git, npm, Docker, Kubernetes, Mythos, Enterprise/Teams/Core/Pro (как названия тарифов).

## Термины
| English | Русский | Примечание |
|---|---|---|
| session | сессия | сессия Devin/агента. Только «debug session» → «сеанс отладки» |
| child session / subagent | дочерняя сессия / субагент | |
| agent | агент | |
| playbook | плейбук | |
| skill | навык | |
| knowledge | знания | «knowledge note» → «заметка знаний» |
| memory | память | |
| rule(s) | правило/правила | |
| hook(s) | хук(и) | |
| plugin | плагин | |
| blueprint | блюпринт | конфиг окружения Devin |
| snapshot | снапшот | |
| environment | окружение | |
| machine / VM | машина / ВМ | |
| workspace | рабочая область | в VS Code-контексте; «workspace» как организация Slack — «рабочее пространство» |
| repository / repo | репозиторий | |
| branch | ветка | |
| commit (сущ.) / commit (глаг.) | коммит / закоммитить | |
| pull request / PR | пул-реквест / PR | «Open PR» → «Открыть PR» |
| merge | слить / слияние | «Merge» кнопка → «Слить» |
| review (код) | ревью | «Code review» → «Код-ревью», «reviewer» → «ревьюер» |
| diff | дифф | |
| check(s) (CI) | проверка/проверки | |
| prompt | промпт | |
| context | контекст | |
| model | модель | |
| token (LLM) / token (доступа) | токен | |
| secret | секрет | |
| credentials | учётные данные | |
| integration | интеграция | |
| automation | автоматизация | |
| trigger | триггер | |
| schedule / scheduled | расписание / по расписанию | |
| board / ticket | доска / тикет | |
| worklog | журнал работы | |
| transcript | транскрипт | |
| inbox | входящие | |
| notification | уведомление | |
| organization / org | организация | |
| enterprise (уровень аккаунта) | Enterprise | не «предприятие» |
| account | аккаунт | |
| member / seat | участник / место | |
| role / permission | роль / разрешение | |
| admin | администратор | «Admin» в меню → «Админка» нельзя; → «Администрирование» |
| billing | оплата | «Billing settings» → «Настройки оплаты» |
| plan (тариф) / plan (план работ агента) | тариф / план | различать по контексту |
| usage / consumption | использование / расход | |
| credits / quota / limit | кредиты / квота / лимит | |
| analytics | аналитика | |
| settings | настройки | (в ядре VS Code Microsoft пишет «Параметры» — не трогаем) |
| preferences | настройки | |
| sign in / log in | войти | «Sign in with GitHub» → «Войти через GitHub» |
| sign out / log out | выйти | |
| sign up | зарегистрироваться | |
| accept / reject | принять / отклонить | |
| approve / deny | одобрить / запретить | |
| dismiss | закрыть | |
| retry | повторить | |
| enable / disable | включить / отключить | |
| toggle X | переключить X / показать или скрыть X | |
| archive / unarchive | архивировать / вернуть из архива | |
| sidebar | боковая панель | |
| tab | вкладка | |
| panel | панель | |
| editor | редактор | |
| terminal | терминал | |
| command palette | палитра команд | |
| shortcut / keybinding | сочетание клавиш | |
| feedback | отзыв / обратная связь | |
| onboarding | знакомство / начало работы | |
| learn more | подробнее | |
| docs | документация | |
| beta / preview / experimental | бета / предварительная версия / экспериментальное | |
| finding (security) | находка | «security finding» → «уязвимость» по смыслу |
| code scan | сканирование кода | |
| red teaming | ред-тиминг | |
| on-call | дежурство | |
| app (Devin Apps) | приложение | |
| bot | бот | |
| mention | упоминание | |

## Плюралы (i18next)
Ключи с суффиксами `_one` / `_other` — формы числа. Для русского всегда выдавай четыре формы:
`x_one` (1, 21, 31…: «{{count}} сессия»), `x_few` (2–4, 22–24…: «{{count}} сессии»), `x_many` (5–20, 25–30…: «{{count}} сессий»), `x_other` (дробные: «{{count}} сессии»).
Если в исходнике есть `_zero` — переведи и его. `{{count}}` сохраняй.
