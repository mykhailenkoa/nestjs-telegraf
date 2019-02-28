import { Injectable, Inject } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import Telegraf, { ContextMessageUpdate } from 'telegraf'
import { flatten, head } from 'lodash'

import { ContextTransformer } from './ContextTransformer'
import { TelegramCatch } from './decorators/TelegramCatch'
import { TelegramErrorHandler } from './interfaces/TelegramErrorHandler'
import { Handler } from './Handler'
import { Bot } from './Bot'
import { TelegramActionHandler } from './decorators/TelegramActionHandler'
import { TokenInjectionToken } from './TokenInjectionToken'
import { TelegramModuleOptionsFactory } from 'TelegramModuleOptionsFactory'

@Injectable()
export class TelegramBot {
  private readonly token: string
  private bot: Bot
  private ref: ModuleRef

  public constructor(
    @Inject(TokenInjectionToken) factory: TelegramModuleOptionsFactory,
  ) {
    this.token = factory.createOptions().token
  }

  public init(ref: ModuleRef) {
    this.ref = ref

    const bot = new Telegraf(this.token)

    const handlers = this.createHandlers()

    this.setupOnStart(bot, handlers)
    this.setupOnCommand(bot, handlers)

    this.bot = bot
  }

  public start() {
    this.bot.startPolling()
  }

  private createHandlers(): Handler[] {
    return flatten(
      Array.from((TelegramActionHandler.handlers || new Map()).entries()).map(
        ([handlerClass, classConfig]) => {
          const handlerInstance = this.ref.get(handlerClass, { strict: false })

          return Array.from(classConfig.entries()).map(
            ([methodName, methodCondig]) => ({
              handle: handlerInstance[methodName].bind(handlerInstance),
              config: methodCondig,
            }),
          )
        },
      ),
    )
  }

  private setupOnStart(bot: Bot, handlers: Handler[]): void {
    const onStart = handlers.filter(({ config }) => config.onStart)

    if (onStart.length !== 1) {
      throw new Error()
    }

    bot.start(this.adoptHandle(head(onStart)))
  }

  private setupOnCommand(bot: Bot, handlers: Handler[]): void {
    const commandHandlers = handlers.filter(({ config }) => config.command)

    commandHandlers.forEach(handler => {
      bot.command(handler.config.command, this.adoptHandle(handler))
    })
  }

  private adoptHandle({ handle, config }: Handler) {
    const errorHandler = this.createCatch()

    return async (ctx: ContextMessageUpdate) => {
      const args = await Promise.all(
        (config.transformations || [])
          .sort((a, b) => a.index - b.index)
          .map(({ transform }) =>
            this.ref
              .get<ContextTransformer>(transform, { strict: false })
              .transform(ctx),
          ),
      )

      return handle(ctx, ...args).catch(errorHandler(ctx))
    }
  }

  private createCatch() {
    const handlers = Array.from(
      (TelegramCatch.handlers || new Map()).entries(),
    ).map(([errorType, handlerType]) => {
      const handler = this.ref.get<TelegramErrorHandler>(handlerType, {
        strict: false,
      })

      return {
        errorType,
        handler,
      }
    })

    return (ctx: ContextMessageUpdate) => (e: any) => {
      for (const { errorType, handler } of handlers) {
        if (e instanceof (errorType as any)) {
          return handler.catch(ctx, e)
        }
      }

      throw e
    }
  }
}