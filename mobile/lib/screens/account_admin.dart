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
          if (mounted) setState(() => url = r['url']);
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
                if (mounted) setState(() => document = r['_id']);
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Integration configuration',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const Text(
                    'Configured credentials do not confirm service availability.',
                  ),
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
              if (records(data).isEmpty)
                const Empty(text: 'No records in this queue.'),
              ...records(data).map(
                (v) => Panel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      DataView(v),
                      if (section == 'verifications') ...[
                        if (v['documentId'] != null)
                          DocumentButton(api: api, id: v['documentId']),
                        FieldsForm(
                          submit: 'Save verification decision',
                          fields: const [
                            FieldSpec(
                              'verification',
                              'Decision',
                              options: {
                                'verified': 'Verified',
                                'rejected': 'Rejected',
                              },
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
                              setState(
                                () => evidence = Map<String, dynamic>.from(r),
                              );
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
            const SizedBox(height: 20),
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
                          onPressed: () => setState(() => fields.remove(f)),
                          child: const Text('Remove specification'),
                        ),
                      ],
                    ),
                  ),
                ),
                if (fields.length < 20)
                  OutlinedButton.icon(
                    onPressed: () =>
                        setState(() => fields.add({'type': 'text'})),
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
