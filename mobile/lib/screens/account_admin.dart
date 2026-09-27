import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/api.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';
import '../services/local_ai.dart';

class DocumentButton extends StatefulWidget {
  const DocumentButton({super.key, required this.api, required this.id});
  final Api api;
  final String id;
  @override
  State<DocumentButton> createState() => _DocumentButtonState();
}

class _DocumentButtonState extends State<DocumentButton> {
  String? url;
  @override
  Widget build(BuildContext context) => Column(
    children: [
      AsyncButton(
        text: 'Prepare private document link',
        icon: Icons.description_outlined,
        run: () async {
          final r = await widget.api.call('/uploads/${widget.id}/document');
          if (mounted) {
            setState(() {
              url = r['url'];
            });
          }
          return 'Private document link ready.';
        },
      ),
      if (url != null)
        AsyncButton(
          text: 'Open document',
          run: () async {
            if (!await launchUrl(
              Uri.parse(url!),
              mode: LaunchMode.externalApplication,
            )) {
              throw const ApiFailure('Unable to open document.');
            }
            return null;
          },
        ),
    ],
  );
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, required this.session});
  final Session session;
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String? document;
  @override
  void initState() {
    super.initState();
    document = widget.session.user?['documentId'];
  }

  @override
  Widget build(BuildContext context) => PageBody(
    title: 'Your business, introduced.',
    subtitle: 'Keep your contact and verification information current.',
    children: [
      Panel(
        child: FieldsForm(
          initial: widget.session.user!,
          submit: 'Save business profile',
          fields: const [
            FieldSpec('name', 'Business name'),
            FieldSpec('city', 'City'),
            FieldSpec('category', 'Business type'),
            FieldSpec('phone', 'Phone'),
            FieldSpec('address', 'Address', required: false),
            FieldSpec('gstin', 'GSTIN', required: false),
          ],
          onSubmit: (v) async {
            await widget.session.profile({
              ...v,
              if (document != null) 'documentId': document,
            });
            return 'Profile saved.';
          },
        ),
      ),
      Panel(
        color: teal,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Business verification',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            Text('Email: ${widget.session.user?['email']}'),
            Text('Status: ${widget.session.user?['verification']}'),
            if (widget.session.user?['verificationNote'] != null)
              Text('${widget.session.user!['verificationNote']}'),
            const Text(
              'Upload a JPEG, PNG or PDF up to 8 MB, then save your profile.',
            ),
            AsyncButton(
              text: 'Upload verification document',
              icon: Icons.upload_file,
              run: () async {
                final picked = await FilePicker.pickFile(
                  type: FileType.custom,
                  allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
                );
                if (picked == null) return null;
                final f = picked;
                final r = await widget.session.api.upload(
                  await f.readAsBytes(),
                  f.name,
                  'document',
                );
                if (mounted) {
                  setState(() {
                    document = r['_id'];
                  });
                }
                return 'Document uploaded. Save profile to submit it.';
              },
            ),
            if (document != null)
              DocumentButton(
                key: ValueKey(document),
                api: widget.session.api,
                id: document!,
              ),
          ],
        ),
      ),
    ],
  );
}

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({
    super.key,
    required this.session,
    required this.onNavigate,
  });
  final Session session;
  final void Function(String) onNavigate;
  @override
  Widget build(BuildContext context) => PageBody(
    title: 'Good things to know.',
    children: [
      Remote(
        api: session.api,
        path: '/notifications',
        builder: (v, reload) => Column(
          children: [
            AsyncButton(
              text: 'Refresh alerts',
              run: reload,
              icon: Icons.refresh,
            ),
            if (records(v).isEmpty) const Empty(text: 'You are all caught up.'),
            ...records(v).map(
              (n) => Panel(
                color: n['readAt'] != null ? card : yellow,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      '${n['title']}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    Text('${n['body'] ?? n['message'] ?? ''}'),
                    Text('${n['createdAt']}'),
                    if (n['readAt'] == null)
                      AsyncButton(
                        text: 'Mark read',
                        run: () async {
                          await session.api.call(
                            '/notifications/${n['_id']}/read',
                            method: 'PATCH',
                          );
                          await reload();
                          return 'Marked read.';
                        },
                      ),
                    if (n['href'] != null || n['link'] != null)
                      FilledButton(
                        onPressed: () {
                          final uri = Uri.tryParse('${n['href'] ?? n['link']}');
                          if (uri != null &&
                              uri.path.startsWith('/dashboard')) {
                            onNavigate(
                              uri.path.split('/').skip(2).firstOrNull ?? '',
                            );
                          }
                        },
                        child: const Text('Open related page'),
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



class VerificationQueueVisualizerWidget extends StatelessWidget {
  const VerificationQueueVisualizerWidget({super.key, required this.users});
  final List users;

  @override
  Widget build(BuildContext context) {
    if (users.isEmpty) return const SizedBox.shrink();
    int pending = 0;
    int verified = 0;
    int rejected = 0;

    for (final u in users) {
      if (u is! Map) continue;
      final v = '${u['verification'] ?? 'pending'}'.toLowerCase();
      if (v == 'verified' || v == 'approved') {
        verified++;
      } else if (v == 'rejected' || v == 'declined') {
        rejected++;
      } else {
        pending++;
      }
    }

    final donutItems = [
      if (pending > 0)
        NeoPieItem(label: 'Pending KYC', value: pending.toDouble(), color: yellow),
      if (verified > 0)
        NeoPieItem(label: 'Approved', value: verified.toDouble(), color: mint),
      if (rejected > 0)
        NeoPieItem(label: 'Rejected', value: rejected.toDouble(), color: pink),
    ];

    return FeatureChartPanel(
      eyebrow: 'KYC AUDIT PIPELINE',
      title: 'Business Verification Queue Status',
      badges: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: pending > 0 ? yellow : mint,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: ink, width: 1.5),
          ),
          child: Text(
            '$pending Pending Review',
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: ink),
          ),
        ),
      ],
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: yellow,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: ink, width: 1.2),
                  ),
                  child: Column(
                    children: [
                      Text('$pending', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: ink)),
                      const Text('Pending', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: ink)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: mint,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: ink, width: 1.2),
                  ),
                  child: Column(
                    children: [
                      Text('$verified', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: ink)),
                      const Text('Approved', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: ink)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: pink,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: ink, width: 1.2),
                  ),
                  child: Column(
                    children: [
                      Text('$rejected', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: ink)),
                      const Text('Rejected', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: ink)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          if (donutItems.isNotEmpty) ...[
            const SizedBox(height: 12),
            NeoDonutChart(
              items: donutItems,
              centerText: '${users.length}',
              centerSubtext: 'Businesses',
              size: 130,
            ),
          ],
        ],
      ),
    );
  }
}

class DisputeQueueVisualizerWidget extends StatelessWidget {
  const DisputeQueueVisualizerWidget({super.key, required this.disputes});
  final List disputes;

  @override
  Widget build(BuildContext context) {
    if (disputes.isEmpty) return const SizedBox.shrink();
    int openCount = 0;
    int resolvedCount = 0;

    for (final d in disputes) {
      if (d is! Map) continue;
      final status = '${d['status'] ?? 'open'}'.toLowerCase();
      if (status == 'resolved' || d['resolution'] != null) {
        resolvedCount++;
      } else {
        openCount++;
      }
    }

    final chartItems = [
      if (openCount > 0)
        NeoPieItem(label: 'Open Escalations', value: openCount.toDouble(), color: pink),
      if (resolvedCount > 0)
        NeoPieItem(label: 'Settled Incidents', value: resolvedCount.toDouble(), color: mint),
    ];

    final ratio = disputes.isNotEmpty ? ((resolvedCount / disputes.length) * 100).round() : 100;

    return FeatureChartPanel(
      eyebrow: 'ADMIN MEDIATION PIPELINE',
      title: 'Disputes & Incident Resolution Status',
      badges: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: openCount > 0 ? pink : mint,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: ink, width: 1.5),
          ),
          child: Text(
            '$openCount Awaiting Admin Decision',
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: ink),
          ),
        ),
      ],
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: pink,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: ink, width: 1.2),
                  ),
                  child: Column(
                    children: [
                      Text('$openCount', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: ink)),
                      const Text('Open', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: ink)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: mint,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: ink, width: 1.2),
                  ),
                  child: Column(
                    children: [
                      Text('$resolvedCount', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: ink)),
                      const Text('Resolved', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: ink)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: teal,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: ink, width: 1.2),
                  ),
                  child: Column(
                    children: [
                      Text('$ratio%', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: ink)),
                      const Text('Resolution Rate', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: ink)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          if (chartItems.isNotEmpty) ...[
            const SizedBox(height: 12),
            NeoDonutChart(
              items: chartItems,
              centerText: '${disputes.length}',
              centerSubtext: 'Disputes',
              size: 130,
            ),
          ],
        ],
      ),
    );
  }
}

class CategoryTaxonomyVisualizerWidget extends StatelessWidget {
  const CategoryTaxonomyVisualizerWidget({super.key, required this.categories});
  final List categories;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    final barItems = <NeoBarItem>[];
    for (int i = 0; i < categories.length; i++) {
      final c = categories[i];
      if (c is! Map) continue;
      final specsCount = (c['requiredFields'] as List?)?.length ?? 0;
      final name = '${c['name'] ?? 'Category'}';
      final color = i % 2 == 0 ? teal : mint;
      barItems.add(
        NeoBarItem(
          label: name,
          value: specsCount.toDouble(),
          color: color,
          valueLabel: '$specsCount specs',
        ),
      );
    }

    return FeatureChartPanel(
      eyebrow: 'TAXONOMY & ATTRIBUTE COMPLEXITY',
      title: 'Platform Category Specification Blueprint',
      badges: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: yellow,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: ink, width: 1.5),
          ),
          child: Text(
            '${categories.length} Registered Categories',
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: ink),
          ),
        ),
      ],
      child: NeoBarChart(
        items: barItems,
        isHorizontal: true,
        height: (barItems.length * 36.0).clamp(120.0, 260.0),
      ),
    );
  }
}

class IntegrationStatusGridWidget extends StatelessWidget {
  const IntegrationStatusGridWidget({super.key, required this.integrations});
  final Map integrations;

  @override
  Widget build(BuildContext context) {
    if (integrations.isEmpty) return const SizedBox.shrink();
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: integrations.entries.map((e) {
        final key = '${e.key}'.toUpperCase();
        final isActive = e.value == true || (e.value is String && (e.value as String).isNotEmpty);
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: isActive ? mint : paper,
            border: Border.all(color: ink, width: 1.5),
            borderRadius: BorderRadius.circular(10),
            boxShadow: const [
              BoxShadow(color: ink, offset: Offset(2, 2)),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isActive ? const Color(0xff059669) : const Color(0xff9ca3af),
                  border: Border.all(color: ink, width: 1),
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    key,
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11),
                  ),
                  Text(
                    isActive ? 'Active' : 'Unset',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: isActive ? const Color(0xff065f46) : Colors.black54,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key, required this.session, required this.section});
  final Session session;
  final String section;
  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  Json? evidence;
  @override
  Widget build(BuildContext context) {
    final api = widget.session.api;
    final section = widget.section;
    if (section == 'categories') return CategoriesScreen(api: api);
    if (section == 'settings') {
      return PageBody(
        title: 'The rules behind the exchange.',
        children: [
          Remote(
            api: api,
            path: '/admin/settings',
            builder: (v, reload) => Panel(
              child: FieldsForm(
                initial: v == null ? {} : Map<String, dynamic>.from(v),
                submit: 'Save platform policy',
                fields: const [
                  FieldSpec(
                    'commissionPercent',
                    'Commission rate (%)',
                    type: 'number',
                    min: 0,
                    max: 30,
                  ),
                  FieldSpec(
                    'minBookingValue',
                    'Minimum booking value (INR)',
                    type: 'number',
                    min: 0,
                  ),
                ],
                onSubmit: (b) async {
                  await api.call('/admin/settings', method: 'PUT', body: b);
                  await reload();
                  return 'Policy saved.';
                },
              ),
            ),
          ),
          Remote(
            api: api,
            path: '/admin/integrations',
            builder: (v, _) => Panel(
              color: sky,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Services & APIs Integration Status',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Configured service credentials and real-time backend readiness.',
                    style: TextStyle(fontSize: 12, color: Colors.black87),
                  ),
                  const SizedBox(height: 14),
                  if (v is Map)
                    IntegrationStatusGridWidget(integrations: v)
                  else
                    DataView(v),
                ],
              ),
            ),
          ),
          Remote(
            api: api,
            path: '/admin/audit',
            builder: (v, _) => Panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Administrative audit log',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  DataView(v),
                ],
              ),
            ),
          ),
        ],
      );
    }
    return PageBody(
      title: section == 'verifications'
          ? 'Trust starts with the details.'
          : section == 'disputes'
          ? 'Resolve with the whole story.'
          : 'Keep the exchange useful.',
      children: [
        Remote(
          api: api,
          path: section == 'moderation' ? '/admin/reports' : '/admin/$section',
          builder: (data, reload) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AsyncButton(
                text: 'Refresh queue',
                run: reload,
                icon: Icons.refresh,
              ),
              if (section == 'verifications' && records(data).isNotEmpty)
                VerificationQueueVisualizerWidget(users: records(data)),
              if (section == 'disputes' && records(data).isNotEmpty)
                DisputeQueueVisualizerWidget(disputes: records(data)),
              if (records(data).isEmpty)
                const Empty(text: 'No records in this queue.'),
              ...records(data).map(
                (v) => Panel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      DataView(v),
                      if (section == 'verifications') ...[
                        // Option A: Automated GSTIN Lookup
                        Container(
                          margin: const EdgeInsets.symmetric(vertical: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: paper,
                            border: Border.all(color: ink, width: 1.5),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'OPTION A: AUTOMATED GSTIN API',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w900,
                                      fontSize: 11,
                                      color: Color(0xff0f766e),
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  if (v['gstinData'] != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: mint,
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: ink, width: 1),
                                      ),
                                      child: const Text(
                                        '● Registry Validated',
                                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800),
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              if (v['gstinData'] is Map)
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  margin: const EdgeInsets.only(bottom: 8),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    border: Border.all(color: const Color(0xffe5e0cf)),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Legal: ${v['gstinData']['legalName'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                                      Text('Trade: ${v['gstinData']['tradeName'] ?? ''}', style: const TextStyle(fontSize: 12)),
                                      Text('State: ${v['gstinData']['state'] ?? ''} · Status: ${v['gstinData']['status'] ?? ''}', style: const TextStyle(fontSize: 11, color: Colors.black87)),
                                    ],
                                  ),
                                )
                              else
                                Text(
                                  v['gstin'] != null && '${v['gstin']}'.isNotEmpty
                                      ? 'GSTIN supplied: ${v['gstin']}. Ready for automated lookup.'
                                      : 'No GSTIN supplied yet.',
                                  style: const TextStyle(fontSize: 12, color: Colors.black54),
                                ),
                              const SizedBox(height: 6),
                              AsyncButton(
                                text: '⚡ Run Automated GSTIN Verification',
                                enabled: v['gstin'] != null && '${v['gstin']}'.isNotEmpty,
                                run: () async {
                                  await api.call(
                                    '/admin/verifications/${v['_id']}/auto-gstin',
                                    method: 'POST',
                                    body: {'gstin': v['gstin']},
                                  );
                                  await reload();
                                  return 'GSTIN verification executed.';
                                },
                              ),
                            ],
                          ),
                        ),

                        // Option B: Manual Document Inspection
                        if (v['documentId'] != null) ...[
                          Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: lavender,
                              border: Border.all(color: ink, width: 1.5),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'OPTION B: MANUAL COMPLIANCE DOCUMENT',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 11,
                                    color: Color(0xff553c9a),
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                DocumentButton(api: api, id: v['documentId']),
                              ],
                            ),
                          ),
                        ],

                        FieldsForm(
                          submit: 'Save verification decision',
                          fields: const [
                            FieldSpec(
                              'verification',
                              'Decision',
                              options: {
                                'verified': 'Verified / Approved',
                                'rejected': 'Rejected',
                              },
                            ),
                            FieldSpec(
                              'verificationMethod',
                              'Verification method',
                              options: {
                                'automated_gstin': 'Automated GSTIN Registry',
                                'manual_document': 'Manual Document Inspection',
                                'hybrid': 'Hybrid (Both Automated + Manual)',
                              },
                              initial: 'automated_gstin',
                            ),
                            FieldSpec(
                              'verificationNote',
                              'Review note',
                              type: 'multiline',
                            ),
                          ],
                          onSubmit: (b) async {
                            await api.call(
                              '/admin/verifications/${v['_id']}',
                              method: 'PATCH',
                              body: b,
                            );
                            await reload();
                            return 'Verification decision saved.';
                          },
                        ),
                      ],
                      if (section == 'disputes') ...[
                        AsyncButton(
                          text: 'Review agreement & conversation',
                          icon: Icons.forum_outlined,
                          run: () async {
                            final r = await api.call(
                              '/admin/disputes/${v['_id']}',
                            );
                            if (mounted) {
                              setState(() {
                                evidence = Map<String, dynamic>.from(r);
                              });
                            }
                            return 'Evidence loaded below the queue.';
                          },
                        ),
                        if (v['status'] == 'open')
                          FieldsForm(
                            submit: 'Resolve dispute',
                            fields: const [
                              FieldSpec(
                                'resolution',
                                'Resolution & next steps',
                                type: 'multiline',
                              ),
                            ],
                            onSubmit: (b) async {
                              await api.call(
                                '/admin/disputes/${v['_id']}/resolve',
                                method: 'POST',
                                body: b,
                              );
                              await reload();
                              return 'Dispute resolved.';
                            },
                          ),
                      ],
                      if (section == 'moderation') ...[
                        if (v['status'] == 'open')
                          FieldsForm(
                            submit: 'Apply moderation decision',
                            fields: const [
                              FieldSpec(
                                'resolution',
                                'Decision notes',
                                type: 'multiline',
                              ),
                              FieldSpec(
                                'pause',
                                'Pause listing & hold publication',
                                type: 'bool',
                              ),
                            ],
                            onSubmit: (b) async {
                              await api.call(
                                '/admin/reports/${v['_id']}/resolve',
                                method: 'POST',
                                body: b,
                              );
                              await reload();
                              return 'Decision applied.';
                            },
                          ),
                        if (v['listing']?['moderationHold'] == true)
                          FieldsForm(
                            submit: 'Release publication hold',
                            fields: const [
                              FieldSpec(
                                'reason',
                                'Reason for releasing hold',
                                type: 'multiline',
                              ),
                            ],
                            onSubmit: (b) async {
                              await api.call(
                                '/admin/listings/${v['listing']['_id']}/release',
                                method: 'POST',
                                body: b,
                              );
                              await reload();
                              return 'Publication hold released.';
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
        if (evidence != null)
          Panel(
            color: lavender,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Dispute evidence • ${evidence!['dispute']['_id']}',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                DataView(evidence!['booking']),
                DataView(evidence!['quote']),
                LocalAiPanel(
                  key: ValueKey(evidence!['dispute']['_id']),
                  api: api,
                  task: 'summarize',
                  source: conversationText(records(evidence!['messages'])),
                ),
                ...records(evidence!['messages']).map(
                  (m) => ListTile(
                    title: Text('${m['text']}'),
                    subtitle: Text(
                      '${identity(m['sender'])} • ${m['createdAt']}',
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class CategoriesScreen extends StatelessWidget {
  const CategoriesScreen({super.key, required this.api});
  final Api api;
  @override
  Widget build(BuildContext context) => PageBody(
    title: 'Make the marketplace make sense.',
    children: [
      Remote(
        api: api,
        path: '/categories',
        builder: (v, reload) => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AsyncButton(
              text: 'Create category',
              icon: Icons.add,
              run: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => CategoryEditor(api: api)),
                );
                await reload();
              },
            ),
            const SizedBox(height: 16),
            if (records(v).isNotEmpty)
              CategoryTaxonomyVisualizerWidget(categories: records(v)),
            const SizedBox(height: 16),
            ...records(v).map(
              (c) => Panel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      '${c['name']}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    DataView(c),
                    AsyncButton(
                      text: 'Edit category',
                      icon: Icons.edit_outlined,
                      run: () async {
                        await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) =>
                                CategoryEditor(api: api, initial: c),
                          ),
                        );
                        await reload();
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

class CategoryEditor extends StatefulWidget {
  const CategoryEditor({super.key, required this.api, this.initial});
  final Api api;
  final Json? initial;
  @override
  State<CategoryEditor> createState() => _CategoryEditorState();
}

class _CategoryEditorState extends State<CategoryEditor> {
  late List<Json> fields;
  @override
  void initState() {
    super.initState();
    fields = records(widget.initial?['requiredFields']);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Category taxonomy')),
    body: PageBody(
      title: widget.initial == null
          ? 'Create a resource category.'
          : 'Edit category.',
      children: [
        Panel(
          child: FieldsForm(
            initial: widget.initial ?? {},
            submit: 'Save category',
            fields: const [
              FieldSpec('name', 'Name'),
              FieldSpec('slug', 'Stable slug'),
              FieldSpec(
                'color',
                'Category color (#RRGGBB)',
                initial: '#79d9c5',
              ),
            ],
            footer: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Required specifications'),
                ...fields.map(
                  (f) => Panel(
                    key: ObjectKey(f),
                    color: sky,
                    child: Column(
                      children: [
                        for (final entry in [
                          ('label', 'Field label'),
                          ('key', 'Stable field key'),
                        ])
                          Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: TextFormField(
                              initialValue: f[entry.$1],
                              decoration: InputDecoration(labelText: entry.$2),
                              validator: (v) =>
                                  v == null || v.isEmpty ? 'Required' : null,
                              onChanged: (v) => f[entry.$1] = v,
                            ),
                          ),
                        DropdownButtonFormField<String>(
                          initialValue: f['type'] ?? 'text',
                          decoration: const InputDecoration(
                            labelText: 'Answer type',
                          ),
                          items: ['text', 'number', 'boolean']
                              .map(
                                (v) =>
                                    DropdownMenuItem(value: v, child: Text(v)),
                              )
                              .toList(),
                          onChanged: (v) => f['type'] = v,
                        ),
                        TextButton(
                          onPressed: () {
                            setState(() {
                              fields.remove(f);
                            });
                          },
                          child: const Text('Remove specification'),
                        ),
                      ],
                    ),
                  ),
                ),
                if (fields.length < 20)
                  OutlinedButton.icon(
                    onPressed: () {
                      setState(() {
                        fields.add({'type': 'text'});
                      });
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('Add specification'),
                  ),
                const SizedBox(height: 18),
              ],
            ),
            onSubmit: (b) async {
              await widget.api.call(
                widget.initial == null
                    ? '/admin/categories'
                    : '/admin/categories/${widget.initial!['_id']}',
                method: widget.initial == null ? 'POST' : 'PUT',
                body: {...b, 'requiredFields': fields},
              );
              if (context.mounted) Navigator.pop(context);
              return null;
            },
          ),
        ),
      ],
    ),
  );
}
