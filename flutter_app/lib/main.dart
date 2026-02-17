import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app_config.dart';
import 'app_state.dart';
import 'storage_keys.dart';
import 'api/api_client.dart';
import 'i18n.dart';
import 'ui/auth/check_email_screen.dart';
import 'ui/auth/forgot_password_screen.dart';
import 'ui/auth/login_screen.dart';
import 'ui/auth/register_screen.dart';
import 'ui/auth/reset_password_screen.dart';
import 'ui/auth/verify_email_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SocialFlowApp());
}

class SocialFlowApp extends StatelessWidget {
  const SocialFlowApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const _StateLoader();
  }
}

class _StateLoader extends StatefulWidget {
  const _StateLoader();

  @override
  State<_StateLoader> createState() => _StateLoaderState();
}

class _StateLoaderState extends State<_StateLoader> {
  AppState? _state;

  @override
  void initState() {
    super.initState();
    unawaited(_load());
  }

  Future<void> _load() async {
    final state = await AppState.load();
    if (!mounted) return;
    setState(() => _state = state);
  }

  @override
  Widget build(BuildContext context) {
    final state = _state;
    if (state == null) {
      return const MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(body: Center(child: CircularProgressIndicator())),
      );
    }

    final lightScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF0D1422),
      brightness: Brightness.light,
    );
    final darkScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF0D1422),
      brightness: Brightness.dark,
      surface: const Color(0xFF0F162A),
    );

    return AnimatedBuilder(
      animation: state,
      builder: (context, _) {
        final themeMode =
            state.themeMode == AppThemeMode.dark ? ThemeMode.dark : ThemeMode.light;

        return MaterialApp(
          title: 'SocialFlow',
          debugShowCheckedModeBanner: false,
          themeMode: themeMode,
          theme: ThemeData(
            useMaterial3: true,
            colorScheme: lightScheme,
            fontFamily: 'Tajawal',
            inputDecorationTheme: InputDecorationTheme(
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
          darkTheme: ThemeData(
            useMaterial3: true,
            colorScheme: darkScheme,
            fontFamily: 'Tajawal',
            inputDecorationTheme: InputDecorationTheme(
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
          locale: Locale(state.locale),
          builder: (context, child) {
            return Directionality(
              textDirection: state.dir,
              child: child ?? const SizedBox.shrink(),
            );
          },
          home: AppBootstrap(state: state),
        );
      },
    );
  }
}

class AppBootstrap extends StatefulWidget {
  const AppBootstrap({super.key, required this.state});

  final AppState state;

  @override
  State<AppBootstrap> createState() => _AppBootstrapState();
}

class _AppBootstrapState extends State<AppBootstrap> {
  final ApiClient _api = ApiClient(baseUri: AppConfig.baseUri);

  bool _loading = true;
  String? _token;
  String _name = '';
  String _email = '';

  @override
  void initState() {
    super.initState();
    unawaited(_restoreSession());
  }

  Future<void> _restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final savedToken = (prefs.getString(StorageKeys.mobileAccessToken) ?? '').trim();
    final savedName = prefs.getString(StorageKeys.mobileUserName) ?? '';
    final savedEmail = prefs.getString(StorageKeys.mobileUserEmail) ?? '';

    if (savedToken.isEmpty) {
      if (!mounted) return;
      setState(() {
        _loading = false;
      });
      return;
    }

    try {
      final me = await _api.fetchMobileMe(savedToken);
      if (!mounted) return;
      setState(() {
        _token = savedToken;
        _name = me['name']?.toString() ?? savedName;
        _email = me['email']?.toString() ?? savedEmail;
        _loading = false;
      });
    } catch (_) {
      await prefs.remove(StorageKeys.mobileAccessToken);
      await prefs.remove(StorageKeys.mobileUserName);
      await prefs.remove(StorageKeys.mobileUserEmail);
      if (!mounted) return;
      setState(() {
        _token = null;
        _name = '';
        _email = '';
        _loading = false;
      });
    }
  }

  Future<void> _handleSignedIn(AuthSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(StorageKeys.mobileAccessToken, session.accessToken);
    await prefs.setString(StorageKeys.mobileUserName, session.name);
    await prefs.setString(StorageKeys.mobileUserEmail, session.email);

    if (!mounted) return;
    setState(() {
      _token = session.accessToken;
      _name = session.name;
      _email = session.email;
    });
  }

  Future<void> _handleSignOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(StorageKeys.mobileAccessToken);
    await prefs.remove(StorageKeys.mobileUserName);
    await prefs.remove(StorageKeys.mobileUserEmail);

    if (!mounted) return;
    setState(() {
      _token = null;
      _name = '';
      _email = '';
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_token == null || _token!.isEmpty) {
      return AuthFlow(state: widget.state, api: _api, onSignedIn: _handleSignedIn);
    }

    return SocialShell(
      api: _api,
      accessToken: _token!,
      userName: _name,
      userEmail: _email,
      onSignOut: _handleSignOut,
    );
  }
}

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.api, required this.onSignedIn});

  final ApiClient api;
  final Future<void> Function(AuthSession session) onSignedIn;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final GlobalKey<FormState> _loginFormKey = GlobalKey<FormState>();
  final GlobalKey<FormState> _registerFormKey = GlobalKey<FormState>();

  final TextEditingController _loginEmailController = TextEditingController();
  final TextEditingController _loginPasswordController =
      TextEditingController();

  final TextEditingController _registerNameController = TextEditingController();
  final TextEditingController _registerEmailController =
      TextEditingController();
  final TextEditingController _registerPasswordController =
      TextEditingController();
  final TextEditingController _verificationCodeController =
      TextEditingController();

  bool _busy = false;
  bool _showVerificationForm = false;
  String _infoMessage = '';
  String _pendingVerificationEmail = '';
  String _pendingVerificationPassword = '';

  @override
  void dispose() {
    _loginEmailController.dispose();
    _loginPasswordController.dispose();
    _registerNameController.dispose();
    _registerEmailController.dispose();
    _registerPasswordController.dispose();
    _verificationCodeController.dispose();
    super.dispose();
  }

  Future<void> _submitLogin() async {
    if (!_loginFormKey.currentState!.validate()) return;

    setState(() {
      _busy = true;
      _infoMessage = '';
    });

    try {
      final session = await widget.api.login(
        email: _loginEmailController.text.trim(),
        password: _loginPasswordController.text,
      );
      await widget.onSignedIn(session);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _infoMessage =
            error is ApiException ? error.message : 'Failed to sign in.';
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submitRegister() async {
    if (!_registerFormKey.currentState!.validate()) return;

    final registerEmail = _registerEmailController.text.trim().toLowerCase();
    final registerPassword = _registerPasswordController.text;

    setState(() {
      _busy = true;
      _infoMessage = '';
    });

    try {
      final registerResponse = await widget.api.register(
        name: _registerNameController.text.trim(),
        email: registerEmail,
        password: registerPassword,
      );

      final verificationRequired =
          registerResponse['verificationRequired'] == true;
      if (verificationRequired) {
        final debugCode = _extractDebugVerificationCode(registerResponse);
        setState(() {
          _showVerificationForm = true;
          _pendingVerificationEmail = registerEmail;
          _pendingVerificationPassword = registerPassword;
          _verificationCodeController.text = debugCode;
          _infoMessage = debugCode.isNotEmpty
              ? 'Account created. Enter your email verification code. (debug code: $debugCode)'
              : 'Account created. Enter your email verification code to continue.';
        });
        return;
      }

      final session = await widget.api.login(
        email: registerEmail,
        password: registerPassword,
      );
      await widget.onSignedIn(session);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _infoMessage =
            error is ApiException ? error.message : 'Failed to register.';
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _normalizeVerificationCode(String input) {
    return input.replaceAll(RegExp(r'[^0-9]'), '').trim();
  }

  String _extractDebugVerificationCode(Map<String, dynamic> registerResponse) {
    final debug = registerResponse['debug'];
    if (debug is! Map<String, dynamic>) return '';
    return _normalizeVerificationCode(
      debug['verificationCode']?.toString() ?? '',
    );
  }

  Future<void> _submitVerificationCode() async {
    final code = _normalizeVerificationCode(_verificationCodeController.text);
    if (_pendingVerificationEmail.isEmpty) {
      setState(() {
        _infoMessage = 'Missing email for verification.';
      });
      return;
    }
    if (code.length != 6) {
      setState(() {
        _infoMessage = 'Enter a valid 6-digit verification code.';
      });
      return;
    }

    setState(() {
      _busy = true;
      _infoMessage = '';
    });

    try {
      await widget.api.verifyEmail(
        email: _pendingVerificationEmail,
        code: code,
      );
      final session = await widget.api.login(
        email: _pendingVerificationEmail,
        password: _pendingVerificationPassword,
      );
      await widget.onSignedIn(session);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _infoMessage =
            error is ApiException ? error.message : 'Failed to verify email.';
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resendVerificationCode() async {
    if (_pendingVerificationEmail.isEmpty) return;

    setState(() {
      _busy = true;
      _infoMessage = '';
    });

    try {
      final response = await widget.api.resendVerification(
        email: _pendingVerificationEmail,
      );
      final debugCode = _extractDebugVerificationCode(response);
      if (!mounted) return;
      setState(() {
        if (debugCode.isNotEmpty) {
          _verificationCodeController.text = debugCode;
          _infoMessage =
              'Verification code sent again. (debug code: $debugCode)';
        } else {
          _infoMessage =
              'If the account exists, a verification code has been sent.';
        }
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _infoMessage = error is ApiException
            ? error.message
            : 'Failed to resend verification code.';
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  bool _isErrorMessage(String message) {
    final value = message.toLowerCase();
    return value.contains('failed') ||
        value.contains('invalid') ||
        value.contains('error') ||
        value.contains('unauthorized') ||
        value.contains('unable');
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 520),
                child: Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'SocialFlow',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Native Flutter app for Android APK and Flutter Web',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 18),
                        const TabBar(
                          tabs: [
                            Tab(text: 'Login'),
                            Tab(text: 'Register'),
                          ],
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          height: _showVerificationForm ? 560 : 430,
                          child: TabBarView(
                            children: [
                              Form(
                                key: _loginFormKey,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    TextFormField(
                                      key: const Key('login-email-field'),
                                      controller: _loginEmailController,
                                      keyboardType: TextInputType.emailAddress,
                                      decoration: _inputDecoration(
                                        'Email',
                                        Icons.alternate_email_rounded,
                                      ),
                                      validator: (value) {
                                        final input = (value ?? '').trim();
                                        if (input.isEmpty)
                                          return 'Email is required.';
                                        if (!input.contains('@'))
                                          return 'Enter a valid email.';
                                        return null;
                                      },
                                    ),
                                    const SizedBox(height: 12),
                                    TextFormField(
                                      key: const Key('login-password-field'),
                                      controller: _loginPasswordController,
                                      obscureText: true,
                                      decoration: _inputDecoration(
                                        'Password',
                                        Icons.lock_rounded,
                                      ),
                                      validator: (value) {
                                        if ((value ?? '').isEmpty)
                                          return 'Password is required.';
                                        return null;
                                      },
                                    ),
                                    const SizedBox(height: 16),
                                    SizedBox(
                                      width: double.infinity,
                                      child: FilledButton.icon(
                                        key: const Key('login-submit-button'),
                                        onPressed: _busy ? null : _submitLogin,
                                        icon: _busy
                                            ? const SizedBox(
                                                width: 16,
                                                height: 16,
                                                child:
                                                    CircularProgressIndicator(
                                                  strokeWidth: 2,
                                                ),
                                              )
                                            : const Icon(Icons.login_rounded),
                                        label: const Text('Sign In'),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Form(
                                key: _registerFormKey,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    TextFormField(
                                      key: const Key('register-name-field'),
                                      controller: _registerNameController,
                                      decoration: _inputDecoration(
                                        'Name',
                                        Icons.person_rounded,
                                      ),
                                      validator: (value) {
                                        final input = (value ?? '').trim();
                                        if (input.length < 2) {
                                          return 'Name must be at least 2 characters.';
                                        }
                                        return null;
                                      },
                                    ),
                                    const SizedBox(height: 12),
                                    TextFormField(
                                      key: const Key('register-email-field'),
                                      controller: _registerEmailController,
                                      keyboardType: TextInputType.emailAddress,
                                      decoration: _inputDecoration(
                                        'Email',
                                        Icons.alternate_email_rounded,
                                      ),
                                      validator: (value) {
                                        final input = (value ?? '').trim();
                                        if (input.isEmpty)
                                          return 'Email is required.';
                                        if (!input.contains('@'))
                                          return 'Enter a valid email.';
                                        return null;
                                      },
                                    ),
                                    const SizedBox(height: 12),
                                    TextFormField(
                                      key: const Key('register-password-field'),
                                      controller: _registerPasswordController,
                                      obscureText: true,
                                      decoration: _inputDecoration(
                                        'Password',
                                        Icons.lock_rounded,
                                      ),
                                      validator: (value) {
                                        final input = value ?? '';
                                        if (input.length < 8) {
                                          return 'Password must be at least 8 characters.';
                                        }
                                        return null;
                                      },
                                    ),
                                    const SizedBox(height: 16),
                                    SizedBox(
                                      width: double.infinity,
                                      child: FilledButton.icon(
                                        key:
                                            const Key('register-submit-button'),
                                        onPressed:
                                            _busy ? null : _submitRegister,
                                        icon: _busy
                                            ? const SizedBox(
                                                width: 16,
                                                height: 16,
                                                child:
                                                    CircularProgressIndicator(
                                                  strokeWidth: 2,
                                                ),
                                              )
                                            : const Icon(
                                                Icons.person_add_alt_1_rounded,
                                              ),
                                        label: const Text('Create Account'),
                                      ),
                                    ),
                                    if (_showVerificationForm) ...[
                                      const SizedBox(height: 14),
                                      TextFormField(
                                        key: const Key(
                                          'register-verification-code-field',
                                        ),
                                        controller: _verificationCodeController,
                                        keyboardType: TextInputType.number,
                                        decoration: _inputDecoration(
                                          'Verification code',
                                          Icons.mark_email_read_rounded,
                                        ),
                                        maxLength: 6,
                                        onChanged: (value) {
                                          final normalized =
                                              _normalizeVerificationCode(value);
                                          if (normalized != value) {
                                            _verificationCodeController.value =
                                                TextEditingValue(
                                              text: normalized,
                                              selection:
                                                  TextSelection.collapsed(
                                                offset: normalized.length,
                                              ),
                                            );
                                          }
                                        },
                                        validator: (value) {
                                          if (!_showVerificationForm)
                                            return null;
                                          final normalized =
                                              _normalizeVerificationCode(
                                            value ?? '',
                                          );
                                          if (normalized.isEmpty) {
                                            return 'Verification code is required.';
                                          }
                                          if (normalized.length != 6) {
                                            return 'Verification code must be 6 digits.';
                                          }
                                          return null;
                                        },
                                      ),
                                      const SizedBox(height: 8),
                                      SizedBox(
                                        width: double.infinity,
                                        child: FilledButton.icon(
                                          key: const Key(
                                            'register-verify-button',
                                          ),
                                          onPressed: _busy
                                              ? null
                                              : _submitVerificationCode,
                                          icon: _busy
                                              ? const SizedBox(
                                                  width: 16,
                                                  height: 16,
                                                  child:
                                                      CircularProgressIndicator(
                                                    strokeWidth: 2,
                                                  ),
                                                )
                                              : const Icon(
                                                  Icons.verified_rounded,
                                                ),
                                          label: const Text(
                                            'Verify Email and Sign In',
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      SizedBox(
                                        width: double.infinity,
                                        child: OutlinedButton.icon(
                                          key: const Key(
                                            'register-resend-button',
                                          ),
                                          onPressed: _busy
                                              ? null
                                              : _resendVerificationCode,
                                          icon: const Icon(
                                            Icons.refresh_rounded,
                                          ),
                                          label: const Text(
                                            'Resend Verification Code',
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (_infoMessage.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Text(
                            _infoMessage,
                            style: TextStyle(
                              color: _isErrorMessage(_infoMessage)
                                  ? Colors.red
                                  : Colors.green,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

enum _AuthView {
  login,
  register,
  checkEmail,
  verifyEmail,
  forgotPassword,
  resetPassword,
}

class AuthFlow extends StatefulWidget {
  const AuthFlow({
    super.key,
    required this.state,
    required this.api,
    required this.onSignedIn,
  });

  final AppState state;
  final ApiClient api;
  final Future<void> Function(AuthSession session) onSignedIn;

  @override
  State<AuthFlow> createState() => _AuthFlowState();
}

class _AuthFlowState extends State<AuthFlow> {
  _AuthView _view = _AuthView.login;
  String _email = '';

  void _go(_AuthView next, {String email = ''}) {
    setState(() {
      _view = next;
      if (email.trim().isNotEmpty) {
        _email = email.trim();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    switch (_view) {
      case _AuthView.login:
        return LoginScreen(
          state: widget.state,
          api: widget.api,
          prefillEmail: _email.isEmpty ? null : _email,
          onSignedIn: widget.onSignedIn,
          onGoToRegister: () => _go(_AuthView.register, email: _email),
          onGoToForgotPassword: () => _go(_AuthView.forgotPassword, email: _email),
        );
      case _AuthView.register:
        return RegisterScreen(
          state: widget.state,
          api: widget.api,
          onGoToLogin: () => _go(_AuthView.login, email: _email),
          onRegisteredNeedingVerification: (email) =>
              _go(_AuthView.checkEmail, email: email),
        );
      case _AuthView.checkEmail:
        return CheckEmailScreen(
          state: widget.state,
          api: widget.api,
          email: _email,
          onEnterVerificationCode: () =>
              _go(_AuthView.verifyEmail, email: _email),
        );
      case _AuthView.verifyEmail:
        return VerifyEmailScreen(
          state: widget.state,
          api: widget.api,
          prefilledEmail: _email,
          onVerified: () => _go(_AuthView.login, email: _email),
        );
      case _AuthView.forgotPassword:
        return ForgotPasswordScreen(
          state: widget.state,
          api: widget.api,
          onBackToLogin: () => _go(_AuthView.login, email: _email),
          onGoToResetPassword: (email) => _go(_AuthView.resetPassword, email: email),
        );
      case _AuthView.resetPassword:
        return ResetPasswordScreen(
          state: widget.state,
          api: widget.api,
          onDone: () => _go(_AuthView.login, email: _email),
        );
    }
  }
}

class SocialShell extends StatefulWidget {
  const SocialShell({
    super.key,
    required this.api,
    required this.accessToken,
    required this.userName,
    required this.userEmail,
    required this.onSignOut,
  });

  final ApiClient api;
  final String accessToken;
  final String userName;
  final String userEmail;
  final Future<void> Function() onSignOut;

  @override
  State<SocialShell> createState() => _SocialShellState();
}

enum PanelKind { dashboard, tasks, accounts, executions, analytics, settings }

class PanelSpec {
  const PanelSpec({
    required this.kind,
    required this.labelKey,
    required this.fallbackLabel,
    required this.icon,
  });

  final PanelKind kind;
  final String labelKey;
  final String fallbackLabel;
  final IconData icon;
}

const List<PanelSpec> kPanelSpecs = <PanelSpec>[
  PanelSpec(
    kind: PanelKind.dashboard,
    labelKey: 'nav.dashboard',
    fallbackLabel: 'Dashboard',
    icon: Icons.space_dashboard_rounded,
  ),
  PanelSpec(
    kind: PanelKind.tasks,
    labelKey: 'nav.tasks',
    fallbackLabel: 'Tasks',
    icon: Icons.task_alt_rounded,
  ),
  PanelSpec(
    kind: PanelKind.accounts,
    labelKey: 'nav.accounts',
    fallbackLabel: 'Accounts',
    icon: Icons.groups_rounded,
  ),
  PanelSpec(
    kind: PanelKind.executions,
    labelKey: 'nav.executions',
    fallbackLabel: 'Executions',
    icon: Icons.list_alt_rounded,
  ),
  PanelSpec(
    kind: PanelKind.analytics,
    labelKey: 'nav.analytics',
    fallbackLabel: 'Analytics',
    icon: Icons.query_stats_rounded,
  ),
  PanelSpec(
    kind: PanelKind.settings,
    labelKey: 'nav.settings',
    fallbackLabel: 'Settings',
    icon: Icons.settings_rounded,
  ),
];

class _PanelState {
  bool loading = false;
  Map<String, dynamic>? data;
  String? error;
}

class _SocialShellState extends State<SocialShell> {
  int _selectedIndex = 0;
  String _tasksQuery = '';
  String _accountsQuery = '';
  String _executionsQuery = '';
  final Map<String, String> _taskActionState = <String, String>{};
  Timer? _dashboardRefreshTimer;

  final Map<PanelKind, _PanelState> _panelStates = {
    for (final panel in kPanelSpecs) panel.kind: _PanelState(),
  };

  @override
  void initState() {
    super.initState();
    unawaited(_loadCurrentPanel(force: true));

    _dashboardRefreshTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) {
        if (!mounted) return;
        if (_currentKind != PanelKind.dashboard) return;
        unawaited(_loadPanel(PanelKind.dashboard, force: true));
      },
    );
  }

  @override
  void dispose() {
    _dashboardRefreshTimer?.cancel();
    super.dispose();
  }

  PanelKind get _currentKind => kPanelSpecs[_selectedIndex].kind;

  Future<void> _loadCurrentPanel({bool force = false}) async {
    await _loadPanel(_currentKind, force: force);
  }

  Future<void> _loadPanel(PanelKind kind, {bool force = false}) async {
    final state = _panelStates[kind]!;
    if (!force && state.data != null && !state.loading) {
      return;
    }

    setState(() {
      state.loading = true;
      state.error = null;
    });

    try {
      late final Map<String, dynamic> payload;
      switch (kind) {
        case PanelKind.dashboard:
          payload = await widget.api.fetchDashboard(widget.accessToken);
          break;
        case PanelKind.tasks:
          payload = await widget.api.fetchTasks(widget.accessToken, limit: 60);
          break;
        case PanelKind.accounts:
          payload = await widget.api.fetchAccounts(
            widget.accessToken,
            limit: 60,
          );
          break;
        case PanelKind.executions:
          payload = await widget.api.fetchExecutions(
            widget.accessToken,
            limit: 60,
          );
          break;
        case PanelKind.analytics:
          payload = await widget.api.fetchAnalytics(
            widget.accessToken,
            limit: 60,
          );
          break;
        case PanelKind.settings:
          payload = await widget.api.fetchProfile(widget.accessToken);
          break;
      }

      if (!mounted) return;
      setState(() {
        state.loading = false;
        state.data = payload;
        state.error = null;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        state.loading = false;
        state.error =
            error is ApiException ? error.message : 'Failed to load panel.';
      });
    }
  }

  Future<void> _onPanelSelected(int index) async {
    if (_selectedIndex == index) return;

    setState(() => _selectedIndex = index);
    await _loadPanel(_currentKind, force: _currentKind == PanelKind.dashboard);
  }

  I18n _i18n(BuildContext context) {
    try {
      final code = Localizations.localeOf(context).languageCode;
      return I18n(code == 'en' ? 'en' : 'ar');
    } catch (_) {
      return I18n('ar');
    }
  }

  void _toast(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<void> _openCreateTaskSheet() async {
    final i18n = _i18n(context);
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) {
        return _TaskComposerSheet(
          api: widget.api,
          accessToken: widget.accessToken,
          i18n: i18n,
        );
      },
    );

    if (created == true) {
      await _loadPanel(PanelKind.dashboard, force: true);
      await _loadPanel(PanelKind.tasks, force: true);
    }
  }

  Widget _buildDrawer(I18n i18n) {
    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            ListTile(
              leading: const Icon(Icons.apps_rounded),
              title: const Text('SocialFlow'),
              subtitle: Text(widget.userEmail),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView.builder(
                itemCount: kPanelSpecs.length,
                itemBuilder: (context, index) {
                  final panel = kPanelSpecs[index];
                  final selected = index == _selectedIndex;
                  return ListTile(
                    leading: Icon(panel.icon),
                    title: Text(i18n.t(panel.labelKey, panel.fallbackLabel)),
                    selected: selected,
                    onTap: () {
                      Navigator.of(context).maybePop();
                      unawaited(_onPanelSelected(index));
                    },
                  );
                },
              ),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.logout_rounded),
              title: Text(i18n.t('common.signOut', 'Sign out')),
              onTap: () async {
                Navigator.of(context).maybePop();
                await widget.onSignOut();
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRail(I18n i18n) {
    return NavigationRail(
      selectedIndex: _selectedIndex,
      labelType: NavigationRailLabelType.all,
      onDestinationSelected: (index) => unawaited(_onPanelSelected(index)),
      destinations: kPanelSpecs
          .map(
            (panel) => NavigationRailDestination(
              icon: Icon(panel.icon),
              selectedIcon: Icon(panel.icon),
              label: Text(i18n.t(panel.labelKey, panel.fallbackLabel)),
            ),
          )
          .toList(),
    );
  }

  Widget _buildBottomNavigation(I18n i18n) {
    return NavigationBar(
      selectedIndex: _selectedIndex,
      onDestinationSelected: (index) => unawaited(_onPanelSelected(index)),
      destinations: kPanelSpecs
          .map(
            (panel) => NavigationDestination(
              icon: Icon(panel.icon),
              label: i18n.t(panel.labelKey, panel.fallbackLabel),
            ),
          )
          .toList(),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            CircleAvatar(child: Icon(icon)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPanelFrame({
    required PanelKind kind,
    required I18n i18n,
    required Widget Function(Map<String, dynamic> data) builder,
  }) {
    final panelState = _panelStates[kind]!;

    if (panelState.loading && panelState.data == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (panelState.error != null && panelState.data == null) {
      return Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.error_outline_rounded,
                    size: 42,
                    color: Colors.redAccent,
                  ),
                  const SizedBox(height: 10),
                  Text(panelState.error!, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: () => unawaited(_loadPanel(kind, force: true)),
                    icon: const Icon(Icons.refresh_rounded),
                    label: Text(i18n.t('common.retry', 'Retry')),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final data = panelState.data ?? <String, dynamic>{};

    return RefreshIndicator(
      onRefresh: () => _loadPanel(kind, force: true),
      child: ListView(
        padding: const EdgeInsets.all(14),
        children: [
          if (panelState.loading)
            const Padding(
              padding: EdgeInsets.only(bottom: 10),
              child: LinearProgressIndicator(),
            ),
          builder(data),
        ],
      ),
    );
  }

  Widget _buildDashboard(Map<String, dynamic> data) {
    final i18n = _i18n(context);
    final stats = data['stats'] is Map<String, dynamic>
        ? data['stats'] as Map<String, dynamic>
        : <String, dynamic>{};
    final recentTasks = data['recentTasks'] is List
        ? (data['recentTasks'] as List)
        : const <dynamic>[];
    final recentExecutions = data['recentExecutions'] is List
        ? (data['recentExecutions'] as List)
        : const <dynamic>[];
    final topTaskStats = data['topTaskStats'] is List
        ? (data['topTaskStats'] as List)
        : const <dynamic>[];
    final taskBreakdown = data['taskBreakdown'] is Map<String, dynamic>
        ? data['taskBreakdown'] as Map<String, dynamic>
        : <String, dynamic>{};
    final accountBreakdown = data['accountBreakdown'] is Map<String, dynamic>
        ? data['accountBreakdown'] as Map<String, dynamic>
        : <String, dynamic>{};
    final health = data['health'] is Map<String, dynamic>
        ? data['health'] as Map<String, dynamic>
        : <String, dynamic>{};
    final accountsById = data['accountsById'] is Map<String, dynamic>
        ? data['accountsById'] as Map<String, dynamic>
        : <String, dynamic>{};

    final totalTasks = (stats['totalTasks'] as num?)?.toInt() ?? 0;
    final totalAccounts = (stats['totalAccounts'] as num?)?.toInt() ?? 0;
    final totalExecutions = (stats['totalExecutions'] as num?)?.toInt() ?? 0;
    final isEmptyWorkspace =
        totalTasks == 0 && totalAccounts == 0 && totalExecutions == 0;

    final activeTasks = (stats['activeTasksCount'] as num?)?.toInt() ?? 0;
    final pausedTasks = (stats['pausedTasksCount'] as num?)?.toInt() ?? 0;
    final errorTasks = (stats['errorTasksCount'] as num?)?.toInt() ?? 0;
    final successRate =
        (stats['executionSuccessRate'] as num?)?.toInt() ?? 0;
    final hasAuthWarnings = health['hasAuthWarnings'] == true;

    final platformBreakdown = (() {
      final byPlatform = accountBreakdown['byPlatform'];
      if (byPlatform is! Map) return const <MapEntry<String, int>>[];
      final entries = <MapEntry<String, int>>[];
      for (final entry in byPlatform.entries) {
        final key = entry.key?.toString() ?? '';
        final rawCount = entry.value;
        final count = rawCount is num ? rawCount.toInt() : int.tryParse(rawCount?.toString() ?? '0') ?? 0;
        if (key.trim().isEmpty) continue;
        entries.add(MapEntry<String, int>(key, count));
      }
      entries.sort((a, b) => b.value.compareTo(a.value));
      return entries;
    })();

    Widget pill(String text, {Color? bg, Color? fg, IconData? icon}) {
      final colorScheme = Theme.of(context).colorScheme;
      final resolvedBg = bg ?? colorScheme.primary.withAlpha((0.10 * 255).round());
      final resolvedFg = fg ?? colorScheme.primary;

      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: resolvedBg,
          border: Border.all(color: resolvedFg.withAlpha((0.25 * 255).round())),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 14, color: resolvedFg),
              const SizedBox(width: 6),
            ],
            Text(
              text,
              style: TextStyle(
                color: resolvedFg,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      );
    }

    Widget sectionTitle(String title, {VoidCallback? onViewAll}) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
          ),
          if (onViewAll != null)
            TextButton(
              onPressed: onViewAll,
              child: Text(i18n.t('dashboard.viewAll', 'View all')),
            ),
        ],
      );
    }

    Widget statGrid() {
      return Wrap(
        spacing: 12,
        runSpacing: 12,
        children: [
          SizedBox(
            width: 260,
            child: _buildStatCard(
              title: 'Total Tasks',
              value: '$totalTasks',
              icon: Icons.task_rounded,
            ),
          ),
          SizedBox(
            width: 260,
            child: _buildStatCard(
              title: 'Active Tasks',
              value: '$activeTasks',
              icon: Icons.play_circle_fill_rounded,
            ),
          ),
          SizedBox(
            width: 260,
            child: _buildStatCard(
              title: 'Connected Accounts',
              value: '$totalAccounts',
              icon: Icons.groups_rounded,
            ),
          ),
          SizedBox(
            width: 260,
            child: _buildStatCard(
              title: 'Execution Success',
              value: '$successRate%',
              icon: Icons.query_stats_rounded,
            ),
          ),
        ],
      );
    }

    Widget dashboardHeader() {
      final colorScheme = Theme.of(context).colorScheme;
      return Card(
        elevation: 0,
        color: colorScheme.surfaceContainerHighest.withAlpha((0.55 * 255).round()),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              pill(
                i18n.t('dashboard.liveOps', 'Live Operations'),
                icon: Icons.bolt_rounded,
              ),
              const SizedBox(height: 10),
              Text(
                i18n.t('dashboard.title', 'SocialFlow Dashboard'),
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 6),
              Text(
                i18n.t(
                  'dashboard.subtitle',
                  'Unified control center for tasks, accounts, executions, and operational health.',
                ),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  pill('$activeTasks ${i18n.t('dashboard.kpi.active', 'active')}'),
                  pill(
                    '$pausedTasks ${i18n.t('dashboard.kpi.paused', 'paused')}',
                    bg: colorScheme.secondary.withAlpha((0.16 * 255).round()),
                    fg: colorScheme.secondary,
                  ),
                  pill(
                    '$errorTasks ${i18n.t('dashboard.kpi.errors', 'errors')}',
                    bg: colorScheme.error.withAlpha((0.12 * 255).round()),
                    fg: colorScheme.error,
                  ),
                  pill('$successRate% ${i18n.t('dashboard.kpi.successRate', 'success rate')}'),
                  if (hasAuthWarnings)
                    pill(
                      i18n.t('dashboard.kpi.oauthAttention', 'OAuth attention needed'),
                      bg: colorScheme.tertiary.withAlpha((0.18 * 255).round()),
                      fg: colorScheme.tertiary,
                      icon: Icons.shield_rounded,
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  OutlinedButton.icon(
                    onPressed: () => unawaited(_loadPanel(PanelKind.dashboard, force: true)),
                    icon: const Icon(Icons.refresh_rounded),
                    label: Text(i18n.t('common.refresh', 'Refresh')),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => unawaited(_onPanelSelected(kPanelSpecs.indexWhere((p) => p.kind == PanelKind.accounts))),
                    icon: const Icon(Icons.groups_rounded),
                    label: Text(i18n.t('dashboard.actions.connectAccount', 'Connect Account')),
                  ),
                  FilledButton.icon(
                    onPressed: () async => _openCreateTaskSheet(),
                    icon: const Icon(Icons.add_rounded),
                    label: Text(i18n.t('dashboard.actions.createTask', 'Create New Task')),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }

    String normalizeTaskStatus(String raw) {
      final value = raw.trim().toLowerCase();
      if (value == 'active' || value == 'enabled' || value == 'running') return 'active';
      if (value == 'paused' || value == 'inactive' || value == 'disabled') return 'paused';
      if (value == 'completed' || value == 'done' || value == 'success') return 'completed';
      if (value == 'error' || value == 'failed' || value == 'failure') return 'error';
      return 'paused';
    }

    String statusLabel(String normalized) {
      if (normalized == 'active') return i18n.t('status.active', 'Active');
      if (normalized == 'paused') return i18n.t('status.paused', 'Paused');
      if (normalized == 'completed') return i18n.t('status.completed', 'Completed');
      return i18n.t('status.error', 'Error');
    }

    Color statusColor(String normalized) {
      final scheme = Theme.of(context).colorScheme;
      if (normalized == 'active') return scheme.primary;
      if (normalized == 'paused') return scheme.secondary;
      if (normalized == 'completed') return scheme.tertiary;
      return scheme.error;
    }

    String relativeTime(dynamic value) {
      if (value == null) return i18n.t('dashboard.never', 'Never');
      DateTime? date;
      if (value is DateTime) {
        date = value;
      } else {
        date = DateTime.tryParse(value.toString());
      }
      if (date == null) return i18n.t('dashboard.never', 'Never');

      final delta = DateTime.now().difference(date);
      if (delta.inSeconds < 60) return i18n.t('dashboard.justNow', 'Just now');
      if (delta.inMinutes < 60) {
        if (i18n.isArabic) return 'قبل ${delta.inMinutes}د';
        return '${delta.inMinutes}m ago';
      }
      if (delta.inHours < 24) {
        if (i18n.isArabic) return 'قبل ${delta.inHours}س';
        return '${delta.inHours}h ago';
      }
      final days = delta.inDays;
      if (days < 7) {
        if (i18n.isArabic) return 'قبل ${days}ي';
        return '${days}d ago';
      }
      return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    }

    List<String> uniquePlatforms(List<dynamic> accountIds) {
      final seen = <String>{};
      for (final rawId in accountIds) {
        final id = rawId?.toString() ?? '';
        if (id.isEmpty) continue;
        final account = accountsById[id];
        if (account is Map) {
          final platform = account['platformId']?.toString() ?? '';
          if (platform.trim().isNotEmpty) seen.add(platform);
        }
      }
      return seen.toList();
    }

    Widget platformChip(String platformId, int? count) {
      final normalized = platformId.trim().toLowerCase();
      final icon = (() {
        if (normalized.contains('telegram')) return Icons.send_rounded;
        if (normalized.contains('twitter')) return Icons.alternate_email_rounded;
        if (normalized.contains('youtube')) return Icons.ondemand_video_rounded;
        if (normalized.contains('tiktok')) return Icons.music_note_rounded;
        if (normalized.contains('instagram')) return Icons.camera_alt_rounded;
        if (normalized.contains('facebook')) return Icons.facebook_rounded;
        return Icons.public_rounded;
      })();

      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          border: Border.all(
            color: Theme.of(context).colorScheme.outlineVariant,
          ),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16),
            const SizedBox(width: 8),
            Text(
              count == null ? platformId : '$platformId $count',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ],
        ),
      );
    }

    Future<void> toggleTask(Map<String, dynamic> task) async {
      final id = task['id']?.toString() ?? '';
      if (id.isEmpty) return;
      if (_taskActionState.containsKey(id)) return;

      final previous = normalizeTaskStatus(task['status']?.toString() ?? '');
      final next = previous == 'active' ? 'paused' : 'active';

      setState(() {
        _taskActionState[id] = 'toggle';
        final dash = _panelStates[PanelKind.dashboard]!;
        final current = dash.data;
        if (current == null) return;
        final cloned = Map<String, dynamic>.from(current);
        final list = cloned['recentTasks'];
        if (list is List) {
          cloned['recentTasks'] = list.map((raw) {
            final item = raw is Map<String, dynamic>
                ? Map<String, dynamic>.from(raw)
                : Map<String, dynamic>.from(raw as Map);
            if (item['id']?.toString() == id) {
              item['status'] = next;
            }
            return item;
          }).toList();
        }
        dash.data = cloned;
      });

      try {
        await widget.api.updateTask(
          widget.accessToken,
          id,
          body: <String, dynamic>{'status': next},
        );
        _toast(
          next == 'active'
              ? i18n.t('dashboard.toast.taskEnabled', 'Task enabled')
              : i18n.t('dashboard.toast.taskPaused', 'Task paused'),
        );
        await _loadPanel(PanelKind.dashboard, force: true);
      } catch (error) {
        setState(() {
          final dash = _panelStates[PanelKind.dashboard]!;
          final current = dash.data;
          if (current == null) return;
          final cloned = Map<String, dynamic>.from(current);
          final list = cloned['recentTasks'];
          if (list is List) {
            cloned['recentTasks'] = list.map((raw) {
              final item = raw is Map<String, dynamic>
                  ? Map<String, dynamic>.from(raw)
                  : Map<String, dynamic>.from(raw as Map);
              if (item['id']?.toString() == id) {
                item['status'] = previous;
              }
              return item;
            }).toList();
          }
          dash.data = cloned;
        });
        final message = error is ApiException ? error.message : i18n.t('dashboard.toast.taskUpdateFailed', 'Failed to update task');
        _toast(message);
      } finally {
        if (!mounted) return;
        setState(() {
          _taskActionState.remove(id);
        });
      }
    }

    Future<void> runTask(Map<String, dynamic> task) async {
      final id = task['id']?.toString() ?? '';
      if (id.isEmpty) return;
      if (_taskActionState.containsKey(id)) return;
      setState(() {
        _taskActionState[id] = 'run';
      });

      try {
        await widget.api.runTask(widget.accessToken, id);
        _toast(i18n.t('dashboard.toast.taskQueued', 'Task run queued'));
        await _loadPanel(PanelKind.dashboard, force: true);
      } catch (error) {
        final message = error is ApiException ? error.message : i18n.t('dashboard.toast.taskRunFailed', 'Failed to run task');
        _toast(message);
      } finally {
        if (!mounted) return;
        setState(() {
          _taskActionState.remove(id);
        });
      }
    }

    Widget recentAutomationsCard() {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              sectionTitle(
                i18n.t('dashboard.section.recentAutomations', 'Recent Automations'),
                onViewAll: () => unawaited(_onPanelSelected(kPanelSpecs.indexWhere((p) => p.kind == PanelKind.tasks))),
              ),
              const SizedBox(height: 8),
              if (recentTasks.isEmpty)
                Text(i18n.t('dashboard.noTasks', 'No tasks yet.'))
              else
                ...recentTasks.take(6).map((raw) {
                  final task = raw is Map<String, dynamic>
                      ? Map<String, dynamic>.from(raw)
                      : Map<String, dynamic>.from(raw as Map);
                  final id = task['id']?.toString() ?? '';
                  final normalized = normalizeTaskStatus(task['status']?.toString() ?? '');
                  final busy = _taskActionState.containsKey(id);

                  final sources = task['sourceAccounts'] is List
                      ? (task['sourceAccounts'] as List)
                      : const <dynamic>[];
                  final targets = task['targetAccounts'] is List
                      ? (task['targetAccounts'] as List)
                      : const <dynamic>[];

                  final sourcePlatforms = uniquePlatforms(sources);
                  final targetPlatforms = uniquePlatforms(targets);

                  final pillColor = statusColor(normalized);
                  final scheme = Theme.of(context).colorScheme;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: scheme.surfaceContainerHighest.withAlpha((0.45 * 255).round()),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: scheme.outlineVariant),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    crossAxisAlignment: WrapCrossAlignment.center,
                                    children: [
                                      Text(
                                        task['name']?.toString() ?? 'Unnamed task',
                                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: pillColor.withAlpha((0.14 * 255).round()),
                                          border: Border.all(color: pillColor.withAlpha((0.32 * 255).round())),
                                          borderRadius: BorderRadius.circular(999),
                                        ),
                                        child: Text(
                                          statusLabel(normalized),
                                          style: TextStyle(color: pillColor, fontWeight: FontWeight.w800),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    '${i18n.t('dashboard.lastRun', 'Last run')}: ${relativeTime(task['lastExecuted'])}',
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Wrap(
                              spacing: 6,
                              children: [
                                IconButton(
                                  onPressed: busy ? null : () => unawaited(toggleTask(task)),
                                  tooltip: normalized == 'active'
                                      ? i18n.t('dashboard.task.pause', 'Pause task')
                                      : i18n.t('dashboard.task.enable', 'Enable task'),
                                  icon: Icon(
                                    normalized == 'active'
                                        ? Icons.pause_circle_filled_rounded
                                        : Icons.play_circle_fill_rounded,
                                  ),
                                ),
                                IconButton(
                                  onPressed: busy ? null : () => unawaited(runTask(task)),
                                  tooltip: i18n.t('dashboard.task.runNow', 'Run task now'),
                                  icon: const Icon(Icons.bolt_rounded),
                                ),
                                IconButton(
                                  onPressed: () {
                                    _toast(i18n.isArabic ? 'تعديل المهمة سيأتي في لوحة المهام.' : 'Task editing is coming in Tasks panel.');
                                  },
                                  tooltip: i18n.t('dashboard.task.edit', 'Edit task'),
                                  icon: const Icon(Icons.open_in_new_rounded),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: scheme.surface.withAlpha((0.55 * 255).round()),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: scheme.outlineVariant),
                          ),
                          child: Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              if (sourcePlatforms.isEmpty)
                                Text(
                                  i18n.t('dashboard.task.noSource', 'No source'),
                                  style: Theme.of(context).textTheme.bodySmall,
                                )
                              else
                                ...sourcePlatforms.map((p) => platformChip(p, null)),
                              Text(
                                '→',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              if (targetPlatforms.isEmpty)
                                Text(
                                  i18n.t('dashboard.task.noTarget', 'No target'),
                                  style: Theme.of(context).textTheme.bodySmall,
                                )
                              else
                                ...targetPlatforms.map((p) => platformChip(p, null)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }),
            ],
          ),
        ),
      );
    }

    Widget systemHealthCard() {
      final scheme = Theme.of(context).colorScheme;
      final inactiveAccounts = (stats['inactiveAccounts'] as num?)?.toInt() ?? 0;
      final activeAccounts = (stats['activeAccounts'] as num?)?.toInt() ?? 0;

      int td(String key) => (taskBreakdown[key] as num?)?.toInt() ?? 0;

      return Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                i18n.t('dashboard.section.systemHealth', 'System Health'),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: scheme.outlineVariant),
                  color: scheme.surfaceContainerHighest.withAlpha((0.40 * 255).round()),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      i18n.t('dashboard.health.taskHealth', 'Task health'),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        pill('Active ${td('active')}', fg: scheme.primary),
                        pill('Paused ${td('paused')}', fg: scheme.secondary, bg: scheme.secondary.withAlpha((0.16 * 255).round())),
                        pill('Errors ${td('error')}', fg: scheme.error, bg: scheme.error.withAlpha((0.12 * 255).round())),
                        pill('Done ${td('completed')}', fg: scheme.tertiary, bg: scheme.tertiary.withAlpha((0.14 * 255).round())),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: scheme.outlineVariant),
                  color: scheme.surfaceContainerHighest.withAlpha((0.40 * 255).round()),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          i18n.t('dashboard.health.accountReliability', 'Account reliability'),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        Icon(
                          hasAuthWarnings ? Icons.shield_rounded : Icons.check_circle_rounded,
                          size: 16,
                          color: hasAuthWarnings ? scheme.secondary : scheme.primary,
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      '$activeAccounts active / $totalAccounts total',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      inactiveAccounts > 0
                          ? '$inactiveAccounts ${i18n.t('dashboard.health.authIssues', 'account(s) need re-authentication.')}'
                          : i18n.t('dashboard.health.noAuthIssues', 'No authentication issues detected.'),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: scheme.outlineVariant),
                  color: scheme.surfaceContainerHighest.withAlpha((0.40 * 255).round()),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      i18n.t('dashboard.health.platformsInUse', 'Platforms in use'),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 10),
                    if (platformBreakdown.isEmpty)
                      Text(i18n.t('dashboard.health.noPlatforms', 'No connected platforms.'))
                    else
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: platformBreakdown
                            .map((entry) => platformChip(entry.key, entry.value))
                            .toList(),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    Widget recentExecutionsCard() {
      final scheme = Theme.of(context).colorScheme;
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              sectionTitle(
                i18n.t('dashboard.section.recentExecutions', 'Recent Executions'),
                onViewAll: () => unawaited(_onPanelSelected(kPanelSpecs.indexWhere((p) => p.kind == PanelKind.executions))),
              ),
              const SizedBox(height: 8),
              if (recentExecutions.isEmpty)
                Text(i18n.t('dashboard.noExecutions', 'No executions yet.'))
              else
                ...recentExecutions.take(7).map((raw) {
                  final execution = raw is Map<String, dynamic>
                      ? Map<String, dynamic>.from(raw)
                      : Map<String, dynamic>.from(raw as Map);
                  final status = execution['status']?.toString() ?? 'pending';
                  final normalized = status.trim().toLowerCase();
                  final color = normalized == 'success'
                      ? scheme.primary
                      : normalized == 'failed'
                          ? scheme.error
                          : scheme.secondary;
                  final content = (execution['originalContent']?.toString() ?? '').trim();
                  final preview = content.isEmpty ? 'No text content' : content;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: scheme.outlineVariant),
                      color: scheme.surfaceContainerHighest.withAlpha((0.40 * 255).round()),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                execution['taskName']?.toString() ?? 'Task execution',
                                style: const TextStyle(fontWeight: FontWeight.w800),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: color.withAlpha((0.14 * 255).round()),
                                border: Border.all(color: color.withAlpha((0.32 * 255).round())),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                status,
                                style: TextStyle(color: color, fontWeight: FontWeight.w800),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${execution['sourceAccountName'] ?? 'Unknown source'} → ${execution['targetAccountName'] ?? 'Unknown target'}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          preview,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.access_time_rounded, size: 14),
                            const SizedBox(width: 6),
                            Text(
                              relativeTime(execution['executedAt']),
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }),
            ],
          ),
        ),
      );
    }

    Widget topTasksCard() {
      final scheme = Theme.of(context).colorScheme;
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                i18n.t('dashboard.section.topTasks', 'Top Performing Tasks'),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              if (topTaskStats.isEmpty)
                Text(i18n.t('dashboard.noPerformance', 'Performance data will appear after executions run.'))
              else
                ...topTaskStats.take(6).map((raw) {
                  final item = raw is Map<String, dynamic>
                      ? Map<String, dynamic>.from(raw)
                      : Map<String, dynamic>.from(raw as Map);
                  final rate = (item['successRate'] as num?)?.toDouble() ?? double.tryParse(item['successRate']?.toString() ?? '') ?? 0;
                  final color = rate >= 90
                      ? scheme.primary
                      : rate >= 70
                          ? scheme.secondary
                          : scheme.error;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: scheme.outlineVariant),
                      color: scheme.surfaceContainerHighest.withAlpha((0.40 * 255).round()),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                item['taskName']?.toString() ?? 'Task',
                                style: const TextStyle(fontWeight: FontWeight.w800),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: color.withAlpha((0.14 * 255).round()),
                                border: Border.all(color: color.withAlpha((0.32 * 255).round())),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                '${rate.toStringAsFixed(0)}%',
                                style: TextStyle(color: color, fontWeight: FontWeight.w800),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${item['totalExecutions'] ?? 0} runs • ${item['successful'] ?? 0} success • ${item['failed'] ?? 0} failed',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  );
                }),
            ],
          ),
        ),
      );
    }

    Widget emptyWorkspaceCard() {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                i18n.t('dashboard.empty.title', 'Workspace is ready'),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                i18n.t(
                  'dashboard.empty.subtitle',
                  'Connect your first account and create your first automation to see live dashboard insights.',
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                alignment: WrapAlignment.center,
                children: [
                  OutlinedButton(
                    onPressed: () => unawaited(_onPanelSelected(kPanelSpecs.indexWhere((p) => p.kind == PanelKind.accounts))),
                    child: Text(i18n.t('dashboard.empty.connect', 'Connect Account')),
                  ),
                  FilledButton(
                    onPressed: () => unawaited(_onPanelSelected(kPanelSpecs.indexWhere((p) => p.kind == PanelKind.tasks))),
                    child: Text(i18n.t('dashboard.empty.create', 'Create First Task')),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        dashboardHeader(),
        const SizedBox(height: 12),
        statGrid(),
        const SizedBox(height: 12),
        if (isEmptyWorkspace) emptyWorkspaceCard() else ...[
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth >= 1100;
              if (!wide) {
                return Column(
                  children: [
                    recentAutomationsCard(),
                    const SizedBox(height: 12),
                    systemHealthCard(),
                  ],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(flex: 8, child: recentAutomationsCard()),
                  const SizedBox(width: 12),
                  Expanded(flex: 4, child: systemHealthCard()),
                ],
              );
            },
          ),
          const SizedBox(height: 12),
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth >= 1100;
              if (!wide) {
                return Column(
                  children: [
                    recentExecutionsCard(),
                    const SizedBox(height: 12),
                    topTasksCard(),
                  ],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(flex: 7, child: recentExecutionsCard()),
                  const SizedBox(width: 12),
                  Expanded(flex: 5, child: topTasksCard()),
                ],
              );
            },
          ),
        ],
      ],
    );
  }

  Widget _buildTasks(Map<String, dynamic> data) {
    final tasks =
        data['tasks'] is List ? (data['tasks'] as List) : const <dynamic>[];

    final filtered = tasks.where((raw) {
      final item = raw is Map<String, dynamic>
          ? raw
          : Map<String, dynamic>.from(raw as Map);
      if (_tasksQuery.isEmpty) return true;
      final query = _tasksQuery.toLowerCase();
      final name = item['name']?.toString().toLowerCase() ?? '';
      final status = item['status']?.toString().toLowerCase() ?? '';
      return name.contains(query) || status.contains(query);
    }).toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Tasks',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            TextField(
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search_rounded),
                hintText: 'Search tasks by name or status',
                border: OutlineInputBorder(),
              ),
              onChanged: (value) => setState(() => _tasksQuery = value.trim()),
            ),
            const SizedBox(height: 10),
            if (filtered.isEmpty)
              const Text('No tasks match your search.')
            else
              ...filtered.take(80).map((raw) {
                final item = raw is Map<String, dynamic>
                    ? raw
                    : Map<String, dynamic>.from(raw as Map);
                final statusText = item['status']?.toString() ?? 'unknown';
                final statusColor = _statusColor(statusText);

                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: const Icon(Icons.task_alt_rounded),
                    title: Text(item['name']?.toString() ?? 'Unnamed task'),
                    subtitle: Text(item['description']?.toString() ?? ''),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withAlpha((0.16 * 255).round()),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        statusText,
                        style: TextStyle(color: statusColor),
                      ),
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Widget _buildAccounts(Map<String, dynamic> data) {
    final accounts = data['accounts'] is List
        ? (data['accounts'] as List)
        : const <dynamic>[];

    final filtered = accounts.where((raw) {
      final item = raw is Map<String, dynamic>
          ? raw
          : Map<String, dynamic>.from(raw as Map);
      if (_accountsQuery.isEmpty) return true;
      final query = _accountsQuery.toLowerCase();
      final name = item['accountName']?.toString().toLowerCase() ?? '';
      final username = item['accountUsername']?.toString().toLowerCase() ?? '';
      final platform = item['platformId']?.toString().toLowerCase() ?? '';
      return name.contains(query) ||
          username.contains(query) ||
          platform.contains(query);
    }).toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Accounts',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            TextField(
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search_rounded),
                hintText: 'Search accounts by platform/name/username',
                border: OutlineInputBorder(),
              ),
              onChanged: (value) =>
                  setState(() => _accountsQuery = value.trim()),
            ),
            const SizedBox(height: 10),
            if (filtered.isEmpty)
              const Text('No accounts found.')
            else
              ...filtered.take(100).map((raw) {
                final item = raw is Map<String, dynamic>
                    ? raw
                    : Map<String, dynamic>.from(raw as Map);
                final active = item['isActive'] == true;

                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: const Icon(Icons.account_circle_rounded),
                    title: Text(item['accountName']?.toString() ?? 'Account'),
                    subtitle: Text(
                      '${item['platformId'] ?? 'unknown'} • @${item['accountUsername'] ?? '-'}',
                    ),
                    trailing: Icon(
                      active
                          ? Icons.check_circle_rounded
                          : Icons.cancel_rounded,
                      color: active ? Colors.green : Colors.red,
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Widget _buildExecutions(Map<String, dynamic> data) {
    final executions = data['executions'] is List
        ? (data['executions'] as List)
        : const <dynamic>[];

    final filtered = executions.where((raw) {
      final item = raw is Map<String, dynamic>
          ? raw
          : Map<String, dynamic>.from(raw as Map);
      if (_executionsQuery.isEmpty) return true;
      final query = _executionsQuery.toLowerCase();
      final taskName = item['taskName']?.toString().toLowerCase() ?? '';
      final status = item['status']?.toString().toLowerCase() ?? '';
      return taskName.contains(query) || status.contains(query);
    }).toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Executions',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            TextField(
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search_rounded),
                hintText: 'Search executions by task or status',
                border: OutlineInputBorder(),
              ),
              onChanged: (value) =>
                  setState(() => _executionsQuery = value.trim()),
            ),
            const SizedBox(height: 10),
            if (filtered.isEmpty)
              const Text('No executions found.')
            else
              ...filtered.take(120).map((raw) {
                final item = raw is Map<String, dynamic>
                    ? raw
                    : Map<String, dynamic>.from(raw as Map);
                final statusText = item['status']?.toString() ?? 'unknown';
                final statusColor = _statusColor(statusText);

                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: const Icon(Icons.history_rounded),
                    title: Text(
                      item['taskName']?.toString() ?? 'Task execution',
                    ),
                    subtitle: Text(item['executedAt']?.toString() ?? ''),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withAlpha((0.16 * 255).round()),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        statusText,
                        style: TextStyle(color: statusColor),
                      ),
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Widget _buildAnalytics(Map<String, dynamic> data) {
    final totals = data['totals'] is Map<String, dynamic>
        ? data['totals'] as Map<String, dynamic>
        : <String, dynamic>{};
    final taskStats = data['taskStats'] is List
        ? (data['taskStats'] as List)
        : const <dynamic>[];

    final totalExecutions = (totals['executions'] as num?)?.toDouble() ?? 0;
    final successfulExecutions =
        (totals['successfulExecutions'] as num?)?.toDouble() ?? 0;
    final successRate =
        totalExecutions > 0 ? successfulExecutions / totalExecutions : 0.0;

    return Column(
      children: [
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            SizedBox(
              width: 260,
              child: _buildStatCard(
                title: 'Total Executions',
                value: '${totals['executions'] ?? 0}',
                icon: Icons.sync_rounded,
              ),
            ),
            SizedBox(
              width: 260,
              child: _buildStatCard(
                title: 'Successful',
                value: '${totals['successfulExecutions'] ?? 0}',
                icon: Icons.check_circle_rounded,
              ),
            ),
            SizedBox(
              width: 260,
              child: _buildStatCard(
                title: 'Failed',
                value: '${totals['failedExecutions'] ?? 0}',
                icon: Icons.error_rounded,
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Success Rate',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(value: successRate.clamp(0.0, 1.0)),
                const SizedBox(height: 6),
                Text('${(successRate * 100).toStringAsFixed(1)}%'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Top Task Stats',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                if (taskStats.isEmpty)
                  const Text('No analytics data yet.')
                else
                  ...taskStats.take(50).map((raw) {
                    final item = raw is Map<String, dynamic>
                        ? raw
                        : Map<String, dynamic>.from(raw as Map);
                    final itemRate =
                        (item['successRate'] as num?)?.toDouble() ?? 0;
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.bar_chart_rounded),
                      title: Text(item['taskName']?.toString() ?? 'Task'),
                      subtitle: Text(
                        'Executions: ${item['totalExecutions'] ?? 0}',
                      ),
                      trailing: Text('${itemRate.toStringAsFixed(1)}%'),
                    );
                  }),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSettings(Map<String, dynamic> data) {
    final user = data['user'] is Map<String, dynamic>
        ? data['user'] as Map<String, dynamic>
        : <String, dynamic>{};

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Settings',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const CircleAvatar(child: Icon(Icons.person_rounded)),
              title: Text(user['name']?.toString() ?? widget.userName),
              subtitle: Text(user['email']?.toString() ?? widget.userEmail),
            ),
            const Divider(),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.link_rounded),
              title: const Text('API Base URL'),
              subtitle: Text(AppConfig.baseUri.toString()),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.security_rounded),
              title: const Text('Auth Mode'),
              subtitle: const Text('Bearer token via /api/mobile/login'),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () async {
                await widget.onSignOut();
              },
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Sign Out'),
            ),
          ],
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    final normalized = status.toLowerCase();
    if (normalized.contains('success') ||
        normalized.contains('active') ||
        normalized.contains('completed')) {
      return Colors.green;
    }
    if (normalized.contains('error') || normalized.contains('failed')) {
      return Colors.red;
    }
    if (normalized.contains('paused')) {
      return Colors.orange;
    }
    return Colors.blueGrey;
  }

  Widget _buildCurrentPanel() {
    final i18n = _i18n(context);
    switch (_currentKind) {
      case PanelKind.dashboard:
        return _buildPanelFrame(
          kind: PanelKind.dashboard,
          i18n: i18n,
          builder: _buildDashboard,
        );
      case PanelKind.tasks:
        return _buildPanelFrame(kind: PanelKind.tasks, i18n: i18n, builder: _buildTasks);
      case PanelKind.accounts:
        return _buildPanelFrame(
          kind: PanelKind.accounts,
          i18n: i18n,
          builder: _buildAccounts,
        );
      case PanelKind.executions:
        return _buildPanelFrame(
          kind: PanelKind.executions,
          i18n: i18n,
          builder: _buildExecutions,
        );
      case PanelKind.analytics:
        return _buildPanelFrame(
          kind: PanelKind.analytics,
          i18n: i18n,
          builder: _buildAnalytics,
        );
      case PanelKind.settings:
        return _buildPanelFrame(
          kind: PanelKind.settings,
          i18n: i18n,
          builder: _buildSettings,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentPanel = kPanelSpecs[_selectedIndex];
    final i18n = _i18n(context);
    final panelLabel = i18n.t(currentPanel.labelKey, currentPanel.fallbackLabel);

    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 1024;

        return Scaffold(
          appBar: AppBar(
            title: Text(panelLabel),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh_rounded),
                tooltip: i18n.t('common.refresh', 'Refresh'),
                onPressed: () => unawaited(_loadCurrentPanel(force: true)),
              ),
              IconButton(
                icon: const Icon(Icons.logout_rounded),
                tooltip: i18n.t('common.signOut', 'Sign out'),
                onPressed: () async {
                  await widget.onSignOut();
                },
              ),
            ],
          ),
          drawer: wide ? null : _buildDrawer(i18n),
          body: Row(
            children: [
              if (wide) _buildRail(i18n),
              Expanded(child: _buildCurrentPanel()),
            ],
          ),
          bottomNavigationBar: wide ? null : _buildBottomNavigation(i18n),
        );
      },
    );
  }
}

// API client lives in lib/api/api_client.dart

class _TaskComposerSheet extends StatefulWidget {
  const _TaskComposerSheet({
    required this.api,
    required this.accessToken,
    required this.i18n,
  });

  final ApiClient api;
  final String accessToken;
  final I18n i18n;

  @override
  State<_TaskComposerSheet> createState() => _TaskComposerSheetState();
}

class _TaskComposerSheetState extends State<_TaskComposerSheet> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _descController = TextEditingController();

  bool _loadingAccounts = true;
  bool _submitting = false;
  String _error = '';

  String _status = 'active';
  String _contentType = 'text';

  List<Map<String, dynamic>> _accounts = <Map<String, dynamic>>[];
  final Set<String> _sourceAccountIds = <String>{};
  final Set<String> _targetAccountIds = <String>{};

  @override
  void initState() {
    super.initState();
    unawaited(_loadAccounts());
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    super.dispose();
  }

  IconData _platformIcon(String platformId) {
    final normalized = platformId.trim().toLowerCase();
    if (normalized.contains('telegram')) return Icons.send_rounded;
    if (normalized.contains('twitter')) return Icons.alternate_email_rounded;
    if (normalized.contains('youtube')) return Icons.ondemand_video_rounded;
    if (normalized.contains('tiktok')) return Icons.music_note_rounded;
    if (normalized.contains('instagram')) return Icons.camera_alt_rounded;
    if (normalized.contains('facebook')) return Icons.facebook_rounded;
    if (normalized.contains('linkedin')) return Icons.work_rounded;
    return Icons.public_rounded;
  }

  Future<void> _loadAccounts() async {
    setState(() {
      _loadingAccounts = true;
      _error = '';
    });

    try {
      final payload = await widget.api.fetchAccounts(
        widget.accessToken,
        limit: 200,
      );
      final raw = payload['accounts'];
      final list = raw is List ? raw : const <dynamic>[];
      final accounts = list.map((entry) {
        final item = entry is Map<String, dynamic>
            ? entry
            : Map<String, dynamic>.from(entry as Map);
        return <String, dynamic>{
          'id': item['id']?.toString() ?? '',
          'platformId': item['platformId']?.toString() ?? 'unknown',
          'accountName': item['accountName']?.toString() ?? '',
          'accountUsername': item['accountUsername']?.toString() ?? '',
          'isActive': item['isActive'] == true,
        };
      }).where((a) => (a['id']?.toString() ?? '').trim().isNotEmpty).toList();

      accounts.sort((a, b) {
        final ap = (a['platformId']?.toString() ?? '').compareTo(b['platformId']?.toString() ?? '');
        if (ap != 0) return ap;
        return (a['accountName']?.toString() ?? '').compareTo(b['accountName']?.toString() ?? '');
      });

      if (!mounted) return;
      setState(() {
        _accounts = accounts;
        _loadingAccounts = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadingAccounts = false;
        _error = error is ApiException ? error.message : 'Failed to load accounts.';
      });
    }
  }

  String _accountLabel(Map<String, dynamic> account) {
    final name = (account['accountName']?.toString() ?? '').trim();
    final username = (account['accountUsername']?.toString() ?? '').trim();
    if (name.isNotEmpty) return name;
    if (username.isNotEmpty) return '@$username';
    return account['id']?.toString() ?? 'Account';
  }

  bool _validateSelections() {
    final overlap = _sourceAccountIds.intersection(_targetAccountIds);
    if (_sourceAccountIds.isEmpty) {
      setState(() => _error = widget.i18n.isArabic ? 'اختر حساب مصدر واحد على الأقل.' : 'Select at least one source account.');
      return false;
    }
    if (_targetAccountIds.isEmpty) {
      setState(() => _error = widget.i18n.isArabic ? 'اختر حساب هدف واحد على الأقل.' : 'Select at least one target account.');
      return false;
    }
    if (overlap.isNotEmpty) {
      setState(() => _error = widget.i18n.isArabic ? 'لا يمكن أن يكون نفس الحساب مصدرًا وهدفًا.' : 'A single account cannot be both source and target.');
      return false;
    }
    return true;
  }

  Future<void> _submit() async {
    if (_submitting) return;
    setState(() => _error = '');

    if (!_formKey.currentState!.validate()) return;
    if (!_validateSelections()) return;

    setState(() => _submitting = true);
    try {
      await widget.api.createTask(
        widget.accessToken,
        body: <String, dynamic>{
          'name': _nameController.text.trim(),
          'description': _descController.text.trim(),
          'sourceAccounts': _sourceAccountIds.toList(),
          'targetAccounts': _targetAccountIds.toList(),
          'status': _status,
          'contentType': _contentType,
          'executionType': 'immediate',
        },
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error is ApiException ? error.message : 'Failed to create task.';
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 8,
          bottom: 16 + MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.i18n.isArabic ? 'إنشاء مهمة' : 'Create Task',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                    ),
                  ),
                  IconButton(
                    onPressed: _submitting ? null : () => Navigator.of(context).maybePop(),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (_error.trim().isNotEmpty)
                Card(
                  color: scheme.errorContainer,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline_rounded, color: scheme.onErrorContainer),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _error,
                            style: TextStyle(color: scheme.onErrorContainer, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              if (_error.trim().isNotEmpty) const SizedBox(height: 10),
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextFormField(
                      controller: _nameController,
                      textInputAction: TextInputAction.next,
                      decoration: InputDecoration(
                        labelText: widget.i18n.isArabic ? 'اسم المهمة' : 'Task name',
                        prefixIcon: const Icon(Icons.task_alt_rounded),
                      ),
                      validator: (value) {
                        if ((value ?? '').trim().isEmpty) {
                          return widget.i18n.isArabic ? 'اسم المهمة مطلوب.' : 'Task name is required.';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _descController,
                      minLines: 2,
                      maxLines: 4,
                      decoration: InputDecoration(
                        labelText: widget.i18n.isArabic ? 'الوصف (اختياري)' : 'Description (optional)',
                        prefixIcon: const Icon(Icons.notes_rounded),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _status,
                            decoration: InputDecoration(
                              labelText: widget.i18n.isArabic ? 'الحالة' : 'Status',
                              prefixIcon: const Icon(Icons.toggle_on_rounded),
                            ),
                            items: const [
                              DropdownMenuItem(value: 'active', child: Text('Active')),
                              DropdownMenuItem(value: 'paused', child: Text('Paused')),
                            ],
                            onChanged: _submitting ? null : (value) {
                              if (value == null) return;
                              setState(() => _status = value);
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _contentType,
                            decoration: InputDecoration(
                              labelText: widget.i18n.isArabic ? 'نوع المحتوى' : 'Content type',
                              prefixIcon: const Icon(Icons.article_rounded),
                            ),
                            items: const [
                              DropdownMenuItem(value: 'text', child: Text('Text')),
                              DropdownMenuItem(value: 'image', child: Text('Image')),
                              DropdownMenuItem(value: 'video', child: Text('Video')),
                              DropdownMenuItem(value: 'link', child: Text('Link')),
                            ],
                            onChanged: _submitting ? null : (value) {
                              if (value == null) return;
                              setState(() => _contentType = value);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.input_rounded),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    widget.i18n.isArabic ? 'حسابات المصدر' : 'Source accounts',
                                    style: const TextStyle(fontWeight: FontWeight.w800),
                                  ),
                                ),
                                Text('${_sourceAccountIds.length}'),
                              ],
                            ),
                            const SizedBox(height: 8),
                            if (_loadingAccounts)
                              const Center(child: Padding(padding: EdgeInsets.all(10), child: CircularProgressIndicator()))
                            else if (_accounts.isEmpty)
                              Text(widget.i18n.isArabic ? 'لا توجد حسابات.' : 'No accounts found.')
                            else
                              ..._accounts.map((account) {
                                final id = account['id']?.toString() ?? '';
                                final selected = _sourceAccountIds.contains(id);
                                return CheckboxListTile(
                                  value: selected,
                                  dense: true,
                                  contentPadding: EdgeInsets.zero,
                                  onChanged: _submitting
                                      ? null
                                      : (value) {
                                          setState(() {
                                            if (value == true) {
                                              _sourceAccountIds.add(id);
                                            } else {
                                              _sourceAccountIds.remove(id);
                                            }
                                          });
                                        },
                                  secondary: Icon(_platformIcon(account['platformId']?.toString() ?? '')),
                                  title: Text(_accountLabel(account)),
                                  subtitle: Text(
                                    '${account['platformId'] ?? 'unknown'} • @${account['accountUsername'] ?? '-'}',
                                  ),
                                );
                              }),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.output_rounded),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    widget.i18n.isArabic ? 'حسابات الهدف' : 'Target accounts',
                                    style: const TextStyle(fontWeight: FontWeight.w800),
                                  ),
                                ),
                                Text('${_targetAccountIds.length}'),
                              ],
                            ),
                            const SizedBox(height: 8),
                            if (_loadingAccounts)
                              const Center(child: Padding(padding: EdgeInsets.all(10), child: CircularProgressIndicator()))
                            else if (_accounts.isEmpty)
                              Text(widget.i18n.isArabic ? 'لا توجد حسابات.' : 'No accounts found.')
                            else
                              ..._accounts.map((account) {
                                final id = account['id']?.toString() ?? '';
                                final selected = _targetAccountIds.contains(id);
                                return CheckboxListTile(
                                  value: selected,
                                  dense: true,
                                  contentPadding: EdgeInsets.zero,
                                  onChanged: _submitting
                                      ? null
                                      : (value) {
                                          setState(() {
                                            if (value == true) {
                                              _targetAccountIds.add(id);
                                            } else {
                                              _targetAccountIds.remove(id);
                                            }
                                          });
                                        },
                                  secondary: Icon(_platformIcon(account['platformId']?.toString() ?? '')),
                                  title: Text(_accountLabel(account)),
                                  subtitle: Text(
                                    '${account['platformId'] ?? 'unknown'} • @${account['accountUsername'] ?? '-'}',
                                  ),
                                );
                              }),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed: _submitting ? null : () => unawaited(_submit()),
                      icon: _submitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.add_rounded),
                      label: Text(widget.i18n.isArabic ? 'إنشاء' : 'Create'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
