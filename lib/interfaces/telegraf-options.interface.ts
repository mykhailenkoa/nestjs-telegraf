import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { Middleware, Context } from 'telegraf';
import {
  TelegrafOptions,
  LaunchPollingOptions,
  LaunchWebhookOptions,
  TelegrafOptions,
} from 'telegraf/typings/telegraf';
import { Middleware } from 'telegraf/typings/composer';
import { Context } from './context.interface';

export interface TelegrafModuleOptions<C extends Context = Context> {
  token: string;
  options?: TelegrafOptions;
  launchOptions?: {
    polling?: LaunchPollingOptions;
    webhook?: LaunchWebhookOptions;
  };
  botName?: string;
  include?: Function[];
  middlewares?: ReadonlyArray<Middleware<Context>>;
  disableGlobalCatch?: boolean;
  middlewares?: Middleware<C>[];
}

export interface TelegrafOptionsFactory {
  createTelegrafOptions(): TelegrafModuleOptions;
}

export interface TelegrafModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  botName?: string;
  useExisting?: Type<TelegrafOptionsFactory>;
  useClass?: Type<TelegrafOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<TelegrafModuleOptions> | TelegrafModuleOptions;
  inject?: any[];
}
