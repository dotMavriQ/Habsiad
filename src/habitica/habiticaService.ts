import { requestUrl, RequestUrlParam } from 'obsidian';
import HabsiadPlugin from '../main';

export class HabiticaService {
  private plugin: HabsiadPlugin;
  private apiUrl: string = 'https://habitica.com/api/v3';

  constructor(plugin: HabsiadPlugin) {
    this.plugin = plugin;
  }

  async getUserData(): Promise<any> {
    const { habiticaUserId, habiticaApiToken } = this.plugin.settings;

    if (!habiticaUserId || !habiticaApiToken) {
      throw new Error('Habitica credentials are not set.');
    }

    const options: RequestUrlParam = {
      url: `${this.apiUrl}/user`,
      method: 'GET',
      headers: {
        'x-api-user': habiticaUserId,
        'x-api-key': habiticaApiToken,
      },
    };

    try {
      const response = await requestUrl(options);
      return response.json.data;
    } catch (error) {
      console.error('Habitica API Error:', error);
      throw error;
    }
  }

  async getTasks(): Promise<any[]> {
    const { habiticaUserId, habiticaApiToken } = this.plugin.settings;

    if (!habiticaUserId || !habiticaApiToken) {
      throw new Error('Habitica credentials are not set.');
    }

    const options: RequestUrlParam = {
      url: `${this.apiUrl}/tasks/user`,
      method: 'GET',
      headers: {
        'x-api-user': habiticaUserId,
        'x-api-key': habiticaApiToken,
      },
    };

    try {
      const response = await requestUrl(options);
      return response.json.data;
    } catch (error) {
      console.error('Habitica API Error:', error);
      throw error;
    }
  }
}
