---
id: getting-updates
title: Getting updates
sidebar_label: Getting updates
slug: getting-updates
---

## Long polling

By default, the bot receives updates using long-polling and requires no additional action.

## Webhooks

If you want to configure a telegram bot webhook, you need to get a middleware from `TelegrafProvider` for connect it in your `main.ts` file.

To access it, you must use the `app.get()` method, followed by the provider reference:
```typescript
const telegrafProvider = app.get('TelegrafProvider');
```

Now you can connect middleware:
```typescript
app.use(telegrafProvider.webhookCallback('/secret-path'));
```

The last step is to specify launchOptions in `forRoot` method:
```typescript
TelegrafModule.forRootAsync({
  imports: [ConfigModule.forFeature(telegrafModuleConfig)],
  useFactory: async (configService: ConfigService) => ({
    token: configService.get<string>('TELEGRAM_BOT_TOKEN'),
    launchOptions: {
      webhook: {
        domain: 'domain.tld',
        hookPath: '/secret-path',
      }
    }
  }),
  inject: [ConfigService],
});
```