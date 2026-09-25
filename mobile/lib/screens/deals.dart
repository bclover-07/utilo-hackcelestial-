import 'dart:async';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../core/api.dart';
import '../ui/widgets.dart';
import '../ui/theme.dart';
import '../services/local_ai.dart';
import 'resources.dart';

Future<void> shareDownload(
  Api api,
  String path,
  String filename,
  String mime,
) async {
  final bytes = await api.bytes(path);
  await SharePlus.instance.share(
    ShareParams(
      files: [XFile.fromData(bytes, mimeType: mime, name: filename)],
      fileNameOverrides: [filename],
    ),
  );
}

class QuotesScreen extends StatelessWidget {
  const QuotesScreen({super.key, required this.session});
  final Session session;
  @override
  Widget build(BuildContext context) => PageBody(
    title: 'Find your middle ground.',
    subtitle: 'Every offer has a version. Every agreement has a record.',
    children: [
      Remote(
        api: session.api,
        path: '/quotes',
        builder: (data, reload) {
          final rows = records(data)
              .where(
                (q) => identity(q[session.mode]['_id']) == session.user?['_id'],
              )
              .toList();
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AsyncButton(
                text: 'Refresh offers',
                run: reload,
                icon: Icons.refresh,
              ),
              if (rows.isEmpty)
                const Empty(
                  text:
                      'No offers in this mode. Create a requirement or publish resources to start.',
                ),
              ...rows.map(
                (q) => Panel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Chip(label: Text('${q['status']}')),
                      Text(
                        identity(q['listing']),
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      Text(identity(q['request'])),
                      Text(
                        '${identity(q['provider'])} ↔ ${identity(q['seeker'])}',
                      ),
                      AsyncButton(
                        text: 'Open conversation',
                        icon: Icons.forum_outlined,
                        run: () async {
                          await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                  QuoteScreen(session: session, id: q['_id']),
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
          );
        },
      ),
    ],
  );
}

class QuoteScreen extends StatefulWidget {
  const QuoteScreen({super.key, required this.session, required this.id});
  final Session session;
  final String id;
  @override
  State<QuoteScreen> createState() => _QuoteScreenState();
}

class _QuoteScreenState extends State<QuoteScreen> {
  Json? proposed;
  dynamic advice;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Quote & conversation')),
    body: PageBody(
      title: 'Find your middle ground.',
      children: [
        Remote(
          api: widget.session.api,
          path: '/quotes',
          builder: (data, reload) {
            final q = records(
              data,
            ).where((q) => q['_id'] == widget.id).firstOrNull;
            if (q == null) return const Empty(text: 'Quote unavailable.');
            final offers = records(q['offers']), last = offers.lastOrNull;
            final mine = last?['by']?['_id'] == widget.session.user?['_id'];
            final open = ['invited', 'offered'].contains(q['status']);
            final canOffer =
                open &&
                (last != null
                    ? !mine
                    : q['provider']['_id'] == widget.session.user?['_id']);
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Panel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        identity(q['listing']),
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      Text(
                        '${identity(q['provider'])} ↔ ${identity(q['seeker'])}',
                      ),
                      Chip(
                        label: Text('${q['status']} • Version ${q['version']}'),
                      ),
                      DataView(q['request']),
                      const Text(
                        'Offer history',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                      if (offers.isEmpty)
                        const Text('The provider can send the first quote.'),
                      ...offers.map(
                        (o) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text('₹${o['price']} • ${identity(o['by'])}'),
                          subtitle: Text('${o['conditions']}\n${o['at']}'),
                        ),
                      ),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          if (open && last != null && !mine)
                            AsyncButton(
                              text: 'Accept & reserve inventory',
                              icon: Icons.handshake_outlined,
                              run: () async {
                                await widget.session.api.call(
                                  '/quotes/${widget.id}/accept',
                                  method: 'POST',
                                  body: {'version': q['version']},
                                );
                                await reload();
                                return 'Booking confirmed.';
                              },
                            ),
                          if (open)
                            AsyncButton(
                              text: 'Decline',
                              run: () async {
                                await widget.session.api.call(
                                  '/quotes/${widget.id}/decline',
                                  method: 'POST',
                                  body: {'version': q['version']},
                                );
                                await reload();
                                return 'Quote declined.';
                              },
                            ),
                          AsyncButton(
                            text: 'Refresh offers',
                            run: reload,
                            icon: Icons.refresh,
                          ),
                        ],
                      ),
                      if (canOffer)
                        Padding(
                          padding: const EdgeInsets.only(top: 20),
                          child: FieldsForm(
                            key: ValueKey('${q['version']}/$proposed'),
                            initial: proposed ?? const {},
                            submit: last == null
                                ? 'Send first quote'
                                : 'Send counter-offer',
                            fields: const [
                              FieldSpec(
                                'price',
                                'Total agreed rental (INR)',
                                type: 'number',
                                min: 1,
                              ),
                              FieldSpec(
                                'conditions',
                                'Conditions & logistics',
                                type: 'multiline',
                                required: false,
                              ),
                            ],
                            onSubmit: (b) async {
                              await widget.session.api.call(
                                '/quotes/${widget.id}/offers',
                                method: 'POST',
                                body: {...b, 'version': q['version']},
                              );
                              proposed = null;
                              await reload();
                              return 'Offer sent.';
                            },
                          ),
                        ),
                    ],
                  ),
                ),
                Panel(
                  color: lavender,
                  child: Column(
                    children: [
                      FieldsForm(
                        submit: 'Ask negotiation copilot',
                        fields: const [
                          FieldSpec(
                            'question',
                            'Your question',
                            type: 'multiline',
                          ),
                        ],
                        onSubmit: (b) async {
                          final r = await widget.session.api.call(
                            '/quotes/${widget.id}/assistant',
                            method: 'POST',
                            body: b,
                          );
                          if (mounted) setState(() => advice = r);
                          return 'Advice ready. You choose what to offer.';
                        },
                      ),
                      if (advice != null) ...[
                        DataView(advice),
                        if (canOffer)
                          ...records(advice['counterOffers']).map(
                            (offer) => OutlinedButton(
                              onPressed: () => setState(
                                () => proposed = {
                                  'price': offer['price'],
                                  'conditions': offer['rationale'],
                                },
                              ),
                              child: Text(
                                'Apply ${offer['label']}: ₹${offer['price']}',
                              ),
                            ),
                          ),
                      ],
                    ],
                  ),
                ),
                MessageThread(session: widget.session, quoteId: widget.id),
                AiResultButton(
                  api: widget.session.api,
                  path: '/ai/sentiment',
                  body: {'quoteId': widget.id},
                  title: 'Analyze conversation tone',
                ),
              ],
            );
          },
        ),
      ],
    ),
  );
}

class MessageThread extends StatefulWidget {
  const MessageThread({
    super.key,
    required this.session,
    required this.quoteId,
  });
  final Session session;
  final String quoteId;
  @override
  State<MessageThread> createState() => _MessageThreadState();
}

class _MessageThreadState extends State<MessageThread> {
  final message = TextEditingController();
  Timer? timer;
  Future<void> Function()? reload;
  @override
  void initState() {
    super.initState();
    timer = Timer.periodic(const Duration(seconds: 15), (_) {
      reload?.call().catchError((Object _) {});
    });
  }

  @override
  void dispose() {
    timer?.cancel();
    message.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Remote(
    api: widget.session.api,
    path: '/quotes/${widget.quoteId}/messages',
    builder: (data, refresh) {
      reload = refresh;
      final messages = records(data);
      return Panel(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Conversation', style: Theme.of(context).textTheme.titleLarge),
            LocalAiPanel(
              api: widget.session.api,
              task: 'summarize',
              source: conversationText(messages),
            ),
            if (messages.isEmpty)
              const Text('Start the conversation with your booking partner.'),
            ...messages.map(
              (m) => Align(
                alignment: m['sender']?['_id'] == widget.session.user?['_id']
                    ? Alignment.centerRight
                    : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: m['sender']?['_id'] == widget.session.user?['_id']
                        ? teal
                        : paper,
                    border: Border.all(color: ink, width: 2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${identity(m['sender'])} • ${m['createdAt']}',
                        style: const TextStyle(fontSize: 11),
                      ),
                      SelectableText('${m['text']}'),
                    ],
                  ),
                ),
              ),
            ),
            TextField(
              controller: message,
              maxLines: 3,
              maxLength: 4000,
              decoration: const InputDecoration(labelText: 'Message'),
            ),
            AsyncButton(
              text: 'Send message',
              icon: Icons.send_outlined,
              run: () async {
                if (message.text.trim().isEmpty) {
                  throw const ApiFailure('Write a message first.');
                }
                await widget.session.api.call(
                  '/quotes/${widget.quoteId}/messages',
                  method: 'POST',
                  body: {'text': message.text},
                );
                message.clear();
                await refresh();
                return 'Message sent.';
              },
            ),
          ],
        ),
      );
    },
  );
}

class BookingsScreen extends StatelessWidget {
  const BookingsScreen({super.key, required this.session});
  final Session session;
  @override
  Widget build(BuildContext context) => PageBody(
    title: 'From agreement to great event.',
    subtitle: 'Track fulfilment, review agreements and keep a record.',
    children: [
      Remote(
        api: session.api,
        path: '/bookings',
        builder: (data, reload) {
          final rows = records(data)
              .where((b) => b[session.mode]?['_id'] == session.user?['_id'])
              .toList();
          return Column(
            children: [
              AsyncButton(
                text: 'Refresh bookings',
                run: reload,
                icon: Icons.refresh,
              ),
              if (rows.isEmpty) const Empty(),
              ...rows.map((b) {
                final provider = b['provider']?['_id'] == session.user?['_id'];
                final start = DateTime.parse(b['start']),
                    end = DateTime.parse(b['end']);
                return Panel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        identity(b['listing']),
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      Chip(label: Text('${b['status']}')),
                      DataView(b),
                      AsyncButton(
                        text: 'Export to calendar',
                        icon: Icons.calendar_month,
                        run: () => shareDownload(
                          session.api,
                          '/bookings/${b['_id']}/calendar',
                          'utlio-booking.ics',
                          'text/calendar',
                        ),
                      ),
                      ExpansionTile(
                        title: const Text('Agreement & offer history'),
                        children: [
                          Remote(
                            api: session.api,
                            path: '/bookings/${b['_id']}/summary',
                            builder: (v, _) => DataView(v),
                          ),
                        ],
                      ),
                      if (provider &&
                          [
                            'confirmed',
                            'in_progress',
                          ].contains(b['status'])) ...[
                        Text(
                          b['status'] == 'confirmed'
                              ? 'Fulfilment can start from ${start.toLocal()}.'
                              : 'Completion available from ${end.toLocal()}.',
                        ),
                        AsyncButton(
                          text: b['status'] == 'confirmed'
                              ? 'Start fulfilment'
                              : 'Mark completed',
                          enabled: b['status'] == 'confirmed'
                              ? !start.isAfter(DateTime.now())
                              : !end.isAfter(DateTime.now()),
                          run: () async {
                            await session.api.call(
                              '/bookings/${b['_id']}/status',
                              method: 'PATCH',
                              body: {
                                'status': b['status'] == 'confirmed'
                                    ? 'in_progress'
                                    : 'completed',
                              },
                            );
                            await reload();
                            return 'Booking updated.';
                          },
                        ),
                      ],
                      if (b['status'] == 'confirmed' &&
                          start.isAfter(DateTime.now()))
                        ExpansionTile(
                          title: const Text('Cancel booking'),
                          children: [
                            FieldsForm(
                              submit: 'Cancel this booking',
                              fields: const [
                                FieldSpec(
                                  'reason',
                                  'Cancellation reason',
                                  type: 'multiline',
                                ),
                              ],
                              onSubmit: (v) async {
                                await session.api.call(
                                  '/bookings/${b['_id']}/status',
                                  method: 'PATCH',
                                  body: {...v, 'status': 'cancelled'},
                                );
                                await reload();
                                return 'Booking cancelled.';
                              },
                            ),
                          ],
                        ),
                      if (b['status'] == 'completed')
                        ExpansionTile(
                          title: const Text('Write a review'),
                          children: [
                            FieldsForm(
                              submit: 'Publish review',
                              fields: const [
                                FieldSpec(
                                  'score',
                                  'Rating',
                                  options: {
                                    '5': '5 — Excellent',
                                    '4': '4 — Good',
                                    '3': '3 — Okay',
                                    '2': '2 — Poor',
                                    '1': '1 — Very poor',
                                  },
                                  initial: '5',
                                ),
                                FieldSpec(
                                  'comment',
                                  'Your experience',
                                  type: 'multiline',
                                ),
                              ],
                              onSubmit: (v) async {
                                await session.api.call(
                                  '/bookings/${b['_id']}/review',
                                  method: 'POST',
                                  body: v,
                                );
                                return 'Review published.';
                              },
                            ),
                          ],
                        ),
                      ExpansionTile(
                        title: const Text('Open a dispute'),
                        children: [
                          FieldsForm(
                            submit: 'Open dispute',
                            fields: const [
                              FieldSpec(
                                'reason',
                                'What happened?',
                                type: 'multiline',
                              ),
                            ],
                            onSubmit: (v) async {
                              await session.api.call(
                                '/bookings/${b['_id']}/dispute',
                                method: 'POST',
                                body: v,
                              );
                              return 'Dispute opened.';
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              }),
            ],
          );
        },
      ),
    ],
  );
}
