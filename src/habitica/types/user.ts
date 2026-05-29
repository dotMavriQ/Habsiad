/**
 * Habitica User-related TypeScript interfaces
 * Based on Habitica API v3 documentation
 */

// User profile information
export interface HabiticaUserProfile {
  name: string;
  blurb?: string;
  imageUrl?: string;
}

// User statistics
export interface HabiticaUserStats {
  hp: number;
  mp: number;
  exp: number;
  gp: number;
  lvl: number;
  class?: "warrior" | "rogue" | "wizard" | "healer";
  points: number;
  str: number;
  con: number;
  int: number;
  per: number;
  toNextLevel: number;
  maxHealth: number;
  maxMP: number;
}

// User preferences
export interface HabiticaUserPreferences {
  hair: {
    color: string;
    base: number;
    bangs: number;
    beard: number;
    mustache: number;
    flower: number;
  };
  skin: string;
  shirt: string;
  size: string;
  background: string;
  tasks: {
    confirmScoreNotes: boolean;
    groupByChallenge: boolean;
    colorPrivate: boolean;
    mirrorGroupTasks: boolean[];
  };
  dayStart: number;
  timezoneOffset: number;
  language: string;
}

// User authentication data
export interface HabiticaUserAuth {
  local?: {
    username: string;
    lowerCaseUsername: string;
    email: string;
    salt: string;
    hashed_password: string;
  };
  facebook?: any;
  google?: any;
}

// User flags for various features
export interface HabiticaUserFlags {
  showTour: boolean;
  tutorial: {
    common: {
      habitsIntro: boolean;
      dailiesIntro: boolean;
      todosIntro: boolean;
      rewardsIntro: boolean;
    };
  };
  itemdrop: {
    egg: number;
    hatchingPotion: number;
    food: number;
  };
  dropsEnabled: boolean;
  chatRevoked: boolean;
  chatShadowMuted: boolean;
  contributor: {
    level: number;
    admin: boolean;
    text: string;
  };
}

// Complete user data structure
export interface HabiticaUserData {
  id: string;
  auth: HabiticaUserAuth;
  profile: HabiticaUserProfile;
  stats: HabiticaUserStats;
  preferences: HabiticaUserPreferences;
  flags: HabiticaUserFlags;
  balance: number;
  purchased: {
    plan: {
      planId?: string;
      customerId?: string;
      dateCreated?: string;
      dateCurrentTypeCreated?: string;
      dateTerminated?: string;
      dateUpdated?: string;
      gemsBought: number;
      paymentMethod?: string;
      planDuration?: number;
      consecutive: {
        trinkets: number;
        offset: number;
        gemCapExtra: number;
      };
    };
  };
  contributor: {
    level: number;
    admin: boolean;
    text: string;
  };
  invitations: {
    guilds: any[];
    parties: any[];
  };
  items: {
    gear: {
      owned: { [key: string]: boolean };
      equipped: {
        armor: string;
        back: string;
        body: string;
        eyewear: string;
        head: string;
        headAccessory: string;
        shield: string;
        weapon: string;
      };
    };
    pets: { [key: string]: number };
    eggs: { [key: string]: number };
    food: { [key: string]: number };
    hatchingPotions: { [key: string]: number };
    quests: { [key: string]: number };
    special: {
      valentine: number;
      valentineReceived: string[];
      nye: number;
      nyeReceived: string[];
      greeting: number;
      greetingReceived: string[];
      thankyou: number;
      thankyouReceived: string[];
      birthday: number;
      birthdayReceived: string[];
    };
  };
  tags: Array<{
    id: string;
    name: string;
    challenge?: string;
    group?: string;
  }>;
  achievements: {
    originalUser: boolean;
    helpedHabit: boolean;
    completedTask: boolean;
    hatchedPet: boolean;
    fedPet: boolean;
    purchasedReward: boolean;
  };
  party: {
    _id?: string;
    order?: string;
    orderAscending?: string;
    quest?: {
      progress: {
        up: number;
        down: number;
        collect: { [key: string]: number };
      };
      RSVPNeeded: boolean;
      key?: string;
    };
  };
  guilds: string[];
  loginIncentives: number;
  invitesSent: number;
  pinnedItemsOrder: string[];
  pinnedItems: any[];
  challenges: string[];
  notifications: any[];
  habits: any[]; // Will be properly typed with task types
  dailies: any[]; // Will be properly typed with task types
  todos: any[]; // Will be properly typed with task types
  rewards: any[]; // Will be properly typed with task types
  history: {
    exp: Array<{ date: number; value: number }>;
    todos: Array<{ date: number; value: number }>;
  };
  backer: {
    tier: number;
    npc?: string;
  };
  extra: any;
  webhooks: any[];
  migration?: string;
  _v: number;
}

// Simplified user data for common operations
export interface HabiticaUserSummary {
  id: string;
  profile: {
    name: string;
  };
  stats: {
    hp: number;
    mp: number;
    exp: number;
    gp: number;
    lvl: number;
  };
}
