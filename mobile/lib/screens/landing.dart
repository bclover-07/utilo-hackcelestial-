import 'package:flutter/material.dart';
import '../core/api.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';
import 'auth.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key, required this.session});
  final Session session;

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  String _mode = 'seeker';
  int _selectedCalcCategory = 0;
  double _idleDays = 8;
  double _calcUnits = 15;
  int _expandedWorkflowStep = 0;
  String _currentLang = 'en';

  static const List<Map<String, dynamic>> _calcCategories = [
    {'name': 'Venues & Banquets', 'rate': 22000, 'unit': 'halls', 'icon': Icons.apartment},
    {'name': 'Sound & Lighting', 'rate': 5500, 'unit': 'rigs', 'icon': Icons.graphic_eq},
    {'name': 'Banquet Chairs', 'rate': 65, 'unit': 'chairs', 'icon': Icons.chair_outlined},
    {'name': 'Cloud Kitchens', 'rate': 14000, 'unit': 'stations', 'icon': Icons.restaurant},
    {'name': 'Fleet & Logistics', 'rate': 7500, 'unit': 'trips', 'icon': Icons.local_shipping_outlined},
  ];

  static const List<Map<String, dynamic>> _resourceCategories = [
    {
      'title': 'Spaces & venues',
      'desc': 'A little room for your big ideas.',
      'color': lavender,
      'icon': Icons.apartment,
    },
    {
      'title': 'Furniture & seating',
      'desc': 'Make everyone feel invited.',
      'color': yellow,
      'icon': Icons.chair_outlined,
    },
    {
      'title': 'Sound & vision',
      'desc': 'Set the tone. Steal the show.',
      'color': pink,
      'icon': Icons.graphic_eq,
    },
    {
      'title': 'Kitchens & catering',
      'desc': 'Great events start in the kitchen.',
      'color': teal,
      'icon': Icons.restaurant,
    },
    {
      'title': 'Transport & logistics',
      'desc': 'Get the good stuff where it belongs.',
      'color': sky,
      'icon': Icons.local_shipping_outlined,
    },
    {
      'title': 'The finishing touches',
      'desc': 'Linens, decor and everything more.',
      'color': peach,
      'icon': Icons.inventory_2_outlined,
    },
  ];

  static const List<Map<String, dynamic>> _workflowSteps = [
    {
      'num': '01',
      'title': 'Brief → Requirements',
      'desc': 'Turn a natural-language brief into structured category requests with dates, quantities, and budget bounds.',
      'color': yellow,
      'icon': Icons.edit_note,
    },
    {
      'num': '02',
      'title': 'An Explained Shortlist',
      'desc': 'AI scans verified inventory for date compatibility, route proximity, and reliability scoring.',
      'color': lavender,
      'icon': Icons.filter_alt_outlined,
    },
    {
      'num': '03',
      'title': 'Bilateral ZOPA Negotiation',
      'desc': 'Negotiate terms in real-time with version-controlled offers, protecting both seeker budget and provider margins.',
      'color': pink,
      'icon': Icons.handshake_outlined,
    },
    {
      'num': '04',
      'title': 'Escrow & Agreement',
      'desc': 'Lock in the agreement with milestone escrow, security hold, and automated dispute mediation protocols.',
      'color': teal,
      'icon': Icons.shield_outlined,
    },
    {
      'num': '05',
      'title': 'Handover & Review',
      'desc': 'Real-time check-in, fulfillment verification, instant calendar sync, and two-way reputation reviews.',
      'color': sky,
      'icon': Icons.verified_outlined,
    },
  ];

  static const List<Map<String, dynamic>> _matrixCards = [
    {
      'title': 'Event Conductor Supervisor',
      'tag': 'MONTE CARLO RESILIENT',
      'icon': Icons.memory,
      'color': yellow,
      'desc': 'Decomposes briefs into multi-supplier packages. Runs dual-supplier failure simulations to guarantee fallback continuity.',
      'simTitle': 'Monte Carlo Resilience',
      'score': '94% Resilient',
      'bar': 0.94,
      'bullets': [
        'Auto-substitute recommendations for inventory gaps',
        'Route corridor grouping saves up to 34% in dispatch overhead',
        'Zero-hallucination verified against active database state',
      ],
    },
    {
      'title': 'Bilateral ZOPA Negotiator',
      'tag': 'SURPLUS OPTIMIZER',
      'icon': Icons.trending_up,
      'color': teal,
      'desc': 'Calculates the real Zone of Possible Agreement between seeker budget and provider floor price.',
      'simTitle': 'ZOPA Convergence Rate',
      'score': '88% Deal Likelihood',
      'bar': 0.88,
      'bullets': [
        '1-click autonomous counter-offer blueprints',
        'Contract dispute and missing protection detection',
        'Sentiment-aware bilateral concessions',
      ],
    },
    {
      'title': 'Dynamic Pricing Auto-Pilot',
      'tag': 'CANNIBALIZATION SHIELD',
      'icon': Icons.bar_chart,
      'color': lavender,
      'desc': 'Monitors regional demand to apply surge multipliers while enforcing strict price floor bounds.',
      'simTitle': 'Weekend Yield Multiplier',
      'score': '+35% Projected Surge',
      'bar': 0.75,
      'bullets': [
        'Cross-listing cannibalization protection alerts',
        'Automatic floor price preservation below cost',
        'Historical liquidity & demand velocity indexing',
      ],
    },
    {
      'title': 'Episodic & Semantic Working Memory',
      'tag': 'CROSS-SESSION RETENTION',
      'icon': Icons.storage,
      'color': pink,
      'desc': 'Preserves your business preferences, logistics corridors, and vendor affinities across every interaction.',
      'simTitle': 'Working Memory Affinity',
      'score': 'Zero-Latency Recall',
      'bar': 1.0,
      'bullets': [
        'Dedicated preferences, constraints & logistics store',
        'Critic reflection verifies every claim against active listings',
        'Full privacy: view, add, or delete memory anytime in Conductor',
      ],
    },
  ];

  static const List<Map<String, dynamic>> _testimonials = [
    {
      'quote': 'Utlio transformed our vacant weekday banquets into ₹4.8 Lakhs of extra monthly revenue. The escrow-backed bookings give us complete peace of mind.',
      'name': 'Rajesh Singhania',
      'business': 'Grand Palace Banquets, Mumbai BKC',
      'metric': '+₹4.8L/mo idle yield',
      'avatar': 'R',
      'color': yellow,
    },
    {
      'quote': 'When an event suddenly expanded, the AI Conductor matched 4 line-array audio rigs and 2 transport vans within 12 minutes. Fast and completely hassle-free.',
      'name': 'Pooja Hegde',
      'business': 'Aura Sound & Visuals, Bengaluru Indiranagar',
      'metric': '12-min multi-vendor match',
      'avatar': 'P',
      'color': teal,
    },
    {
      'quote': 'The ZOPA negotiation advisor and dynamic pricing tool helped us quote competitive prices while keeping our margins protected. We closed 19 deals in month one.',
      'name': 'Vikram Malhotra',
      'business': 'Apex Hospitality Fleet, Delhi Aerocity',
      'metric': '19 deals in 30 days',
      'avatar': 'V',
      'color': lavender,
    },
  ];

  static const List<Map<String, String>> _faqs = [
    {
      'q': 'How does Utlio ensure asset security and transaction safety?',
      'a': 'Every business undergoes KYC verification before publishing resources. Transactions are protected through structured escrow milestones, damage security holds, and automated dispute mediation protocols.',
    },
    {
      'q': 'Can I use the same business account as both a Seeker and a Provider?',
      'a': 'Yes! Utlio features a dual-role exchange model. A single business account allows you to discover and book resources as a Seeker, and list excess capacity as a Provider with a seamless one-click switch.',
    },
    {
      'q': 'How does the AI Event Conductor assemble multi-supplier packages?',
      'a': 'The Conductor uses a Supervisor Planner to break down complex briefs into discrete categories. It performs Monte Carlo failure simulation and corridor clustering to ensure reliable delivery.',
    },
    {
      'q': 'Does Utlio support multiple regional and global languages?',
      'a': 'Yes! Utlio features dynamic multi-language translation, supporting 14 languages including Hindi, Marathi, Bengali, Gujarati, Tamil, Telugu, Spanish, French, and German across all dashboards and workflows.',
    },
    {
      'q': 'How does dynamic pricing work for providers?',
      'a': 'Providers can enable Auto-Pilot Dynamic Pricing on any listing. It automatically applies weekend surge factors (+35%) while respecting your strict minimum floor price and preventing cannibalization across your items.',
    },
  ];

  void _navAuth(bool register, {String? role}) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AuthScreen(
          session: widget.session,
          register: register,
          initialRole: role ?? _mode,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cat = _calcCategories[_selectedCalcCategory];
    final monthlyRevenue = ((_idleDays * _calcUnits * (cat['rate'] as int) * 0.65)).round();
    final formattedRevenue = '₹${monthlyRevenue.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}';
    final seekerSavings = (monthlyRevenue * 0.28).round();
    final formattedSavings = '₹${seekerSavings.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}';

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 12,
        title: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: pink,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: ink, width: 2),
                  boxShadow: const [BoxShadow(color: ink, offset: Offset(1.5, 1.5))],
                ),
                child: const Text('u', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: ink)),
              ),
              const SizedBox(width: 6),
              const Text(
                'utlio',
                style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'SpaceGrotesk', fontSize: 20, color: ink),
              ),
              const Text(' ✳', style: TextStyle(color: Color(0xfff59e0b), fontSize: 18)),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => _navAuth(false),
            child: const Text('Log in', style: TextStyle(fontWeight: FontWeight.w800, color: ink)),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: NeoButton(
              text: 'Join ↗',
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              fontSize: 13,
              color: yellow,
              onPressed: () => _navAuth(true),
            ),
          ),
        ],
      ),
      body: DottedScaffoldBackground(
        child: Scrollbar(
          child: SingleChildScrollView(
            primary: true,
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // SECTION 1: HERO
                Panel(
                  color: paperCard,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const NeoBadge(
                        text: '✳ THE HOSPITALITY SHARING CLUB',
                        color: yellow,
                        textColor: ink,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Less idle.\nMore possible.',
                        style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                              fontWeight: FontWeight.w900,
                              letterSpacing: -1,
                              height: 1.05,
                            ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Your spare space is someone’s perfect venue. Your extra chairs? Their full house. Share resources, find your people, and make more happen.',
                        style: TextStyle(fontSize: 15, height: 1.5, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 20),
                      NeoButton(
                        text: 'Find your next possibility ↗',
                        isFullWidth: true,
                        color: yellow,
                        onPressed: () => _navAuth(true, role: 'seeker'),
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                        ),
                        onPressed: () => _navAuth(true, role: 'provider'),
                        child: const Text('I have something to share →'),
                      ),
                      const SizedBox(height: 18),
                      // Social Proof Footnote
                      Row(
                        children: [
                          for (final letter in ['H', 'E', 'V'])
                            Align(
                              widthFactor: 0.75,
                              child: CircleAvatar(
                                radius: 14,
                                backgroundColor: ink,
                                child: CircleAvatar(
                                  radius: 12,
                                  backgroundColor: letter == 'H' ? yellow : letter == 'E' ? teal : pink,
                                  child: Text(
                                    letter,
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: ink),
                                  ),
                                ),
                              ),
                            ),
                          const SizedBox(width: 14),
                          const Expanded(
                            child: Text(
                              'Hotels. Event makers. Local businesses.\nBetter, together.',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Hero Interactive Art Board
                Panel(
                  color: const Color(0xff1f2421),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Expanded(
                            child: NeoBadge(
                              text: '● A WORLD OF SHARED POSSIBILITIES',
                              color: Color(0xff2d3748),
                              textColor: Colors.white,
                              hasLiveDot: true,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(Icons.arrow_outward, color: yellow, size: 20),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Container(
                        height: 130,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: const Color(0xff2c332e),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xff4a5568), width: 1.5),
                        ),
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  _floatingIconBadge(Icons.apartment, lavender),
                                  const SizedBox(width: 12),
                                  _floatingIconBadge(Icons.chair_outlined, yellow),
                                  const SizedBox(width: 12),
                                  _floatingIconBadge(Icons.graphic_eq, pink),
                                  const SizedBox(width: 12),
                                  _floatingIconBadge(Icons.restaurant, teal),
                                ],
                              ),
                              const SizedBox(height: 12),
                              const Text(
                                'YOUR NEXT EVENT, COMING TOGETHER.',
                                style: TextStyle(color: yellow, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.8),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: yellow,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: ink, width: 2),
                          boxShadow: const [BoxShadow(color: Colors.black, offset: Offset(2, 2))],
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.auto_awesome, color: ink, size: 20),
                            SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('A LITTLE AI MAGIC', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: ink)),
                                  Text('Your perfect match awaits.', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: ink)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // SECTION 2: LIVE MARKET TICKER
                const SizedBox(height: 8),
                const NeoStatCard(
                  tag: 'VERIFIED INVENTORY',
                  value: '4,850+',
                  label: 'Active hospitality resources across micro-markets',
                  bg: yellow,
                ),
                const NeoStatCard(
                  tag: 'LIQUIDITY UNLOCKED',
                  value: '₹2.4 Cr+',
                  label: 'Idle capacity monetized for banquet & fleet operators',
                  bg: teal,
                ),
                const NeoStatCard(
                  tag: 'SOLVING SPEED',
                  value: '15 min',
                  label: 'AI Conductor multi-supplier package resolution',
                  bg: lavender,
                ),
                const NeoStatCard(
                  tag: 'ESCROW ASSURANCE',
                  value: '99.4%',
                  label: 'Fulfilment SLA guarantee with dispute protection',
                  bg: pink,
                ),

                // SECTION 3: COMMUNITY RIBBON
                const NeoMarqueeStrip(),

                // SECTION 4: THE GOOD STUFF (RESOURCE CATEGORIES)
                const SizedBox(height: 10),
                const NeoBadge(text: 'THERE’S PLENTY TO GO AROUND', color: yellow),
                const SizedBox(height: 8),
                Text(
                  'Good resources.\nEven better neighbours.',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.5,
                      ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'From the big space to the little details. Discover what your neighbourhood has to offer.',
                  style: TextStyle(fontSize: 14, color: Colors.black87),
                ),
                const SizedBox(height: 16),
                for (int i = 0; i < _resourceCategories.length; i++)
                  Panel(
                    color: _resourceCategories[i]['color'] as Color,
                    onTap: () => _navAuth(false),
                    child: Row(
                      children: [
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: ink, width: 2),
                            boxShadow: const [BoxShadow(color: ink, offset: Offset(2, 2))],
                          ),
                          child: Icon(_resourceCategories[i]['icon'] as IconData, size: 28, color: ink),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    _resourceCategories[i]['title'] as String,
                                    style: const TextStyle(fontWeight: FontWeight.w900, fontFamily: 'SpaceGrotesk', fontSize: 16, color: ink),
                                  ),
                                  Text('0${i + 1} ↗', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: ink)),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _resourceCategories[i]['desc'] as String,
                                style: const TextStyle(fontSize: 13, color: Colors.black87),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                // SECTION 5: INTERACTIVE CAPACITY ROI CALCULATOR
                const SizedBox(height: 20),
                Panel(
                  color: card,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const NeoBadge(text: 'INTERACTIVE CAPACITY REVENUE CALCULATOR', color: lavender),
                      const SizedBox(height: 12),
                      const Text(
                        'Estimate Your Idle Asset Earnings',
                        style: TextStyle(fontFamily: 'SpaceGrotesk', fontSize: 22, fontWeight: FontWeight.w900, color: ink),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'See how much ancillary revenue your unused spaces, furniture, or equipment could generate each month on Utlio.',
                        style: TextStyle(fontSize: 13, color: Colors.black87),
                      ),
                      const SizedBox(height: 16),
                      const Text('SELECT ASSET TYPE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.6)),
                      const SizedBox(height: 8),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            for (int i = 0; i < _calcCategories.length; i++)
                              Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: ChoiceChip(
                                  selected: _selectedCalcCategory == i,
                                  onSelected: (_) => setState(() => _selectedCalcCategory = i),
                                  label: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(_calcCategories[i]['icon'] as IconData, size: 16),
                                      const SizedBox(width: 6),
                                      Text(_calcCategories[i]['name'] as String),
                                    ],
                                  ),
                                  selectedColor: yellow,
                                  backgroundColor: paperCard,
                                  labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: ink),
                                  side: const BorderSide(color: ink, width: 2),
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Unused Days Per Month', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                          Text('${_idleDays.toInt()} Days', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: ink)),
                        ],
                      ),
                      Slider(
                        value: _idleDays,
                        min: 1,
                        max: 28,
                        divisions: 27,
                        activeColor: ink,
                        inactiveColor: const Color(0xffe2d9c2),
                        onChanged: (v) => setState(() => _idleDays = v),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Available ${cat['unit'].toString().toUpperCase()} Quantity', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                          Text('${_calcUnits.toInt()} ${cat['unit']}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: ink)),
                        ],
                      ),
                      Slider(
                        value: _calcUnits,
                        min: 1,
                        max: _selectedCalcCategory == 2 ? 300 : 50,
                        divisions: _selectedCalcCategory == 2 ? 299 : 49,
                        activeColor: ink,
                        inactiveColor: const Color(0xffe2d9c2),
                        onChanged: (v) => setState(() => _calcUnits = v),
                      ),
                      const SizedBox(height: 16),
                      // Results Card
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: yellow,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: ink, width: 2.5),
                          boxShadow: const [BoxShadow(color: ink, offset: Offset(3, 4))],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Text(
                              'ESTIMATED MONTHLY UNLOCKED REVENUE',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.6, color: ink),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              formattedRevenue,
                              style: const TextStyle(fontFamily: 'SpaceGrotesk', fontSize: 36, fontWeight: FontWeight.w900, color: ink),
                            ),
                            const Text('Projected net ancillary earnings / month', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                            const Divider(color: ink, thickness: 1.5, height: 24),
                            _perkItem('Seeker community saves ~$formattedSavings vs spot brokers'),
                            _perkItem('100% Escrow protected with damage security hold'),
                            _perkItem('Dynamic pricing auto-pilot optimizes weekend surge'),
                            const SizedBox(height: 14),
                            NeoButton(
                              text: 'Start Earning From Idle Capacity ↗',
                              color: card,
                              isFullWidth: true,
                              onPressed: () => _navAuth(true, role: 'provider'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // SECTION 6: HOW IT WORKS (EXCHANGE WORKFLOW)
                const SizedBox(height: 20),
                const NeoBadge(text: 'FROM “WHAT IF” TO “IT’S HAPPENING”', color: pink),
                const SizedBox(height: 8),
                Text(
                  'A good idea.\nA few good connections.',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 6),
                const Text(
                  'One clear path from your first brief to the final handover. Tap a step to explore.',
                  style: TextStyle(fontSize: 14, color: Colors.black87),
                ),
                const SizedBox(height: 16),
                for (int i = 0; i < _workflowSteps.length; i++)
                  Panel(
                    color: _workflowSteps[i]['color'] as Color,
                    onTap: () => setState(() => _expandedWorkflowStep = _expandedWorkflowStep == i ? -1 : i),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: ink, width: 1.8),
                              ),
                              child: Text(
                                _workflowSteps[i]['num'] as String,
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: ink),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _workflowSteps[i]['title'] as String,
                                style: const TextStyle(fontFamily: 'SpaceGrotesk', fontWeight: FontWeight.w900, fontSize: 16, color: ink),
                              ),
                            ),
                            Icon(
                              _expandedWorkflowStep == i ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                              color: ink,
                            ),
                          ],
                        ),
                        if (_expandedWorkflowStep == i) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.8),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: ink, width: 1.2),
                            ),
                            child: Text(
                              _workflowSteps[i]['desc'] as String,
                              style: const TextStyle(fontSize: 13, height: 1.4, color: ink, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                // SECTION 7: ROLE SHOWCASE (SEEKER VS PROVIDER DUAL PERSPECTIVES)
                const SizedBox(height: 20),
                Panel(
                  color: paperCard,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const NeoBadge(text: 'TWO SIDES. ONE GREAT NEIGHBOURHOOD.', color: teal),
                      const SizedBox(height: 12),
                      const Text(
                        'Find what you need.\nShare what you have.',
                        style: TextStyle(fontFamily: 'SpaceGrotesk', fontSize: 24, fontWeight: FontWeight.w900, color: ink),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'One business account gives you both perspectives. Your next opportunity might be on either side.',
                        style: TextStyle(fontSize: 13, color: Colors.black87),
                      ),
                      const SizedBox(height: 16),
                      // Toggle pills
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _mode = 'seeker'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: _mode == 'seeker' ? yellow : paperCard,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: ink, width: 2),
                                  boxShadow: _mode == 'seeker' ? const [BoxShadow(color: ink, offset: Offset(2, 2))] : null,
                                ),
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.search, size: 18),
                                    SizedBox(width: 6),
                                    Text('I’m a seeker', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _mode = 'provider'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: _mode == 'provider' ? yellow : paperCard,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: ink, width: 2),
                                  boxShadow: _mode == 'provider' ? const [BoxShadow(color: ink, offset: Offset(2, 2))] : null,
                                ),
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.inventory_2_outlined, size: 18),
                                    SizedBox(width: 6),
                                    Text('I’m a provider', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: _mode == 'seeker' ? const Color(0xfff5f0ff) : const Color(0xffeffaf4),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: ink, width: 2),
                          boxShadow: const [BoxShadow(color: ink, offset: Offset(2, 3))],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _mode == 'seeker' ? 'LET’S MAKE IT HAPPEN' : 'YOUR SPARE CAPACITY. PUT TO WORK.',
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, fontFamily: 'SpaceGrotesk', color: ink),
                            ),
                            const SizedBox(height: 12),
                            _roleCheckItem(_mode == 'seeker' ? 'Compare availability, distance and terms' : 'Manage quantity and available dates'),
                            _roleCheckItem(_mode == 'seeker' ? 'Track quotes through to fulfilment' : 'Negotiate directly with local businesses'),
                            _roleCheckItem('Switch perspectives anytime with 1-click in workspace'),
                            const SizedBox(height: 14),
                            NeoButton(
                              text: 'Open the ${_mode.toUpperCase()} workspace ↗',
                              color: _mode == 'seeker' ? lavender : teal,
                              isFullWidth: true,
                              onPressed: () => _navAuth(false, role: _mode),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // SECTION 8: AUTONOMOUS MULTI-AGENT ARCHITECTURE
                const SizedBox(height: 20),
                const NeoBadge(text: 'AUTONOMOUS MULTI-AGENT ARCHITECTURE', color: yellow),
                const SizedBox(height: 8),
                Text(
                  'Smarter matching.\nIronclad reliability.',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Utlio runs specialized AI worker agents coordinated by a Supervisor Planner, verified by a reflection critic node.',
                  style: TextStyle(fontSize: 14, color: Colors.black87),
                ),
                const SizedBox(height: 16),
                for (final matrix in _matrixCards)
                  Panel(
                    color: matrix['color'] as Color,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: ink, width: 2),
                              ),
                              child: Icon(matrix['icon'] as IconData, size: 22, color: ink),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                matrix['title'] as String,
                                style: const TextStyle(fontFamily: 'SpaceGrotesk', fontWeight: FontWeight.w900, fontSize: 16, color: ink),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        NeoBadge(text: matrix['tag'] as String, color: Colors.white, hasLiveDot: true),
                        const SizedBox(height: 10),
                        Text(
                          matrix['desc'] as String,
                          style: const TextStyle(fontSize: 13, height: 1.4, color: Colors.black87),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: ink, width: 1.5),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(matrix['simTitle'] as String, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                                  Text(matrix['score'] as String, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xff16a34a))),
                                ],
                              ),
                              const SizedBox(height: 6),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(6),
                                child: LinearProgressIndicator(
                                  value: matrix['bar'] as double,
                                  backgroundColor: const Color(0xffe2e8f0),
                                  color: const Color(0xff16a34a),
                                  minHeight: 8,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                        for (final b in (matrix['bullets'] as List<String>))
                          Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('• ', style: TextStyle(fontWeight: FontWeight.w900, color: ink)),
                                Expanded(child: Text(b, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600))),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),

                // SECTION 9: HOSPITALITY STORIES (TESTIMONIALS)
                const SizedBox(height: 20),
                const NeoBadge(text: 'HOSPITALITY COMMUNITY STORIES', color: teal),
                const SizedBox(height: 8),
                Text(
                  'Trusted by operators.\nLoved by planners.',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 16),
                for (final t in _testimonials)
                  Panel(
                    color: t['color'] as Color,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            for (int s = 0; s < 5; s++)
                              const Icon(Icons.star, size: 18, color: Color(0xfff59e0b)),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          '“${t['quote']}”',
                          style: const TextStyle(fontSize: 14, fontStyle: FontStyle.italic, fontWeight: FontWeight.w600, height: 1.4),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 18,
                              backgroundColor: ink,
                              child: Text(
                                t['avatar'] as String,
                                style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.white),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(t['name'] as String, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                                  Text(t['business'] as String, style: const TextStyle(fontSize: 11, color: Colors.black87)),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        NeoBadge(text: t['metric'] as String, color: Colors.white),
                      ],
                    ),
                  ),

                // SECTION 10: INTERACTIVE FAQ
                const SizedBox(height: 20),
                const Center(child: NeoBadge(text: 'COMMON QUESTIONS', color: lavender)),
                const SizedBox(height: 8),
                const Center(
                  child: Text(
                    'Frequently Asked Questions',
                    style: TextStyle(fontFamily: 'SpaceGrotesk', fontSize: 22, fontWeight: FontWeight.w900, color: ink),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 16),
                for (int i = 0; i < _faqs.length; i++)
                  NeoAccordion(
                    question: _faqs[i]['q']!,
                    answer: _faqs[i]['a']!,
                    initialOpen: i == 0,
                  ),

                // SECTION 11: FINAL INVITE
                const SizedBox(height: 20),
                Panel(
                  color: yellow,
                  child: Column(
                    children: [
                      const Text('✳', style: TextStyle(fontSize: 32, color: pink)),
                      const Text(
                        'A LITTLE SHARING GOES A LONG WAY',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.8),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Your next big thing\nis closer than you think.',
                        style: TextStyle(fontFamily: 'SpaceGrotesk', fontSize: 24, fontWeight: FontWeight.w900, height: 1.1),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Make room for better events, stronger connections, and more possibility.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 13),
                      ),
                      const SizedBox(height: 16),
                      NeoButton(
                        text: 'Come on in ↗',
                        color: card,
                        onPressed: () => _navAuth(true),
                      ),
                    ],
                  ),
                ),

                // SECTION 12: NEO FOOTER
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xff171915),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: ink, width: 2),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: pink,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text('u', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: ink)),
                          ),
                          const SizedBox(width: 8),
                          const Text('utlio ✳', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Text('Less idle. More possible.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                      const Divider(color: Color(0xff333333), height: 28),
                      const Text('THE EXCHANGE', style: TextStyle(color: yellow, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.8)),
                      const SizedBox(height: 6),
                      GestureDetector(
                        onTap: () => _navAuth(true, role: 'seeker'),
                        child: const Text('Find resources', style: TextStyle(color: Colors.white70, fontSize: 13)),
                      ),
                      const SizedBox(height: 4),
                      GestureDetector(
                        onTap: () => _navAuth(true, role: 'provider'),
                        child: const Text('Share resources', style: TextStyle(color: Colors.white70, fontSize: 13)),
                      ),
                      const SizedBox(height: 16),
                      const Text('YOUR WORKSPACE', style: TextStyle(color: teal, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.8)),
                      const SizedBox(height: 6),
                      GestureDetector(
                        onTap: () => _navAuth(false),
                        child: const Text('Business login', style: TextStyle(color: Colors.white70, fontSize: 13)),
                      ),
                      const SizedBox(height: 4),
                      GestureDetector(
                        onTap: () => _navAuth(false, role: 'admin'),
                        child: const Text('Admin login', style: TextStyle(color: Colors.white70, fontSize: 13)),
                      ),
                      const SizedBox(height: 16),
                      const Row(
                        children: [
                          Icon(Icons.location_on_outlined, size: 16, color: pink),
                          SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Made for local connections. Built for hospitality.',
                              style: TextStyle(color: Colors.grey, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Text('PREFERENCES', style: TextStyle(color: yellow, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.8)),
                      const SizedBox(height: 8),
                      PopupMenuButton<String>(
                        initialValue: _currentLang,
                        tooltip: 'Choose language',
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: const BorderSide(color: ink, width: 2),
                        ),
                        color: card,
                        onSelected: (code) {
                          setState(() => _currentLang = code);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Language set to ${code.toUpperCase()}')),
                          );
                        },
                        itemBuilder: (context) => const [
                          PopupMenuItem(value: 'en', child: Text('🇬🇧 English')),
                          PopupMenuItem(value: 'hi', child: Text('🇮🇳 हिन्दी (Hindi)')),
                          PopupMenuItem(value: 'mr', child: Text('🇮🇳 मराठी (Marathi)')),
                          PopupMenuItem(value: 'es', child: Text('🇪🇸 Español')),
                          PopupMenuItem(value: 'fr', child: Text('🇫🇷 Français')),
                          PopupMenuItem(value: 'de', child: Text('🇩🇪 Deutsch')),
                        ],
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: card,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: ink, width: 2),
                            boxShadow: neoShadowSm,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.language, size: 16, color: ink),
                              const SizedBox(width: 8),
                              Text('Language: ${_currentLang.toUpperCase()}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: ink)),
                              const SizedBox(width: 4),
                              const Icon(Icons.arrow_drop_down, size: 18, color: ink),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _floatingIconBadge(IconData icon, Color bg) => Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: ink, width: 2),
          boxShadow: const [BoxShadow(color: ink, offset: Offset(2, 2))],
        ),
        child: Icon(icon, color: ink, size: 24),
      );

  Widget _perkItem(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(2),
              decoration: const BoxDecoration(color: ink, shape: BoxShape.circle),
              child: const Icon(Icons.check, size: 12, color: yellow),
            ),
            const SizedBox(width: 8),
            Expanded(child: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: ink))),
          ],
        ),
      );

  Widget _roleCheckItem(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.check_circle, size: 16, color: ink),
            const SizedBox(width: 8),
            Expanded(child: Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: ink))),
          ],
        ),
      );
}
