import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:utlio_mobile/core/api.dart';
import 'package:utlio_mobile/screens/resources.dart';
import 'package:utlio_mobile/screens/deals.dart';
import 'package:utlio_mobile/screens/intelligence.dart';
import 'package:utlio_mobile/screens/account_admin.dart';
import 'package:utlio_mobile/screens/workspace.dart';
import 'package:utlio_mobile/ui/theme.dart';

void main() {
  const base = String.fromEnvironment('CONTRACT_API');
  testWidgets('All dashboard families render real API responses on phone and laptop', (tester) async {
    // Allow the real isolated Express server instead of Flutter's default HTTP blocker.
    HttpOverrides.global = null;
    final api = Api(baseUrl: base, persistSession: false);
    final adminApi = Api(baseUrl: base, persistSession: false);
    final session = Session(api), admin = Session(adminApi);
    await tester.runAsync(() async {
      await session.login({'name':'Screen contract business','email':'screen@mobile-test.invalid','password':'ContractPassword123!','role':'business','mode':'provider','city':'Mumbai','category':'hospitality','phone':'9999999999'},register:true);
      await admin.login({'email':'screen-admin@mobile-test.invalid','password':'ContractPassword123!','role':'admin'});
    });
    addTearDown(() { api.dio.close(); adminApi.dio.close(); });
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final screens = <String,Widget Function()>{
      'overview':()=>AnalyticsScreen(session:session,section:'',onNavigate:(_){}),
      'analytics':()=>AnalyticsScreen(session:session,section:'analytics',onNavigate:(_){}),
      'market-pulse':()=>AnalyticsScreen(session:session,section:'market-pulse',onNavigate:(_){}),
      'performance':()=>AnalyticsScreen(session:session,section:'performance',onNavigate:(_){}),
      'listings':()=>ListingsScreen(session:session),
      'listing-create':()=>ListingEditor(session:session),
      'availability':()=>AvailabilityScreen(session:session),
      'discovery':()=>SearchScreen(session:session),
      'saved':()=>SavedScreen(session:session),
      'requests':()=>RequestsScreen(session:session),
      'request-create':()=>RequestEditor(session:session),
      'quotes':()=>QuotesScreen(session:session),
      'bookings':()=>BookingsScreen(session:session),
      'reviews':()=>RecordsScreen(api:api,path:'/reviews',title:'Reviews'),
      'disputes':()=>RecordsScreen(api:api,path:'/disputes',title:'Disputes'),
      'profile':()=>ProfileScreen(session:session),
      'notifications':()=>NotificationsScreen(session:session,onNavigate:(_){}),
      'planner':()=>PlannerScreen(session:session),
      for(final section in ['agents','smart-pricing','forecast'])section:()=>AgentScreen(session:session,section:section),
      for(final section in ['verifications','disputes','moderation','categories','settings'])'admin-$section':()=>AdminScreen(session:admin,section:section),
      'admin-agents':()=>AgentScreen(session:admin,section:'agents'),
      'admin-overview':()=>AnalyticsScreen(session:admin,section:'',onNavigate:(_){}),
      'admin-analytics':()=>AnalyticsScreen(session:admin,section:'analytics',onNavigate:(_){}),
      'admin-category-create':()=>CategoryEditor(api:adminApi),
    };
    for(final width in [360.0,1440.0]) {
      tester.view.physicalSize=Size(width,900);tester.view.devicePixelRatio=1;
      for(final entry in screens.entries) {
        await tester.pumpWidget(MaterialApp(theme:utlioTheme(),home:Scaffold(body:KeyedSubtree(key:UniqueKey(),child:entry.value()))));
        for(var i=0;i<100;i++) {
          await tester.runAsync(()=>Future<void>.delayed(const Duration(milliseconds:30)));
          await tester.pump(const Duration(milliseconds:50));
          if(find.byType(CircularProgressIndicator).evaluate().isEmpty)break;
        }
        expect(find.byType(CircularProgressIndicator),findsNothing,reason:'${entry.key} at $width did not load');
        expect(find.text('Retry connection'),findsNothing,reason:'${entry.key} at $width could not fetch its endpoint');
        expect(tester.takeException(),isNull,reason:'${entry.key} at $width');
      }
    }
    await tester.pumpWidget(const SizedBox());
  },skip:base.isEmpty,timeout:const Timeout(Duration(minutes:5)));
}
