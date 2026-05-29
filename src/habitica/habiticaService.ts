import { requestUrl, RequestUrlParam } from "obsidian";
import HabsiadPlugin from "../main";
import {
  HabiticaUserData,
  HabiticaTask,
  HabiticaTodo,
  HabiticaApiResponse,
  HabiticaRateLimitHeaders,
} from "./types/index";
import { HabsiadApiError } from "./types/obsidian";

export class HabiticaService {
  private plugin: HabsiadPlugin;
  private apiUrl: string = "https://habitica.com/api/v3";
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 30000; // 30 seconds as per API guidelines

  constructor(plugin: HabsiadPlugin) {
    this.plugin = plugin;
  }

  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(
        `Habitica rate limit: waiting ${waitTime}ms before next request`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  private getCommonHeaders(): Record<string, string> {
    const { habiticaUserId } = this.plugin.settings;

    return {
      "x-api-user": habiticaUserId,
      "x-api-key": this.plugin.settings.habiticaApiToken,
      "x-client": `${habiticaUserId}-Habsiad`,
    };
  }

  async getUserData(): Promise<HabiticaUserData> {
    const { habiticaUserId, habiticaApiToken } = this.plugin.settings;

    if (!habiticaUserId || !habiticaApiToken) {
      throw new Error("Habitica credentials are not set.");
    }

    await this.respectRateLimit();

    const options: RequestUrlParam = {
      url: `${this.apiUrl}/user`,
      method: "GET",
      headers: this.getCommonHeaders(),
    };

    try {
      const response = await requestUrl(options);

      // Log rate limit info for debugging
      console.log("Habitica API Rate Limit Status:", {
        limit: response.headers["x-ratelimit-limit"],
        remaining: response.headers["x-ratelimit-remaining"],
        reset: response.headers["x-ratelimit-reset"],
      });

      return response.json.data;
    } catch (error: any) {
      console.error("Habitica API Error:", error);

      // Handle rate limiting specifically
      if (error.status === 429) {
        const retryAfter = error.headers?.["retry-after"];
        console.error(`Rate limited. Retry after: ${retryAfter} seconds`);
        throw new HabsiadApiError(
          `Habitica API rate limit exceeded. Please wait ${retryAfter} seconds.`,
          error.status,
          "RATE_LIMIT"
        );
      }

      throw error;
    }
  }

  async getTasks(): Promise<HabiticaTask[]> {
    const { habiticaUserId, habiticaApiToken } = this.plugin.settings;

    if (!habiticaUserId || !habiticaApiToken) {
      throw new Error("Habitica credentials are not set.");
    }

    await this.respectRateLimit();

    const options: RequestUrlParam = {
      url: `${this.apiUrl}/tasks/user`,
      method: "GET",
      headers: this.getCommonHeaders(),
    };

    try {
      const response = await requestUrl(options);

      // Log rate limit info for debugging
      console.log("Habitica API Rate Limit Status:", {
        limit: response.headers["x-ratelimit-limit"],
        remaining: response.headers["x-ratelimit-remaining"],
        reset: response.headers["x-ratelimit-reset"],
      });

      return response.json.data;
    } catch (error: any) {
      console.error("Habitica API Error:", error);

      // Handle rate limiting specifically
      if (error.status === 429) {
        const retryAfter = error.headers?.["retry-after"];
        console.error(`Rate limited. Retry after: ${retryAfter} seconds`);
        throw new HabsiadApiError(
          `Habitica API rate limit exceeded. Please wait ${retryAfter} seconds.`,
          error.status,
          "RATE_LIMIT"
        );
      }

      throw error;
    }
  }

  async getTodos(): Promise<HabiticaTodo[]> {
    const { habiticaUserId, habiticaApiToken } = this.plugin.settings;

    if (!habiticaUserId || !habiticaApiToken) {
      throw new Error("Habitica credentials are not set.");
    }

    await this.respectRateLimit();

    const options: RequestUrlParam = {
      url: `${this.apiUrl}/tasks/user?type=todos`,
      method: "GET",
      headers: this.getCommonHeaders(),
    };

    try {
      const response = await requestUrl(options);

      // Log rate limit info for debugging
      console.log("Habitica API Rate Limit Status:", {
        limit: response.headers["x-ratelimit-limit"],
        remaining: response.headers["x-ratelimit-remaining"],
        reset: response.headers["x-ratelimit-reset"],
      });

      // Filter for incomplete TODO tasks
      const todos = response.json.data.filter(
        (todo: HabiticaTodo) => !todo.completed
      );
      return todos;
    } catch (error: any) {
      console.error("Habitica API Error:", error);

      // Handle rate limiting specifically
      if (error.status === 429) {
        const retryAfter = error.headers?.["retry-after"];
        console.error(`Rate limited. Retry after: ${retryAfter} seconds`);
        throw new HabsiadApiError(
          `Habitica API rate limit exceeded. Please wait ${retryAfter} seconds.`,
          error.status,
          "RATE_LIMIT"
        );
      }

      throw error;
    }
  }
}
