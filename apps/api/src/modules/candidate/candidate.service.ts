import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CandidateService {
  private profiles: any[] = [];
  private storageDir: string;
  private storageFile: string;

  constructor() {
    this.storageDir = process.env.DATA_DIR || path.join(__dirname, '../../../data');
    this.storageFile = path.join(this.storageDir, 'profiles.json');
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        this.profiles = JSON.parse(raw);
      } else {
        this.profiles = [];
      }
    } catch {
      this.profiles = [];
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
      fs.writeFileSync(this.storageFile, JSON.stringify(this.profiles, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write candidate profiles to disk:', err);
    }
  }

  saveProfile(profile: any) {
    const id = profile.id || profile.userId || `cand_${Date.now()}`;
    const cleanProfile = {
      ...profile,
      id,
      updatedAt: new Date().toISOString(),
    };

    const idx = this.profiles.findIndex((p) => p.id === id || (p.phone && p.phone === profile.phone));
    if (idx >= 0) {
      this.profiles[idx] = cleanProfile;
    } else {
      this.profiles.push(cleanProfile);
    }

    this.saveToDisk();
    return cleanProfile;
  }

  getProfile(id: string) {
    const profile = this.profiles.find((p) => p.id === id || p.userId === id);
    if (!profile) {
      throw new NotFoundException(`Profile for candidate ${id} not found`);
    }
    return profile;
  }

  getAllProfiles() {
    return this.profiles;
  }
}
