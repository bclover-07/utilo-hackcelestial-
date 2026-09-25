import 'package:flutter_test/flutter_test.dart';
import 'package:utlio_mobile/core/api.dart';

// Run by backend/scripts/mobile-check.js against an isolated MongoDB replica set.
// No app response is mocked and no configured development database is used.
void main() {
  const base = String.fromEnvironment('CONTRACT_API');
  test(
    'Dart client executes real authenticated marketplace contracts',
    () async {
      final provider = Api(baseUrl: base, persistSession: false);
      final seeker = Api(baseUrl: base, persistSession: false);
      Future<Json> account(Api api, String name) async =>
          Map<String, dynamic>.from(
            await api.call(
              '/auth/register',
              method: 'POST',
              body: {
                'name': name,
                'email': '$name@mobile-test.invalid',
                'password': 'ContractPassword123!',
                'role': 'business',
                'mode': name == 'provider' ? 'provider' : 'seeker',
                'city': 'Mumbai',
                'phone': '9999999999',
                'category': 'hospitality',
              },
            ),
          );
      final p = await account(provider, 'provider');
      final s = await account(seeker, 'seeker');
      expect((await provider.call('/auth/me'))['_id'], p['_id']);
      expect((await seeker.call('/auth/me'))['_id'], s['_id']);
      final listing = await provider.call(
        '/listings',
        method: 'POST',
        body: {
          'title': 'Mobile contract chairs',
          'description': 'Stackable chairs for isolated integration checks',
          'category': 'chairs',
          'quantity': 10,
          'capacity': 1,
          'price': 100,
          'unit': 'day',
          'minHours': 1,
          'deposit': 0,
          'delivery': true,
          'deliveryFee': 50,
          'cancellationHours': 24,
          'city': 'Mumbai',
          'address': 'Test address',
          'coordinates': [72.8777, 19.076],
          'photos': [],
          'attributes': {},
        },
      );
      final start = DateTime.now().toUtc().add(const Duration(days: 4)),
          end = start.add(const Duration(days: 1));
      final filters = {
        'category': 'chairs',
        'quantity': 2,
        'start': start.toIso8601String(),
        'end': end.toIso8601String(),
        'city': 'Mumbai',
      };
      final search = await seeker.call(
        '/search',
        method: 'POST',
        body: filters,
      );
      expect(search['items'][0]['_id'], listing['_id']);
      final favorite = await seeker.call(
        '/favorites/${listing['_id']}',
        method: 'POST',
      );
      expect(favorite['saved'], true);
      final saved = await seeker.call(
        '/saved-searches',
        method: 'POST',
        body: {'name': 'Chairs for event', 'filters': filters},
      );
      expect((await seeker.call('/saved-searches') as List).length, 1);
      await seeker.call('/saved-searches/${saved['_id']}', method: 'DELETE');
      final request = await seeker.call(
        '/requests',
        method: 'POST',
        body: {
          'title': 'Mobile integration event',
          'items': [
            {
              'category': 'chairs',
              'quantity': 2,
              'capacity': 1,
              'specs': 'Stackable',
            },
          ],
          'city': 'Mumbai',
          'coordinates': [72.8777, 19.076],
          'radiusKm': 25,
          'start': start.toIso8601String(),
          'end': end.toIso8601String(),
          'budget': 1000,
          'delivery': false,
        },
      );
      expect(request['invited'], 1);
      final quote = (await provider.call('/quotes') as List).single;
      await provider.call(
        '/quotes/${quote['_id']}/messages',
        method: 'POST',
        body: {'text': 'Delivery is available for an additional charge.'},
      );
      expect(
        (await seeker.call('/quotes/${quote['_id']}/messages'))[0]['text'],
        'Delivery is available for an additional charge.',
      );
      await provider.call(
        '/quotes/${quote['_id']}/offers',
        method: 'POST',
        body: {'version': 0, 'price': 200, 'conditions': 'Pickup included'},
      );
      final booking = await seeker.call(
        '/quotes/${quote['_id']}/accept',
        method: 'POST',
        body: {'version': 1},
      );
      expect(booking['status'], 'confirmed');
      expect(
        (await seeker.call(
          '/bookings/${booking['_id']}/summary',
        ))['booking']['price'],
        200,
      );
      expect(
        (await seeker.bytes('/bookings/${booking['_id']}/calendar')).length,
        greaterThan(50),
      );
      await seeker.call(
        '/bookings/${booking['_id']}/status',
        method: 'PATCH',
        body: {'status': 'cancelled', 'reason': 'Integration test cleanup'},
      );
      expect((await seeker.call('/bookings'))[0]['status'], 'cancelled');
      final config = await seeker.call('/ai/local-config');
      expect(config['tasks']['polish'], isA<String>());
      final urgency = await seeker.call(
        '/ai/urgency',
        method: 'POST',
        body: {'requestId': request['request']['_id']},
      );
      expect(urgency['score'], isA<num>());
      for (final path in [
        '/analytics?mode=seeker',
        '/analytics/intelligence',
        '/analytics/market-pulse',
        '/ai/studio',
        '/ai/plans',
        '/ai/memory',
        '/reviews',
        '/disputes',
        '/notifications',
      ]) {
        expect(await seeker.call(path), isNotNull, reason: path);
      }
      await seeker.call('/auth/logout', method: 'POST');
      await expectLater(
        seeker.call('/auth/me'),
        throwsA(isA<ApiFailure>().having((e) => e.status, 'status', 401)),
      );
      provider.dio.close();
      seeker.dio.close();
    },
    skip: base.isEmpty
        ? 'Use node backend/scripts/mobile-check.js to provision the isolated server.'
        : false,
    timeout: const Timeout(Duration(minutes: 3)),
  );
}
