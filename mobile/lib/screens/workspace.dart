import 'package:flutter/material.dart';
import '../core/api.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';
import 'resources.dart';
import 'deals.dart';
import 'intelligence.dart';
import 'account_admin.dart';

class Destination {
  const Destination(this.path, this.title, this.icon, {this.category = 'Main'});
  final String path, title, category;
  final IconData icon;
}

const supportedLanguages = [
  {'code': 'en', 'name': 'English', 'native': 'English'},
  {'code': 'hi', 'name': 'Hindi', 'native': 'हिन्दी'},
  {'code': 'mr', 'name': 'Marathi', 'native': 'मराठी'},
  {'code': 'es', 'name': 'Spanish', 'native': 'Español'},
  {'code': 'fr', 'name': 'French', 'native': 'Français'},
  {'code': 'de', 'name': 'German', 'native': 'Deutsch'},
  {'code': 'ar', 'name': 'Arabic', 'native': 'العربية'},
  {'code': 'zh-CN', 'name': 'Chinese', 'native': '中文'},
  {'code': 'ja', 'name': 'Japanese', 'native': '日本語'},
  {'code': 'pt', 'name': 'Portuguese', 'native': 'Português'},
  {'code': 'bn', 'name': 'Bengali', 'native': 'বাংলা'},
  {'code': 'gu', 'name': 'Gujarati', 'native': 'ગુજરાતી'},
  {'code': 'ta', 'name': 'Tamil', 'native': 'தமிழ்'},
  {'code': 'te', 'name': 'Telugu', 'native': 'తెలుగు'},
];

const sharedDestinations = [
  Destination('negotiations', 'Quotes & negotiations', Icons.forum_outlined, category: 'Deals'),
  Destination('bookings', 'Bookings & calendar', Icons.event_available, category: 'Deals'),
  Destination('reviews', 'Reviews & reputation', Icons.star_outline, category: 'Deals'),
  Destination('disputes', 'Disputes & mediation', Icons.flag_outlined, category: 'Deals'),
  Destination('market-pulse', 'Live market pulse', Icons.radar, category: 'Intelligence'),
  Destination('analytics', 'Market analytics', Icons.bar_chart, category: 'Intelligence'),
  Destination('notifications', 'Alerts & updates', Icons.notifications_outlined, category: 'Account'),
  Destination('profile', 'Business profile & KYC', Icons.business_outlined, category: 'Account'),
];

class Workspace extends StatefulWidget {
  const Workspace({super.key, required this.session});
  final Session session;
  @override
  State<Workspace> createState() => _WorkspaceState();
}

class _WorkspaceState extends State<Workspace> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  String selected = '';
  String currentLang = 'en';
  bool isSwitchingMode = false;

  Session get s => widget.session;

  List<Destination> get destinations => s.admin
      ? const [
          Destination('', 'Platform overview', Icons.dashboard_outlined, category: 'Overview'),
          Destination('verifications', 'KYC verifications', Icons.verified_outlined, category: 'Operations'),
          Destination('disputes', 'Dispute arbitration', Icons.gavel, category: 'Operations'),
          Destination('moderation', 'Content moderation', Icons.shield_outlined, category: 'Operations'),
          Destination('categories', 'Categories taxonomy', Icons.category_outlined, category: 'Configuration'),
          Destination('analytics', 'Marketplace liquidity', Icons.bar_chart, category: 'Intelligence'),
          Destination('settings', 'Policies & integrations', Icons.settings_outlined, category: 'Configuration'),
          Destination('agents', 'AI operations & agents', Icons.auto_awesome, category: 'Intelligence'),
        ]
      : [
          const Destination('', 'Overview summary', Icons.dashboard_outlined, category: 'Main'),
          if (s.mode == 'provider') ...const [
            Destination('listings', 'My listings', Icons.inventory_2_outlined, category: 'Inventory'),
            Destination('calendar', 'Availability & calendar', Icons.calendar_month, category: 'Inventory'),
            Destination('smart-pricing', 'Smart pricing advisor', Icons.currency_rupee, category: 'Intelligence'),
            Destination('forecast', 'Demand outlook', Icons.trending_up, category: 'Intelligence'),
            Destination('performance', 'Provider performance', Icons.stars_outlined, category: 'Intelligence'),
          ] else ...const [
            Destination('search', 'Discover resources', Icons.search, category: 'Discovery'),
            Destination('planner', 'AI Conductor', Icons.hub_outlined, category: 'Discovery'),
            Destination('requests', 'My requirements (RFQs)', Icons.campaign_outlined, category: 'Discovery'),
            Destination('compare', 'Saved & compare', Icons.favorite_border, category: 'Discovery'),
          ],
          const Destination('agents', 'Agent Studio', Icons.auto_awesome, category: 'Intelligence'),
          ...sharedDestinations,
        ];

  void go(String path) {
    setState(() => selected = path);
  }

  Future<void> toggleMode() async {
    if (isSwitchingMode) return;
    setState(() => isSwitchingMode = true);
    try {
      final next = s.mode == 'provider' ? 'seeker' : 'provider';
      await s.profile({'mode': next});
      if (mounted) {
        setState(() {
          selected = '';
          isSwitchingMode = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Switched to ${next.toUpperCase()} dashboard'),
            backgroundColor: ink,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => isSwitchingMode = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not switch mode: $e'),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    }
  }

  void showLanguagePicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: paper,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (modalCtx, setModalState) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 48,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade400,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(Icons.translate, size: 22, color: ink),
                    const SizedBox(width: 8),
                    const Text(
                      'Choose Language / भाषा',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: yellow,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: ink, width: 1.5),
                      ),
                      child: Text(
                        '14 Languages',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                ConstrainedBox(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.sizeOf(context).height * 0.55,
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: supportedLanguages.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (c, i) {
                      final item = supportedLanguages[i];
                      final isSelected = item['code'] == currentLang;
                      return ListTile(
                        selected: isSelected,
                        selectedTileColor: yellow.withValues(alpha: 0.35),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        leading: CircleAvatar(
                          radius: 16,
                          backgroundColor: isSelected ? ink : Colors.grey.shade200,
                          child: Text(
                            item['code']!.toUpperCase().substring(0, item['code']!.length > 2 ? 2 : item['code']!.length),
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.white : ink,
                            ),
                          ),
                        ),
                        title: Text(
                          item['native']!,
                          style: TextStyle(
                            fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                            fontSize: 15,
                          ),
                        ),
                        subtitle: Text(item['name']!, style: const TextStyle(fontSize: 12)),
                        trailing: isSelected
                            ? const Icon(Icons.check_circle, color: ink)
                            : null,
                        onTap: () {
                          setState(() => currentLang = item['code']!);
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Language preference set to ${item['native']} (${item['name']})'),
                              backgroundColor: ink,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  int _bottomIndex() {
    if (selected == '') return 0;
    if (s.admin) {
      if (selected == 'verifications') return 1;
      if (selected == 'disputes') return 2;
      if (selected == 'analytics') return 3;
    } else {
      if (s.mode == 'provider') {
        if (selected == 'listings') return 1;
        if (selected == 'calendar') return 2;
        if (selected == 'bookings') return 3;
      } else {
        if (selected == 'search') return 1;
        if (selected == 'planner') return 2;
        if (selected == 'bookings') return 3;
      }
    }
    return 4; // More
  }

  @override
  Widget build(BuildContext context) {
    final choices = destinations;
    final activeDestination = choices.where((d) => d.path == selected).firstOrNull;
    final title = activeDestination?.title ?? 'Workspace';

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        titleSpacing: 4,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'utlio ✳',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: s.admin
                    ? Colors.purple.shade700
                    : s.mode == 'provider'
                    ? const Color(0xFF0F766E)
                    : const Color(0xFF1D4ED8),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                s.admin ? 'ADMIN' : s.mode.toUpperCase(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
        ),
        actions: [
          if (!s.admin)
            InkWell(
              borderRadius: BorderRadius.circular(10),
              onTap: isSwitchingMode ? null : toggleMode,
              child: Container(
                margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                decoration: BoxDecoration(
                  color: yellow,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: ink, width: 1.8),
                  boxShadow: const [BoxShadow(color: ink, offset: Offset(2, 2))],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    isSwitchingMode
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2, color: ink),
                          )
                        : const Icon(Icons.swap_horiz_rounded, size: 16, color: ink),
                    const SizedBox(width: 5),
                    Text(
                      s.mode == 'provider' ? 'Seeker' : 'Provider',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: ink,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          IconButton(
            tooltip: 'Language / भाषा',
            icon: const Icon(Icons.translate, size: 20),
            onPressed: () => showLanguagePicker(context),
          ),
          IconButton(
            tooltip: 'Alerts',
            icon: const Icon(Icons.notifications_outlined, size: 20),
            onPressed: () => go('notifications'),
          ),
          const SizedBox(width: 6),
        ],
      ),
      drawer: Drawer(
        backgroundColor: paper,
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: yellow,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: ink, width: 2),
                      boxShadow: const [BoxShadow(color: ink, offset: Offset(2, 2))],
                    ),
                    alignment: Alignment.center,
                    child: const Text('✳', style: TextStyle(fontSize: 22)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'utlio',
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5),
                        ),
                        Text(
                          s.admin ? 'Operations Command' : '${s.mode.toUpperCase()} WORKSPACE',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (!s.admin)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: sky,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: ink, width: 2),
                    boxShadow: const [BoxShadow(color: ink, offset: Offset(3, 3))],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'ROLE: ${s.mode.toUpperCase()}',
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: s.mode == 'provider' ? const Color(0xFF0F766E) : const Color(0xFF1D4ED8),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              s.mode == 'provider' ? 'EARNING' : 'HIRING',
                              style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        s.mode == 'provider'
                            ? 'Switch to find and hire equipment/services'
                            : 'Switch to list equipment and manage earnings',
                        style: const TextStyle(fontSize: 11),
                      ),
                      const SizedBox(height: 10),
                      AsyncButton(
                        text: s.mode == 'provider' ? 'Switch to Seeker' : 'Switch to Provider',
                        icon: Icons.swap_horiz,
                        run: toggleMode,
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 16),
              ...choices.map(
                (d) => ListTile(
                  dense: true,
                  selected: selected == d.path,
                  selectedTileColor: yellow,
                  selectedColor: ink,
                  leading: Icon(d.icon, color: ink, size: 20),
                  title: Text(
                    d.title,
                    style: TextStyle(
                      fontWeight: selected == d.path ? FontWeight.w900 : FontWeight.w600,
                      fontSize: 13.5,
                    ),
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    go(d.path);
                  },
                ),
              ),
              const Divider(height: 28),
              ListTile(
                dense: true,
                leading: const Icon(Icons.translate, color: ink, size: 20),
                title: const Text('Change Language / भाषा', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                onTap: () {
                  Navigator.pop(context);
                  showLanguagePicker(context);
                },
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                child: Text(
                  identity(s.user),
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade700, fontWeight: FontWeight.w600),
                ),
              ),
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
                      s.admin ? 'OPERATIONS STUDIO' : '${s.mode.toUpperCase()} DASHBOARD',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    if (!s.admin)
                      AsyncButton(
                        text: s.mode == 'provider' ? 'Switch to seeker' : 'Switch to provider',
                        icon: Icons.swap_horiz,
                        run: toggleMode,
                      ),
                    const SizedBox(height: 8),
                    ...choices.map(
                      (d) => ListTile(
                        dense: true,
                        selected: selected == d.path,
                        selectedTileColor: yellow,
                        leading: Icon(d.icon, size: 18),
                        title: Text(d.title, style: const TextStyle(fontSize: 13)),
                        onTap: () => go(d.path),
                      ),
                    ),
                    const Divider(),
                    ListTile(
                      dense: true,
                      leading: const Icon(Icons.translate, size: 18),
                      title: const Text('Language / भाषा', style: TextStyle(fontSize: 13)),
                      onTap: () => showLanguagePicker(context),
                    ),
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: const BoxDecoration(
                    color: paper,
                    border: Border(bottom: BorderSide(color: ink, width: 1.5)),
                  ),
                  child: Row(
                    children: [
                      Text(
                        s.admin ? 'Admin' : (s.mode == 'provider' ? 'Provider' : 'Seeker'),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Text('/', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      const SizedBox(width: 6),
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: AnimatedSwitcher(
                    duration: MediaQuery.disableAnimationsOf(context)
                        ? Duration.zero
                        : const Duration(milliseconds: 280),
                    switchInCurve: Curves.easeOutCubic,
                    switchOutCurve: Curves.easeInCubic,
                    transitionBuilder: (child, animation) => FadeTransition(
                      opacity: animation,
                      child: SlideTransition(
                        position: Tween<Offset>(
                          begin: const Offset(0, 0.025),
                          end: Offset.zero,
                        ).animate(animation),
                        child: child,
                      ),
                    ),
                    child: KeyedSubtree(
                      key: ValueKey('${s.admin}/${s.mode}/$selected'),
                      child: screen(),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: MediaQuery.sizeOf(context).width >= 1000
          ? null
          : NavigationBar(
              selectedIndex: _bottomIndex(),
              onDestinationSelected: (i) {
                if (i == 0) {
                  go('');
                } else if (i == 1) {
                  go(s.admin ? 'verifications' : (s.mode == 'provider' ? 'listings' : 'search'));
                } else if (i == 2) {
                  go(s.admin ? 'disputes' : (s.mode == 'provider' ? 'calendar' : 'planner'));
                } else if (i == 3) {
                  go(s.admin ? 'analytics' : 'bookings');
                } else if (i == 4) {
                  _scaffoldKey.currentState?.openDrawer();
                }
              },
              destinations: [
                const NavigationDestination(
                  icon: Icon(Icons.dashboard_outlined),
                  selectedIcon: Icon(Icons.dashboard),
                  label: 'Home',
                ),
                NavigationDestination(
                  icon: Icon(
                    s.admin
                        ? Icons.verified_outlined
                        : s.mode == 'provider'
                        ? Icons.inventory_2_outlined
                        : Icons.search,
                  ),
                  selectedIcon: Icon(
                    s.admin
                        ? Icons.verified
                        : s.mode == 'provider'
                        ? Icons.inventory_2
                        : Icons.search,
                  ),
                  label: s.admin
                      ? 'KYC'
                      : s.mode == 'provider'
                      ? 'Listings'
                      : 'Discover',
                ),
                NavigationDestination(
                  icon: Icon(
                    s.admin
                        ? Icons.gavel_outlined
                        : s.mode == 'provider'
                        ? Icons.calendar_month_outlined
                        : Icons.hub_outlined,
                  ),
                  selectedIcon: Icon(
                    s.admin
                        ? Icons.gavel
                        : s.mode == 'provider'
                        ? Icons.calendar_month
                        : Icons.hub,
                  ),
                  label: s.admin
                      ? 'Disputes'
                      : s.mode == 'provider'
                      ? 'Calendar'
                      : 'Planner',
                ),
                NavigationDestination(
                  icon: Icon(
                    s.admin ? Icons.bar_chart_outlined : Icons.event_available_outlined,
                  ),
                  selectedIcon: Icon(
                    s.admin ? Icons.bar_chart : Icons.event_available,
                  ),
                  label: s.admin ? 'Liquidity' : 'Bookings',
                ),
                const NavigationDestination(
                  icon: Icon(Icons.menu),
                  label: 'More',
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
        return ReviewsScreen(session: s);
      case 'disputes':
        return DisputesScreen(session: s);
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
