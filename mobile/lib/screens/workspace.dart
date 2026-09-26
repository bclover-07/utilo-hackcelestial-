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

class NavSection {
  const NavSection(this.title, this.destinations);
  final String title;
  final List<Destination> destinations;
  List<Destination> get items => destinations;
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

  List<NavSection> get navSections {
    if (s.admin) {
      return const [
        NavSection('OPERATIONS STUDIO', [
          Destination('', 'Platform overview', Icons.dashboard_outlined),
          Destination('verifications', 'Business KYC verifications', Icons.verified_outlined),
          Destination('disputes', 'Dispute arbitration', Icons.shield_outlined),
          Destination('moderation', 'Content moderation', Icons.gavel),
          Destination('categories', 'Categories taxonomy', Icons.category_outlined),
          Destination('analytics', 'Marketplace liquidity', Icons.bar_chart),
          Destination('settings', 'Policies & integrations', Icons.settings_outlined),
          Destination('agents', 'AI operations & agents', Icons.auto_awesome),
        ]),
      ];
    }

    if (s.mode == 'provider') {
      return const [
        NavSection('MAIN', [
          Destination('', 'Overview', Icons.dashboard_outlined),
        ]),
        NavSection('INVENTORY & YIELD', [
          Destination('listings', 'My listings', Icons.inventory_2_outlined),
          Destination('calendar', 'Availability & Calendar', Icons.calendar_month),
          Destination('smart-pricing', 'Smart pricing & demand', Icons.currency_rupee),
          Destination('forecast', 'Demand outlook', Icons.trending_up),
          Destination('performance', 'Provider performance', Icons.stars_outlined),
        ]),
        NavSection('DEALS & FULFILMENT', [
          Destination('negotiations', 'Incoming RFQs & Chat', Icons.forum_outlined),
          Destination('bookings', 'Confirmed bookings', Icons.event_available),
          Destination('reviews', 'Reviews & reputation', Icons.star_outline),
          Destination('disputes', 'Disputes & mediation', Icons.flag_outlined),
        ]),
        NavSection('MARKET INTELLIGENCE', [
          Destination('agents', 'Agent Studio', Icons.auto_awesome),
          Destination('market-pulse', 'Live market pulse', Icons.radar),
          Destination('analytics', 'Market analytics', Icons.bar_chart),
        ]),
        NavSection('SETTINGS', [
          Destination('profile', 'Settings', Icons.business_outlined),
          Destination('notifications', 'Alerts & updates', Icons.notifications_outlined),
        ]),
      ];
    }

    return const [
      NavSection('MAIN', [
        Destination('', 'Overview', Icons.dashboard_outlined),
      ]),
      NavSection('DISCOVER & PLAN', [
        Destination('search', 'Discover resources', Icons.search),
        Destination('planner', 'AI Conductor', Icons.hub_outlined),
        Destination('requests', 'My requirements (RFQs)', Icons.campaign_outlined),
        Destination('compare', 'Saved & compare', Icons.favorite_border),
      ]),
      NavSection('DEALS & BOOKINGS', [
        Destination('negotiations', 'Active quotes & chat', Icons.forum_outlined),
        Destination('bookings', 'My bookings & calendar', Icons.event_available),
        Destination('reviews', 'Reviews given & received', Icons.star_outline),
        Destination('disputes', 'Disputes & claims', Icons.flag_outlined),
      ]),
      NavSection('MARKET INTELLIGENCE', [
        Destination('agents', 'Agent Studio', Icons.auto_awesome),
        Destination('market-pulse', 'Live market pulse', Icons.radar),
        Destination('analytics', 'Market analytics', Icons.bar_chart),
      ]),
      NavSection('SETTINGS', [
        Destination('profile', 'Settings', Icons.business_outlined),
        Destination('notifications', 'Alerts & updates', Icons.notifications_outlined),
      ]),
    ];
  }

  List<Destination> get destinations => [
    for (final sec in navSections) ...sec.destinations,
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
                    const Expanded(
                      child: Text(
                        'Choose Language / भाषा',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: yellow,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: ink, width: 1.5),
                      ),
                      child: const Text(
                        '14 Languages',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
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


  @override
  Widget build(BuildContext context) {
    final choices = destinations;
    final activeDestination = choices.where((d) => d.path == selected).firstOrNull;
    final title = activeDestination?.title ?? 'Workspace';

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        backgroundColor: paper,
        scrolledUnderElevation: 0,
        elevation: 0,
        titleSpacing: 0,
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(2),
          child: Divider(height: 2, thickness: 2, color: ink),
        ),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded, color: ink, size: 24),
          tooltip: 'Menu',
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        title: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const LivePulseDot(size: 8),
              const SizedBox(width: 8),
              const Text(
                'UTLIO',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: -0.5, color: ink),
              ),
              const Text(
                ' ✳',
                style: TextStyle(color: Color(0xFFD97706), fontWeight: FontWeight.w900, fontSize: 16),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 5),
                child: Text('/', style: TextStyle(color: Colors.black38, fontWeight: FontWeight.w700, fontSize: 13)),
              ),
              Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: ink),
              ),
            ],
          ),
        ),
        actions: [
          if (!s.admin)
            Container(
              margin: const EdgeInsets.symmetric(vertical: 9, horizontal: 4),
              decoration: BoxDecoration(
                color: paper,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: ink, width: 1.8),
                boxShadow: const [BoxShadow(color: ink, offset: Offset(1.5, 1.5))],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  InkWell(
                    borderRadius: const BorderRadius.horizontal(left: Radius.circular(8)),
                    onTap: isSwitchingMode || s.mode == 'seeker' ? null : toggleMode,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
                      decoration: BoxDecoration(
                        color: s.mode == 'seeker' ? yellow : Colors.transparent,
                        borderRadius: const BorderRadius.horizontal(left: Radius.circular(8)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.search, size: 12, color: ink),
                          const SizedBox(width: 3),
                          const Text('Seeker', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: ink)),
                          if (s.mode == 'seeker') ...[
                            const SizedBox(width: 4),
                            const LivePulseDot(size: 4),
                          ],
                        ],
                      ),
                    ),
                  ),
                  Container(width: 1.5, height: 16, color: ink),
                  InkWell(
                    borderRadius: const BorderRadius.horizontal(right: Radius.circular(8)),
                    onTap: isSwitchingMode || s.mode == 'provider' ? null : toggleMode,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
                      decoration: BoxDecoration(
                        color: s.mode == 'provider' ? yellow : Colors.transparent,
                        borderRadius: const BorderRadius.horizontal(right: Radius.circular(8)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.inventory_2_outlined, size: 12, color: ink),
                          const SizedBox(width: 3),
                          const Text('Provider', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: ink)),
                          if (s.mode == 'provider') ...[
                            const SizedBox(width: 4),
                            const LivePulseDot(size: 4),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          IconButton(
            visualDensity: VisualDensity.compact,
            padding: const EdgeInsets.all(6),
            tooltip: 'Language / भाषा',
            icon: const Icon(Icons.translate, size: 18, color: ink),
            onPressed: () => showLanguagePicker(context),
          ),
          IconButton(
            visualDensity: VisualDensity.compact,
            padding: const EdgeInsets.all(6),
            tooltip: 'Alerts & Notifications',
            icon: const Icon(Icons.notifications_outlined, size: 19, color: ink),
            onPressed: () => go('notifications'),
          ),
          InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => go('profile'),
            child: Container(
              margin: const EdgeInsets.only(left: 4, right: 10),
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: yellow,
                shape: BoxShape.circle,
                border: Border.all(color: ink, width: 2),
                boxShadow: const [BoxShadow(color: ink, offset: Offset(1.5, 1.5))],
              ),
              alignment: Alignment.center,
              child: Text(
                ((s.user?['name'] ?? s.user?['email'] ?? 'U') as String).substring(0, 1).toUpperCase(),
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: ink),
              ),
            ),
          ),
        ],
      ),
      drawer: Drawer(
        backgroundColor: paper,
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 12, 12),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: yellow,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: ink, width: 2),
                        boxShadow: const [BoxShadow(color: ink, offset: Offset(2, 2))],
                      ),
                      alignment: Alignment.center,
                      child: const Text('U', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: ink)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: const [
                              Text(
                                'utlio',
                                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: -0.5, color: ink),
                              ),
                              Text('✳', style: TextStyle(fontSize: 18, color: Color(0xFFD97706), fontWeight: FontWeight.w900)),
                            ],
                          ),
                          Text(
                            s.admin ? 'OPERATIONS STUDIO' : '${s.mode.toUpperCase()} WORKSPACE',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: Colors.grey.shade700,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: ink, size: 20),
                      tooltip: 'Close menu',
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, thickness: 1.5, color: ink),
              if (!s.admin)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: sky,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: ink, width: 1.8),
                      boxShadow: const [BoxShadow(color: ink, offset: Offset(2, 2))],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'ROLE: ${s.mode.toUpperCase()}',
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: ink),
                            ),
                            Text(
                              s.mode == 'provider' ? 'Monetizing Capacity' : 'Finding Resources',
                              style: TextStyle(fontSize: 10, color: Colors.grey.shade800, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                        InkWell(
                          onTap: isSwitchingMode ? null : toggleMode,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: yellow,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: ink, width: 1.5),
                            ),
                            child: isSwitchingMode
                                ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: ink))
                                : Text(
                                    s.mode == 'provider' ? 'Switch Seeker' : 'Switch Provider',
                                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: ink),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  children: [
                    for (final section in navSections) ...[
                      Padding(
                        padding: const EdgeInsets.only(left: 8, top: 12, bottom: 6),
                        child: Text(
                          section.title,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Colors.grey.shade600,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                      for (final d in section.items) ...[
                        Container(
                          margin: const EdgeInsets.only(bottom: 4),
                          decoration: BoxDecoration(
                            color: selected == d.path ? yellow : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            border: selected == d.path ? Border.all(color: ink, width: 1.8) : null,
                            boxShadow: selected == d.path ? const [BoxShadow(color: ink, offset: Offset(2, 2))] : null,
                          ),
                          child: ListTile(
                            dense: true,
                            visualDensity: const VisualDensity(vertical: -2),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
                            leading: Icon(d.icon, color: ink, size: 18),
                            title: Text(
                              d.title,
                              style: TextStyle(
                                fontWeight: selected == d.path ? FontWeight.w900 : FontWeight.w700,
                                fontSize: 13,
                                color: ink,
                              ),
                            ),
                            onTap: () {
                              Navigator.pop(context);
                              go(d.path);
                            },
                          ),
                        ),
                      ],
                    ],
                  ],
                ),
              ),
              const Divider(height: 1, thickness: 1.5, color: ink),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: mint,
                        shape: BoxShape.circle,
                        border: Border.all(color: ink, width: 1.8),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        ((s.user?['name'] ?? s.user?['email'] ?? 'U') as String).substring(0, 1).toUpperCase(),
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: ink),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            identity(s.user),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: ink),
                          ),
                          Text(
                            s.user?['email']?.toString() ?? '',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 10, color: Colors.grey.shade700),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.logout, size: 18, color: ink),
                      tooltip: 'Log out',
                      onPressed: s.logout,
                    ),
                  ],
                ),
              ),
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
                    for (final section in navSections) ...[
                      Padding(
                        padding: const EdgeInsets.only(left: 6, top: 10, bottom: 4),
                        child: Text(
                          section.title,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Colors.grey.shade600,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                      for (final d in section.items) ...[
                        ListTile(
                          dense: true,
                          selected: selected == d.path,
                          selectedTileColor: yellow,
                          leading: Icon(d.icon, size: 18),
                          title: Text(d.title, style: const TextStyle(fontSize: 13)),
                          onTap: () => go(d.path),
                        ),
                      ],
                    ],
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
      bottomNavigationBar: null,
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
