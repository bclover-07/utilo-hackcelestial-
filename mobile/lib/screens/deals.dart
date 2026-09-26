import 'dart:async';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../core/api.dart';
import '../ui/widgets.dart';
import '../ui/theme.dart';
import '../services/local_ai.dart';
import 'resources.dart';
import 'video_call.dart';

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



class ZopaDistributionWidget extends StatelessWidget {
  const ZopaDistributionWidget({super.key, required this.zopa});
  final Map<String, dynamic>? zopa;

  @override
  Widget build(BuildContext context) {
    if (zopa == null) return const SizedBox.shrink();
    final minVal = (zopa!['min'] is num) ? (zopa!['min'] as num).toDouble() : 0.0;
    final currentVal = (zopa!['current'] is num) ? (zopa!['current'] as num).toDouble() : 0.0;
    final maxVal = (zopa!['max'] is num) ? (zopa!['max'] as num).toDouble() : 0.0;

    final items = [
      NeoBarItem(
        label: 'Seeker Target',
        value: minVal,
        color: teal,
        valueLabel: money(minVal.toInt()),
      ),
      NeoBarItem(
        label: 'Current Offer',
        value: currentVal,
        color: yellow,
        valueLabel: money(currentVal.toInt()),
      ),
      NeoBarItem(
        label: 'Provider Ask',
        value: maxVal,
        color: pink,
        valueLabel: money(maxVal.toInt()),
      ),
    ];

    return FeatureChartPanel(
      eyebrow: 'BILATERAL ZOPA METRICS',
      title: 'Zone of Possible Agreement Distribution',
      badges: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: yellow,
            border: Border.all(color: ink, width: 1.5),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            'Spread: ${money((maxVal - minVal).abs().toInt())}',
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: ink),
          ),
        ),
      ],
      child: NeoBarChart(
        items: items,
        isHorizontal: true,
        height: 120,
      ),
    );
  }
}

class OfferConvergenceWidget extends StatelessWidget {
  const OfferConvergenceWidget({super.key, required this.offers});
  final List offers;

  @override
  Widget build(BuildContext context) {
    if (offers.length < 2) return const SizedBox.shrink();

    final points = <NeoLinePoint>[];
    for (int i = 0; i < offers.length; i++) {
      final o = offers[i];
      if (o is! Map) continue;
      final price = (o['price'] is num) ? (o['price'] as num).toDouble() : 0.0;
      points.add(NeoLinePoint(xLabel: 'R${i + 1}', yValue: price));
    }

    if (points.length < 2) return const SizedBox.shrink();

    return FeatureChartPanel(
      eyebrow: 'PRICE CONVERGENCE',
      title: 'Offer Trajectory (${offers.length} Rounds)',
      badges: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: mint,
            border: Border.all(color: ink, width: 1.5),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            '${money(offers.first['price'])} → ${money(offers.last['price'])}',
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: ink),
          ),
        ),
      ],
      child: NeoLineChart(
        points: points,
        height: 140,
      ),
    );
  }
}

class ReviewReputationAnalyticsWidget extends StatelessWidget {
  const ReviewReputationAnalyticsWidget({super.key, required this.reviews});
  final List reviews;

  @override
  Widget build(BuildContext context) {
    if (reviews.isEmpty) return const SizedBox.shrink();

    final counts = [0, 0, 0, 0, 0]; // 1★ to 5★
    double totalScore = 0;

    for (final r in reviews) {
      if (r is! Map) continue;
      final score = (r['score'] is num) ? (r['score'] as num).toInt() : 5;
      final clamped = score.clamp(1, 5);
      counts[clamped - 1]++;
      totalScore += score;
    }

    final avg = (totalScore / reviews.length).toStringAsFixed(1);
    final barItems = [
      NeoBarItem(label: '5★', value: counts[4].toDouble(), color: teal, valueLabel: '${counts[4]}'),
      NeoBarItem(label: '4★', value: counts[3].toDouble(), color: mint, valueLabel: '${counts[3]}'),
      NeoBarItem(label: '3★', value: counts[2].toDouble(), color: yellow, valueLabel: '${counts[2]}'),
      NeoBarItem(label: '2★', value: counts[1].toDouble(), color: peach, valueLabel: '${counts[1]}'),
      NeoBarItem(label: '1★', value: counts[0].toDouble(), color: pink, valueLabel: '${counts[0]}'),
    ];

    return FeatureChartPanel(
      eyebrow: 'REPUTATION & INTEGRITY',
      title: 'Reputation Score & Rating Spread',
      badges: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: yellow,
            border: Border.all(color: ink, width: 1.5),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            '★ $avg Avg',
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: ink),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: const Color(0x334ecdc4),
            border: Border.all(color: ink, width: 1.5),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            '${reviews.length} Verified',
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: ink),
          ),
        ),
      ],
      child: NeoBarChart(
        items: barItems,
        height: 120,
      ),
    );
  }
}

class DisputeResolutionAnalyticsWidget extends StatelessWidget {
  const DisputeResolutionAnalyticsWidget({super.key, required this.disputes});
  final List disputes;

  @override
  Widget build(BuildContext context) {
    if (disputes.isEmpty) return const SizedBox.shrink();

    int openCount = 0;
    int resolvedCount = 0;
    int mediationCount = 0;

    for (final d in disputes) {
      if (d is! Map) continue;
      final st = '${d['status'] ?? 'open'}'.toLowerCase();
      if (st == 'resolved') {
        resolvedCount++;
      } else if (st == 'mediation' || st == 'under_review') {
        mediationCount++;
      } else {
        openCount++;
      }
    }

    final donutItems = [
      if (resolvedCount > 0)
        NeoPieItem(label: 'Resolved', value: resolvedCount.toDouble(), color: teal),
      if (mediationCount > 0)
        NeoPieItem(label: 'Mediation', value: mediationCount.toDouble(), color: yellow),
      if (openCount > 0)
        NeoPieItem(label: 'Open Claims', value: openCount.toDouble(), color: pink),
    ];

    return FeatureChartPanel(
      eyebrow: 'ESCROW & RESOLUTION GUARANTEE',
      title: 'Dispute Arbitration Status',
      badges: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: resolvedCount > openCount ? mint : yellow,
            border: Border.all(color: ink, width: 1.5),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            '$resolvedCount Resolved',
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: ink),
          ),
        ),
      ],
      child: NeoDonutChart(
        items: donutItems,
        centerText: '${disputes.length}',
        centerSubtext: 'Claims',
        size: 130,
      ),
    );
  }
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
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Offer history',
                            style: TextStyle(fontWeight: FontWeight.w800),
                          ),
                          if (offers.length >= 2)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: yellow,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: ink, width: 1.2),
                              ),
                              child: Text(
                                '₹${offers.first['price']} → ₹${offers.last['price']}',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900),
                              ),
                            ),
                        ],
                      ),
                      ZopaDistributionWidget(
                        zopa: (q['zopa'] is Map)
                            ? Map<String, dynamic>.from(q['zopa'])
                            : (last != null
                                ? {
                                    'min': ((last['price'] as num) * 0.85).round(),
                                    'current': last['price'],
                                    'max': ((last['price'] as num) * 1.15).round(),
                                  }
                                : null),
                      ),
                      if (offers.length >= 2)
                        OfferConvergenceWidget(offers: offers),
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
                MessageThread(
                  session: widget.session,
                  quoteId: widget.id,
                  partnerName: identity(
                    q['provider']?['_id'] == widget.session.user?['_id']
                        ? q['seeker']
                        : q['provider'],
                  ),
                  listingTitle: identity(q['listing']),
                ),
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
    this.partnerName = 'Peer',
    this.listingTitle = 'Resource Negotiation',
  });
  final Session session;
  final String quoteId;
  final String partnerName;
  final String listingTitle;
  @override
  State<MessageThread> createState() => _MessageThreadState();
}

class _MessageThreadState extends State<MessageThread> {
  final message = TextEditingController();
  Timer? timer;
  Future<void> Function()? reload;
  bool _requestingCall = false;

  @override
  void initState() {
    super.initState();
    timer = Timer.periodic(const Duration(seconds: 10), (_) {
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Conversation', style: Theme.of(context).textTheme.titleLarge),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFA8E6CF),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: ink, width: 1.5),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircleAvatar(radius: 3.5, backgroundColor: Color(0xFF059669)),
                      SizedBox(width: 5),
                      Text('Live Sync', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: ink)),
                    ],
                  ),
                ),
              ],
            ),
            LocalAiPanel(
              api: widget.session.api,
              task: 'summarize',
              source: conversationText(messages),
            ),
            if (messages.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Text('Start the conversation or request a video call with your partner.'),
              ),
            ...messages.map((m) {
              final isMe = m['sender']?['_id'] == widget.session.user?['_id'];
              final isVideo = m['type'] == 'video_call';

              if (isVideo) {
                final vCall = (m['videoCall'] is Map) ? (m['videoCall'] as Map) : {};
                final callStatus = (vCall['status'] ?? 'requested').toString();
                final roomId = (vCall['roomId'] ?? 'room_${widget.quoteId}').toString();
                final callerId = (vCall['caller'] is Map) ? vCall['caller']['_id'] : vCall['caller'];
                final isCaller = callerId == widget.session.user?['_id'] || isMe;
                final durationSecs = vCall['durationSeconds'] ?? 0;

                Color cardBg;
                Color badgeBg;
                String statusLabel;
                IconData statusIcon;

                switch (callStatus) {
                  case 'accepted':
                    cardBg = const Color(0xFFECFDF5);
                    badgeBg = const Color(0xFF10B981);
                    statusLabel = 'ACTIVE VIDEO CALL';
                    statusIcon = Icons.videocam;
                    break;
                  case 'declined':
                    cardBg = const Color(0xFFFEF2F2);
                    badgeBg = const Color(0xFFEF4444);
                    statusLabel = 'CALL DECLINED';
                    statusIcon = Icons.videocam_off;
                    break;
                  case 'ended':
                    cardBg = const Color(0xFFF3F4F6);
                    badgeBg = const Color(0xFF6B7280);
                    statusLabel = durationSecs > 0 ? 'CALL ENDED (${durationSecs}s)' : 'CALL COMPLETED';
                    statusIcon = Icons.call_end;
                    break;
                  default:
                    cardBg = const Color(0xFFFEF9C3);
                    badgeBg = yellow;
                    statusLabel = 'LIVE VIDEO CALL REQUEST';
                    statusIcon = Icons.ring_volume;
                }

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: cardBg,
                    border: Border.all(color: ink, width: 1.5),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: const [BoxShadow(color: ink, offset: Offset(2, 2.5))],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: badgeBg,
                              shape: BoxShape.circle,
                              border: Border.all(color: ink, width: 1.2),
                            ),
                            child: Icon(statusIcon, size: 14, color: badgeBg == const Color(0xFF10B981) || badgeBg == const Color(0xFFEF4444) ? Colors.white : ink),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  statusLabel,
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.5,
                                    color: ink,
                                  ),
                                ),
                                Text(
                                  '${identity(m['sender'])} • ${m['createdAt'] ?? 'Just now'}',
                                  style: const TextStyle(fontSize: 10, color: Colors.black54),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${m['text'] ?? 'Video Call Session'}',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: ink),
                      ),
                      const SizedBox(height: 10),
                      if (callStatus == 'requested') ...[
                        if (!isCaller) ...[
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  icon: const Icon(Icons.call, size: 15, color: Colors.white),
                                  label: const Text(
                                    'Accept Call',
                                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: Colors.white),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF059669),
                                    side: const BorderSide(color: ink, width: 1.5),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                  ),
                                  onPressed: () async {
                                    try {
                                      await widget.session.api.call(
                                        '/quotes/${widget.quoteId}/video-call/respond',
                                        method: 'POST',
                                        body: {
                                          'action': 'accept',
                                          'roomId': roomId,
                                          'messageId': m['_id'],
                                        },
                                      );
                                      if (context.mounted) {
                                        await Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) => VideoCallScreen(
                                              session: widget.session,
                                              quoteId: widget.quoteId,
                                              roomId: roomId,
                                              partnerName: widget.partnerName,
                                              listingTitle: widget.listingTitle,
                                              isInitiator: false,
                                              messageId: m['_id']?.toString(),
                                            ),
                                          ),
                                        );
                                        await refresh();
                                      }
                                    } catch (e) {
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
                                      }
                                    }
                                  },
                                ),
                              ),
                              const SizedBox(width: 8),
                              OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: ink, width: 1.5),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                ),
                                onPressed: () async {
                                  try {
                                    await widget.session.api.call(
                                      '/quotes/${widget.quoteId}/video-call/respond',
                                      method: 'POST',
                                      body: {
                                        'action': 'decline',
                                        'roomId': roomId,
                                        'messageId': m['_id'],
                                      },
                                    );
                                    await refresh();
                                  } catch (e) {
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
                                    }
                                  }
                                },
                                child: const Text('Decline', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: ink)),
                              ),
                            ],
                          ),
                        ] else ...[
                          Row(
                            children: [
                              const Text('Waiting for peer to join...', style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Colors.black54)),
                              const Spacer(),
                              TextButton.icon(
                                icon: const Icon(Icons.open_in_new, size: 14, color: ink),
                                label: const Text('Open Room', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: ink)),
                                onPressed: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => VideoCallScreen(
                                      session: widget.session,
                                      quoteId: widget.quoteId,
                                      roomId: roomId,
                                      partnerName: widget.partnerName,
                                      listingTitle: widget.listingTitle,
                                      isInitiator: true,
                                      messageId: m['_id']?.toString(),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ] else if (callStatus == 'accepted') ...[
                        ElevatedButton.icon(
                          icon: const Icon(Icons.videocam, size: 15, color: ink),
                          label: const Text('Rejoin Video Call', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: ink)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: yellow,
                            side: const BorderSide(color: ink, width: 1.5),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                          ),
                          onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => VideoCallScreen(
                                session: widget.session,
                                quoteId: widget.quoteId,
                                roomId: roomId,
                                partnerName: widget.partnerName,
                                listingTitle: widget.listingTitle,
                                isInitiator: false,
                                messageId: m['_id']?.toString(),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              }

              return Align(
                alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isMe ? teal : paper,
                    border: Border.all(color: ink, width: 1.5),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: const [BoxShadow(color: ink, offset: Offset(1.5, 1.5))],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${identity(m['sender'])} • ${m['createdAt'] ?? ''}',
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.black54),
                      ),
                      const SizedBox(height: 4),
                      SelectableText(
                        '${m['text']}',
                        style: const TextStyle(fontSize: 13, color: ink),
                      ),
                    ],
                  ),
                ),
              );
            }),
            TextField(
              controller: message,
              maxLines: 2,
              maxLength: 4000,
              decoration: const InputDecoration(labelText: 'Write message...'),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: AsyncButton(
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
                ),
                const SizedBox(width: 8),
                InkWell(
                  onTap: _requestingCall
                      ? null
                      : () async {
                          setState(() => _requestingCall = true);
                          try {
                            final res = await widget.session.api.call(
                              '/quotes/${widget.quoteId}/video-call/request',
                              method: 'POST',
                            );
                            final roomId = res is Map ? res['roomId'] as String? : null;
                            final msgId = res is Map ? res['messageId'] as String? : null;
                            await refresh();
                            if (context.mounted && roomId != null) {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => VideoCallScreen(
                                    session: widget.session,
                                    quoteId: widget.quoteId,
                                    roomId: roomId,
                                    partnerName: widget.partnerName,
                                    listingTitle: widget.listingTitle,
                                    isInitiator: true,
                                    messageId: msgId,
                                  ),
                                ),
                              );
                              await refresh();
                            }
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Video call error: $e')),
                              );
                            }
                          } finally {
                            if (mounted) setState(() => _requestingCall = false);
                          }
                        },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    decoration: BoxDecoration(
                      color: lavender,
                      border: Border.all(color: ink, width: 1.5),
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: const [BoxShadow(color: ink, offset: Offset(1.5, 1.5))],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _requestingCall ? Icons.hourglass_top : Icons.videocam_outlined,
                          size: 18,
                          color: ink,
                        ),
                        const SizedBox(width: 6),
                        const Text(
                          'Video Call',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: ink),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
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
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              identity(b['listing']),
                              style: Theme.of(context).textTheme.titleLarge,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: b['status'] == 'completed'
                                  ? teal
                                  : b['status'] == 'in_progress'
                                  ? yellow
                                  : lavender,
                              border: Border.all(color: ink, width: 1.5),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${b['status']}'.toUpperCase(),
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 11,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${identity(b['provider'])} ↔ ${identity(b['seeker'])}',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 14),

                      // 4-Step Visual Stage Indicator
                      Container(
                        padding: const EdgeInsets.symmetric(
                          vertical: 10,
                          horizontal: 8,
                        ),
                        decoration: BoxDecoration(
                          color: card,
                          border: Border.all(color: ink, width: 1.5),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            for (int idx = 0; idx < 4; idx++) ...[
                              if (idx > 0)
                                Expanded(
                                  child: Container(
                                    height: 3,
                                    color: (b['status'] == 'completed' &&
                                                idx <= 2) ||
                                            (b['status'] == 'in_progress' &&
                                                idx <= 1)
                                        ? ink
                                        : Colors.grey.shade300,
                                  ),
                                ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: (idx == 0) ||
                                          (idx == 1 &&
                                              [
                                                'in_progress',
                                                'completed',
                                              ].contains(b['status'])) ||
                                          (idx == 2 &&
                                              b['status'] == 'completed')
                                      ? yellow
                                      : Colors.white,
                                  border: Border.all(color: ink, width: 1.5),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  ['Confirmed', 'Active', 'Done', 'Review'][idx],
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Booking Facts Cards
                      Container(
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
                              children: [
                                const Icon(Icons.calendar_month, size: 16),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    '${start.toLocal().toString().split(' ')[0]} → ${end.toLocal().toString().split(' ')[0]}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.currency_rupee, size: 16),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    'Rental: ₹${b['price']} · ${b['quantity']} units · Deposit: ₹${b['deposit'] ?? 0}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            if (b['logistics'] != null) ...[
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  const Icon(Icons.local_shipping, size: 16),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      'Handover: ${b['logistics']}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                            if (b['conditions'] != null &&
                                '${b['conditions']}'.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text(
                                'Terms: ${b['conditions']}',
                                style: const TextStyle(fontSize: 12),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          AsyncButton(
                            text: 'Export calendar (.ics)',
                            icon: Icons.calendar_month,
                            run: () => shareDownload(
                              session.api,
                              '/bookings/${b['_id']}/calendar',
                              'utlio-booking.ics',
                              'text/calendar',
                            ),
                          ),
                          if (provider &&
                              [
                                'confirmed',
                                'in_progress',
                              ].contains(b['status']))
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
                      ),
                      const SizedBox(height: 8),

                      ExpansionTile(
                        title: const Text('Agreement & offer record'),
                        children: [
                          Remote(
                            api: session.api,
                            path: '/bookings/${b['_id']}/summary',
                            builder: (v, _) => Padding(
                              padding: const EdgeInsets.all(8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (v is Map && v['booking'] != null)
                                    Text(
                                      'Reference: ${v['booking']['_id']}\nCancellation notice: ${v['booking']['cancellationHours'] ?? 24} hours',
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                  const SizedBox(height: 8),
                                  const Text(
                                    'Payments are arranged directly between businesses.',
                                    style: TextStyle(
                                      fontStyle: FontStyle.italic,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
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
                          title: const Text('Leave a review'),
                          children: [
                            FieldsForm(
                              submit: 'Publish review',
                              fields: const [
                                FieldSpec(
                                  'score',
                                  'Rating',
                                  options: {
                                    '5': '5 ★ — Excellent',
                                    '4': '4 ★ — Good',
                                    '3': '3 ★ — Okay',
                                    '2': '2 ★ — Poor',
                                    '1': '1 ★ — Very poor',
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
                      if (b['status'] != 'cancelled')
                        ExpansionTile(
                          title: const Text('Report an issue / Open dispute'),
                          children: [
                            FieldsForm(
                              submit: 'Submit dispute claim',
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
                                return 'Dispute opened. Track it under Disputes & Claims.';
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

class ReviewsScreen extends StatelessWidget {
  const ReviewsScreen({super.key, required this.session});
  final Session session;

  @override
  Widget build(BuildContext context) => PageBody(
    title: 'Trust, earned together.',
    subtitle: 'Reviews come from completed bookings, in both directions.',
    children: [
      Remote(
        api: session.api,
        path: '/reviews',
        builder: (data, reload) {
          final list = records(data);
          final myId = session.user?['_id'];
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  AsyncButton(
                    text: 'Refresh',
                    run: reload,
                    icon: Icons.refresh,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (list.isNotEmpty)
                ReviewReputationAnalyticsWidget(reviews: list),
              if (list.isEmpty)
                const Empty(
                  text:
                      'A reputation starts with a booking. After fulfilment, both businesses can leave a review from the booking page.',
                ),
              ...list.map((r) {
                final fromMe = r['from']?['_id'] == myId;
                final score =
                    (r['score'] is num) ? (r['score'] as num).toInt() : 5;
                return Panel(
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
                              color: fromMe ? yellow : teal,
                              border: Border.all(color: ink, width: 1.5),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              fromMe ? 'GIVEN' : 'RECEIVED',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 11,
                              ),
                            ),
                          ),
                          Row(
                            children: List.generate(
                              5,
                              (i) => Icon(
                                i < score ? Icons.star : Icons.star_border,
                                color: i < score
                                    ? const Color(0xfff59e0b)
                                    : Colors.grey,
                                size: 20,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        '${r['comment'] ?? ''}',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        '${r['from']?['name'] ?? 'User'} → ${r['to']?['name'] ?? 'Partner'} · ${r['createdAt'] != null ? DateTime.tryParse('${r['createdAt']}')?.toLocal().toString().split(' ')[0] ?? '' : ''}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.black87,
                        ),
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

class DisputesScreen extends StatelessWidget {
  const DisputesScreen({super.key, required this.session});
  final Session session;

  @override
  Widget build(BuildContext context) => PageBody(
    title: 'Let\'s work it out.',
    subtitle: 'Booking issues and their resolution history.',
    children: [
      Remote(
        api: session.api,
        path: '/disputes',
        builder: (data, reload) {
          final list = records(data);
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  AsyncButton(
                    text: 'Refresh disputes',
                    run: reload,
                    icon: Icons.refresh,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (list.isNotEmpty)
                DisputeResolutionAnalyticsWidget(disputes: list),
              if (list.isEmpty)
                const Empty(
                  text:
                      'No disputes to track. If an issue arises, open a dispute from the relevant booking.',
                ),
              ...list.map((d) {
                final status = '${d['status'] ?? 'open'}';
                final isResolved = status == 'resolved';
                final statusColor =
                    isResolved ? teal : const Color(0xffff6b6b);
                final bookingId =
                    '${d['booking']?['_id'] ?? d['booking'] ?? ''}';
                return Panel(
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
                              color: statusColor,
                              border: Border.all(color: ink, width: 1.5),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              status.toUpperCase(),
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 11,
                              ),
                            ),
                          ),
                          if (bookingId.isNotEmpty)
                            Text(
                              'Booking ${bookingId.length > 8 ? bookingId.substring(bookingId.length - 8) : bookingId}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Reason: ${d['reason'] ?? 'Not specified'}',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (d['resolution'] != null &&
                          '${d['resolution']}'.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: paper,
                            border: Border.all(color: ink, width: 1.5),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Resolution',
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text('${d['resolution']}'),
                            ],
                          ),
                        ),
                      ],
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

