import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:utlio_mobile/core/api.dart';
import 'package:utlio_mobile/ui/theme.dart';
import 'package:utlio_mobile/ui/widgets.dart';
import 'package:utlio_mobile/screens/landing.dart';
import 'package:utlio_mobile/screens/auth.dart';

void main() {
  for (final width in [360.0, 768.0, 1440.0]) {
    testWidgets('Landing and registration fit a $width viewport', (
      tester,
    ) async {
      tester.view.physicalSize = Size(width, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final session = Session(
        Api(baseUrl: 'http://localhost:4000/api', persistSession: false),
      );
      FlutterError.onError = FlutterError.dumpErrorToConsole;
      await tester.pumpWidget(
        MaterialApp(
          theme: utlioTheme(),
          home: LandingScreen(session: session),
        ),
      );
      expect(find.text('Less idle.\nMore possible.'), findsOneWidget);
      final exc = tester.takeException();
      if (exc is FlutterError) {
        for (final d in exc.diagnostics) {
          // ignore: avoid_print
          print(d.toStringDeep());
        }
      }
      expect(exc, isNull);
      await tester.pumpWidget(
        MaterialApp(
          theme: utlioTheme(),
          home: AuthScreen(session: session, register: true),
        ),
      );
      expect(
        find.widgetWithText(TextFormField, 'Business name'),
        findsOneWidget,
      );
      expect(tester.takeException(), isNull);
    });
  }
  testWidgets(
    'Required fields prevent an empty mutation; valid numeric input remains numeric',
    (tester) async {
      Json? submitted;
      await tester.pumpWidget(
        MaterialApp(
          theme: utlioTheme(),
          home: Scaffold(
            body: FieldsForm(
              submit: 'Save',
              fields: const [
                FieldSpec('quantity', 'Quantity', type: 'number', min: 1),
              ],
              onSubmit: (v) async {
                submitted = v;
                return 'Saved.';
              },
            ),
          ),
        ),
      );
      await tester.tap(find.text('Save'));
      await tester.pump();
      expect(submitted, isNull);
      await tester.enterText(find.byType(TextFormField), '2');
      await tester.tap(find.text('Save'));
      await tester.pumpAndSettle();
      expect(submitted, {'quantity': 2});
      expect(find.text('Saved.'), findsOneWidget);
    },
  );
  testWidgets('Failed action exposes the actual failure and can be retried', (
    tester,
  ) async {
    var calls = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AsyncButton(
            text: 'Reserve',
            run: () async {
              calls++;
              throw const ApiFailure(
                'Inventory changed. Refresh before accepting.',
              );
            },
          ),
        ),
      ),
    );
    await tester.tap(find.text('Reserve'));
    await tester.pumpAndSettle();
    expect(
      find.text('Inventory changed. Refresh before accepting.'),
      findsOneWidget,
    );
    await tester.tap(find.text('Reserve'));
    await tester.pumpAndSettle();
    expect(calls, 2);
  });
}
