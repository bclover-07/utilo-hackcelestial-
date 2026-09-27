import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:utlio_mobile/core/api.dart';
import 'package:utlio_mobile/ui/theme.dart';
import 'package:utlio_mobile/ui/widgets.dart';
import 'package:utlio_mobile/screens/resources.dart';

void main() {
  testWidgets('ItemsEditor dynamically adds and removes requirement items', (tester) async {
    final items = <Json>[
      {'quantity': 1, 'capacity': 1, 'specs': ''}
    ];
    final categories = <Json>[
      {'slug': 'venue', 'name': 'Venues & Halls'},
      {'slug': 'equipment', 'name': 'AV Equipment'},
    ];

    await tester.pumpWidget(
      MaterialApp(
        theme: utlioTheme(),
        home: Scaffold(
          body: StatefulBuilder(
            builder: (context, setState) => SingleChildScrollView(
              child: ItemsEditor(categories: categories, items: items),
            ),
          ),
        ),
      ),
    );

    expect(find.text('Add another resource'), findsOneWidget);
    expect(items.length, 1);

    // Tap "Add another resource"
    await tester.tap(find.text('Add another resource'));
    await tester.pumpAndSettle();
    expect(items.length, 2);

    // Remove buttons should appear when length > 1
    expect(find.text('Remove item'), findsWidgets);

    // Tap "Remove item"
    await tester.tap(find.text('Remove item').first);
    await tester.pumpAndSettle();
    expect(items.length, 1);
  });

  testWidgets('Requirement FieldsForm validates required fields and submits properly', (tester) async {
    Json? submitted;
    await tester.pumpWidget(
      MaterialApp(
        theme: utlioTheme(),
        home: Scaffold(
          body: SingleChildScrollView(
            child: FieldsForm(
              submit: 'Broadcast request →',
              fields: const [
                FieldSpec('title', 'Event / request title'),
                FieldSpec('budget', 'Total budget (INR)', type: 'number', min: 1),
                FieldSpec('urgency', 'Priority', options: {
                  'routine': 'Routine',
                  'urgent': 'Urgent',
                }, initial: 'routine'),
              ],
              onSubmit: (input) async {
                submitted = input;
                return 'Broadcast submitted';
              },
            ),
          ),
        ),
      ),
    );

    expect(find.text('Broadcast request →'), findsOneWidget);

    // Test form validation: submitting empty form should show validation errors
    await tester.tap(find.text('Broadcast request →'));
    await tester.pumpAndSettle();

    // Required fields show validation message
    expect(find.text('Event / request title is required'), findsOneWidget);
    expect(submitted, isNull);

    // Enter valid inputs
    await tester.enterText(find.widgetWithText(TextFormField, 'Event / request title'), 'Annual Summit');
    await tester.enterText(find.widgetWithText(TextFormField, 'Total budget (INR)'), '50000');
    await tester.tap(find.text('Broadcast request →'));
    await tester.pumpAndSettle();

    expect(submitted, isNotNull);
    expect(submitted!['title'], 'Annual Summit');
    expect(submitted!['budget'], 50000);
    expect(find.text('Broadcast submitted'), findsOneWidget);
  });

  testWidgets('FieldsForm handles search keywords, number validation, and submission', (tester) async {
    Json? submitted;
    await tester.pumpWidget(
      MaterialApp(
        theme: utlioTheme(),
        home: Scaffold(
          body: FieldsForm(
            submit: 'Apply Search',
            fields: const [
              FieldSpec('query', 'Keywords', required: false),
              FieldSpec('minCapacity', 'Min Capacity', type: 'number', min: 1),
            ],
            onSubmit: (values) async {
              submitted = values;
              return 'Search Applied';
            },
          ),
        ),
      ),
    );

    expect(find.text('Apply Search'), findsOneWidget);
    await tester.enterText(find.widgetWithText(TextFormField, 'Keywords'), 'Banquet');
    await tester.enterText(find.widgetWithText(TextFormField, 'Min Capacity'), '150');
    await tester.tap(find.text('Apply Search'));
    await tester.pumpAndSettle();

    expect(submitted, isNotNull);
    expect(submitted!['query'], 'Banquet');
    expect(submitted!['minCapacity'], 150);
    expect(find.text('Search Applied'), findsOneWidget);
  });

  testWidgets('AiResultButton displays analysis button smoothly', (tester) async {
    final api = Api(baseUrl: 'http://localhost:4000/api', persistSession: false);
    await tester.pumpWidget(
      MaterialApp(
        theme: utlioTheme(),
        home: Scaffold(
          body: AiResultButton(
            api: api,
            path: '/ai/urgency',
            body: const {'requestId': 'req-123'},
            title: 'Analyze urgency',
          ),
        ),
      ),
    );

    expect(find.text('Analyze urgency'), findsOneWidget);
  });
}
