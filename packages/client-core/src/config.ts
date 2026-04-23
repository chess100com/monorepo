export interface ClientCoreConfig {
  apiBase: string;
  socketUrl: string | undefined;
  fetchCredentials: RequestCredentials;
  socketOptions: Record<string, unknown>;
}

export const clientCoreConfig: ClientCoreConfig = {
  apiBase: '/api',
  socketUrl: undefined,
  fetchCredentials: 'include',
  socketOptions: { withCredentials: true, autoConnect: true },
};

export function configureClientCore(options: Partial<ClientCoreConfig>): void {
  Object.assign(clientCoreConfig, options);
}
