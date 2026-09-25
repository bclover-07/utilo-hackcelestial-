import 'package:flutter/material.dart';
import '../core/api.dart';
import '../ui/widgets.dart';
import '../ui/theme.dart';
import 'resources.dart';
import 'deals.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({
    super.key,
    required this.session,
    required this.section,
    required this.onNavigate,
  });
  final Session session;
  final String section;
  final void Function(String) onNavigate;
  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  Json filters = {};
  @override
  Widget build(BuildContext context) {
    final section = widget.section;
    final api = widget.session.api;
    final query = Uri(
      queryParameters: {
        'mode': widget.session.mode,
        ...filters.map((k, v) => MapEntry(k, '$v')),
      },
    ).query;
    final path = section == 'analytics'
        ? '/analytics/intelligence?$query'
        : section == 'market-pulse'
        ? '/analytics/market-pulse'
        : section == 'performance'
        ? '/analytics/provider-performance'
        : '/analytics?mode=${widget.session.mode}';
    return PageBody(
      title: section == 'analytics'
          ? 'See the whole marketplace.'
          : section == 'market-pulse'
          ? 'The market, right now.'
          : section == 'performance'
          ? 'Your service, in perspective.'
          : 'Less idle. More possible.',
      subtitle: section == 'analytics'
          ? 'Observed demand, supply and booking activity. Independent activity counts are not a conversion funnel.'
          : 'Live records from your workspace. Empty data remains empty.',
      children: [
        if (section == 'analytics')
          Panel(
            child: FieldsForm(
              submit: 'Apply filters',
              fields: const [
                FieldSpec('city', 'City', required: false),
                FieldSpec('category', 'Category slug', required: false),
              ],
              onSubmit: (v) async {
                setState(() => filters = v);
                return 'Filters applied.';
              },
            ),
          ),
        Remote(
          api: api,
          path: path,
          builder: (data, reload) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  AsyncButton(
                    text: 'Refresh',
                    run: reload,
                    icon: Icons.refresh,
                  ),
                  AsyncButton(
                    text: 'Export bookings CSV',
                    icon: Icons.download_outlined,
                    run: () => shareDownload(
                      api,
                      '/analytics/export?mode=${widget.session.mode}',
                      'utlio-bookings.csv',
                      'text/csv',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              if (section == '') ...[
                Wrap(
                  spacing: 16,
                  runSpacing: 8,
                  children: [
                    for (final key in [
                      'listings',
                      'requests',
                      'quotes',
                      'businesses',
                      'searches',
                      'totalValue',
                      'fulfillmentRate',
                    ])
                      if (data[key] != null)
                        SizedBox(
                          width: 220,
                          child: Panel(
                            color: palette[key.length % 5],
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  label(key),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                Text(
                                  key == 'totalValue'
                                      ? '₹${data[key]}'
                                      : key == 'fulfillmentRate'
                                      ? '${data[key]}%'
                                      : '${data[key]}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 30,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                  ],
                ),
                Wrap(
                  spacing: 12,
                  children: [
                    FilledButton(
                      onPressed: () => widget.onNavigate(
                        widget.session.admin
                            ? 'verifications'
                            : widget.session.mode == 'provider'
                            ? 'listings'
                            : 'search',
                      ),
                      child: Text(
                        widget.session.admin
                            ? 'Review verification queue'
                            : widget.session.mode == 'provider'
                            ? 'Manage resources'
                            : 'Discover resources',
                      ),
                    ),
                    FilledButton(
                      onPressed: () => widget.onNavigate('agents'),
                      child: const Text('Open Agent Studio'),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Bars(
                  title: 'Monthly agreed booking value (INR)',
                  rows: records(data['trend']),
                  nameKey: '_id',
                  valueKey: 'value',
                ),
                Bars(
                  title: 'Bookings by status',
                  rows: records(data['bookings']),
                  nameKey: '_id',
                  valueKey: 'count',
                ),
                const SizedBox(height: 12),
                _MarketDemandRadarWidget(demand: records(data['demand'])),
              ],
              if (section == 'analytics') ...[
                Bars(
                  title: 'Current demand (units)',
                  rows: records(data['demand']),
                  nameKey: 'category',
                  valueKey: 'totalUnits',
                ),
                Bars(
                  title: 'Recorded utilization (%)',
                  rows: records(data['supply']),
                  nameKey: 'title',
                  valueKey: 'utilizationPercent',
                ),
                Bars(
                  title: 'Monthly booking value (INR)',
                  rows: records(data['revenue']),
                  nameKey: 'period',
                  valueKey: 'revenue',
                ),
                Bars(
                  title: 'Requirement coverage',
                  rows: records(data['coverage']),
                  nameKey: 'status',
                  valueKey: 'count',
                ),
              ],
              if (section == 'market-pulse') ...[
                if (data['snapshot'] != null)
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      _PulseMetricCard(
                        icon: Icons.search,
                        label: 'Searches today',
                        value: '${data['snapshot']['searchesToday'] ?? 0}',
                        color: yellow,
                      ),
                      _PulseMetricCard(
                        icon: Icons.assignment_outlined,
                        label: 'Requests today',
                        value: '${data['snapshot']['requestsToday'] ?? 0}',
                        color: sky,
                      ),
                      _PulseMetricCard(
                        icon: Icons.check_circle_outline,
                        label: 'Bookings today',
                        value: '${data['snapshot']['bookingsToday'] ?? 0}',
                        color: teal,
                      ),
                      _PulseMetricCard(
                        icon: Icons.business_outlined,
                        label: 'Active businesses',
                        value: '${data['snapshot']['activeBusinesses'] ?? 0}',
                        color: const Color(0xFFC3B1E1),
                      ),
                    ],
                  ),
                const SizedBox(height: 18),
                if (records(data['trendingCategories']).isNotEmpty)
                  Bars(
                    title: 'Trending categories (Search velocity)',
                    rows: records(data['trendingCategories']),
                    nameKey: 'category',
                    valueKey: 'searchVelocity',
                  ),
                if (records(data['priceMovement']).isNotEmpty)
                  Panel(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text('Recent price movements', style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: [
                            for (final p in records(data['priceMovement']))
                              Container(
                                width: 200,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: card,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: ink, width: 1.5),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Chip(label: Text(label('${p['category']}'))),
                                    const SizedBox(height: 6),
                                    Text(
                                      '₹${p['avgPrice'] ?? 0}',
                                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                                    ),
                                    Text(
                                      'Avg from ${p['bookingCount'] ?? 0} bookings',
                                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
              ],
              if (section == 'performance') ...[
                Builder(
                  builder: (context) {
                    final item = data is List && data.isNotEmpty
                        ? data[0] as Map
                        : (data is Map ? data : {});
                    if (item.isEmpty) {
                      return const Empty(
                        text: 'No performance data available yet. Complete bookings to build your scorecard.',
                      );
                    }
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: [
                            _PulseMetricCard(
                              icon: Icons.timer_outlined,
                              label: 'Response time',
                              value: item['avgResponseHours'] != null ? '${item['avgResponseHours']}h' : '—',
                              color: yellow,
                            ),
                            _PulseMetricCard(
                              icon: Icons.check_circle_outline,
                              label: 'Acceptance rate',
                              value: item['acceptanceRate'] != null ? '${item['acceptanceRate']}%' : '—',
                              color: teal,
                            ),
                            _PulseMetricCard(
                              icon: Icons.star,
                              label: 'Average rating',
                              value: item['avgRating'] != null ? '${item['avgRating']} ★' : '—',
                              color: const Color(0xFFFFB347),
                            ),
                            _PulseMetricCard(
                              icon: Icons.inventory_2_outlined,
                              label: 'Total bookings',
                              value: '${item['totalBookings'] ?? 0}',
                              color: sky,
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                        Panel(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text('Performance Indicators', style: Theme.of(context).textTheme.titleLarge),
                              const SizedBox(height: 14),
                              _ScoreIndicator(
                                label: 'Response Score',
                                percent: item['avgResponseHours'] != null
                                    ? ((100 - (item['avgResponseHours'] as num) * 2).clamp(0, 100)) / 100
                                    : 0.8,
                                displayValue: item['avgResponseHours'] != null ? '${item['avgResponseHours']}h avg' : 'N/A',
                                color: teal,
                              ),
                              _ScoreIndicator(
                                label: 'Acceptance Rate',
                                percent: item['acceptanceRate'] != null ? ((item['acceptanceRate'] as num) / 100).clamp(0.0, 1.0) : 0.0,
                                displayValue: item['acceptanceRate'] != null ? '${item['acceptanceRate']}%' : 'N/A',
                                color: yellow,
                              ),
                              _ScoreIndicator(
                                label: 'Rating Score',
                                percent: item['avgRating'] != null ? (((item['avgRating'] as num) * 20).clamp(0, 100)) / 100 : 0.0,
                                displayValue: item['avgRating'] != null ? '${item['avgRating']} / 5.0' : 'N/A',
                                color: const Color(0xFFFFB347),
                              ),
                              _ScoreIndicator(
                                label: 'Completion Rate',
                                percent: item['completionRate'] != null ? ((item['completionRate'] as num) / 100).clamp(0.0, 1.0) : 0.0,
                                displayValue: item['completionRate'] != null ? '${item['completionRate']}%' : 'N/A',
                                color: sky,
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ],
              ExpansionTile(
                title: const Text(
                  'Raw record telemetry',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
                children: [
                  Panel(child: DataView(data)),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _PulseMetricCard extends StatelessWidget {
  const _PulseMetricCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });
  final IconData icon;
  final String label, value;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
    width: MediaQuery.sizeOf(context).width < 400 ? double.infinity : 200,
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: ink, width: 2),
      boxShadow: const [BoxShadow(color: ink, offset: Offset(3, 3))],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 24, color: ink),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: ink),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: ink),
        ),
        Row(
          children: [
            Container(
              width: 7,
              height: 7,
              decoration: const BoxDecoration(
                color: Color(0xFF0F766E),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 5),
            const Text(
              'Last 24 hours',
              style: TextStyle(fontSize: 10, color: Colors.black54, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ],
    ),
  );
}

class _ScoreIndicator extends StatelessWidget {
  const _ScoreIndicator({
    required this.label,
    required this.percent,
    required this.displayValue,
    required this.color,
  });
  final String label, displayValue;
  final double percent;
  final Color color;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
            Text(displayValue, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
          ],
        ),
        const SizedBox(height: 6),
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0.0, end: percent.clamp(0.0, 1.0)),
          duration: const Duration(milliseconds: 650),
          curve: Curves.easeOutQuart,
          builder: (context, animValue, _) => LinearProgressIndicator(
            value: animValue,
            minHeight: 12,
            backgroundColor: Colors.grey.shade300,
            color: color,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ],
    ),
  );
}

class Bars extends StatelessWidget {
  const Bars({
    super.key,
    required this.title,
    required this.rows,
    required this.nameKey,
    required this.valueKey,
  });
  final String title, nameKey, valueKey;
  final List<Json> rows;
  @override
  Widget build(BuildContext context) {
    final values = rows.where((r) => r[valueKey] is num).toList();
    final maximum = values.fold<double>(
      0,
      (m, r) => (r[valueKey] as num).toDouble() > m
          ? (r[valueKey] as num).toDouble()
          : m,
    );
    return Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 14),
          if (values.isEmpty) const Text('No recorded data yet.'),
          for (final (i, row) in values.indexed)
            Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('${identity(row[nameKey])}: ${row[valueKey]}'),
                  const SizedBox(height: 5),
                  TweenAnimationBuilder<double>(
                    tween: Tween(
                      begin: 0,
                      end: maximum == 0 ? 0 : (row[valueKey] as num) / maximum,
                    ),
                    duration: MediaQuery.disableAnimationsOf(context)
                        ? Duration.zero
                        : const Duration(milliseconds: 400),
                    builder: (context, value, _) => LinearProgressIndicator(
                      value: value,
                      minHeight: 16,
                      backgroundColor: paper,
                      color: palette[i % 5],
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class AgentScreen extends StatefulWidget {
  const AgentScreen({super.key, required this.session, required this.section});
  final Session session;
  final String section;
  @override
  State<AgentScreen> createState() => _AgentScreenState();
}

class _AgentScreenState extends State<AgentScreen> {
  dynamic result;
  String? listing;
  @override
  Widget build(BuildContext context) {
    final s = widget.session;
    return PageBody(
      title: widget.section == 'smart-pricing'
          ? 'Price with perspective.'
          : widget.section == 'forecast'
          ? 'Spot your next opportunity.'
          : 'Meet your working team.',
      subtitle:
          'Specialist tools, visible evidence and real execution records. AI recommendations need your review.',
      children: [
        if (widget.section == 'agents') ...[
          if (s.admin)
            AiResultButton(
              api: s.api,
              path: '/admin/agents/brief',
              body: const {},
              title: 'Prepare operations brief',
            )
          else ...[
            Panel(
              color: lavender,
              child: FieldsForm(
                submit: 'Research marketplace',
                fields: const [
                  FieldSpec(
                    'text',
                    'Ask about resources, terms or suitability',
                    type: 'multiline',
                  ),
                ],
                onSubmit: (b) async {
                  final r = await s.api.call(
                    '/ai/knowledge',
                    method: 'POST',
                    body: b,
                  );
                  if (mounted) setState(() => result = r);
                  return 'Evidence review complete.';
                },
              ),
            ),
            Panel(
              child: FieldsForm(
                submit: 'Interpret brief & rank matches',
                fields: [
                  const FieldSpec(
                    'text',
                    'Describe your event requirements',
                    type: 'multiline',
                  ),
                  ...locationFields,
                  ...rangeFields,
                  const FieldSpec(
                    'budget',
                    'Per-item budget (INR)',
                    type: 'number',
                    min: 1,
                  ),
                  const FieldSpec(
                    'radiusKm',
                    'Radius (km)',
                    type: 'number',
                    initial: 25,
                    min: 1,
                    max: 300,
                  ),
                  const FieldSpec(
                    'delivery',
                    'Delivery required',
                    type: 'bool',
                  ),
                ],
                onSubmit: (b) async {
                  final input = locationBody(b);
                  final text = input.remove('text');
                  final r = await s.api.call(
                    '/ai/workflow',
                    method: 'POST',
                    body: {'kind': 'bundle', 'text': text, 'filters': input},
                  );
                  if (mounted) setState(() => result = r);
                  return 'Matching complete.';
                },
              ),
            ),
          ],
          Remote(
            api: s.api,
            path: s.admin ? '/admin/agents' : '/ai/studio',
            builder: (v, reload) => Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AsyncButton(
                  text: 'Refresh agent activity',
                  run: reload,
                  icon: Icons.refresh,
                ),
                ...records(v['agents']).map(
                  (a) => Panel(
                    color: palette['${a['id']}'.length % 5],
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.auto_awesome),
                        Text(
                          '${a['title']}',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        Text('${a['description']}'),
                        Text('${a['engine']}'),
                        Text('${a['check']}'),
                      ],
                    ),
                  ),
                ),
                Panel(
                  child: DataView({
                    'configuration': v['configuration'],
                    'scope': v['scope'],
                    'summary': v['summary'],
                    'recent': v['recent'],
                  }),
                ),
              ],
            ),
          ),
          if (!s.admin) MemoryPanel(api: s.api),
        ] else
          Remote(
            api: s.api,
            path: '/categories',
            builder: (cats, _) => Panel(
              child: FieldsForm(
                submit: widget.section == 'smart-pricing'
                    ? 'Analyze observed prices'
                    : 'Analyze demand snapshot',
                fields: [
                  FieldSpec(
                    'category',
                    'Resource category',
                    options: categoryOptions(cats),
                    required: widget.section == 'smart-pricing',
                  ),
                  if (widget.section == 'forecast')
                    FieldSpec(
                      'city',
                      'City',
                      required: false,
                      initial: s.user?['city'],
                    ),
                ],
                footer: widget.section == 'smart-pricing'
                    ? Remote(
                        api: s.api,
                        path: '/listings',
                        builder: (data, _) => Padding(
                          padding: const EdgeInsets.only(bottom: 20),
                          child: DropdownButtonFormField<String>(
                            isExpanded: true,
                            decoration: const InputDecoration(
                              labelText: 'Optional listing to compare',
                            ),
                            items: [
                              const DropdownMenuItem(
                                value: '',
                                child: Text('Category-wide comparison'),
                              ),
                              ...records(data).map(
                                (l) => DropdownMenuItem(
                                  value: '${l['_id']}',
                                  child: Text(
                                    '${l['title']}',
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ),
                            ],
                            onChanged: (v) => listing = v,
                          ),
                        ),
                      )
                    : null,
                onSubmit: (b) async {
                  final r = await s.api.call(
                    widget.section == 'smart-pricing'
                        ? '/ai/smart-price'
                        : '/ai/forecast',
                    method: 'POST',
                    body: {
                      ...b,
                      if (listing != null && listing!.isNotEmpty)
                        'listingId': listing,
                    },
                  );
                  if (mounted) setState(() => result = r);
                  return 'Analysis ready.';
                },
              ),
            ),
          ),
        if (result != null)
          Panel(
            color: widget.section == 'smart-pricing'
                ? yellow
                : widget.section == 'forecast'
                ? sky
                : teal,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      widget.section == 'smart-pricing'
                          ? 'AI Pricing Recommendation'
                          : widget.section == 'forecast'
                          ? 'Demand Intelligence Snapshot'
                          : 'Intelligence & Evidence',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: paper,
                        border: Border.all(color: ink, width: 1.5),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text(
                        'GEMINI AI',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Advice Text
                if (result['advice'] != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: card,
                      border: Border.all(color: ink, width: 1.5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${result['advice']}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        height: 1.4,
                      ),
                    ),
                  ),

                // AutoPilot Recommendation Card for Smart Pricing
                if (result['autoPilotRecommendation'] != null) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xffe8f5e9),
                      border: Border.all(color: ink, width: 2),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'DYNAMIC PRICING AUTO-PILOT',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.04,
                            color: Color(0xff2e7d32),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Suggested Dynamic Rate: ₹${result['autoPilotRecommendation']['recommendedDynamicPrice']}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Surge Multiplier: ${result['autoPilotRecommendation']['surgeMultiplier']}x • Floor: ₹${result['autoPilotRecommendation']['floorPrice']} • Ceiling: ₹${result['autoPilotRecommendation']['ceilingPrice']}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Cannibalization Risk Alert
                if (result['cannibalization'] != null &&
                    result['cannibalization']['detected'] == true) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xffffebee),
                      border: Border.all(color: ink, width: 2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '⚠️ CANNIBALIZATION RISK DETECTED',
                          style: TextStyle(
                            color: Color(0xffc62828),
                            fontWeight: FontWeight.w800,
                            fontSize: 11,
                          ),
                        ),
                        const SizedBox(height: 4),
                        for (final w
                            in records(result['cannibalization']['warnings']))
                          Text(
                            '• ${w['warning']}',
                            style: const TextStyle(fontSize: 12),
                          ),
                      ],
                    ),
                  ),
                ],

                // Comparables for Smart Pricing
                if (result['comparables'] != null &&
                    (result['comparables'] as List).isNotEmpty) ...[
                  const Text(
                    'Market Comparables',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                  const SizedBox(height: 8),
                  for (final c in records(result['comparables']))
                    Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: card,
                        border: Border.all(color: ink, width: 1.5),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${c['_id'] ?? 'Category sample'} (${c['count']} listings)',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          Text(
                            'Avg: ₹${(c['avgPrice'] is num) ? (c['avgPrice'] as num).round() : c['avgPrice']}',
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              color: Color(0xff2e7d32),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],

                // Observations & Trends for Demand Forecast
                if (result['observations'] != null) ...[
                  const Text(
                    'Market Observations',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                  const SizedBox(height: 6),
                  if (result['observations'] is List)
                    for (final obs in result['observations'])
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          '• $obs',
                          style: const TextStyle(fontSize: 13),
                        ),
                      )
                  else
                    Text(
                      '${result['observations']}',
                      style: const TextStyle(fontSize: 13),
                    ),
                  const SizedBox(height: 10),
                ],

                if (result['recommendations'] != null &&
                    result['recommendations'] is List) ...[
                  const Text(
                    'Actionable Recommendations',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                  const SizedBox(height: 6),
                  for (final rec in result['recommendations'])
                    Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: card,
                        border: Border.all(color: ink, width: 1.5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '💡 $rec',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],

                // Fallback details if not smart-pricing or forecast
                if (widget.section != 'smart-pricing' &&
                    widget.section != 'forecast')
                  DataView(result),

                if (result['sources'] is List) ...[
                  const SizedBox(height: 10),
                  ...records(result['sources']).map(
                    (source) => TextButton.icon(
                      icon: const Icon(Icons.open_in_new, size: 16),
                      onPressed: () => openScreen(
                        context,
                        ListingDetail(
                          session: s,
                          listing: {
                            '_id': source['id'],
                            'title': source['title'],
                          },
                        ),
                      ),
                      label: Text('Inspect source: ${source['title']}'),
                    ),
                  ),
                ],
              ],
            ),
          ),
      ],
    );
  }
}


class MemoryPanel extends StatelessWidget {
  const MemoryPanel({super.key, required this.api});
  final Api api;
  @override
  Widget build(BuildContext context) => Remote(
    api: api,
    path: '/ai/memory',
    builder: (v, reload) => Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Your working preferences',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          ...records(v).map(
            (m) => ListTile(
              title: Text('${m['key']}: ${m['value']}'),
              subtitle: Text('${m['category']}'),
              trailing: AsyncButton(
                text: 'Delete',
                icon: Icons.delete_outline,
                run: () async {
                  await api.call('/ai/memory/${m['_id']}', method: 'DELETE');
                  await reload();
                  return 'Preference removed.';
                },
              ),
            ),
          ),
          FieldsForm(
            submit: 'Save preference',
            fields: const [
              FieldSpec(
                'category',
                'Type',
                options: {
                  'preference': 'Preference',
                  'constraint': 'Constraint',
                  'logistics': 'Logistics',
                  'vendor_affinity': 'Vendor affinity',
                },
                initial: 'preference',
              ),
              FieldSpec('key', 'Preference name'),
              FieldSpec('value', 'Details', type: 'multiline'),
              FieldSpec('pinned', 'Pin this preference', type: 'bool'),
            ],
            onSubmit: (b) async {
              await api.call('/ai/memory', method: 'POST', body: b);
              await reload();
              return 'Preference saved.';
            },
          ),
        ],
      ),
    ),
  );
}

class PlannerScreen extends StatefulWidget {
  const PlannerScreen({super.key, required this.session});
  final Session session;
  @override
  State<PlannerScreen> createState() => _PlannerScreenState();
}

class _PlannerScreenState extends State<PlannerScreen> {
  Json? draft, plan;
  int refresh = 0;
  @override
  Widget build(BuildContext context) => PageBody(
    title: 'Your event. In concert.',
    subtitle:
        'Interpret a brief, edit the requirements, compare real packages, then approve an RFQ. Planning does not reserve inventory.',
    children: [
      Panel(
        color: lavender,
        child: FieldsForm(
          submit: 'Turn this into a draft',
          fields: const [
            FieldSpec('text', 'Describe your event', type: 'multiline'),
          ],
          onSubmit: (b) async {
            final r = await widget.session.api.call(
              '/ai/workflow',
              method: 'POST',
              body: {...b, 'kind': 'parse'},
            );
            if (mounted) {
              setState(() => draft = Map<String, dynamic>.from(r['draft']));
            }
            return 'Review the draft and supply missing details.';
          },
        ),
      ),
      if (draft?['missing'] != null)
        Panel(
          color: yellow,
          child: DataView({'Please confirm': draft!['missing']}),
        ),
      PlannerForm(
        key: ValueKey(draft),
        session: widget.session,
        initial: draft,
        onResult: (r) => setState(() {
          plan = r;
          refresh++;
        }),
      ),
      if (plan != null)
        PlanResult(
          session: widget.session,
          plan: plan!,
          onChange: (p) => setState(() => plan = p),
        ),
      Remote(
        key: ValueKey(refresh),
        api: widget.session.api,
        path: '/ai/plans',
        builder: (v, reload) => Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Saved plans',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              if (records(v).isEmpty) const Text('No saved plans yet.'),
              ...records(v).map(
                (p) => ListTile(
                  title: Text('${p['input']?['title']}'),
                  subtitle: Text(
                    'Version ${p['version']} • ${p['result']?['status']}',
                  ),
                  trailing: AsyncButton(
                    text: 'Open',
                    run: () async {
                      final r = await widget.session.api.call(
                        '/ai/plans/${p['_id']}',
                      );
                      if (mounted) {
                        setState(() => plan = Map<String, dynamic>.from(r));
                      }
                      return 'Plan loaded.';
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ],
  );
}

class PlannerForm extends StatefulWidget {
  const PlannerForm({
    super.key,
    required this.session,
    this.initial,
    this.plan,
    required this.onResult,
  });
  final Session session;
  final Json? initial, plan;
  final void Function(Json) onResult;
  @override
  State<PlannerForm> createState() => _PlannerFormState();
}

class _PlannerFormState extends State<PlannerForm> {
  late List<Json> items;
  @override
  void initState() {
    super.initState();
    items = records(
      widget.plan?['input']?['items'] ?? widget.initial?['items'],
    );
    if (items.isEmpty) items.add({'quantity': 1, 'capacity': 1, 'specs': ''});
  }

  @override
  Widget build(BuildContext context) {
    final initial = widget.plan?['input'] ?? widget.initial ?? {};
    final filters = initial['filters'] ?? initial;
    return Remote(
      api: widget.session.api,
      path: '/categories',
      builder: (data, _) => Panel(
        child: FieldsForm(
          initial: {
            ...filters,
            'title': initial['title'],
            'latitude': filters['coordinates']?[1],
            'longitude': filters['coordinates']?[0],
          },
          submit: widget.plan == null
              ? 'Build event packages'
              : 'Replan & compare',
          fields: [
            const FieldSpec('title', 'Event title'),
            ...locationFields,
            ...rangeFields,
            const FieldSpec(
              'budget',
              'Total rental & delivery budget (INR)',
              type: 'number',
              min: 1,
            ),
            const FieldSpec(
              'radiusKm',
              'Radius (km)',
              type: 'number',
              min: 1,
              max: 300,
              initial: 25,
            ),
            const FieldSpec('delivery', 'Delivery required', type: 'bool'),
            const FieldSpec(
              'excludedProviders',
              'Excluded provider IDs (comma separated)',
              required: false,
            ),
          ],
          footer: ItemsEditor(categories: records(data), items: items, planner: true),
          onSubmit: (raw) async {
            final f = locationBody(raw);
            final title = f.remove('title');
            final excluded = '${f.remove('excludedProviders') ?? ''}'
                .split(',')
                .map((v) => v.trim())
                .where((v) => v.isNotEmpty)
                .toList();
            final input = {
              'title': title,
              'filters': f,
              'items': items
                  .map(
                    (i) => {
                      ...i,
                      'label':
                          i['label'] ??
                          categoryOptions(data)[i['category']] ??
                          i['category'],
                    },
                  )
                  .toList(),
              'excludedProviders': excluded,
            };
            final r = await widget.session.api.call(
              widget.plan == null
                  ? '/ai/plans'
                  : '/ai/plans/${widget.plan!['_id']}/replan',
              method: 'POST',
              body: widget.plan == null
                  ? input
                  : {'version': widget.plan!['version'], 'input': input},
            );
            widget.onResult(Map<String, dynamic>.from(r));
            return 'Plan ready. Review prices, constraints and alternatives.';
          },
        ),
      ),
    );
  }
}

class PlanResult extends StatefulWidget {
  const PlanResult({
    super.key,
    required this.session,
    required this.plan,
    required this.onChange,
  });
  final Session session;
  final Json plan;
  final void Function(Json) onChange;
  @override
  State<PlanResult> createState() => _PlanResultState();
}

class _PlanResultState extends State<PlanResult> {
  bool acknowledged = false;
  @override
  Widget build(BuildContext context) => Panel(
    color: teal,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '${widget.plan['input']['title']} • Version ${widget.plan['version']}',
          style: Theme.of(context).textTheme.titleLarge,
        ),

          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Text(
              '${widget.plan['result']['summary']}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        const SizedBox(height: 10),
        const Text(
          'Engineered Packages',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
        ),
        const SizedBox(height: 8),
        for (final p in records(widget.plan['result']?['alternatives']))
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: card,
              border: Border.all(color: ink, width: 2),
              borderRadius: BorderRadius.circular(12),
              boxShadow: const [BoxShadow(color: ink, offset: Offset(2, 2))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${p['label'] ?? p['id']}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: p['feasible'] == true ? teal : lavender,
                        border: Border.all(color: ink, width: 1.5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        p['feasible'] == true ? 'FEASIBLE' : 'LIMITATIONS',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Total Package: ₹${p['total']}',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: Color(0xff2e7d32),
                  ),
                ),
                if (p['items'] is List) ...[
                  const SizedBox(height: 8),
                  for (final it in records(p['items']))
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Text(
                        '• ${it['quantity']}× ${it['category']} — ${identity(it['listing'])} (₹${it['price'] ?? 0})',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                ],
                if (p['notes'] != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    '${p['notes']}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
            ),
          ),
        if (widget.plan['request'] != null)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: card,
              border: Border.all(color: ink, width: 1.5),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '✅ RFQ created: ${widget.plan['request']}',
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
          )

        else ...[
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            value: acknowledged,
            onChanged: (v) => setState(() => acknowledged = v!),
            title: const Text(
              'I reviewed the package, conditions, deposits and availability limitations. Create invitations for this package.',
            ),
          ),
          ...records(widget.plan['result']['alternatives']).map(
            (p) => AsyncButton(
              text: 'Create RFQ: ${p['label'] ?? p['id']} • ₹${p['total']}',
              enabled: p['feasible'] == true && acknowledged,
              run: () async {
                await widget.session.api.call(
                  '/ai/plans/${widget.plan['_id']}/request',
                  method: 'POST',
                  body: {
                    'version': widget.plan['version'],
                    'packageId': p['id'],
                    'acknowledged': true,
                  },
                );
                widget.onChange(
                  Map<String, dynamic>.from(
                    await widget.session.api.call(
                      '/ai/plans/${widget.plan['_id']}',
                    ),
                  ),
                );
                return 'RFQ invitations created. No inventory is booked yet.';
              },
            ),
          ),
          ExpansionTile(
            title: const Text('Change constraints & replan'),
            children: [
              PlannerForm(
                key: ValueKey(
                  '${widget.plan['_id']}/${widget.plan['version']}',
                ),
                session: widget.session,
                plan: widget.plan,
                onResult: widget.onChange,
              ),
            ],
          ),
        ],
      ],
    ),
  );
}

class _MarketDemandRadarWidget extends StatelessWidget {
  const _MarketDemandRadarWidget({required this.demand});
  final List<dynamic> demand;

  @override
  Widget build(BuildContext context) {
    if (demand.isEmpty) return const SizedBox.shrink();

    return Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Demand vs Listed Supply',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: teal,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: ink, width: 1.5),
                ),
                child: const Text('EQUILIBRIUM', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900)),
              ),
            ],
          ),
          const SizedBox(height: 14),
          for (final d in demand) ...[
            Builder(
              builder: (context) {
                final catName = '${d['_id'] ?? d['category'] ?? ''}'.replaceAll('_', ' ');
                final reqUnits = d['units'] is num ? (d['units'] as num).toInt() : (d['totalUnits'] is num ? (d['totalUnits'] as num).toInt() : 0);
                final listedUnits = d['listedUnits'] is num ? (d['listedUnits'] as num).toInt() : 0;
                final maxUnits = (reqUnits > listedUnits ? reqUnits : listedUnits).clamp(1, 99999);
                final reqRatio = (reqUnits / maxUnits).clamp(0.05, 1.0);
                final listedRatio = (listedUnits / maxUnits).clamp(0.05, 1.0);
                final isDeficit = reqUnits > listedUnits;

                return Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(catName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: isDeficit ? const Color(0xfffee2e2) : const Color(0xffd1fae5),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              isDeficit ? 'Unmet +${reqUnits - listedUnits}' : 'Surplus +${listedUnits - reqUnits}',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: isDeficit ? const Color(0xff991b1b) : const Color(0xff065f46),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const SizedBox(width: 55, child: Text('Demand', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w700))),
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: reqRatio,
                                minHeight: 8,
                                backgroundColor: const Color(0xfff3f4f6),
                                valueColor: const AlwaysStoppedAnimation(Color(0xffff85a1)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text('$reqUnits req', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const SizedBox(width: 55, child: Text('Supply', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w700))),
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: listedRatio,
                                minHeight: 8,
                                backgroundColor: const Color(0xfff3f4f6),
                                valueColor: const AlwaysStoppedAnimation(Color(0xff4ecdc4)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text('$listedUnits pool', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ],
      ),
    );
  }
}

