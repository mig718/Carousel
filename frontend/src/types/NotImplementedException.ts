export type NotImplementedCardVariant = 'search' | 'settings-list';

export interface NotImplementedExceptionPayload {
  title: string;
  message: string;
  description: string;
  icon?: string;
  variant?: NotImplementedCardVariant;
}

export class NotImplementedException extends Error {
  public readonly payload: NotImplementedExceptionPayload;

  constructor(payload: NotImplementedExceptionPayload) {
    super(payload.message);
    this.name = 'NotImplementedException';
    this.payload = payload;
  }
}
