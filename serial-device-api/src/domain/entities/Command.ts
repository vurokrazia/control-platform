export interface Command {
  _id?: string;
  deviceId: string;
  command: string;
  value?: string | number | undefined;
  status: 'sent' | 'acknowledged' | 'failed';
  sentAt: Date;
  response?: string | undefined;
}