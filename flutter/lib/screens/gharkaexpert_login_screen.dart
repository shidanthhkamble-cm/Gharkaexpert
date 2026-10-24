import 'dart:async';
import 'dart:io';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

enum GharKaExpertRole { customer, worker }

enum _AuthFlowStage {
  phoneInput,
  otpVerify,
  workerKycAndPhoto,
}

class GharKaExpertAuthResult {
  final User user;
  final GharKaExpertRole role;
  final String phoneNumber;
  final File? profilePhoto;
  final File? kycFrontPhoto;
  final File? kycBackPhoto;

  const GharKaExpertAuthResult({
    required this.user,
    required this.role,
    required this.phoneNumber,
    this.profilePhoto,
    this.kycFrontPhoto,
    this.kycBackPhoto,
  });
}

class GharKaExpertLoginScreen extends StatefulWidget {
  final GharKaExpertRole initialRole;
  final void Function(GharKaExpertAuthResult result) onAuthCompleted;
  final VoidCallback? onBack;

  const GharKaExpertLoginScreen({
    super.key,
    this.initialRole = GharKaExpertRole.customer,
    required this.onAuthCompleted,
    this.onBack,
  });

  @override
  State<GharKaExpertLoginScreen> createState() =>
      _GharKaExpertLoginScreenState();
}

class _GharKaExpertLoginScreenState extends State<GharKaExpertLoginScreen> {
  // Primary solid deep blue brand palette
  static const Color _deepBlueBg = Color(0xFF1E3A8A);
  static const Color _deepBlueDark = Color(0xFF172554);
  static const Color _workerAmber = Color(0xFFF59E0B);

  final GlobalKey<FormState> _phoneFormKey = GlobalKey<FormState>();
  final TextEditingController _phoneController = TextEditingController();
  final List<TextEditingController> _otpControllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());

  final ImagePicker _imagePicker = ImagePicker();

  late GharKaExpertRole _selectedRole;
  _AuthFlowStage _stage = _AuthFlowStage.phoneInput;

  bool _isSendingOtp = false;
  bool _isVerifyingOtp = false;
  bool _isLaunchingCamera = false;
  bool _isCameraPermanentlyDenied = false;

  String? _verificationId;
  int? _resendToken;
  User? _authenticatedUser;

  String? _errorMessage;
  String? _infoMessage;

  Timer? _resendTimer;
  int _resendSecondsRemaining = 0;

  // Captured real camera photos (Profile Selfie + Worker KYC Documents)
  File? _profilePhotoFile;
  File? _kycFrontPhotoFile;
  File? _kycBackPhotoFile;

  @override
  void initState() {
    super.initState();
    _selectedRole = widget.initialRole;
    _recoverLostCameraDataIfNeeded();
  }

  @override
  void dispose() {
    _resendTimer?.cancel();
    _phoneController.dispose();
    for (final controller in _otpControllers) {
      controller.dispose();
    }
    for (final node in _otpFocusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  /// Recovers image captured by Android camera if MainActivity was recreated
  /// by the OS under low-memory conditions during native camera capture.
  Future<void> _recoverLostCameraDataIfNeeded() async {
    if (!Platform.isAndroid) return;
    try {
      final LostDataResponse response = await _imagePicker.retrieveLostData();
      if (response.isEmpty) return;
      if (response.file != null && mounted) {
        setState(() {
          _profilePhotoFile ??= File(response.file!.path);
        });
      }
    } catch (_) {
      // Safe no-op if no lost camera data exists
    }
  }

  String get _cleanTenDigitPhone =>
      _phoneController.text.replaceAll(RegExp(r'\D'), '');

  String get _enteredOtp =>
      _otpControllers.map((controller) => controller.text.trim()).join();

  void _startResendCountdown() {
    _resendTimer?.cancel();
    setState(() {
      _resendSecondsRemaining = 30;
    });

    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_resendSecondsRemaining <= 1) {
        timer.cancel();
        setState(() {
          _resendSecondsRemaining = 0;
        });
      } else {
        setState(() {
          _resendSecondsRemaining -= 1;
        });
      }
    });
  }

  void _switchRole(GharKaExpertRole role) {
    if (_selectedRole == role && _stage == _AuthFlowStage.phoneInput) return;
    setState(() {
      _selectedRole = role;
      _stage = _AuthFlowStage.phoneInput;
      _errorMessage = null;
      _infoMessage = null;
      _isCameraPermanentlyDenied = false;
      _clearOtpInputs();
    });
  }

  void _clearOtpInputs() {
    for (final controller in _otpControllers) {
      controller.clear();
    }
  }

  void _handleBackNavigation() {
    if (_stage == _AuthFlowStage.workerKycAndPhoto) {
      setState(() {
        _stage = _AuthFlowStage.otpVerify;
        _errorMessage = null;
        _infoMessage = null;
      });
      return;
    }
    if (_stage == _AuthFlowStage.otpVerify) {
      setState(() {
        _stage = _AuthFlowStage.phoneInput;
        _errorMessage = null;
        _infoMessage = null;
        _clearOtpInputs();
      });
      return;
    }
    if (widget.onBack != null) {
      widget.onBack!();
    } else if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    }
  }

  // ---------------------------------------------------------------------------
  // REAL CAMERA ACCESS WITH ANDROID & iOS PERMISSION CHECKS + ERROR HANDLING
  // ---------------------------------------------------------------------------

  Future<bool> _ensureCameraPermission() async {
    PermissionStatus status = await Permission.camera.status;

    if (status.isGranted || status.isLimited) {
      if (mounted && _isCameraPermanentlyDenied) {
        setState(() {
          _isCameraPermanentlyDenied = false;
        });
      }
      return true;
    }

    if (status.isDenied || status.isRestricted) {
      status = await Permission.camera.request();
    }

    if (status.isGranted || status.isLimited) {
      if (mounted) {
        setState(() {
          _isCameraPermanentlyDenied = false;
        });
      }
      return true;
    }

    if (status.isPermanentlyDenied) {
      if (mounted) {
        setState(() {
          _isCameraPermanentlyDenied = true;
          _errorMessage =
              'Camera access is permanently disabled. Tap "Open Settings" below and allow Camera permission for GharKaExpert.';
        });
      }
      return false;
    }

    if (mounted) {
      setState(() {
        _isCameraPermanentlyDenied = false;
        _errorMessage =
            'Camera permission is required to capture your photo. Please allow camera access when prompted.';
      });
    }
    return false;
  }

  Future<void> _capturePhotoFromRealCamera({
    required ValueChanged<File> onPhotoCaptured,
    required CameraDevice preferredCamera,
    required String successLabel,
  }) async {
    if (_isLaunchingCamera) return;

    setState(() {
      _isLaunchingCamera = true;
      _errorMessage = null;
      _infoMessage = null;
    });

    try {
      final bool hasPermission = await _ensureCameraPermission();
      if (!hasPermission) {
        if (mounted) {
          setState(() {
            _isLaunchingCamera = false;
          });
        }
        return;
      }

      final XFile? pickedImage = await _imagePicker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: preferredCamera,
        imageQuality: 85,
        maxWidth: 1440,
        maxHeight: 1440,
      );

      if (!mounted) return;

      if (pickedImage == null) {
        // User closed camera without taking a photo
        setState(() {
          _isLaunchingCamera = false;
        });
        return;
      }

      final File capturedFile = File(pickedImage.path);
      if (!await capturedFile.exists()) {
        setState(() {
          _isLaunchingCamera = false;
          _errorMessage =
              'Captured photo could not be read from device storage. Please try again.';
        });
        return;
      }

      onPhotoCaptured(capturedFile);
      setState(() {
        _isLaunchingCamera = false;
        _infoMessage = successLabel;
      });
    } on PlatformException catch (e) {
      if (!mounted) return;
      final String code = e.code.toLowerCase();
      final bool permissionIssue =
          code.contains('camera_access_denied') || code.contains('permission');
      setState(() {
        _isLaunchingCamera = false;
        _isCameraPermanentlyDenied = permissionIssue;
        _errorMessage = permissionIssue
            ? 'Camera access was denied by the device. Please enable Camera permission in Settings.'
            : (e.message ??
                'Unable to open device camera. Please ensure no other app is using the camera.');
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLaunchingCamera = false;
        _errorMessage =
            'Could not access the smartphone camera. Please try again.';
      });
    }
  }

  // ---------------------------------------------------------------------------
  // FIREBASE 6-DIGIT SMS OTP AUTHENTICATION
  // ---------------------------------------------------------------------------

  Future<void> _sendSixDigitSmsOtp({bool isResend = false}) async {
    FocusScope.of(context).unfocus();

    if (!isResend && !(_phoneFormKey.currentState?.validate() ?? false)) {
      return;
    }

    final String digits = _cleanTenDigitPhone;
    if (!RegExp(r'^[6-9]\d{9}$').hasMatch(digits)) {
      setState(() {
        _errorMessage = 'Please enter a valid 10-digit Indian mobile number.';
      });
      return;
    }

    final String e164Phone = '+91$digits';

    setState(() {
      _isSendingOtp = true;
      _errorMessage = null;
      _infoMessage = null;
    });

    try {
      await FirebaseAuth.instance.verifyPhoneNumber(
        phoneNumber: e164Phone,
        timeout: const Duration(seconds: 60),
        forceResendingToken: isResend ? _resendToken : null,
        verificationCompleted: (PhoneAuthCredential credential) async {
          try {
            final UserCredential userCred =
                await FirebaseAuth.instance.signInWithCredential(credential);
            if (!mounted) return;
            setState(() {
              _isSendingOtp = false;
              _isVerifyingOtp = false;
            });
            if (userCred.user != null) {
              _handlePostOtpAuthenticated(userCred.user!, e164Phone);
            }
          } on FirebaseAuthException catch (e) {
            if (!mounted) return;
            setState(() {
              _isSendingOtp = false;
              _isVerifyingOtp = false;
              _errorMessage = _mapFirebaseError(e);
            });
          }
        },
        verificationFailed: (FirebaseAuthException e) {
          if (!mounted) return;
          setState(() {
            _isSendingOtp = false;
            _errorMessage = _mapFirebaseError(e);
          });
        },
        codeSent: (String verificationId, int? resendToken) {
          if (!mounted) return;
          _clearOtpInputs();
          setState(() {
            _verificationId = verificationId;
            _resendToken = resendToken;
            _isSendingOtp = false;
            _stage = _AuthFlowStage.otpVerify;
            _infoMessage = '6-digit SMS OTP sent to +91 $digits.';
          });
          _startResendCountdown();
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              _otpFocusNodes.first.requestFocus();
            }
          });
        },
        codeAutoRetrievalTimeout: (String verificationId) {
          if (!mounted) return;
          _verificationId = verificationId;
        },
      );
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isSendingOtp = false;
        _errorMessage =
            'Unable to send SMS OTP right now. Please check your connection and try again.';
      });
    }
  }

  Future<void> _verifySixDigitSmsOtp() async {
    FocusScope.of(context).unfocus();

    final String smsCode = _enteredOtp;
    if (smsCode.length != 6) {
      setState(() {
        _errorMessage = 'Please enter the complete 6-digit SMS OTP.';
      });
      return;
    }

    if (_verificationId == null || _verificationId!.isEmpty) {
      setState(() {
        _errorMessage =
            'Verification session expired. Please tap Resend SMS OTP.';
      });
      return;
    }

    setState(() {
      _isVerifyingOtp = true;
      _errorMessage = null;
    });

    try {
      final PhoneAuthCredential credential = PhoneAuthProvider.credential(
        verificationId: _verificationId!,
        smsCode: smsCode,
      );
      final UserCredential userCred =
          await FirebaseAuth.instance.signInWithCredential(credential);

      if (!mounted) return;
      setState(() {
        _isVerifyingOtp = false;
      });

      if (userCred.user != null) {
        _handlePostOtpAuthenticated(
          userCred.user!,
          '+91$_cleanTenDigitPhone',
        );
      }
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      setState(() {
        _isVerifyingOtp = false;
        _errorMessage = _mapFirebaseError(e);
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isVerifyingOtp = false;
        _errorMessage =
            'Unable to verify OTP. Please check your internet connection and retry.';
      });
    }
  }

  void _handlePostOtpAuthenticated(User user, String e164Phone) {
    _authenticatedUser = user;

    if (_selectedRole == GharKaExpertRole.worker) {
      setState(() {
        _stage = _AuthFlowStage.workerKycAndPhoto;
        _errorMessage = null;
        _infoMessage =
            'Mobile verified. Capture your Profile Photo & Aadhaar KYC using your camera.';
      });
      return;
    }

    widget.onAuthCompleted(
      GharKaExpertAuthResult(
        user: user,
        role: _selectedRole,
        phoneNumber: e164Phone,
        profilePhoto: _profilePhotoFile,
      ),
    );
  }

  void _completeWorkerKycSubmission() {
    if (_profilePhotoFile == null) {
      setState(() {
        _errorMessage =
            'Please capture your live Profile Photo using the camera.';
      });
      return;
    }
    if (_kycFrontPhotoFile == null || _kycBackPhotoFile == null) {
      setState(() {
        _errorMessage =
            'Please capture both Front and Back photos of your Aadhaar card.';
      });
      return;
    }

    final User? currentUser =
        _authenticatedUser ?? FirebaseAuth.instance.currentUser;
    if (currentUser == null) {
      setState(() {
        _stage = _AuthFlowStage.phoneInput;
        _errorMessage = 'Session expired. Please verify your mobile number.';
      });
      return;
    }

    widget.onAuthCompleted(
      GharKaExpertAuthResult(
        user: currentUser,
        role: GharKaExpertRole.worker,
        phoneNumber: '+91$_cleanTenDigitPhone',
        profilePhoto: _profilePhotoFile,
        kycFrontPhoto: _kycFrontPhotoFile,
        kycBackPhoto: _kycBackPhotoFile,
      ),
    );
  }

  String _mapFirebaseError(FirebaseAuthException e) {
    switch (e.code) {
      case 'invalid-phone-number':
        return 'Invalid mobile number. Please check the 10-digit number.';
      case 'too-many-requests':
        return 'Too many OTP requests. Please wait a few minutes and try again.';
      case 'invalid-verification-code':
        return 'Incorrect 6-digit SMS OTP. Please check your SMS messages.';
      case 'session-expired':
        return 'This OTP has expired. Please tap Resend SMS OTP.';
      case 'network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return e.message ?? 'Authentication failed. Please try again.';
    }
  }

  void _onOtpDigitChanged(int index, String value) {
    final String digitsOnly = value.replaceAll(RegExp(r'\D'), '');

    if (digitsOnly.length > 1) {
      for (int i = 0; i < 6; i++) {
        _otpControllers[i].text = i < digitsOnly.length ? digitsOnly[i] : '';
      }
      final int targetFocus = digitsOnly.length >= 6 ? 5 : digitsOnly.length;
      _otpFocusNodes[targetFocus].requestFocus();
      setState(() {
        _errorMessage = null;
      });
      return;
    }

    _otpControllers[index].text = digitsOnly;
    _otpControllers[index].selection = TextSelection.fromPosition(
      TextPosition(offset: _otpControllers[index].text.length),
    );

    if (digitsOnly.isNotEmpty && index < 5) {
      _otpFocusNodes[index + 1].requestFocus();
    }

    setState(() {
      _errorMessage = null;
    });
  }

  // ---------------------------------------------------------------------------
  // FULL-HEIGHT SOLID DEEP BLUE UI LAYOUT (ZERO BOTTOM WHITE GAP)
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final bool isCustomer = _selectedRole == GharKaExpertRole.customer;
    final EdgeInsets systemPadding = MediaQuery.paddingOf(context);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
        systemNavigationBarColor: _deepBlueBg,
        systemNavigationBarIconBrightness: Brightness.light,
      ),
      child: Scaffold(
        backgroundColor: _deepBlueBg,
        resizeToAvoidBottomInset: true,
        // SizedBox.expand + ColoredBox guarantees 100% screen width & height
        // coverage from top status bar to bottom gesture indicator with zero white space.
        body: SizedBox.expand(
          child: ColoredBox(
            color: _deepBlueBg,
            child: SafeArea(
              bottom: false,
              child: LayoutBuilder(
                builder: (BuildContext context, BoxConstraints viewport) {
                  return SingleChildScrollView(
                    physics: const ClampingScrollPhysics(),
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minWidth: double.infinity,
                        minHeight: viewport.maxHeight,
                      ),
                      child: IntrinsicHeight(
                        child: Padding(
                          padding: EdgeInsets.fromLTRB(
                            20,
                            14,
                            20,
                            systemPadding.bottom + 20,
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.max,
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              _buildTopBar(),
                              const SizedBox(height: 16),
                              _buildBrandHeader(),
                              const SizedBox(height: 24),
                              _buildWhiteContainerCard(isCustomer),
                              const Spacer(),
                              const Padding(
                                padding: EdgeInsets.only(top: 24),
                                child: Text(
                                  'GharKaExpert · Secure SMS Verification powered by Firebase',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Color(0xFFBFDBFE),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    final bool canGoBack = _stage != _AuthFlowStage.phoneInput ||
        widget.onBack != null ||
        Navigator.of(context).canPop();

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        if (canGoBack)
          TextButton.icon(
            onPressed: _handleBackNavigation,
            style: TextButton.styleFrom(
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              minimumSize: const Size(44, 44),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.arrow_back_rounded, size: 18),
            label: const Text(
              'Back',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
          )
        else
          const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.verified_user_rounded,
                color: Color(0xFFFBBF24),
                size: 16,
              ),
              SizedBox(width: 6),
              Text(
                'Direct Hiring · 0% Commission',
                style: TextStyle(
                  color: Color(0xFFDBEAFE),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        Text(
          _selectedRole == GharKaExpertRole.customer
              ? 'Customer Account'
              : 'Karigar Account',
          style: const TextStyle(
            color: Color(0xFFDBEAFE),
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildBrandHeader() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.18),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.engineering_rounded,
                color: _deepBlueBg,
                size: 32,
              ),
            ),
            Positioned(
              right: -4,
              bottom: -4,
              child: Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: _workerAmber,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.handyman_rounded,
                  color: Color(0xFF0F172A),
                  size: 14,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(width: 14),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'GharKaExpert',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.4,
                  height: 1.15,
                ),
              ),
              SizedBox(height: 3),
              Text(
                'Trusted Local Karigars & Home Services',
                style: TextStyle(
                  color: Color(0xFFDBEAFE),
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildWhiteContainerCard(bool isCustomer) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: _deepBlueDark.withValues(alpha: 0.35),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_stage == _AuthFlowStage.phoneInput) ...[
            _buildRoleSegmentedToggle(isCustomer),
            const SizedBox(height: 20),
          ],
          _buildCardHeader(isCustomer),
          const SizedBox(height: 18),
          if (_infoMessage != null && _errorMessage == null) ...[
            _buildAlertBanner(message: _infoMessage!, isError: false),
            const SizedBox(height: 16),
          ],
          if (_errorMessage != null) ...[
            _buildAlertBanner(message: _errorMessage!, isError: true),
            if (_isCameraPermanentlyDenied) ...[
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: openAppSettings,
                  icon: const Icon(Icons.settings_rounded, size: 16),
                  label: const Text(
                    'Open Settings',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),
          ],
          if (_stage == _AuthFlowStage.phoneInput)
            _buildPhoneInputForm(isCustomer)
          else if (_stage == _AuthFlowStage.otpVerify)
            _buildOtpVerificationForm(isCustomer)
          else
            _buildWorkerKycCameraForm(),
        ],
      ),
    );
  }

  Widget _buildRoleSegmentedToggle(bool isCustomer) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => _switchRole(GharKaExpertRole.customer),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                height: 40,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: isCustomer ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(9),
                  boxShadow: isCustomer
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          ),
                        ]
                      : null,
                ),
                child: Text(
                  'Customer Login',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isCustomer ? FontWeight.w700 : FontWeight.w600,
                    color:
                        isCustomer ? _deepBlueBg : const Color(0xFF475569),
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => _switchRole(GharKaExpertRole.worker),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                height: 40,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: !isCustomer ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(9),
                  boxShadow: !isCustomer
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          ),
                        ]
                      : null,
                ),
                child: Text(
                  'Worker Login',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: !isCustomer ? FontWeight.w700 : FontWeight.w600,
                    color:
                        !isCustomer ? _deepBlueBg : const Color(0xFF475569),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardHeader(bool isCustomer) {
    if (_stage == _AuthFlowStage.otpVerify) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Verify 6-Digit SMS OTP',
            style: TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Enter the 6-digit verification code sent via SMS to +91 $_cleanTenDigitPhone',
            style: const TextStyle(
              color: Color(0xFF475569),
              fontSize: 13,
              height: 1.4,
            ),
          ),
        ],
      );
    }

    if (_stage == _AuthFlowStage.workerKycAndPhoto) {
      return const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Camera KYC & Profile Photo',
            style: TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Capture a clear live selfie and your Aadhaar card photos directly using your smartphone camera.',
            style: TextStyle(
              color: Color(0xFF475569),
              fontSize: 13,
              height: 1.4,
            ),
          ),
        ],
      );
    }

    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color:
                isCustomer ? const Color(0xFFEFF6FF) : const Color(0xFFFFFBEB),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isCustomer
                  ? const Color(0xFFDBEAFE)
                  : const Color(0xFFFDE68A),
            ),
          ),
          child: Icon(
            isCustomer ? Icons.home_rounded : Icons.engineering_rounded,
            color: isCustomer ? _deepBlueBg : const Color(0xFFB45309),
            size: 26,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isCustomer ? 'Customer Login' : 'Worker / Karigar Login',
                style: const TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 19,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'Enter your 10-digit mobile number to receive a 6-digit SMS OTP',
                style: TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 12.5,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPhoneInputForm(bool isCustomer) {
    final bool isPhoneReady = _cleanTenDigitPhone.length == 10;

    return Form(
      key: _phoneFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Optional Quick Profile Photo Capture for Customers or Pre-Login Workers
          _buildOptionalProfileCameraRow(),
          const SizedBox(height: 18),
          const Text(
            'Mobile Number',
            style: TextStyle(
              color: Color(0xFF334155),
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            autofillHints: const [AutofillHints.telephoneNumberNational],
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(10),
            ],
            onChanged: (_) {
              setState(() {
                if (_errorMessage != null) _errorMessage = null;
              });
            },
            style: const TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 16,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.1,
            ),
            decoration: InputDecoration(
              hintText: 'Enter 10-digit mobile number',
              hintStyle: const TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 14,
                fontWeight: FontWeight.w400,
                letterSpacing: 0,
              ),
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 15,
              ),
              prefixIcon: Container(
                width: 56,
                alignment: Alignment.center,
                child: const Text(
                  '+91',
                  style: TextStyle(
                    color: _deepBlueBg,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: _deepBlueBg, width: 1.8),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFFE11D48)),
              ),
              focusedErrorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide:
                    const BorderSide(color: Color(0xFFE11D48), width: 1.8),
              ),
            ),
            validator: (value) {
              final String clean =
                  (value ?? '').replaceAll(RegExp(r'\D'), '');
              if (!RegExp(r'^[6-9]\d{9}$').hasMatch(clean)) {
                return 'Enter a valid 10-digit mobile number';
              }
              return null;
            },
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 50,
            child: ElevatedButton(
              onPressed: (!isPhoneReady || _isSendingOtp)
                  ? null
                  : () => _sendSixDigitSmsOtp(),
              style: ElevatedButton.styleFrom(
                backgroundColor: isCustomer ? _deepBlueBg : _workerAmber,
                foregroundColor:
                    isCustomer ? Colors.white : const Color(0xFF0F172A),
                disabledBackgroundColor: const Color(0xFFE2E8F0),
                disabledForegroundColor: const Color(0xFF94A3B8),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: _isSendingOtp
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.4,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          isCustomer
                              ? Colors.white
                              : const Color(0xFF0F172A),
                        ),
                      ),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.sms_rounded,
                          size: 18,
                          color: isCustomer
                              ? const Color(0xFFFCD34D)
                              : const Color(0xFF0F172A),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Send 6-Digit SMS OTP',
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(Icons.arrow_forward_rounded, size: 18),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOptionalProfileCameraRow() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => _capturePhotoFromRealCamera(
              preferredCamera: CameraDevice.front,
              successLabel: 'Profile photo captured via front camera.',
              onPhotoCaptured: (file) {
                setState(() {
                  _profilePhotoFile = file;
                });
              },
            ),
            child: Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFEFF6FF),
                border: Border.all(color: _deepBlueBg, width: 1.8),
              ),
              clipBehavior: Clip.antiAlias,
              child: _profilePhotoFile != null
                  ? Image.file(
                      _profilePhotoFile!,
                      fit: BoxFit.cover,
                    )
                  : const Icon(
                      Icons.camera_alt_rounded,
                      color: _deepBlueBg,
                      size: 22,
                    ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _profilePhotoFile != null
                      ? 'Profile Photo Attached'
                      : 'Profile Photo (Camera)',
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _selectedRole == GharKaExpertRole.worker
                      ? 'Capture now or during Karigar KYC step'
                      : 'Optional: Capture your profile photo via camera',
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 11.5,
                  ),
                ),
              ],
            ),
          ),
          TextButton.icon(
            onPressed: _isLaunchingCamera
                ? null
                : () => _capturePhotoFromRealCamera(
                      preferredCamera: CameraDevice.front,
                      successLabel: 'Profile photo captured via front camera.',
                      onPhotoCaptured: (file) {
                        setState(() {
                          _profilePhotoFile = file;
                        });
                      },
                    ),
            style: TextButton.styleFrom(
              foregroundColor: _deepBlueBg,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              minimumSize: const Size(44, 40),
              backgroundColor: const Color(0xFFEFF6FF),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            icon: const Icon(Icons.photo_camera_front_rounded, size: 16),
            label: Text(
              _profilePhotoFile != null ? 'Retake' : 'Camera',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOtpVerificationForm(bool isCustomer) {
    final bool isOtpComplete = _enteredOtp.length == 6;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(6, (index) {
            return SizedBox(
              width: 45,
              height: 54,
              child: KeyboardListener(
                focusNode: FocusNode(skipTraversal: true),
                onKeyEvent: (KeyEvent event) {
                  if (event is KeyDownEvent &&
                      event.logicalKey == LogicalKeyboardKey.backspace &&
                      _otpControllers[index].text.isEmpty &&
                      index > 0) {
                    _otpFocusNodes[index - 1].requestFocus();
                  }
                },
                child: TextField(
                  controller: _otpControllers[index],
                  focusNode: _otpFocusNodes[index],
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  autofillHints:
                      index == 0 ? const [AutofillHints.oneTimeCode] : null,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(index == 0 ? 6 : 1),
                  ],
                  onChanged: (val) => _onOtpDigitChanged(index, val),
                  style: const TextStyle(
                    color: _deepBlueBg,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                  decoration: InputDecoration(
                    counterText: '',
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: EdgeInsets.zero,
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: _errorMessage != null
                            ? const Color(0xFFFDA4AF)
                            : const Color(0xFFCBD5E1),
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide:
                          const BorderSide(color: _deepBlueBg, width: 1.8),
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              "Didn't receive SMS?",
              style: TextStyle(
                color: Color(0xFF64748B),
                fontSize: 12.5,
              ),
            ),
            if (_resendSecondsRemaining == 0)
              TextButton.icon(
                onPressed: _isSendingOtp
                    ? null
                    : () => _sendSixDigitSmsOtp(isResend: true),
                style: TextButton.styleFrom(
                  foregroundColor: _deepBlueBg,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  minimumSize: const Size(44, 36),
                ),
                icon: const Icon(Icons.refresh_rounded, size: 16),
                label: const Text(
                  'Resend SMS OTP',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              )
            else
              Text(
                'Resend in ${_resendSecondsRemaining}s',
                style: const TextStyle(
                  color: Color(0xFF475569),
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 50,
          child: ElevatedButton(
            onPressed: (!isOtpComplete || _isVerifyingOtp)
                ? null
                : _verifySixDigitSmsOtp,
            style: ElevatedButton.styleFrom(
              backgroundColor: isCustomer ? _deepBlueBg : _workerAmber,
              foregroundColor:
                  isCustomer ? Colors.white : const Color(0xFF0F172A),
              disabledBackgroundColor: const Color(0xFFE2E8F0),
              disabledForegroundColor: const Color(0xFF94A3B8),
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: _isVerifyingOtp
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        isCustomer ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                  )
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Verify OTP & Continue',
                        style: TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(width: 6),
                      Icon(Icons.arrow_forward_rounded, size: 18),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // WORKER REAL CAMERA KYC & LIVE SELFIE CAPTURE WIDGETS
  // ---------------------------------------------------------------------------

  Widget _buildWorkerKycCameraForm() {
    final bool allCaptured = _profilePhotoFile != null &&
        _kycFrontPhotoFile != null &&
        _kycBackPhotoFile != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // 1. Live Profile Selfie (Front Camera)
        Center(
          child: Column(
            children: [
              GestureDetector(
                onTap: _isLaunchingCamera
                    ? null
                    : () => _capturePhotoFromRealCamera(
                          preferredCamera: CameraDevice.front,
                          successLabel: 'Live profile selfie captured.',
                          onPhotoCaptured: (file) {
                            setState(() {
                              _profilePhotoFile = file;
                            });
                          },
                        ),
                child: Container(
                  width: 112,
                  height: 112,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFFF1F5F9),
                    border: Border.all(
                      color: _profilePhotoFile != null
                          ? const Color(0xFF059669)
                          : _deepBlueBg,
                      width: 3,
                    ),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: _profilePhotoFile != null
                      ? Image.file(
                          _profilePhotoFile!,
                          fit: BoxFit.cover,
                        )
                      : const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.photo_camera_front_rounded,
                              color: _deepBlueBg,
                              size: 32,
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Take Selfie',
                              style: TextStyle(
                                color: _deepBlueBg,
                                fontSize: 11.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: _isLaunchingCamera
                    ? null
                    : () => _capturePhotoFromRealCamera(
                          preferredCamera: CameraDevice.front,
                          successLabel: 'Live profile selfie captured.',
                          onPhotoCaptured: (file) {
                            setState(() {
                              _profilePhotoFile = file;
                            });
                          },
                        ),
                icon: const Icon(Icons.camera_alt_rounded, size: 16),
                label: Text(
                  _profilePhotoFile != null
                      ? 'Retake Profile Selfie'
                      : 'Open Front Camera for Selfie',
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 12.5,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // 2. Aadhaar Front Card (Rear Camera)
        _buildKycDocumentCameraTile(
          title: '1. Aadhaar Card — Front Photo',
          subtitle: 'Capture clear name & 12-digit Aadhaar number',
          capturedFile: _kycFrontPhotoFile,
          onCapturePressed: () => _capturePhotoFromRealCamera(
            preferredCamera: CameraDevice.rear,
            successLabel: 'Aadhaar Front photo captured.',
            onPhotoCaptured: (file) {
              setState(() {
                _kycFrontPhotoFile = file;
              });
            },
          ),
        ),
        const SizedBox(height: 12),

        // 3. Aadhaar Back Card (Rear Camera)
        _buildKycDocumentCameraTile(
          title: '2. Aadhaar Card — Back Photo',
          subtitle: 'Capture residential address side clearly',
          capturedFile: _kycBackPhotoFile,
          onCapturePressed: () => _capturePhotoFromRealCamera(
            preferredCamera: CameraDevice.rear,
            successLabel: 'Aadhaar Back photo captured.',
            onPhotoCaptured: (file) {
              setState(() {
                _kycBackPhotoFile = file;
              });
            },
          ),
        ),
        const SizedBox(height: 20),

        SizedBox(
          height: 50,
          child: ElevatedButton.icon(
            onPressed: _isLaunchingCamera ? null : _completeWorkerKycSubmission,
            style: ElevatedButton.styleFrom(
              backgroundColor:
                  allCaptured ? const Color(0xFF059669) : _deepBlueBg,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            icon: const Icon(Icons.verified_rounded, size: 19),
            label: const Text(
              'Complete KYC & Activate Profile',
              style: TextStyle(
                fontSize: 14.5,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildKycDocumentCameraTile({
    required String title,
    required String subtitle,
    required File? capturedFile,
    required VoidCallback onCapturePressed,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: capturedFile != null
              ? const Color(0xFFA7F3D0)
              : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(
                Icons.badge_rounded,
                size: 18,
                color: _deepBlueBg,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              if (capturedFile != null)
                const Text(
                  'Captured',
                  style: TextStyle(
                    color: Color(0xFF059669),
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 11.5,
            ),
          ),
          const SizedBox(height: 10),
          if (capturedFile != null)
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.file(
                    capturedFile,
                    width: 84,
                    height: 56,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Document photo ready',
                    style: TextStyle(
                      color: Color(0xFF1E293B),
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                OutlinedButton.icon(
                  onPressed: _isLaunchingCamera ? null : onCapturePressed,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: _deepBlueBg,
                    side: const BorderSide(color: Color(0xFFCBD5E1)),
                    minimumSize: const Size(44, 38),
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  icon: const Icon(Icons.camera_alt_rounded, size: 15),
                  label: const Text(
                    'Retake',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            )
          else
            SizedBox(
              height: 42,
              child: ElevatedButton.icon(
                onPressed: _isLaunchingCamera ? null : onCapturePressed,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _deepBlueBg,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(11),
                  ),
                ),
                icon: const Icon(Icons.photo_camera_back_rounded, size: 17),
                label: const Text(
                  'Open Camera',
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildAlertBanner({
    required String message,
    required bool isError,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isError ? const Color(0xFFFFF1F2) : const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isError ? const Color(0xFFFECDD3) : const Color(0xFFA7F3D0),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isError
                ? Icons.error_outline_rounded
                : Icons.check_circle_outline_rounded,
            size: 18,
            color: isError ? const Color(0xFFE11D48) : const Color(0xFF059669),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color:
                    isError ? const Color(0xFF9F1239) : const Color(0xFF065F46),
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
