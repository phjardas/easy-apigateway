export type Internationalizable = {
  messageKey: string;
  messageArgs?: Array<unknown>;
};

export class InternationalizableError
  extends Error
  implements Internationalizable
{
  readonly messageKey: string;
  readonly messageArgs?: Array<unknown>;

  constructor({
    messageKey,
    messageArgs,
    message,
  }: {
    messageKey: string;
    messageArgs?: Array<unknown>;
    message?: string;
  }) {
    super(message);
    this.messageKey = messageKey;
    this.messageArgs = messageArgs;
  }
}

/**
 * When you throw this exception in your lambda handler, the framework
 * will set the appropriate HTTP response code and send the message in
 * the payload.
 */
export class StatusError extends InternationalizableError {
  constructor(
    readonly code: number,
    message?: string,
  ) {
    super({ messageKey: `errors.http.${code}`, message });
  }
}
