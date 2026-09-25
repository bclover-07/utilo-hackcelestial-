import 'package:flutter/material.dart';
import '../core/api.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';
import 'resources.dart';
import 'deals.dart';
import 'intelligence.dart';
import 'account_admin.dart';

class Destination {
  const Destination(this.path, this.title, this.icon);
  final String path, title;
  final IconData icon;
}

const sharedDestinations = [
  Destination('negotiations', 'Quotes & conversation', Icons.forum_outlined),
  Destination('bookings', 'Bookings & calendar', Icons.event_available),
  Destination('reviews', 'Reviews & reputation', Icons.star_outline),
  Destination('disputes', 'Disputes & mediation', Icons.flag_outlined),
  Destination('market-pulse', 'Live market pulse', Icons.radar),
  Destination('analytics', 'Market analytics', Icons.bar_chart),
  Destination(
    'notifications',
    'Alerts & updates',
    Icons.notifications_outlined,
  ),
  Destination('profile', 'Business profile & KYC', Icons.business_outlined),
];

class Workspace extends StatefulWidget {
  const Workspace({super.key, required this.session});
  final Session session;
  @override
  State<Workspace> createState() => _WorkspaceState();
}

class _WorkspaceState extends State<Workspace> {
  String selected = '';
  Session get s => widget.session;
  List<Destination> get destinations => s.admin
      ? const [
          Destination('', 'Platform overview', Icons.dashboard_outlined),
          Destination(
            'verifications',
            'KYC verifications',
            Icons.verified_outlined,
          ),
          Destination('disputes', 'Dispute arbitration', Icons.gavel),
          Destination(
            'moderation',
            'Content moderation',
            Icons.shield_outlined,
          ),
          Destination(
            'categories',
            'Categories taxonomy',
            Icons.category_outlined,
          ),
          Destination('analytics', 'Marketplace liquidity', Icons.bar_chart),
          Destination(
            'settings',
            'Policies & integrations',
            Icons.settings_outlined,
          ),
          Destination('agents', 'AI operations & agents', Icons.auto_awesome),
        ]
      : [
          const Destination('', 'Overview summary', Icons.dashboard_outlined),
          if (s.mode == 'provider') ...const [
            Destination('listings', 'My listings', Icons.inventory_2_outlined),
            Destination(
              'calendar',
              'Availability & calendar',
              Icons.calendar_month,
            ),
            Destination(
              'smart-pricing',
              'Smart pricing advisor',
              Icons.currency_rupee,
            ),
            Destination('forecast', 'Demand outlook', Icons.trending_up),
            Destination(
              'performance',
              'Provider performance',
              Icons.stars_outlined,
            ),
          ] else ...const [
            Destination('search', 'Discover resources', Icons.search),
            Destination('planner', 'AI Conductor', Icons.hub_outlined),
            Destination(
              'requests',
              'My requirements (RFQs)',
              Icons.campaign_outlined,
            ),
            Destination('compare', 'Saved & compare', Icons.favorite_border),
          ],
          const Destination('agents', 'Agent Studio', Icons.auto_awesome),
          ...sharedDestinations,
        ];
  void go(String path) {
    setState(() => selected = path);
  }

  @override
  Widget build(BuildContext context) {
    final choices = destinations;
    final title =
        choices.where((d) => d.path == selected).firstOrNull?.title ??
        'Workspace';
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'utlio ✳  $title',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
        ),
      ),
      drawer: Drawer(
        backgroundColor: paper,
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text(
                'U  utlio ✳',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900),
              ),
              Text(
                s.admin
                    ? 'OPERATIONS STUDIO'
                    : '${s.mode.toUpperCase()} DASHBOARD',
              ),
              const SizedBox(height: 18),
              if (!s.admin)
                AsyncButton(
                  text: s.mode == 'provider'
                      ? 'Switch to seeker'
                      : 'Switch to provider',
                  icon: Icons.swap_horiz,
                  run: () async {
                    await s.profile({
                      'mode': s.mode == 'provider' ? 'seeker' : 'provider',
                    });
                    go('');
                    return 'Workspace changed.';
                  },
                ),
              const SizedBox(height: 12),
              ...choices.map(
                (d) => ListTile(
                  selected: selected == d.path,
                  selectedTileColor: yellow,
                  leading: Icon(d.icon),
                  title: Text(d.title),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    go(d.path);
                  },
                ),
              ),
              const Divider(),
              Text(identity(s.user)),
              AsyncButton(text: 'Log out', icon: Icons.logout, run: s.logout),
            ],
          ),
        ),
      ),
      body: Row(
        children: [
          if (MediaQuery.sizeOf(context).width >= 1000)
            SizedBox(
              width: 275,
              child: DecoratedBox(
                decoration: const BoxDecoration(
                  color: paper,
                  border: Border(right: BorderSide(color: ink, width: 2)),
                ),
                child: ListView(
                  padding: const EdgeInsets.all(12),
                  children: [
                    Text(
                      s.admin
                          ? 'OPERATIONS STUDIO'
                          : '${s.mode.toUpperCase()} DASHBOARD',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    if (!s.admin)
                      AsyncButton(
                        text: s.mode == 'provider'
                            ? 'Switch to seeker'
                            : 'Switch to provider',
                        icon: Icons.swap_horiz,
                        run: () async {
                          await s.profile({
                            'mode': s.mode == 'provider'
                                ? 'seeker'
                                : 'provider',
                          });
                          go('');
                          return 'Workspace changed.';
                        },
                      ),
                    ...choices.map(
                      (d) => ListTile(
                        selected: selected == d.path,
                        selectedTileColor: yellow,
                        leading: Icon(d.icon),
                        title: Text(d.title),
                        onTap: () => go(d.path),
                      ),
                    ),
                    const Divider(),
                    AsyncButton(
                      text: 'Log out',
                      icon: Icons.logout,
                      run: s.logout,
                    ),
                  ],
                ),
              ),
            ),
          Expanded(
            child: AnimatedSwitcher(
              duration: MediaQuery.disableAnimationsOf(context)
                  ? Duration.zero
                  : const Duration(milliseconds: 220),
              child: KeyedSubtree(
                key: ValueKey('${s.admin}/${s.mode}/$selected'),
                child: screen(),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: MediaQuery.sizeOf(context).width >= 1000
          ? null
          : NavigationBar(
              selectedIndex: selected == ''
                  ? 0
                  : selected ==
                        (s.admin
                            ? 'agents'
                            : s.mode == 'provider'
                            ? 'listings'
                            : 'search')
                  ? 1
                  : 2,
              onDestinationSelected: (i) => go(
                i == 0
                    ? ''
                    : i == 1
                    ? (s.admin
                          ? 'agents'
                          : s.mode == 'provider'
                          ? 'listings'
                          : 'search')
                    : (s.admin ? 'disputes' : 'negotiations'),
              ),
              destinations: [
                const NavigationDestination(
                  icon: Icon(Icons.dashboard_outlined),
                  label: 'Overview',
                ),
                NavigationDestination(
                  icon: Icon(
                    s.admin
                        ? Icons.auto_awesome
                        : s.mode == 'provider'
                        ? Icons.inventory_2_outlined
                        : Icons.search,
                  ),
                  label: s.admin
                      ? 'Agents'
                      : s.mode == 'provider'
                      ? 'Listings'
                      : 'Discover',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.forum_outlined),
                  label: s.admin ? 'Disputes' : 'Deals',
                ),
              ],
            ),
    );
  }

  Widget screen() {
    if (s.admin &&
        [
          'verifications',
          'disputes',
          'moderation',
          'categories',
          'settings',
        ].contains(selected)) {
      return AdminScreen(session: s, section: selected);
    }
    switch (selected) {
      case 'listings':
        return ListingsScreen(session: s);
      case 'calendar':
        return AvailabilityScreen(session: s);
      case 'search':
        return SearchScreen(session: s);
      case 'compare':
        return SavedScreen(session: s);
      case 'requests':
        return RequestsScreen(session: s);
      case 'negotiations':
        return QuotesScreen(session: s);
      case 'bookings':
        return BookingsScreen(session: s);
      case 'reviews':
      case 'disputes':
        return RecordsScreen(
          api: s.api,
          path: '/$selected',
          title: selected == 'reviews'
              ? 'Reviews & reputation'
              : 'Disputes & mediation',
        );
      case 'profile':
        return ProfileScreen(session: s);
      case 'notifications':
        return NotificationsScreen(session: s, onNavigate: go);
      case 'planner':
        return PlannerScreen(session: s);
      case 'smart-pricing':
      case 'forecast':
      case 'agents':
        return AgentScreen(session: s, section: selected);
      case 'analytics':
      case 'market-pulse':
      case 'performance':
      case '':
        return AnalyticsScreen(session: s, section: selected, onNavigate: go);
      default:
        return const Empty(
          text: 'This destination is unavailable. Choose a page from the menu.',
        );
    }
  }
}

class RecordsScreen extends StatelessWidget {
  const RecordsScreen({
    super.key,
    required this.api,
    required this.path,
    required this.title,
  });
  final Api api;
  final String path, title;
  @override
  Widget build(BuildContext context) => PageBody(
    title: title,
    children: [
      Remote(
        api: api,
        path: path,
        builder: (data, reload) => Column(
          children: [
            AsyncButton(text: 'Refresh', run: reload, icon: Icons.refresh),
            if (records(data).isEmpty) const Empty(),
            ...records(data).map((e) => Panel(child: DataView(e))),
          ],
        ),
      ),
    ],
  );
}
