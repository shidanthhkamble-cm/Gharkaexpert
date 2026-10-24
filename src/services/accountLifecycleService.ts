import {
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
  updateDoc,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { UserAccountDocument, PhoneAuthCheckResult } from '../types';
import { auth, db, handleFirestoreError, OperationType } from './firebaseConfig';

const STORAGE_USERS_KEY = 'gharkaexpert_users_v2';
const STORAGE_ARCHIVED_KEY = 'gharkaexpert_archived_users_v2';
const STORAGE_CURRENT_USER_ID_KEY = 'gharkaexpert_current_uid_v2';
const STORAGE_DEVICE_ID_KEY = 'gharkaexpert_device_uuid_v2';

class AccountLifecycleService {
  /**
   * Normalizes phone number to 10-digit Indian mobile number
   */
  public normalizePhone(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length > 10 && digitsOnly.startsWith('91')) {
      return digitsOnly.slice(-10);
    }
    return digitsOnly.slice(-10);
  }

  /**
   * Generates and persists a unique cryptographic installation UUID for device matching
   */
  public getDeviceId(): string {
    try {
      const existing = localStorage.getItem(STORAGE_DEVICE_ID_KEY);
      if (existing) return existing;

      const generated =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? `dev_${crypto.randomUUID()}`
          : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(STORAGE_DEVICE_ID_KEY, generated);
      return generated;
    } catch {
      return 'dev_runtime_session';
    }
  }

  public getUsersCollection(): UserAccountDocument[] {
    try {
      const stored = localStorage.getItem(STORAGE_USERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // Ignore storage read error
    }
    return [];
  }

  private saveUsersCollection(users: UserAccountDocument[]): void {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch {
      // Ignore storage quota error
    }
  }

  public getArchivedUsersCollection(): UserAccountDocument[] {
    try {
      const stored = localStorage.getItem(STORAGE_ARCHIVED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // Ignore
    }
    return [];
  }

  private saveArchivedUsersCollection(archived: UserAccountDocument[]): void {
    try {
      localStorage.setItem(STORAGE_ARCHIVED_KEY, JSON.stringify(archived));
    } catch {
      // Ignore
    }
  }

  public getCurrentUserId(): string | null {
    if (auth.currentUser?.uid) {
      return auth.currentUser.uid;
    }
    try {
      return localStorage.getItem(STORAGE_CURRENT_USER_ID_KEY);
    } catch {
      return null;
    }
  }

  public setCurrentUserId(userId: string | null): void {
    try {
      if (userId) {
        localStorage.setItem(STORAGE_CURRENT_USER_ID_KEY, userId);
      } else {
        localStorage.removeItem(STORAGE_CURRENT_USER_ID_KEY);
      }
    } catch {
      // Ignore
    }
  }

  public getCurrentUser(): UserAccountDocument | null {
    const uid = this.getCurrentUserId();
    if (!uid) return null;
    const users = this.getUsersCollection();
    return users.find((u) => u.id === uid) || null;
  }

  public generateMaskedNameHint(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts
      .map((part) => {
        if (part.length <= 1) return part;
        return part.charAt(0) + '*'.repeat(Math.min(part.length - 1, 4));
      })
      .join(' ');
  }

  public getDaysSinceDeletion(deletedAtIso: string): number {
    try {
      const deletedMs = new Date(deletedAtIso).getTime();
      const diffMs = Date.now() - deletedMs;
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  }

  /**
   * Syncs public profile and owner-isolated PII lifecycle state to Cloud Firestore
   * whenever an authenticated Firebase session is active.
   */
  public async syncAuthenticatedUserToFirestore(userDoc: UserAccountDocument): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const uid = currentUser.uid;
    const publicPath = `users/${uid}`;
    const privatePath = `users/${uid}/private/account`;
    const publicRef = doc(db, 'users', uid);
    const privateRef = doc(db, 'users', uid, 'private', 'account');

    const safeName = (userDoc.name || 'User').trim().slice(0, 100);
    const safeRole = userDoc.role === 'worker' ? 'worker' : 'customer';
    const safePhone = (currentUser.phoneNumber || `+91${this.normalizePhone(userDoc.phoneNumber)}`).slice(0, 20);
    const safeDeviceId = (userDoc.deviceId || this.getDeviceId()).slice(0, 128);
    const safeDeletedAt = userDoc.isDeleted && userDoc.deletedAt ? userDoc.deletedAt.slice(0, 40) : '';

    let publicSnapExists = false;
    try {
      const existingSnap = await getDoc(publicRef);
      publicSnapExists = existingSnap.exists();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        handleFirestoreError(error, OperationType.GET, publicPath);
      }
      return;
    }

    const publicPayload: Record<string, unknown> = {
      ownerId: uid,
      name: safeName,
      role: safeRole,
      aadhaarVerified: Boolean(userDoc.aadhaarVerified),
      isDeleted: Boolean(userDoc.isDeleted),
      updatedAt: serverTimestamp(),
    };

    if (userDoc.trade) publicPayload.trade = String(userDoc.trade).slice(0, 40);
    if (userDoc.pincode) publicPayload.pincode = String(userDoc.pincode).slice(0, 10);
    if (typeof userDoc.experienceYears === 'number') {
      publicPayload.experienceYears = Math.min(60, Math.max(0, userDoc.experienceYears));
    }
    if (typeof userDoc.rating === 'number') {
      publicPayload.rating = Math.min(5, Math.max(0, userDoc.rating));
    }
    if (typeof userDoc.reviewsCount === 'number') {
      publicPayload.reviewsCount = Math.max(0, userDoc.reviewsCount);
    }
    if (typeof userDoc.completedJobs === 'number') {
      publicPayload.completedJobs = Math.max(0, userDoc.completedJobs);
    }
    if (typeof userDoc.dailyRate === 'number') {
      publicPayload.dailyRate = Math.min(100000, Math.max(0, userDoc.dailyRate));
    }
    if (typeof userDoc.visitingFee === 'number') {
      publicPayload.visitingFee = Math.min(50000, Math.max(0, userDoc.visitingFee));
    }
    if (userDoc.bio) {
      publicPayload.bio = String(userDoc.bio).slice(0, 500);
    }

    try {
      const batch = writeBatch(db);
      if (!publicSnapExists) {
        batch.set(publicRef, {
          ...publicPayload,
          createdAt: serverTimestamp(),
        });
        batch.set(privateRef, {
          ownerId: uid,
          phoneNumber: safePhone,
          deviceId: safeDeviceId,
          isDeleted: Boolean(userDoc.isDeleted),
          deletedAtIso: safeDeletedAt,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const { ownerId: _o, role: _r, ...updatablePublic } = publicPayload;
        batch.update(publicRef, updatablePublic);
        batch.update(privateRef, {
          phoneNumber: safePhone,
          deviceId: safeDeviceId,
          isDeleted: Boolean(userDoc.isDeleted),
          deletedAtIso: safeDeletedAt,
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        handleFirestoreError(
          error,
          publicSnapExists ? OperationType.UPDATE : OperationType.CREATE,
          `${publicPath} & ${privatePath}`
        );
      }
    }
  }

  /**
   * Soft-deletes the active user account in Firestore & local storage, then signs out of Firebase Auth
   */
  public async softDeleteAccount(userId?: string): Promise<{
    success: boolean;
    message: string;
    deletedAt: string;
    user?: UserAccountDocument;
  }> {
    const targetId = userId || this.getCurrentUserId();
    const timestamp = new Date().toISOString();

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      try {
        await updateDoc(doc(db, 'users', uid), {
          isDeleted: true,
          updatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'users', uid, 'private', 'account'), {
          isDeleted: true,
          deletedAtIso: timestamp,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
        }
      }
    }

    const users = this.getUsersCollection();
    let updatedUser: UserAccountDocument | undefined;
    if (targetId) {
      const userIndex = users.findIndex((u) => u.id === targetId);
      if (userIndex !== -1) {
        updatedUser = {
          ...users[userIndex],
          isDeleted: true,
          deletedAt: timestamp,
          updatedAt: timestamp,
        };
        users[userIndex] = updatedUser;
        this.saveUsersCollection(users);
      }
    }

    try {
      await signOut(auth);
    } catch {
      // Ignore signOut errors if offline
    }

    this.setCurrentUserId(null);

    return {
      success: true,
      message:
        'Account soft-deleted successfully. Your ratings and service history are safely preserved and can be restored by signing back in.',
      deletedAt: timestamp,
      user: updatedUser,
    };
  }

  /**
   * Checks account restoration status for an authenticated or returning phone number
   */
  public async handlePhoneLoginOrRegistration(phoneNumber: string): Promise<PhoneAuthCheckResult> {
    const cleanPhone = this.normalizePhone(phoneNumber);
    if (cleanPhone.length < 10) {
      return {
        status: 'new_user',
        message: 'Enter a valid 10-digit mobile number.',
      };
    }

    // If Firebase Auth session is active, inspect Firestore private lifecycle record first
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      try {
        const [pubSnap, privSnap] = await Promise.all([
          getDoc(doc(db, 'users', uid)),
          getDoc(doc(db, 'users', uid, 'private', 'account')),
        ]);

        if (pubSnap.exists() && privSnap.exists()) {
          const pubData = pubSnap.data();
          const privData = privSnap.data();

          const mappedUser: UserAccountDocument = {
            id: uid,
            phoneNumber: cleanPhone,
            name: String(pubData.name || 'Verified User'),
            photoUrl: '',
            role: pubData.role === 'worker' ? 'worker' : 'customer',
            isDeleted: Boolean(privData.isDeleted),
            deletedAt: privData.deletedAtIso ? String(privData.deletedAtIso) : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deviceId: String(privData.deviceId || ''),
            trade: pubData.trade,
            pincode: pubData.pincode,
            aadhaarVerified: Boolean(pubData.aadhaarVerified),
            experienceYears: pubData.experienceYears,
            rating: pubData.rating,
            reviewsCount: pubData.reviewsCount,
            completedJobs: pubData.completedJobs,
            dailyRate: pubData.dailyRate,
            visitingFee: pubData.visitingFee,
            bio: pubData.bio,
          };

          if (mappedUser.isDeleted && mappedUser.deletedAt) {
            const days = this.getDaysSinceDeletion(mappedUser.deletedAt);
            const currentDevice = this.getDeviceId();
            if (days > 60) {
              return {
                status: 'expired_new_owner',
                message: 'Previous inactive account archived. Setting up your fresh profile.',
                daysSinceDeletion: days,
              };
            }
            if (mappedUser.deviceId === currentDevice) {
              return {
                status: 'restored',
                message: 'Welcome back! Your account and service history have been restored.',
                user: mappedUser,
                daysSinceDeletion: days,
                deviceIdMatched: true,
              };
            }
            return {
              status: 'security_prompt_required',
              message: 'Please confirm your previous registered name to restore your account.',
              user: mappedUser,
              daysSinceDeletion: days,
              previousAccountNameHint: this.generateMaskedNameHint(mappedUser.name),
              deviceIdMatched: false,
            };
          }

          return {
            status: 'existing_active',
            message: 'Welcome back!',
            user: mappedUser,
          };
        }
      } catch {
        // Proceed to local check if Firestore record doesn't exist yet
      }
    }

    const users = this.getUsersCollection();
    const existingIndex = users.findIndex(
      (u) => !u.isArchived && this.normalizePhone(u.phoneNumber) === cleanPhone
    );

    if (existingIndex === -1) {
      return {
        status: 'new_user',
        message: 'Proceeding with new account registration.',
      };
    }

    const userDoc = users[existingIndex];
    if (!userDoc.isDeleted) {
      this.setCurrentUserId(userDoc.id);
      return {
        status: 'existing_active',
        message: 'Welcome back!',
        user: userDoc,
      };
    }

    const deletedAt = userDoc.deletedAt || new Date().toISOString();
    const daysSinceDeletion = this.getDaysSinceDeletion(deletedAt);
    const currentDeviceId = this.getDeviceId();
    const sameDevice = Boolean(userDoc.deviceId && userDoc.deviceId === currentDeviceId);

    if (daysSinceDeletion > 60) {
      const archivedUser = this.archiveUserRecord(
        userDoc,
        'telecom_recycled_sim_older_than_60_days'
      );
      this.saveUsersCollection(users.filter((u) => u.id !== userDoc.id));

      return {
        status: 'expired_new_owner',
        message: 'Previous inactive account archived. Setting up your fresh profile.',
        daysSinceDeletion,
        archivedPreviousUser: archivedUser,
      };
    }

    if (sameDevice) {
      const timestamp = new Date().toISOString();
      const restoredUser: UserAccountDocument = {
        ...userDoc,
        isDeleted: false,
        restoredAt: timestamp,
        updatedAt: timestamp,
        lastDeviceId: currentDeviceId,
      };

      users[existingIndex] = restoredUser;
      this.saveUsersCollection(users);
      this.setCurrentUserId(restoredUser.id);

      return {
        status: 'restored',
        message: 'Welcome back! Your account and service history have been restored.',
        user: restoredUser,
        daysSinceDeletion,
        deviceIdMatched: true,
      };
    }

    return {
      status: 'security_prompt_required',
      message: 'Please confirm your previous registered name to restore your account.',
      user: userDoc,
      daysSinceDeletion,
      previousAccountNameHint: this.generateMaskedNameHint(userDoc.name),
      deviceIdMatched: false,
    };
  }

  public async verifySecurityPromptAndRestore(
    phoneNumber: string,
    enteredName: string
  ): Promise<{
    success: boolean;
    message: string;
    user?: UserAccountDocument;
  }> {
    const cleanPhone = this.normalizePhone(phoneNumber);
    const users = this.getUsersCollection();
    const existingIndex = users.findIndex(
      (u) => !u.isArchived && this.normalizePhone(u.phoneNumber) === cleanPhone
    );

    if (existingIndex === -1) {
      return { success: false, message: 'No previous account record found.' };
    }

    const userDoc = users[existingIndex];
    if (!userDoc.isDeleted) {
      return { success: true, message: 'Account is active.', user: userDoc };
    }

    const cleanStored = userDoc.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const cleanInput = enteredName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    const storedTokens = cleanStored.split(/\s+/).filter((t) => t.length > 2);
    const inputTokens = cleanInput.split(/\s+/).filter((t) => t.length > 2);

    const isDirectMatch =
      cleanInput.length >= 2 &&
      (cleanStored.includes(cleanInput) || cleanInput.includes(cleanStored));
    const hasTokenOverlap = storedTokens.some((token) => inputTokens.includes(token));

    if (isDirectMatch || hasTokenOverlap) {
      const timestamp = new Date().toISOString();
      const currentDeviceId = this.getDeviceId();
      const restoredUser: UserAccountDocument = {
        ...userDoc,
        isDeleted: false,
        restoredAt: timestamp,
        updatedAt: timestamp,
        deviceId: currentDeviceId,
        lastDeviceId: currentDeviceId,
      };

      users[existingIndex] = restoredUser;
      this.saveUsersCollection(users);
      this.setCurrentUserId(restoredUser.id);
      void this.syncAuthenticatedUserToFirestore(restoredUser);

      return {
        success: true,
        message: 'Ownership verified. Your account, ratings, and history have been restored.',
        user: restoredUser,
      };
    }

    return {
      success: false,
      message:
        'The entered name did not match the previous account holder. If this is your new number, select "Start Fresh Profile".',
    };
  }

  public async claimAsNewSimOwnerAndArchive(
    phoneNumber: string,
    newOwnerName?: string,
    role: 'customer' | 'worker' = 'customer'
  ): Promise<{
    success: boolean;
    message: string;
    newUser: UserAccountDocument;
  }> {
    const cleanPhone = this.normalizePhone(phoneNumber);
    const users = this.getUsersCollection();
    const existingIndex = users.findIndex(
      (u) => !u.isArchived && this.normalizePhone(u.phoneNumber) === cleanPhone
    );

    if (existingIndex !== -1) {
      const oldDoc = users[existingIndex];
      this.archiveUserRecord(oldDoc, 'claimed_by_new_sim_owner');
      users.splice(existingIndex, 1);
    }

    const now = new Date().toISOString();
    const currentDeviceId = this.getDeviceId();
    const uid = auth.currentUser?.uid || `user_${Date.now()}`;
    const freshUser: UserAccountDocument = {
      id: uid,
      phoneNumber: cleanPhone,
      name: newOwnerName || (role === 'worker' ? 'Verified Karigar' : 'Customer'),
      photoUrl: '',
      role,
      isDeleted: false,
      deletedAt: null,
      restoredAt: null,
      createdAt: now,
      updatedAt: now,
      deviceId: currentDeviceId,
      lastDeviceId: currentDeviceId,
      rating: 5.0,
      reviewsCount: 0,
      completedJobs: 0,
      vipSubscription: {
        isVipUser: false,
      },
    };

    users.push(freshUser);
    this.saveUsersCollection(users);
    this.setCurrentUserId(freshUser.id);

    return {
      success: true,
      message: 'Fresh profile initialized.',
      newUser: freshUser,
    };
  }

  private archiveUserRecord(userDoc: UserAccountDocument, reason: string): UserAccountDocument {
    const timestamp = new Date().toISOString();
    const archivedDoc: UserAccountDocument = {
      ...userDoc,
      isArchived: true,
      archivedAt: timestamp,
      archiveReason: reason,
      phoneNumber: `${userDoc.phoneNumber}_archived_${Date.now()}`,
      updatedAt: timestamp,
    };

    const archivedList = this.getArchivedUsersCollection();
    archivedList.push(archivedDoc);
    this.saveArchivedUsersCollection(archivedList);

    return archivedDoc;
  }

  public saveOrUpdateUser(
    userData: Partial<UserAccountDocument> & { phoneNumber: string }
  ): UserAccountDocument {
    const cleanPhone = this.normalizePhone(userData.phoneNumber);
    const users = this.getUsersCollection();
    const existingIndex = users.findIndex(
      (u) => !u.isArchived && this.normalizePhone(u.phoneNumber) === cleanPhone
    );

    const now = new Date().toISOString();
    const currentDeviceId = this.getDeviceId();
    const firebaseUid = auth.currentUser?.uid;

    let savedDoc: UserAccountDocument;

    if (existingIndex !== -1) {
      const existing = users[existingIndex];
      savedDoc = {
        ...existing,
        ...userData,
        id: firebaseUid || existing.id,
        isDeleted: false,
        deviceId: currentDeviceId,
        lastDeviceId: currentDeviceId,
        updatedAt: now,
      };
      users[existingIndex] = savedDoc;
    } else {
      savedDoc = {
        id: firebaseUid || `user_${Date.now()}`,
        phoneNumber: cleanPhone,
        name: userData.name || 'Customer',
        photoUrl: userData.photoUrl || '',
        role: userData.role || 'customer',
        isDeleted: false,
        deletedAt: null,
        restoredAt: null,
        createdAt: now,
        updatedAt: now,
        deviceId: currentDeviceId,
        lastDeviceId: currentDeviceId,
        trade: userData.trade,
        rating: userData.rating || 5.0,
        reviewsCount: userData.reviewsCount || 0,
        experienceYears: userData.experienceYears || 5,
        pincode: userData.pincode || '',
        aadhaarVerified: userData.aadhaarVerified || false,
        aadhaarFrontUrl: userData.aadhaarFrontUrl,
        aadhaarBackUrl: userData.aadhaarBackUrl,
        bio: userData.bio,
        dailyRate: userData.dailyRate,
        visitingFee: userData.visitingFee,
        vipSubscription: userData.vipSubscription,
        completedJobs: userData.completedJobs || 0,
      };
      users.push(savedDoc);
    }

    this.saveUsersCollection(users);
    this.setCurrentUserId(savedDoc.id);
    void this.syncAuthenticatedUserToFirestore(savedDoc);

    return savedDoc;
  }
}

export const accountLifecycleService = new AccountLifecycleService();
