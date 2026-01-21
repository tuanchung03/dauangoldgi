
export enum Step {
  LANDING = 'LANDING',
  VERIFY_OTP = 'VERIFY_OTP',
  UPLOAD_PORTRAIT = 'UPLOAD_PORTRAIT',
  REMOVE_BG = 'REMOVE_BG',
  DESIGN_WORKBENCH = 'DESIGN_WORKBENCH',
  PREVIEW_FINAL = 'PREVIEW_FINAL',
  ADMIN = 'ADMIN'
}

export interface Landmark {
  id: string;
  name: string;
  coords: string;
  sketchUrl: string;
  realUrl?: string;
}

export interface Engagement {
  likes: number;
  comments: number;
  shares: number;
}

export interface Participant {
  name: string;
  phone: string;
  timestamp: string;
  landmark: string;
  shared: boolean;
  facebookLink?: string;
  engagement?: Engagement;
  lastEngagementUpdate?: string;
  image?: string;
}

export interface UserSession {
  userName?: string;
  phone?: string;
  portraitBase64?: string;
  noBgPortraitBase64?: string;
  selectedLandmark?: Landmark;
  isVerified: boolean;
  scale: number;
  position: { x: number, y: number };
  shared: boolean;
}
