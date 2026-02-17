import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:socialflow_flutter/main.dart';

class FakeAuthApiClient extends ApiClient {
  FakeAuthApiClient({
    required this.onRegister,
    required this.onVerifyEmail,
    required this.onLogin,
  }) : super(baseUri: Uri.parse('https://example.test'));

  final Future<Map<String, dynamic>> Function({
    required String name,
    required String email,
    required String password,
  }) onRegister;

  final Future<Map<String, dynamic>> Function({
    required String email,
    required String code,
  }) onVerifyEmail;

  final Future<AuthSession> Function({
    required String email,
    required String password,
  }) onLogin;

  @override
  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
  }) {
    return onRegister(name: name, email: email, password: password);
  }

  @override
  Future<Map<String, dynamic>> verifyEmail({
    required String email,
    required String code,
  }) {
    return onVerifyEmail(email: email, code: code);
  }

  @override
  Future<AuthSession> login({required String email, required String password}) {
    return onLogin(email: email, password: password);
  }
}

void main() {
  testWidgets('register -> verify email -> sign in flow works', (tester) async {
    late AuthSession signedInSession;

    final api = FakeAuthApiClient(
      onRegister: ({required name, required email, required password}) async {
        expect(name, 'Test User');
        expect(email, 'test@example.com');
        expect(password, 'password123');
        return {
          'success': true,
          'verificationRequired': true,
          'debug': {'verificationCode': '123456'},
        };
      },
      onVerifyEmail: ({required email, required code}) async {
        expect(email, 'test@example.com');
        expect(code, '123456');
        return {'success': true};
      },
      onLogin: ({required email, required password}) async {
        expect(email, 'test@example.com');
        expect(password, 'password123');
        return const AuthSession(
          accessToken: 'token-1',
          userId: 'u1',
          email: 'test@example.com',
          name: 'Test User',
        );
      },
    );

    await tester.pumpWidget(
      MaterialApp(
        home: AuthScreen(
          api: api,
          onSignedIn: (session) async {
            signedInSession = session;
          },
        ),
      ),
    );

    await tester.tap(find.text('Register'));
    await tester.pumpAndSettle();

    await tester.enterText(
      find.byKey(const Key('register-name-field')),
      'Test User',
    );
    await tester.enterText(
      find.byKey(const Key('register-email-field')),
      'test@example.com',
    );
    await tester.enterText(
      find.byKey(const Key('register-password-field')),
      'password123',
    );

    await tester.tap(find.byKey(const Key('register-submit-button')));
    await tester.pumpAndSettle();

    expect(
      find.textContaining(
        'Account created. Enter your email verification code.',
      ),
      findsOneWidget,
    );
    expect(
      find.byKey(const Key('register-verification-code-field')),
      findsOneWidget,
    );

    await tester.tap(find.byKey(const Key('register-verify-button')));
    await tester.pumpAndSettle();

    expect(signedInSession.accessToken, 'token-1');
    expect(signedInSession.email, 'test@example.com');
  });
}
