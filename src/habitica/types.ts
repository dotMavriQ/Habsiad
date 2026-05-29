/**
 * Legacy types file - now redirects to the new modular type system
 * @deprecated Use imports from './types/index' instead
 */

// Re-export everything from the new modular type system
export * from "./types/index";

// Legacy interface for backward compatibility
export interface HabiticaUserData {
  id: string;
  profile: {
    name: string;
    // Add other properties as needed
  };
  // Include other relevant fields
}

// Note: This file is kept for backward compatibility
// New code should import from './types/index' or specific type files
