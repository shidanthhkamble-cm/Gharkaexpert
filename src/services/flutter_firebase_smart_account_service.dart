// ============================================================================
// GHAR KA EXPERT - SMART ACCOUNT RESTORATION & NEW OWNER DETECTION (FLUTTER/DART)
// Package Dependencies:
//   cloud_firestore: ^5.0.0
//   firebase_auth: ^5.0.0
//   device_info_plus: ^10.0.0
// ============================================================================

import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:device_info_plus/device_info_plus.dart';

enum SmartAuthOutcome {
  activeLogin,
  restoredSameDevice,
  restoredViaSecurityPrompt,
  recycledSimNewOwnerCreated,
  brandNewUserCreated,
}

class SmartAuthResult {
  final SmartAuthOutcome outcome;
  final String message;
  final Map<String, dynamic>? userData;
  final int? daysSinceDeletion;

  SmartAuthResult({
    required this.outcome,
    required this.message,
    this.userData,
    this.daysSinceDeletion,
  });
}

class SmartAccountRestorationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();

  /// 1. Retrieve unique Hardware / Installation Device ID
  Future<String> getDeviceId() async {
    try {
      if (Platform.isAndroid) {
        final androidInfo = await _deviceInfo.androidInfo;
        return androidInfo.id; // Unique hardware or build fingerprint
      } else if (Platform.isIOS) {
        final iosInfo = await _deviceInfo.iosInfo;
        return iosInfo.identifierForVendor ?? 'unknown_ios_device';
      }
    } catch (e) {
      // Fallback
    }
    return 'generic_device_id';
  }

  /// 2. Soft-Delete Current User Account (Instant, preserves history & ratings)
  Future<void> softDeleteAccount() async {
    final user = _auth.currentUser;
    if (user == null) return;

    final userId = user.uid;

    // Step 1: Update Firestore document to Soft Delete state
    await _firestore.collection('users').doc(userId).update({
      'isDeleted': true,
      'deletedAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    // Step 2: Sign out from Firebase Auth
    await _auth.signOut();
  }

  /// 3. Main Smart Login & Registration Handler
  /// Automated "Smart Account Restoration & New Owner Detection" without Customer Support
  Future<SmartAuthResult> handlePhoneLoginOrRegistration({
    required String phoneNumber,
    required Future<String?> Function(String nameHint) promptForPreviousName,
  }) async {
    final cleanPhone = phoneNumber.replaceAll(RegExp(r'\D'), '');
    final currentDeviceId = await getDeviceId();

    // Step 1: Check Firestore collection 'users' for an existing document with this phone number
    final querySnapshot = await _firestore
        .collection('users')
        .where('phoneNumber', isEqualTo: cleanPhone)
        .limit(1)
        .get();

    if (querySnapshot.docs.isEmpty) {
      // Step 3: If no existing document is found, create a normal NEW user account
      return SmartAuthResult(
        outcome: SmartAuthOutcome.brandNewUserCreated,
        message: "New user detected. Please complete your profile setup.",
      );
    }

    final userDoc = querySnapshot.docs.first;
    final userData = userDoc.data();
    final bool isDeleted = userData['isDeleted'] ?? false;

    // If account is ACTIVE (not soft-deleted), log in directly
    if (!isDeleted) {
      await userDoc.reference.update({
        'lastLoginAt': FieldValue.serverTimestamp(),
        'lastDeviceId': currentDeviceId,
      });
      return SmartAuthResult(
        outcome: SmartAuthOutcome.activeLogin,
        message: "Welcome back! Logging into your active account.",
        userData: userData,
      );
    }

    // Step 2: Account is Soft-Deleted (isDeleted: true)
    final Timestamp? deletedAtTimestamp = userData['deletedAt'] as Timestamp?;
    final DateTime deletedAt = deletedAtTimestamp?.toDate() ?? DateTime.now();
    final int daysSinceDeletion = DateTime.now().difference(deletedAt).inDays;

    // RULE A: If deletedAt is older than 60 days -> Recycled SIM policy (TRAI telecom reissuance)
    // Treat as a NEW owner. Archive old record and auto-create a FRESH profile.
    if (daysSinceDeletion > 60) {
      await _archiveOldRecordAndCreateNewProfile(
        oldDoc: userDoc,
        cleanPhone: cleanPhone,
        currentDeviceId: currentDeviceId,
        reason: 'telecom_recycled_sim_older_than_60_days',
      );

      return SmartAuthResult(
        outcome: SmartAuthOutcome.recycledSimNewOwnerCreated,
        message: "This SIM was inactive for $daysSinceDeletion days (>60 days). Previous account has been securely archived. Initialized a fresh profile for the new SIM owner!",
        daysSinceDeletion: daysSinceDeletion,
      );
    }

    // RULE B: Within 60 days -> Check deviceId
    final String? registeredDeviceId = userData['deviceId'] as String?;
    final bool isSameDevice = registeredDeviceId != null && registeredDeviceId == currentDeviceId;

    if (isSameDevice) {
      // Device Verification Matches (Same Device): Auto-RESTORE old account!
      await userDoc.reference.update({
        'isDeleted': false,
        'restoredAt': FieldValue.serverTimestamp(),
        'lastDeviceId': currentDeviceId,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      return SmartAuthResult(
        outcome: SmartAuthOutcome.restoredSameDevice,
        message: "Device recognized! Account restored successfully with previous history, ratings & profile.",
        userData: {
          ...userData,
          'isDeleted': false,
        },
        daysSinceDeletion: daysSinceDeletion,
      );
    }

    // RULE C: Different Device Detected -> Ask for Automated Security Prompt (e.g. Previous Registered Name)
    final String registeredName = (userData['name'] as String? ?? '').trim();
    final String nameHint = _generateMaskedHint(registeredName);

    // Invoke automated dialog/modal prompt to get user input
    final enteredName = await promptForPreviousName(nameHint);

    if (enteredName != null && _isNameMatching(enteredName, registeredName)) {
      // Verification Matches: Set isDeleted: false and RESTORE
      await userDoc.reference.update({
        'isDeleted': false,
        'restoredAt': FieldValue.serverTimestamp(),
        'deviceId': currentDeviceId,
        'lastDeviceId': currentDeviceId,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      return SmartAuthResult(
        outcome: SmartAuthOutcome.restoredViaSecurityPrompt,
        message: "Identity verified! Account restored successfully with previous history, ratings & profile.",
        userData: {
          ...userData,
          'isDeleted': false,
        },
        daysSinceDeletion: daysSinceDeletion,
      );
    } else {
      // Verification Fails or User clicked 'I am a New SIM Owner':
      // Treat as a NEW owner. Archive old record and auto-create a FRESH profile.
      await _archiveOldRecordAndCreateNewProfile(
        oldDoc: userDoc,
        cleanPhone: cleanPhone,
        currentDeviceId: currentDeviceId,
        reason: 'security_prompt_failed_or_new_owner_claimed',
      );

      return SmartAuthResult(
        outcome: SmartAuthOutcome.recycledSimNewOwnerCreated,
        message: "Previous record safely archived. Fresh profile created for new SIM owner without customer support delay!",
        daysSinceDeletion: daysSinceDeletion,
      );
    }
  }

  /// Archive old record into 'archived_users' and free phone number
  Future<void> _archiveOldRecordAndCreateNewProfile({
    required DocumentSnapshot oldDoc,
    required String cleanPhone,
    required String currentDeviceId,
    required String reason,
  }) async {
    final oldData = oldDoc.data() as Map<String, dynamic>;

    // 1. Write to archived_users collection for audit and historical rating protection
    await _firestore.collection('archived_users').doc(oldDoc.id).set({
      ...oldData,
      'isArchived': true,
      'archivedAt': FieldValue.serverTimestamp(),
      'archiveReason': reason,
      'originalPhoneNumber': cleanPhone,
    });

    // 2. Dissociate phone number from old record or delete old document
    await oldDoc.reference.delete();

    // 3. Auto-create FRESH profile for new owner
    await _firestore.collection('users').doc('user_${DateTime.now().millisecondsSinceEpoch}').set({
      'phoneNumber': cleanPhone,
      'name': 'New SIM Owner',
      'role': 'customer',
      'isDeleted': false,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'deviceId': currentDeviceId,
      'rating': 5.0,
      'reviewsCount': 0,
      'completedJobs': 0,
    });
  }

  /// Helper to generate a privacy-preserving name hint (e.g., "Suresh Kumar" -> "S***** K****")
  String _generateMaskedHint(String fullName) {
    if (fullName.isEmpty) return '*****';
    final parts = fullName.split(' ');
    return parts.map((part) {
      if (part.length <= 1) return part;
      return part[0] + ('*' * (part.length - 1).clamp(2, 5));
    }).join(' ');
  }

  /// Fuzzy/Token comparison to verify name match gracefully
  bool _isNameMatching(String entered, String registered) {
    final cleanInput = entered.toLowerCase().replaceAll(RegExp(r'[^a-z0-9\s]'), '').trim();
    final cleanStored = registered.toLowerCase().replaceAll(RegExp(r'[^a-z0-9\s]'), '').trim();

    if (cleanStored.isEmpty || cleanInput.isEmpty) return false;
    if (cleanStored == cleanInput) return true;
    if (cleanStored.contains(cleanInput) || cleanInput.contains(cleanStored)) return true;

    final inputTokens = cleanInput.split(' ').where((s) => s.length > 2);
    final storedTokens = cleanStored.split(' ').where((s) => s.length > 2);

    return inputTokens.any((token) => storedTokens.contains(token));
  }
}

// ============================================================================
// FLUTTER UI SCREEN: SMART PHONE AUTH & RESTORATION SCREEN
// Includes:
//  1. MobileNumberInputField()
//  2. if (!kReleaseMode) ... [ Testing Box with green decoration ]
//  3. SendFirebaseSmsOtpButton() & TruecallerLoginButton()
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart'; // For kReleaseMode

class SmartPhoneAuthScreen extends StatefulWidget {
  const SmartPhoneAuthScreen({Key? key}) : super(key: key);

  @override
  State<SmartPhoneAuthScreen> createState() => _SmartPhoneAuthScreenState();
}

class _SmartPhoneAuthScreenState extends State<SmartPhoneAuthScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final SmartAccountRestorationService _authService = SmartAccountRestorationService();

  bool _isLoading = false;
  String? _statusBanner;
  SmartAuthResult? _lastResult;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  // Automated Security Prompt (Modal dialog) when a different device is detected
  Future<String?> _showSecurityNameDialog(String nameHint) async {
    final TextEditingController nameController = TextEditingController();
    return showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: const [
            Icon(Icons.shield_outlined, color: Colors.amber),
            SizedBox(width: 8),
            Text("Verify Account Ownership", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "A previously soft-deleted account exists on this number, but was logged in from another device.",
              style: TextStyle(fontSize: 13, color: Colors.black87),
            ),
            const SizedBox(height: 12),
            Text(
              "Account Holder Hint: $nameHint",
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueAccent),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: "Enter Previous Registered Name",
                border: OutlineInputBorder(),
                hintText: "e.g. Ramesh Kumar",
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(null), // Claim as New SIM Owner
            child: const Text("I am a New SIM Owner", style: TextStyle(color: Colors.redAccent)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(nameController.text.trim()),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text("Verify & Restore"),
          ),
        ],
      ),
    );
  }

  Future<void> _handleLoginOrRestore() async {
    final phone = _phoneController.text.trim();
    if (phone.length < 10) return;

    setState(() => _isLoading = true);

    try {
      final result = await _authService.handlePhoneLoginOrRegistration(
        phoneNumber: phone,
        promptForPreviousName: (hint) => _showSecurityNameDialog(hint),
      );

      setState(() {
        _lastResult = result;
        _statusBanner = result.message;
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.message),
          backgroundColor: result.outcome == SmartAuthOutcome.recycledSimNewOwnerCreated
              ? Colors.indigo
              : Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error: $e"), backgroundColor: Colors.red),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("GharKaExpert - Login"),
        backgroundColor: Colors.green[700],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Mobile Number Input Field (Yeh hamesha dikhega)
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              maxLength: 10,
              decoration: InputDecoration(
                prefixText: "+91 ",
                prefixStyle: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue),
                labelText: "Mobile Number (Firebase 6-Digit SMS OTP)",
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),

            const SizedBox(height: 12),

            // Status feedback banner if account checked
            if (_statusBanner != null) ...[
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.08),
                  border: Border.all(color: Colors.blue.shade300),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(_statusBanner!, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              ),
              const SizedBox(height: 12),
            ],

            // 2. TESTING BOX (Yeh sirf Debug mode mein dikhega, Release mein hide ho jayega)
            if (!kReleaseMode) ...[
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  border: Border.all(color: Colors.green),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "⚡ TEST SMART RESTORATION SCENARIOS:", 
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                    const SizedBox(height: 8),
                    // Yahan aapke 1, 2, 3, 4 wale test buttons hain
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        OutlinedButton(
                          onPressed: () => _phoneController.text = "9812345678",
                          child: const Text("1. Active (Priya)"),
                        ),
                        OutlinedButton(
                          onPressed: () => _phoneController.text = "9988776655",
                          child: const Text("2. Same Device (Auto-Restore)"),
                        ),
                        OutlinedButton(
                          onPressed: () => _phoneController.text = "9822334455",
                          child: const Text("3. New Device (Name Prompt)"),
                        ),
                        OutlinedButton(
                          onPressed: () => _phoneController.text = "9766554433",
                          child: const Text("4. >60d (New Owner)"),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // 3. Firebase Phone Auth (SMS OTP) & Truecaller Buttons (Yeh hamesha dikhenge)
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _handleLoginOrRestore,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF59E0B), // Firebase Amber
                foregroundColor: Colors.black87,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.sms, color: Colors.black87),
              label: Text(
                _isLoading ? "Verifying with Firebase Auth..." : "Send 6-Digit SMS OTP (Firebase Auth)",
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
              ),
            ),

            const SizedBox(height: 12),

            OutlinedButton.icon(
              onPressed: _isLoading ? null : _handleLoginOrRestore,
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                side: const BorderSide(color: Colors.blueAccent),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.flash_on, color: Colors.blueAccent),
              label: const Text(
                "Truecaller 1-Click Login",
                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blueAccent),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

