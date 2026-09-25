import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../core/api.dart';
import '../ui/widgets.dart';
import '../ui/theme.dart';
import '../services/local_ai.dart';

Map<String, String> categoryOptions(dynamic data) => {
  for (final c in records(data)) '${c['slug']}': '${c['name']}',
};
void openScreen(BuildContext context, Widget screen) =>
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
Json locationBody(Json input) {
  final body = {...input};
  final lat = body.remove('latitude'), lon = body.remove('longitude');
  if (lat != null && lon != null) body['coordinates'] = [lon, lat];
  return body;
}

const locationFields = [
  FieldSpec('city', 'City'),
  FieldSpec('latitude', 'Latitude', type: 'number', min: -90, max: 90),
  FieldSpec('longitude', 'Longitude', type: 'number', min: -180, max: 180),
];
const rangeFields = [
  FieldSpec('start', 'Starts', type: 'date'),
  FieldSpec('end', 'Ends', type: 'date'),
];

Widget _specChip(String text) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xfff4f1ea),
        border: Border.all(color: ink, width: 1.2),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        text,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );

class ListingCard extends StatelessWidget {
  const ListingCard({
    super.key,
    required this.listing,
    this.actions = const [],
  });
  final Json listing;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final score = listing['score'] is num ? (listing['score'] as num).toInt() : null;
    final qty = listing['quantity'] is num ? (listing['quantity'] as num).toInt() : 1;
    final stockRatio = ((qty * 12).clamp(20, 100)) / 100;
    final reasons = listing['reasons'] is List ? (listing['reasons'] as List) : [];

    return Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Stack(
            children: [
              if ((listing['photos'] as List? ?? []).isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    listing['photos'][0],
                    height: 170,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, e, s) => Container(
                      height: 120,
                      color: const Color(0xffe5e0cf),
                      child: const Icon(Icons.broken_image_outlined, size: 40),
                    ),
                  ),
                )
              else
                Container(
                  height: 120,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: teal,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.inventory_2_outlined, size: 44),
                ),
              Positioned(
                bottom: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: ink, width: 1.5),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: const [BoxShadow(color: ink, offset: Offset(1.5, 1.5))],
                  ),
                  child: Text(
                    '${listing['category']}'.replaceAll('_', ' ').toUpperCase(),
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
              if (score != null)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: ink, width: 1.5),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: const [BoxShadow(color: ink, offset: Offset(2, 2))],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: score >= 85
                                ? const Color(0xff10b981)
                                : score >= 65
                                    ? const Color(0xfff59e0b)
                                    : const Color(0xff6366f1),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '$score% match',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '${listing['title']}',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),

          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _specChip('📍 ${listing['city']}'),
              _specChip('👥 ${listing['capacity']} cap'),
              _specChip('📦 $qty ${listing['unit'] ?? 'units'}'),
            ],
          ),
          const SizedBox(height: 10),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '₹${listing['price']} / ${listing['unit']}',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
              ),
              if (listing['estimatedTotal'] != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: lavender,
                    border: Border.all(color: ink, width: 1.5),
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: const [BoxShadow(color: ink, offset: Offset(1.5, 1.5))],
                  ),
                  child: Text(
                    'Est: ₹${listing['estimatedTotal']}',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),

          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xfffaf8f2),
              border: Border.all(color: ink, width: 1.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Capacity Availability', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.black54)),
                    Text('$qty ready', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800)),
                  ],
                ),
                const SizedBox(height: 5),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: stockRatio,
                    minHeight: 6,
                    backgroundColor: const Color(0xffe5e0cf),
                    valueColor: const AlwaysStoppedAnimation(Color(0xff10b981)),
                  ),
                ),
              ],
            ),
          ),

          if (reasons.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: [
                for (final r in reasons)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xffecfdf5),
                      border: Border.all(color: const Color(0xff10b981), width: 1.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.check, size: 12, color: Color(0xff059669)),
                        const SizedBox(width: 4),
                        Text(
                          '$r',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xff065f46)),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          Wrap(spacing: 10, runSpacing: 10, children: actions),
        ],
      ),
    );
  }
}

class ListingsScreen extends StatelessWidget {
  const ListingsScreen({super.key, required this.session});
  final Session session;
  @override
  Widget build(BuildContext context) => PageBody(
    title: 'Make idle, useful.',
    subtitle: 'Your resources, ready for their next booking.',
    children: [
      Remote(
        api: session.api,
        path: '/listings',
        builder: (data, reload) => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AsyncButton(
              text: 'List a resource',
              icon: Icons.add,
              run: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ListingEditor(session: session),
                  ),
                );
                await reload();
              },
            ),
            const SizedBox(height: 20),
            if (records(data).isEmpty) const Empty(),
            ...records(data).map(
              (l) => ListingCard(
                listing: l,
                actions: [
                  AsyncButton(
                    text: 'Edit',
                    icon: Icons.edit_outlined,
                    run: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              ListingEditor(session: session, initial: l),
                        ),
                      );
                      await reload();
                    },
                  ),
                  if (l['moderationHold'] != true)
                    AsyncButton(
                      text: l['status'] == 'active' ? 'Pause' : 'Publish',
                      run: () async {
                        await session.api.call(
                          '/listings/${l['_id']}/status',
                          method: 'PATCH',
                          body: {
                            'status': l['status'] == 'active'
                                ? 'paused'
                                : 'active',
                          },
                        );
                        await reload();
                        return 'Listing updated.';
                      },
                    ),
                  AsyncButton(
                    text: 'Archive',
                    icon: Icons.archive_outlined,
                    run: () async {
                      await session.api.call(
                        '/listings/${l['_id']}/status',
                        method: 'PATCH',
                        body: {'status': 'archived'},
                      );
                      await reload();
                      return 'Listing archived.';
                    },
                  ),
                  AsyncButton(
                    text: 'Refresh AI index',
                    icon: Icons.auto_awesome,
                    run: () async {
                      await session.api.call(
                        '/listings/${l['_id']}/index',
                        method: 'POST',
                      );
                      return 'Index updated.';
                    },
                  ),
                  if (l['moderationHold'] == true)
                    const Text(
                      'Publication is on hold during administrator review.',
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    ],
  );
}

class ListingEditor extends StatefulWidget {
  const ListingEditor({super.key, required this.session, this.initial});
  final Session session;
  final Json? initial;
  @override
  State<ListingEditor> createState() => _ListingEditorState();
}

class _ListingEditorState extends State<ListingEditor> {
  late String category;
  late TextEditingController description;
  late List<String> photos;
  @override
  void initState() {
    super.initState();
    category = widget.initial?['category'] ?? '';
    description = TextEditingController(
      text: widget.initial?['description'] ?? '',
    );
    photos = List<String>.from(widget.initial?['photos'] ?? []);
  }

  @override
  void dispose() {
    description.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(widget.initial == null ? 'List a resource' : 'Edit resource'),
    ),
    body: PageBody(
      title: widget.initial == null
          ? 'A little space. A lot of potential.'
          : 'Fine-tune your listing.',
      subtitle: 'Be specific: good details lead to better matches.',
      children: [
        Remote(
          api: widget.session.api,
          path: '/categories',
          builder: (data, _) => Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: category.isEmpty ? null : category,
                  decoration: const InputDecoration(labelText: 'Category'),
                  items: categoryOptions(data).entries
                      .map(
                        (e) => DropdownMenuItem(
                          value: e.key,
                          child: Text(e.value),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => category = v ?? ''),
                ),
                const SizedBox(height: 18),
                FieldsForm(
                  submit: widget.initial == null
                      ? 'Publish resource →'
                      : 'Save changes',
                  initial: {
                    ...?widget.initial,
                    'latitude': widget.initial?['location']?['coordinates']?[1],
                    'longitude':
                        widget.initial?['location']?['coordinates']?[0],
                    ...{
                      for (final e
                          in (widget.initial?['attributes'] as Map? ?? {})
                              .entries)
                        'attr_${e.key}': e.value,
                    },
                  },
                  fields: [
                    const FieldSpec('title', 'Resource title'),
                    const FieldSpec(
                      'quantity',
                      'Units available',
                      type: 'number',
                      min: 1,
                    ),
                    const FieldSpec(
                      'capacity',
                      'Capacity per unit',
                      type: 'number',
                      min: 1,
                    ),
                    const FieldSpec(
                      'price',
                      'Price per unit (INR)',
                      type: 'number',
                      min: 0.01,
                    ),
                    const FieldSpec(
                      'unit',
                      'Billing unit',
                      options: {'hour': 'Hour', 'day': 'Day', 'event': 'Event'},
                      initial: 'day',
                    ),
                    const FieldSpec(
                      'minHours',
                      'Minimum rental (hours)',
                      type: 'number',
                      initial: 1,
                      min: 1,
                    ),
                    const FieldSpec(
                      'deposit',
                      'Security deposit (INR)',
                      type: 'number',
                      initial: 0,
                      min: 0,
                    ),
                    const FieldSpec(
                      'delivery',
                      'Delivery available',
                      type: 'bool',
                    ),
                    const FieldSpec(
                      'deliveryFee',
                      'Delivery charge (INR)',
                      type: 'number',
                      initial: 0,
                      min: 0,
                    ),
                    const FieldSpec(
                      'cancellationHours',
                      'Cancellation lead time (hours)',
                      type: 'number',
                      initial: 24,
                      min: 0,
                    ),
                    ...locationFields,
                    const FieldSpec('address', 'Street address'),
                    const FieldSpec(
                      'conditions',
                      'Rental conditions & pickup instructions',
                      type: 'multiline',
                      required: false,
                    ),
                    for (final f in records(
                      records(data)
                          .where((c) => c['slug'] == category)
                          .firstOrNull?['requiredFields'],
                    ))
                      FieldSpec(
                        'attr_${f['key']}',
                        '${f['label']}',
                        type: f['type'] == 'number' ? 'number' : 'text',
                        options: f['type'] == 'boolean'
                            ? {'true': 'Yes', 'false': 'No'}
                            : null,
                      ),
                  ],
                  footer: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextFormField(
                        controller: description,
                        maxLines: 5,
                        maxLength: 5000,
                        decoration: const InputDecoration(
                          labelText: 'Description',
                        ),
                        validator: (v) => (v?.trim().length ?? 0) < 10
                            ? 'Write at least 10 characters'
                            : null,
                        onChanged: (_) => setState(() {}),
                      ),
                      LocalAiPanel(
                        api: widget.session.api,
                        task: 'polish',
                        source: description.text,
                        onApply: (v) => setState(() => description.text = v),
                      ),
                      const SizedBox(height: 18),
                    ],
                  ),
                  onSubmit: (input) async {
                    if (category.isEmpty) {
                      throw const ApiFailure('Choose a category.');
                    }
                    final body = locationBody(input);
                    final attrs = <String, dynamic>{};
                    for (final f in records(
                      records(data)
                          .where((c) => c['slug'] == category)
                          .firstOrNull?['requiredFields'],
                    )) {
                      final v = body.remove('attr_${f['key']}');
                      attrs[f['key']] = f['type'] == 'boolean'
                          ? v == 'true'
                          : v;
                    }
                    body.removeWhere((k, v) => k.startsWith('attr_'));
                    body.addAll({
                      'category': category,
                      'description': description.text,
                      'photos': photos,
                      'attributes': attrs,
                    });
                    await widget.session.api.call(
                      widget.initial == null
                          ? '/listings'
                          : '/listings/${widget.initial!['_id']}',
                      method: widget.initial == null ? 'POST' : 'PUT',
                      body: body,
                    );
                    if (context.mounted) Navigator.pop(context);
                    return null;
                  },
                ),
              ],
            ),
          ),
        ),
        Panel(
          color: yellow,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Show the real thing.',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const Text(
                'Upload photos of this resource. Up to 10 images, 8 MB each.',
              ),
              AsyncButton(
                text: 'Upload photo',
                enabled: photos.length < 10,
                icon: Icons.add_photo_alternate_outlined,
                run: () async {
                  final result = await FilePicker.pickFile(
                    type: FileType.custom,
                    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
                  );
                  if (result == null) return null;
                  final file = result;
                  final uploaded = await widget.session.api.upload(
                    await file.readAsBytes(),
                    file.name,
                    'image',
                  );
                  if (mounted) setState(() => photos.add(uploaded['url']));
                  return 'Photo uploaded.';
                },
              ),
              ...photos.map(
                (p) => Row(
                  children: [
                    Expanded(
                      child: Image.network(
                        p,
                        height: 100,
                        fit: BoxFit.cover,
                        errorBuilder: (_, e, s) =>
                            const Icon(Icons.broken_image),
                      ),
                    ),
                    IconButton(
                      tooltip: 'Remove photo',
                      onPressed: () => setState(() => photos.remove(p)),
                      icon: const Icon(Icons.delete_outline),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class AvailabilityScreen extends StatefulWidget {
  const AvailabilityScreen({super.key, required this.session});
  final Session session;
  @override
  State<AvailabilityScreen> createState() => _AvailabilityScreenState();
}

class _AvailabilityScreenState extends State<AvailabilityScreen> {
  String? selected;
  @override
  Widget build(BuildContext context) => PageBody(
    title: 'Room for the next booking.',
    subtitle:
        'Block direct bookings, maintenance and dates you need for yourself.',
    children: [
      Remote(
        api: widget.session.api,
        path: '/listings',
        builder: (data, _) => DropdownButtonFormField<String>(
          isExpanded: true,
          initialValue: selected,
          decoration: const InputDecoration(labelText: 'Resource'),
          items: records(data)
              .map(
                (l) => DropdownMenuItem(
                  value: '${l['_id']}',
                  child: Text('${l['title']}', overflow: TextOverflow.ellipsis),
                ),
              )
              .toList(),
          onChanged: (v) => setState(() => selected = v),
        ),
      ),
      const SizedBox(height: 20),
      if (selected != null)
        Remote(
          key: ValueKey(selected),
          api: widget.session.api,
          path: '/listings/$selected/availability',
          builder: (data, reload) => Column(
            children: [
              Panel(
                child: FieldsForm(
                  submit: 'Reserve these units',
                  fields: [
                    ...rangeFields,
                    const FieldSpec(
                      'quantity',
                      'Units to block',
                      type: 'number',
                      min: 1,
                    ),
                    const FieldSpec('reason', 'Reason'),
                  ],
                  onSubmit: (body) async {
                    await widget.session.api.call(
                      '/listings/$selected/availability',
                      method: 'POST',
                      body: body,
                    );
                    await reload();
                    return 'Availability updated.';
                  },
                ),
              ),
              if (records(data).isEmpty)
                const Empty(text: 'No reserved time for this resource.'),
              ...records(data).map(
                (b) => Panel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: b['booking'] != null ? teal : yellow,
                              border: Border.all(color: ink, width: 1.5),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              b['booking'] != null
                                  ? 'CONFIRMED BOOKING'
                                  : 'OWNER BLOCK',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 11,
                              ),
                            ),
                          ),
                          Text(
                            '${b['quantity']} units',
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        '${b['reason'] ?? 'Reserved date range'}',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${b['start'] != null ? DateTime.tryParse('${b['start']}')?.toLocal().toString().split(' ')[0] : ''} → ${b['end'] != null ? DateTime.tryParse('${b['end']}')?.toLocal().toString().split(' ')[0] : ''}',
                        style: const TextStyle(fontSize: 13, color: Colors.black87),
                      ),
                      if (b['booking'] == null) ...[
                        const SizedBox(height: 10),
                        AsyncButton(
                          text: 'Remove block',
                          icon: Icons.delete_outline,
                          run: () async {
                            await widget.session.api.call(
                              '/listings/$selected/availability/${b['_id']}',
                              method: 'DELETE',
                            );
                            await reload();
                            return 'Block removed.';
                          },
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
    ],
  );
}

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key, required this.session, this.filters});
  final Session session;
  final Json? filters;
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  dynamic result;
  Json? filters;
  Future<void> search(Json body) async {
    final data = await widget.session.api.call(
      '/search',
      method: 'POST',
      body: body,
    );
    if (mounted) {
      setState(() {
        result = data;
        filters = body;
      });
    }
  }

  @override
  Widget build(BuildContext context) => PageBody(
    title: 'Find your next possibility.',
    subtitle: 'Search real resources by location, dates and quantities.',
    children: [
      Remote(
        api: widget.session.api,
        path: '/categories',
        builder: (data, _) => Panel(
          child: FieldsForm(
            initial: {
              ...?widget.filters,
              'latitude': widget.filters?['coordinates']?[1],
              'longitude': widget.filters?['coordinates']?[0],
            },
            submit: 'Discover resources →',
            fields: [
              const FieldSpec(
                'query',
                'What are you looking for?',
                required: false,
              ),
              FieldSpec(
                'category',
                'Category',
                required: false,
                options: categoryOptions(data),
              ),
              const FieldSpec('city', 'City', required: false),
              const FieldSpec(
                'latitude',
                'Latitude',
                type: 'number',
                required: false,
                min: -90,
                max: 90,
              ),
              const FieldSpec(
                'longitude',
                'Longitude',
                type: 'number',
                required: false,
                min: -180,
                max: 180,
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
                'quantity',
                'Units needed',
                type: 'number',
                initial: 1,
                min: 1,
              ),
              const FieldSpec(
                'capacity',
                'Capacity per unit',
                type: 'number',
                initial: 1,
                min: 1,
              ),
              const FieldSpec(
                'budget',
                'Maximum rental budget (INR)',
                type: 'number',
                required: false,
                min: 1,
              ),
              const FieldSpec('start', 'Starts', type: 'date', required: false),
              const FieldSpec('end', 'Ends', type: 'date', required: false),
              const FieldSpec('delivery', 'Delivery required', type: 'bool'),
            ],
            onSubmit: (body) async {
              if (body.containsKey('latitude') !=
                  body.containsKey('longitude')) {
                throw const ApiFailure('Supply both coordinates.');
              }
              await search({...locationBody(body), 'page': 1});
              return 'Search complete.';
            },
          ),
        ),
      ),
      if (result != null) ...[
        Text(
          '${result['total'] ?? records(result['items']).length} matching resources',
        ),
        ...records(result['items']).map(
          (l) => ListingCard(
            listing: l,
            actions: [
              FilledButton(
                onPressed: () => openScreen(
                  context,
                  ListingDetail(session: widget.session, listing: l),
                ),
                child: const Text('View resource'),
              ),
              AsyncButton(
                text: 'Save / unsave',
                icon: Icons.favorite_border,
                run: () async {
                  final r = await widget.session.api.call(
                    '/favorites/${l['_id']}',
                    method: 'POST',
                  );
                  return r['saved'] == true ? 'Saved.' : 'Removed from saved.';
                },
              ),
            ],
          ),
        ),
        if (records(result['items']).isEmpty)
          const Empty(text: 'No matches. Adjust your filters and try again.'),
        Wrap(
          spacing: 12,
          children: [
            AsyncButton(
              text: 'Previous page',
              enabled: (filters?['page'] ?? 1) > 1,
              run: () => search({...filters!, 'page': filters!['page'] - 1}),
            ),
            AsyncButton(
              text: 'Next page',
              enabled:
                  (filters?['page'] ?? 1) <
                  ((result['total'] ?? 0) / 24).ceil(),
              run: () => search({...filters!, 'page': filters!['page'] + 1}),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Panel(
          child: FieldsForm(
            submit: 'Save search & alerts',
            fields: const [FieldSpec('name', 'Search name')],
            onSubmit: (b) async {
              await widget.session.api.call(
                '/saved-searches',
                method: 'POST',
                body: {...b, 'filters': filters},
              );
              return 'Search saved.';
            },
          ),
        ),
      ],
    ],
  );
}

class ListingDetail extends StatelessWidget {
  const ListingDetail({
    super.key,
    required this.session,
    required this.listing,
  });
  final Session session;
  final Json listing;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Resource details')),
    body: PageBody(
      title: '${listing['title']}',
      children: [
        Remote(
          api: session.api,
          path: '/listings/${listing['_id']}',
          builder: (data, _) => Column(
            children: [
              ListingCard(listing: Map<String, dynamic>.from(data)),
              Panel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Specifications & Terms',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    for (final spec in [
                      ('Location', '${data['city'] ?? ''}'),
                      ('Price', '₹${data['price']} / ${data['unit']}'),
                      ('Available units', '${data['quantity']} units'),
                      ('Capacity per unit', '${data['capacity']} people'),
                      ('Minimum rental', '${data['minHours'] ?? 1} hours'),
                      ('Security deposit', '₹${data['deposit'] ?? 0}'),
                      (
                        'Delivery',
                        data['delivery'] == true
                            ? 'Offered (₹${data['deliveryFee'] ?? 0})'
                            : 'Not offered',
                      ),
                      (
                        'Cancellation notice',
                        '${data['cancellationHours'] ?? 24} hours',
                      ),
                      if (data['address'] != null)
                        ('Address', '${data['address']}'),
                      if (data['provider'] is Map)
                        (
                          'Provider',
                          '${data['provider']['name']} (${data['provider']['category'] ?? 'Business'})',
                        ),
                    ])
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              spec.$1,
                              style: const TextStyle(
                                color: Colors.black54,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                spec.$2,
                                textAlign: TextAlign.right,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (data['conditions'] != null &&
                        '${data['conditions']}'.isNotEmpty) ...[
                      const Divider(height: 20),
                      const Text(
                        'Rental conditions:',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${data['conditions']}',
                        style: const TextStyle(fontSize: 13),
                      ),
                    ],
                  ],
                ),
              ),

              FilledButton(
                onPressed: () => openScreen(
                  context,
                  RequestEditor(
                    session: session,
                    initial: {
                      'city': data['city'],
                      'coordinates': data['location']['coordinates'],
                      'items': [
                        {
                          'category': data['category'],
                          'quantity': 1,
                          'capacity': data['capacity'],
                          'specs': data['title'],
                        },
                      ],
                    },
                  ),
                ),
                child: const Text('Request this type of resource'),
              ),
              const SizedBox(height: 20),
              Panel(
                child: FieldsForm(
                  submit: 'Report listing',
                  fields: const [
                    FieldSpec(
                      'reason',
                      'Reason for reporting',
                      type: 'multiline',
                    ),
                  ],
                  onSubmit: (b) async {
                    await session.api.call(
                      '/listings/${listing['_id']}/report',
                      method: 'POST',
                      body: b,
                    );
                    return 'Report submitted.';
                  },
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class SavedScreen extends StatelessWidget {
  const SavedScreen({super.key, required this.session});
  final Session session;
  @override
  Widget build(BuildContext context) => PageBody(
    title: 'Keep the good possibilities close.',
    subtitle: 'Compare saved resources and rerun your searches.',
    children: [
      Remote(
        api: session.api,
        path: '/favorites',
        builder: (data, reload) => Column(
          children: [
            if (records(data).isEmpty)
              const Empty(
                text: 'Save resources from Discover to compare them here.',
              ),
            ...records(data).map(
              (l) => ListingCard(
                listing: l,
                actions: [
                  FilledButton(
                    onPressed: () => openScreen(
                      context,
                      ListingDetail(session: session, listing: l),
                    ),
                    child: const Text('Compare details'),
                  ),
                  AsyncButton(
                    text: 'Remove saved',
                    run: () async {
                      await session.api.call(
                        '/favorites/${l['_id']}',
                        method: 'POST',
                      );
                      await reload();
                      return 'Removed.';
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      Remote(
        api: session.api,
        path: '/saved-searches',
        builder: (data, reload) => Column(
          children: [
            ...records(data).map(
              (s) => Panel(
                child: Column(
                  children: [
                    Text(
                      '${s['name']}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    DataView(s['filters']),
                    FilledButton(
                      onPressed: () => openScreen(
                        context,
                        Scaffold(
                          appBar: AppBar(title: Text('${s['name']}')),
                          body: SearchScreen(
                            session: session,
                            filters: Map<String, dynamic>.from(s['filters']),
                          ),
                        ),
                      ),
                      child: const Text('Use these search filters'),
                    ),
                    AsyncButton(
                      text: 'Delete search',
                      run: () async {
                        await session.api.call(
                          '/saved-searches/${s['_id']}',
                          method: 'DELETE',
                        );
                        await reload();
                        return 'Deleted.';
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    ],
  );
}

class ItemsEditor extends StatefulWidget {
  const ItemsEditor({super.key, required this.categories, required this.items, this.planner = false});
  final bool planner;
  final List<Json> categories, items;
  @override
  State<ItemsEditor> createState() => _ItemsEditorState();
}

class _ItemsEditorState extends State<ItemsEditor> {
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      for (final item in widget.items)
        Panel(
          key: ObjectKey(item),
          color: sky,
          child: Column(
            children: [
              DropdownButtonFormField<String>(
                initialValue:
                    categoryOptions(
                      widget.categories,
                    ).containsKey(item['category'])
                    ? item['category']
                    : null,
                decoration: const InputDecoration(
                  labelText: 'Resource category',
                ),
                items: categoryOptions(widget.categories).entries
                    .map(
                      (e) =>
                          DropdownMenuItem(value: e.key, child: Text(e.value)),
                    )
                    .toList(),
                validator: (v) => v == null ? 'Choose a category' : null,
                onChanged: (v) {
                  item['category'] = v;
                  item['label'] = categoryOptions(widget.categories)[v];
                },
              ),
              for (final f in [
                ('quantity', 'Units needed'),
                ('capacity', 'Capacity per unit'),
                ('specs', 'Specifications / compatibility'),
              ])
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: TextFormField(
                    initialValue: '${item[f.$1] ?? (f.$1 == 'specs' ? '' : 1)}',
                    decoration: InputDecoration(labelText: f.$2),
                    keyboardType: f.$1 == 'specs'
                        ? TextInputType.text
                        : TextInputType.number,
                    onChanged: (v) =>
                        item[f.$1] = f.$1 == 'specs' ? v : num.tryParse(v),
                    validator: (v) =>
                        f.$1 != 'specs' && ((int.tryParse(v ?? '') ?? 0) < 1)
                        ? 'Enter a positive whole number'
                        : null,
                  ),
                ),
              if (widget.planner) ...[
                TextFormField(initialValue: item['label'], decoration: const InputDecoration(labelText: 'Resource name'), onChanged: (v) => item['label'] = v),
                const SizedBox(height: 12),
                TextFormField(initialValue: item['query'], decoration: const InputDecoration(labelText: 'Listing title keyword (optional)'), onChanged: (v) => item['query'] = v),
                const SizedBox(height: 12),
                TextFormField(initialValue: jsonEncode(item['attributes'] ?? {}), maxLines: 3, decoration: const InputDecoration(labelText: 'Exact attribute constraints (JSON)'), validator: (v) { try { final decoded = jsonDecode(v ?? '{}'); if (decoded is! Map) return 'Use a JSON object'; for (final value in decoded.values) { if (value is! String && value is! num && value is! bool) return 'Attribute values must be text, numbers or booleans'; } return null; } catch (_) { return 'Enter valid JSON'; } }, onChanged: (v) { try { final decoded = jsonDecode(v); if (decoded is Map) item['attributes'] = decoded; } catch (_) {} }),
                const Text('Missing or mismatched exact attributes exclude a listing. Free-text requirements need provider confirmation.'),
              ],
              if (widget.items.length > 1)
                TextButton.icon(
                  onPressed: () => setState(() => widget.items.remove(item)),
                  icon: const Icon(Icons.remove_circle_outline),
                  label: const Text('Remove item'),
                ),
            ],
          ),
        ),
      if (widget.items.length < 10)
        OutlinedButton.icon(
          onPressed: () => setState(
            () => widget.items.add({'quantity': 1, 'capacity': 1, 'specs': ''}),
          ),
          icon: const Icon(Icons.add),
          label: const Text('Add another resource'),
        ),
    ],
  );
}

class RequestEditor extends StatefulWidget {
  const RequestEditor({super.key, required this.session, this.initial});
  final Session session;
  final Json? initial;
  @override
  State<RequestEditor> createState() => _RequestEditorState();
}

class _RequestEditorState extends State<RequestEditor> {
  late List<Json> items;
  @override
  void initState() {
    super.initState();
    items = records(widget.initial?['items']);
    if (items.isEmpty) items.add({'quantity': 1, 'capacity': 1, 'specs': ''});
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Create requirement')),
    body: PageBody(
      title: 'Tell the market what you need.',
      children: [
        Remote(
          api: widget.session.api,
          path: '/categories',
          builder: (data, _) => Panel(
            child: FieldsForm(
              initial: {
                ...?widget.initial,
                'latitude': widget.initial?['coordinates']?[1],
                'longitude': widget.initial?['coordinates']?[0],
                'city': widget.initial?['city'] ?? widget.session.user?['city'],
              },
              submit: 'Broadcast request →',
              fields: [
                const FieldSpec('title', 'Event / request title'),
                ...locationFields,
                ...rangeFields,
                const FieldSpec(
                  'budget',
                  'Total budget (INR)',
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
                  'urgency',
                  'Priority',
                  options: {
                    'routine': 'Routine',
                    'urgent': 'Urgent',
                    'emergency': 'Emergency',
                  },
                  initial: 'routine',
                ),
                const FieldSpec('delivery', 'Delivery required', type: 'bool'),
              ],
              footer: ItemsEditor(categories: records(data), items: items),
              onSubmit: (input) async {
                await widget.session.api.call(
                  '/requests',
                  method: 'POST',
                  body: {...locationBody(input), 'items': items},
                );
                if (context.mounted) Navigator.pop(context);
                return null;
              },
            ),
          ),
        ),
      ],
    ),
  );
}

class RequestsScreen extends StatelessWidget {
  const RequestsScreen({super.key, required this.session});
  final Session session;
  @override
  Widget build(BuildContext context) => PageBody(
    title: 'Good events start with a clear ask.',
    children: [
      Remote(
        api: session.api,
        path: '/requests',
        builder: (data, reload) => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AsyncButton(
              text: 'Create requirement',
              icon: Icons.add,
              run: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => RequestEditor(session: session),
                  ),
                );
                await reload();
              },
            ),
            const SizedBox(height: 20),
            if (records(data).isEmpty) const Empty(),
            ...records(data).map(
              (r) {
                final items = r['items'] is List ? (r['items'] as List) : [];
                final totalItems = items.isNotEmpty ? items.length : 1;
                final bookedCount = items.where((item) => item is Map && item['booking'] != null).length;
                final progressRatio = bookedCount / totalItems;
                final startDate = r['start'] != null ? DateTime.tryParse('${r['start']}')?.toLocal().toString().split(' ')[0] : null;
                final endDate = r['end'] != null ? DateTime.tryParse('${r['end']}')?.toLocal().toString().split(' ')[0] : null;

                return Panel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              '${r['title']}',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: r['status'] == 'completed' ? teal : yellow,
                              border: Border.all(color: ink, width: 1.5),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${r['status'] ?? 'OPEN'}'.toUpperCase(),
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          if (startDate != null && endDate != null)
                            _specChip('📅 $startDate → $endDate'),
                          if (r['city'] != null)
                            _specChip('📍 ${r['city']}'),
                          if (r['budget'] != null)
                            _specChip('💰 Budget: ₹${r['budget']}'),
                        ],
                      ),
                      const SizedBox(height: 12),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Fulfilment Progress', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.black54)),
                          Text('$bookedCount of $totalItems Secured (${(progressRatio * 100).round()}%)', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: progressRatio,
                          minHeight: 8,
                          backgroundColor: const Color(0xffe5e0cf),
                          valueColor: const AlwaysStoppedAnimation(Color(0xff4ecdc4)),
                        ),
                      ),
                      const SizedBox(height: 12),

                      if (items.isNotEmpty) ...[
                        const Text('Resource Bundle Items', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 8),
                        for (final item in items)
                          Container(
                            margin: const EdgeInsets.only(bottom: 6),
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: item['booking'] != null ? const Color(0xfff0fdf4) : const Color(0xfffffbeb),
                              border: Border.all(
                                color: item['booking'] != null ? const Color(0xff10b981) : const Color(0xfff59e0b),
                                width: 1.2,
                              ),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  item['booking'] != null ? Icons.check_circle : Icons.radio_button_unchecked,
                                  size: 18,
                                  color: item['booking'] != null ? const Color(0xff059669) : const Color(0xffd97706),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    '${item['quantity'] ?? 1} × ${'${item['category']}'.replaceAll('_', ' ')}',
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: item['booking'] != null ? const Color(0xffd1fae5) : const Color(0xfffef3c7),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    item['booking'] != null ? 'Confirmed' : 'Quoting',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: item['booking'] != null ? const Color(0xff065f46) : const Color(0xff92400e),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                      const SizedBox(height: 10),

                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          AsyncButton(
                            text: 'Repeat requirement',
                            icon: Icons.repeat,
                            run: () async {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => RequestEditor(
                                    session: session,
                                    initial: {...r, 'start': '', 'end': ''},
                                  ),
                                ),
                              );
                              await reload();
                            },
                          ),
                          if (r['status'] == 'open')
                            AsyncButton(
                              text: 'Cancel request',
                              icon: Icons.close,
                              run: () async {
                                await session.api.call(
                                  '/requests/${r['_id']}/cancel',
                                  method: 'POST',
                                );
                                await reload();
                                return 'Request cancelled.';
                              },
                            ),
                          AiResultButton(
                            api: session.api,
                            path: '/ai/urgency',
                            body: {'requestId': r['_id']},
                            title: 'Analyze urgency',
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    ],
  );
}

class AiResultButton extends StatefulWidget {
  const AiResultButton({
    super.key,
    required this.api,
    required this.path,
    required this.body,
    required this.title,
  });
  final Api api;
  final String path, title;
  final Json body;
  @override
  State<AiResultButton> createState() => _AiResultButtonState();
}

class _AiResultButtonState extends State<AiResultButton> {
  dynamic result;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      AsyncButton(
        text: widget.title,
        icon: Icons.auto_awesome,
        run: () async {
          final r = await widget.api.call(
            widget.path,
            method: 'POST',
            body: widget.body,
          );
          if (mounted) setState(() => result = r);
          return 'Analysis ready.';
        },
      ),
      if (result != null) Panel(color: lavender, child: DataView(result)),
    ],
  );
}
