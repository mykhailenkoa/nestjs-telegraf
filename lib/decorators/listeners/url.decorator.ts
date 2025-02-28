import { createUpdateListenerDecorator } from '../../helpers';

/**
 * Registers middleware for handling messages with url entity.
 *
 * @see https://telegraf.js.org/#/?id=telegraf-url
 */
export const Url = createUpdateListenerDecorator('url');
