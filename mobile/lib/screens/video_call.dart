import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/api.dart';
import '../ui/theme.dart';

class VideoCallScreen extends StatefulWidget {
  const VideoCallScreen({
    super.key,
    required this.session,
    required this.quoteId,
    required this.roomId,
    required this.partnerName,
    this.partnerRole = 'Provider',
    this.listingTitle = 'Asset Negotiation',
    this.isInitiator = false,
    this.messageId,
  });

  final Session session;
  final String quoteId;
  final String roomId;
  final String partnerName;
  final String partnerRole;
  final String listingTitle;
  final bool isInitiator;
  final String? messageId;

  @override
  State<VideoCallScreen> createState() => _VideoCallScreenState();
}

class _VideoCallScreenState extends State<VideoCallScreen> with TickerProviderStateMixin {
  late String _callState; // 'calling', 'connecting', 'connected', 'declined', 'timeout', 'ended'
  int _duration = 0;
  int _callingSeconds = 0;
  bool _audioMuted = false;
  bool _videoOff = false;
  bool _isFrontCamera = true;
  bool _speakerOn = true;

  Timer? _durationTimer;
  Timer? _statusPollingTimer;
  Timer? _callingTimeoutTimer;

  late AnimationController _pulseController;
  late AnimationController _waveController;

  final TextEditingController _inCallTextController = TextEditingController();
  List<dynamic> _inCallMessages = [];
  bool _sendingInCallMsg = false;

  @override
  void initState() {
    super.initState();
    _callState = widget.isInitiator ? 'calling' : 'connected';

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1300),
    )..repeat(reverse: true);

    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat();

    if (_callState == 'connected') {
      _startConnectedTimers();
    } else {
      _startCallingTimers();
    }
  }

  void _startConnectedTimers() {
    _durationTimer?.cancel();
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {
          _duration++;
        });
      }
    });

    // When connected, poll call status every 3 seconds to detect if remote peer hangs up
    _statusPollingTimer?.cancel();
    _statusPollingTimer = Timer.periodic(const Duration(seconds: 3), (_) => _checkCallStatus());
  }

  void _startCallingTimers() {
    _callingSeconds = 0;
    // Calling timeout timer: after 45s, auto-cancel if peer hasn't answered
    _callingTimeoutTimer?.cancel();
    _callingTimeoutTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _callingSeconds++;
      });
      if (_callingSeconds >= 45 && _callState == 'calling') {
        _handleCallingTimeout();
      }
    });

    // Fast polling in calling state (every 1.5s) to detect peer acceptance immediately
    _statusPollingTimer?.cancel();
    _statusPollingTimer = Timer.periodic(const Duration(milliseconds: 1500), (_) => _checkCallStatus());
  }

  Future<void> _handleCallingTimeout() async {
    _statusPollingTimer?.cancel();
    _callingTimeoutTimer?.cancel();
    if (!mounted) return;
    setState(() {
      _callState = 'timeout';
    });

    try {
      await widget.session.api.call(
        '/quotes/${widget.quoteId}/video-call/end',
        method: 'POST',
        body: {
          'roomId': widget.roomId,
          'messageId': widget.messageId,
          'durationSeconds': 0,
          'reason': 'timeout',
        },
      );
    } catch (_) {}

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) Navigator.pop(context);
    });
  }

  Future<void> _checkCallStatus() async {
    try {
      final res = await widget.session.api.call('/quotes/${widget.quoteId}/messages');
      if (res is List) {
        _inCallMessages = res;
        final vCallMsg = res.lastWhere(
          (m) => m is Map && m['type'] == 'video_call' && m['videoCall']?['roomId'] == widget.roomId,
          orElse: () => null,
        );
        if (vCallMsg != null && vCallMsg is Map) {
          final status = vCallMsg['videoCall']?['status'];
          if (status == 'accepted' && _callState != 'connected') {
            _callingTimeoutTimer?.cancel();
            if (mounted) {
              setState(() {
                _callState = 'connected';
              });
              _startConnectedTimers();
            }
          } else if (status == 'declined' && _callState != 'declined') {
            _statusPollingTimer?.cancel();
            _callingTimeoutTimer?.cancel();
            _durationTimer?.cancel();
            if (mounted) {
              setState(() {
                _callState = 'declined';
              });
            }
            Future.delayed(const Duration(seconds: 2), () {
              if (mounted) Navigator.pop(context);
            });
          } else if (status == 'ended' && _callState != 'ended') {
            _statusPollingTimer?.cancel();
            _callingTimeoutTimer?.cancel();
            _durationTimer?.cancel();
            if (mounted) {
              setState(() {
                _callState = 'ended';
              });
            }
            Future.delayed(const Duration(seconds: 2), () {
              if (mounted) Navigator.pop(context);
            });
          }
        }
      }
    } catch (_) {}
  }

  Future<void> _endCall() async {
    _durationTimer?.cancel();
    _statusPollingTimer?.cancel();
    _callingTimeoutTimer?.cancel();
    setState(() {
      _callState = 'ended';
    });

    try {
      await widget.session.api.call(
        '/quotes/${widget.quoteId}/video-call/end',
        method: 'POST',
        body: {
          'roomId': widget.roomId,
          'messageId': widget.messageId,
          'durationSeconds': _duration,
        },
      );
    } catch (_) {}

    if (mounted) {
      Navigator.pop(context);
    }
  }

  String _formatDuration(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  void _showInCallChat() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xff1a1d18),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        side: BorderSide(color: Color(0xff2d312c), width: 1.5),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final myId = widget.session.user?['_id']?.toString();
            final chatList = _inCallMessages
                .where((m) => m is Map && m['type'] != 'video_call')
                .toList();

            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
                left: 16,
                right: 16,
                top: 16,
              ),
              child: SizedBox(
                height: 420,
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.chat_bubble_outline, color: yellow, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'In-Call Chat with ${widget.partnerName}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 15,
                              ),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white70),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const Divider(color: Color(0xff2d312c)),
                    Expanded(
                      child: chatList.isEmpty
                          ? const Center(
                              child: Text(
                                'No text messages yet. Send a quick note below.',
                                style: TextStyle(color: Colors.white54, fontSize: 12),
                              ),
                            )
                          : ListView.builder(
                              itemCount: chatList.length,
                              itemBuilder: (context, i) {
                                final msg = chatList[i] as Map;
                                final sender = msg['sender'];
                                final senderId = (sender is Map) ? sender['_id']?.toString() : sender?.toString();
                                final isMe = senderId != null && myId != null && senderId == myId;

                                return Align(
                                  alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                                  child: Container(
                                    margin: const EdgeInsets.symmetric(vertical: 4),
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: isMe ? teal : const Color(0xff2a2e28),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(color: ink, width: 1.2),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          msg['text']?.toString() ?? '',
                                          style: TextStyle(
                                            color: isMe ? ink : Colors.white,
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _inCallTextController,
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              hintText: 'Type quick message...',
                              hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
                              filled: true,
                              fillColor: const Color(0xff222620),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(color: Color(0xff3a3f36)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(color: Color(0xff3a3f36)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(color: yellow, width: 1.5),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton.filled(
                          icon: _sendingInCallMsg
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: ink),
                                )
                              : const Icon(Icons.send, size: 18),
                          style: IconButton.styleFrom(
                            backgroundColor: yellow,
                            foregroundColor: ink,
                            side: const BorderSide(color: ink, width: 1.5),
                          ),
                          onPressed: _sendingInCallMsg
                              ? null
                              : () async {
                                  final txt = _inCallTextController.text.trim();
                                  if (txt.isEmpty) return;
                                  _inCallTextController.clear();
                                  setModalState(() => _sendingInCallMsg = true);
                                  try {
                                    await widget.session.api.call(
                                      '/quotes/${widget.quoteId}/messages',
                                      method: 'POST',
                                      body: {'text': txt},
                                    );
                                    await _checkCallStatus();
                                    if (mounted) setModalState(() {});
                                  } catch (_) {}
                                  if (mounted) setModalState(() => _sendingInCallMsg = false);
                                },
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  void dispose() {
    _durationTimer?.cancel();
    _statusPollingTimer?.cancel();
    _callingTimeoutTimer?.cancel();
    _pulseController.dispose();
    _waveController.dispose();
    _inCallTextController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xff10120e),
      body: SafeArea(
        child: Column(
          children: [
            // Top Header Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                color: Color(0xff1a1d18),
                border: Border(bottom: BorderSide(color: Color(0xff2d312c), width: 1.5)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 19,
                    backgroundColor: yellow,
                    child: Text(
                      widget.partnerName.isNotEmpty ? widget.partnerName[0].toUpperCase() : 'P',
                      style: const TextStyle(fontWeight: FontWeight.w900, color: ink, fontSize: 16),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              widget.partnerName,
                              style: const TextStyle(fontWeight: FontWeight.w800, color: Colors.white, fontSize: 15),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: teal,
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(color: ink, width: 1),
                              ),
                              child: Text(
                                widget.partnerRole,
                                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: ink),
                              ),
                            ),
                          ],
                        ),
                        Text(
                          widget.listingTitle,
                          style: const TextStyle(color: Colors.white70, fontSize: 11),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  if (_callState == 'connected') ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xff059669).withValues(alpha: 0.25),
                        border: Border.all(color: const Color(0xff10b981), width: 1.2),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const CircleAvatar(radius: 3.5, backgroundColor: Color(0xff10b981)),
                          const SizedBox(width: 6),
                          Text(
                            'LIVE ${_formatDuration(_duration)}',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xff34d399)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  // Quick Chat Toggle
                  IconButton(
                    onPressed: _showInCallChat,
                    icon: const Icon(Icons.chat_bubble_outline, color: Colors.white, size: 20),
                    style: IconButton.styleFrom(
                      backgroundColor: const Color(0xff2a2e28),
                      side: const BorderSide(color: Color(0xff3f453c), width: 1.2),
                    ),
                    tooltip: 'In-call chat',
                  ),
                ],
              ),
            ),

            // Video Stage
            Expanded(
              child: Stack(
                children: [
                  // Main Stage Center View
                  Center(
                    child: _callState == 'connected'
                        ? Container(
                            margin: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xff1e221b),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xff374151), width: 1.5),
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  const Color(0xff22281f),
                                  const Color(0xff141712),
                                ],
                              ),
                            ),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    CircleAvatar(
                                      radius: 48,
                                      backgroundColor: yellow,
                                      child: Text(
                                        widget.partnerName.isNotEmpty ? widget.partnerName[0].toUpperCase() : 'P',
                                        style: const TextStyle(fontSize: 38, fontWeight: FontWeight.w900, color: ink),
                                      ),
                                    ),
                                    const SizedBox(height: 14),
                                    Text(
                                      widget.partnerName,
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18),
                                    ),
                                    const SizedBox(height: 10),
                                    // Animated Voice Waveform
                                    AnimatedBuilder(
                                      animation: _waveController,
                                      builder: (context, _) {
                                        return Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: List.generate(7, (i) {
                                            final wave = math.sin((_waveController.value * 2 * math.pi) + (i * 0.8));
                                            final height = 8.0 + (wave.abs() * 18.0);
                                            return Container(
                                              width: 3.5,
                                              height: height,
                                              margin: const EdgeInsets.symmetric(horizontal: 2.5),
                                              decoration: BoxDecoration(
                                                color: const Color(0xff10b981),
                                                borderRadius: BorderRadius.circular(2),
                                              ),
                                            );
                                          }),
                                        );
                                      },
                                    ),
                                    const SizedBox(height: 14),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xff064e3b).withValues(alpha: 0.6),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: const Color(0xff10b981), width: 1),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.lock_outline, size: 12, color: Color(0xff34d399)),
                                          SizedBox(width: 5),
                                          Text(
                                            'P2P WebRTC Direct Tunnel • Active Audio',
                                            style: TextStyle(color: Color(0xff34d399), fontSize: 11, fontWeight: FontWeight.w700),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          )
                        : _callState == 'calling'
                            ? Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  AnimatedBuilder(
                                    animation: _pulseController,
                                    builder: (context, child) {
                                      return Transform.scale(
                                        scale: 1.0 + (_pulseController.value * 0.12),
                                        child: Container(
                                          padding: const EdgeInsets.all(22),
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: yellow,
                                            border: Border.all(color: ink, width: 2),
                                            boxShadow: [
                                              BoxShadow(
                                                color: yellow.withValues(alpha: 0.4),
                                                blurRadius: 20,
                                                spreadRadius: 8,
                                              ),
                                            ],
                                          ),
                                          child: const Icon(Icons.ring_volume, size: 44, color: ink),
                                        ),
                                      );
                                    },
                                  ),
                                  const SizedBox(height: 22),
                                  Text(
                                    'Calling ${widget.partnerName}...',
                                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    'Waiting for response • ${45 - _callingSeconds}s timeout',
                                    style: const TextStyle(fontSize: 13, color: Colors.white70),
                                  ),
                                ],
                              )
                            : _callState == 'declined'
                                ? Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(20),
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: const Color(0xfff58e7e),
                                          border: Border.all(color: ink, width: 2),
                                        ),
                                        child: const Icon(Icons.call_end, size: 40, color: ink),
                                      ),
                                      const SizedBox(height: 18),
                                      const Text(
                                        'Call Declined',
                                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xfff58e7e)),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        '${widget.partnerName} declined the call. Leaving room...',
                                        style: const TextStyle(fontSize: 13, color: Colors.white70),
                                      ),
                                    ],
                                  )
                                : _callState == 'timeout'
                                    ? Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(20),
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: yellow,
                                              border: Border.all(color: ink, width: 2),
                                            ),
                                            child: const Icon(Icons.phone_missed, size: 40, color: ink),
                                          ),
                                          const SizedBox(height: 18),
                                          const Text(
                                            'No Answer',
                                            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white),
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            '${widget.partnerName} did not answer in time.',
                                            style: const TextStyle(fontSize: 13, color: Colors.white70),
                                          ),
                                        ],
                                      )
                                    : Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          const Icon(Icons.phone_disabled, size: 48, color: Colors.white54),
                                          const SizedBox(height: 14),
                                          const Text(
                                            'Call Ended',
                                            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white),
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            'Total duration: ${_formatDuration(_duration)}',
                                            style: const TextStyle(fontSize: 13, color: Colors.white60),
                                          ),
                                        ],
                                      ),
                  ),

                  // Picture-In-Picture Self Camera Window
                  Positioned(
                    bottom: 20,
                    right: 20,
                    child: Container(
                      width: 110,
                      height: 150,
                      decoration: BoxDecoration(
                        color: const Color(0xff1e211c),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: yellow, width: 1.5),
                        boxShadow: const [BoxShadow(color: ink, offset: Offset(2, 2))],
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          if (_videoOff)
                            const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.videocam_off, size: 28, color: Colors.white54),
                                SizedBox(height: 4),
                                Text('Camera off', style: TextStyle(color: Colors.white54, fontSize: 10)),
                              ],
                            )
                          else
                            Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(12),
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    teal.withValues(alpha: 0.45),
                                    const Color(0xff171915),
                                  ],
                                ),
                              ),
                              child: Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      _isFrontCamera ? Icons.face : Icons.camera_rear,
                                      size: 26,
                                      color: Colors.white70,
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      _isFrontCamera ? 'Front Cam' : 'Back Cam',
                                      style: const TextStyle(fontSize: 10, color: Colors.white70, fontWeight: FontWeight.w700),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          Positioned(
                            bottom: 6,
                            left: 8,
                            child: Row(
                              children: [
                                Text(
                                  _audioMuted ? 'Muted 🔇' : 'Live 🎙️',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: _audioMuted ? const Color(0xfff58e7e) : const Color(0xff34d399),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Bottom Control Dock
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: const BoxDecoration(
                color: Color(0xff1a1d18),
                border: Border(top: BorderSide(color: Color(0xff2d312c), width: 1.5)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  // Microphone Toggle
                  IconButton.filled(
                    onPressed: () {
                      setState(() {
                        _audioMuted = !_audioMuted;
                      });
                    },
                    icon: Icon(_audioMuted ? Icons.mic_off : Icons.mic),
                    style: IconButton.styleFrom(
                      backgroundColor: _audioMuted ? const Color(0xfff58e7e) : card,
                      foregroundColor: ink,
                      side: const BorderSide(color: ink, width: 1.5),
                    ),
                    tooltip: _audioMuted ? 'Unmute' : 'Mute',
                  ),

                  // Camera Toggle
                  IconButton.filled(
                    onPressed: () {
                      setState(() {
                        _videoOff = !_videoOff;
                      });
                    },
                    icon: Icon(_videoOff ? Icons.videocam_off : Icons.videocam),
                    style: IconButton.styleFrom(
                      backgroundColor: _videoOff ? const Color(0xfff58e7e) : card,
                      foregroundColor: ink,
                      side: const BorderSide(color: ink, width: 1.5),
                    ),
                    tooltip: _videoOff ? 'Start Video' : 'Stop Video',
                  ),

                  // Flip Camera
                  IconButton.filled(
                    onPressed: () {
                      setState(() {
                        _isFrontCamera = !_isFrontCamera;
                      });
                    },
                    icon: const Icon(Icons.flip_camera_ios),
                    style: IconButton.styleFrom(
                      backgroundColor: card,
                      foregroundColor: ink,
                      side: const BorderSide(color: ink, width: 1.5),
                    ),
                    tooltip: 'Flip Camera',
                  ),

                  // Speaker Toggle
                  IconButton.filled(
                    onPressed: () {
                      setState(() {
                        _speakerOn = !_speakerOn;
                      });
                    },
                    icon: Icon(_speakerOn ? Icons.volume_up : Icons.volume_off),
                    style: IconButton.styleFrom(
                      backgroundColor: card,
                      foregroundColor: ink,
                      side: const BorderSide(color: ink, width: 1.5),
                    ),
                    tooltip: _speakerOn ? 'Speaker On' : 'Speaker Off',
                  ),

                  // Hang Up Button
                  FilledButton.icon(
                    onPressed: _endCall,
                    icon: const Icon(Icons.call_end, size: 20),
                    label: Text(_callState == 'calling' ? 'Cancel' : 'End Call'),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xffef4444),
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: ink, width: 1.5),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
