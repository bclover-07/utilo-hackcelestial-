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
                Bars(
                  title: 'Open demand by category (units)',
                  rows: records(data['demand']),
                  nameKey: '_id',
                  valueKey: 'units',
                ),
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
              Panel(child: DataView(data)),
            ],
          ),
        ),
      ],
    );
  }
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
            color: teal,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Results & evidence',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                DataView(result),
                if (result['sources'] is List)
                  ...records(result['sources']).map(
                    (source) => TextButton(
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
                      child: Text('Inspect source: ${source['title']}'),
                    ),
                  ),
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
        DataView(widget.plan['result']),
        if (widget.plan['request'] != null)
          Text('RFQ created: ${widget.plan['request']}')
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
