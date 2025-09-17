export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  walletAddress: string;
  profileImage?: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences: {
    currency: 'ALGO' | 'USDC' | 'USDT' | 'EURC';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      transactions: boolean;
      marketing: boolean;
    };
    privacy: {
      showBalance: boolean;
      showTransactions: boolean;
    };
  };
  kycStatus: 'not_started' | 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

class ProfileService {
  private readonly STORAGE_KEY = 'user_profile';
  private readonly BACKUP_KEY = 'user_profile_backup';

  /**
   * Get user profile from localStorage
   */
  getProfile(): UserProfile | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const profile = JSON.parse(stored);
        // Validate profile structure
        if (this.isValidProfile(profile)) {
          return profile;
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading profile:', error);
      return this.getBackupProfile();
    }
  }

  /**
   * Save user profile to localStorage
   */
  saveProfile(profile: Partial<UserProfile>): UserProfile {
    try {
      const existingProfile = this.getProfile();
      const updatedProfile: UserProfile = {
        ...this.getDefaultProfile(),
        ...existingProfile,
        ...profile,
        updatedAt: new Date().toISOString()
      };

      // Create backup before saving
      if (existingProfile) {
        localStorage.setItem(this.BACKUP_KEY, JSON.stringify(existingProfile));
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedProfile));
      return updatedProfile;
    } catch (error) {
      console.error('Error saving profile:', error);
      throw new Error('Failed to save profile');
    }
  }

  /**
   * Update specific profile fields
   */
  updateProfile(updates: Partial<UserProfile>): UserProfile {
    return this.saveProfile(updates);
  }

  /**
   * Clear profile data
   */
  clearProfile(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.BACKUP_KEY);
    } catch (error) {
      console.error('Error clearing profile:', error);
    }
  }

  /**
   * Export profile data
   */
  exportProfile(): string {
    const profile = this.getProfile();
    if (!profile) {
      throw new Error('No profile data to export');
    }
    return JSON.stringify(profile, null, 2);
  }

  /**
   * Import profile data
   */
  importProfile(profileData: string): UserProfile {
    try {
      const profile = JSON.parse(profileData);
      if (!this.isValidProfile(profile)) {
        throw new Error('Invalid profile data format');
      }
      return this.saveProfile(profile);
    } catch (error) {
      console.error('Error importing profile:', error);
      throw new Error('Failed to import profile data');
    }
  }

  /**
   * Get profile completion percentage
   */
  getProfileCompletion(): number {
    const profile = this.getProfile();
    if (!profile) return 0;

    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'country',
      'walletAddress'
    ];

    const optionalFields = [
      'dateOfBirth',
      'address.street',
      'address.city',
      'address.state',
      'address.zipCode'
    ];

    let completedRequired = 0;
    let completedOptional = 0;

    // Check required fields
    requiredFields.forEach(field => {
      if (profile[field as keyof UserProfile] && 
          String(profile[field as keyof UserProfile]).trim() !== '') {
        completedRequired++;
      }
    });

    // Check optional fields
    optionalFields.forEach(field => {
      const value = this.getNestedValue(profile, field);
      if (value && String(value).trim() !== '') {
        completedOptional++;
      }
    });

    // Required fields are worth 80%, optional fields 20%
    const requiredPercentage = (completedRequired / requiredFields.length) * 80;
    const optionalPercentage = (completedOptional / optionalFields.length) * 20;

    return Math.round(requiredPercentage + optionalPercentage);
  }

  /**
   * Validate profile structure
   */
  private isValidProfile(profile: any): profile is UserProfile {
    return (
      profile &&
      typeof profile === 'object' &&
      typeof profile.firstName === 'string' &&
      typeof profile.lastName === 'string' &&
      typeof profile.email === 'string' &&
      profile.preferences &&
      typeof profile.preferences === 'object'
    );
  }

  /**
   * Get default profile structure
   */
  private getDefaultProfile(): UserProfile {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      country: '',
      walletAddress: '',
      preferences: {
        currency: 'USDC',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          transactions: true,
          marketing: false
        },
        privacy: {
          showBalance: true,
          showTransactions: true
        }
      },
      kycStatus: 'not_started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Get backup profile if main profile is corrupted
   */
  private getBackupProfile(): UserProfile | null {
    try {
      const backup = localStorage.getItem(this.BACKUP_KEY);
      if (backup) {
        const profile = JSON.parse(backup);
        if (this.isValidProfile(profile)) {
          return profile;
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading backup profile:', error);
      return null;
    }
  }

  /**
   * Get nested object value by dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Sync profile with wallet connection
   */
  syncWithWallet(walletAddress: string): UserProfile {
    const profile = this.getProfile() || this.getDefaultProfile();
    return this.saveProfile({
      ...profile,
      walletAddress,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Get user display name
   */
  getDisplayName(): string {
    const profile = this.getProfile();
    if (!profile) return 'User';

    if (profile.firstName && profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    
    if (profile.firstName) {
      return profile.firstName;
    }

    if (profile.walletAddress) {
      return `${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-4)}`;
    }

    return 'User';
  }

  /**
   * Check if profile is complete enough for KYC
   */
  isKycReady(): boolean {
    const profile = this.getProfile();
    if (!profile) return false;

    const requiredForKyc = [
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'country',
      'dateOfBirth'
    ];

    return requiredForKyc.every(field => {
      const value = profile[field as keyof UserProfile];
      return value && String(value).trim() !== '';
    });
  }
}

export const profileService = new ProfileService();
