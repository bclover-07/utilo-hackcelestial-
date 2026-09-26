import 'dart:async';
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

class _VideoCallScreenState extends State<VideoCallScreen> with SingleTickerProviderStateMixin {
  late String _callState; // 'calling', 'connecting', 'connected', 'declined', 'ended'
  int _duration = 0;
  bool _audioMuted = false;
  bool _videoOff = false;
  bool _isFrontCamera = true;
  Timer? _timer;
  Timer? _pollingTimer;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _callState = widget.isInitiator ? 'calling' : 'connected';

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    if (_callState == 'connected') {
      _startTimer();
    } else {
      // Poll call status until accepted or declined
      _pollingTimer = Timer.periodic(const Duration(seconds: 2), (_) => _checkCallStatus());
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _duration++);
    });
  }

  Future<void> _checkCallStatus() async {
    try {
      final res = await widget.session.api.call('/quotes/${widget.quoteId}/messages');
      if (res is List) {
        final vCallMsg = res.lastWhere(
          (m) => m is Map && m['type'] == 'video_call' && m['videoCall']?['roomId'] == widget.roomId,
          orElse: () => null,
        );
        if (vCallMsg != null && vCallMsg is Map) {
          final status = vCallMsg['videoCall']?['status'];
          if (status == 'accepted' && _callState != 'connected') {
            _pollingTimer?.cancel();
            if (mounted) {
              setState(() => _callState = 'connected');
              _startTimer();
            }
          } else if (status == 'declined' && _callState != 'declined') {
            _pollingTimer?.cancel();
            if (mounted) {
              setState(() => _callState = 'declined');
            }
            Future.delayed(const Duration(seconds: 2), () {
              if (mounted) Navigator.pop(context);
            });
          } else if (status == 'ended' && _callState != 'ended') {
            _pollingTimer?.cancel();
            if (mounted) {
              setState(() => _callState = 'ended');
            }
            Future.delayed(const Duration(seconds: 1), () {
              if (mounted) Navigator.pop(context);
            });
          }
        }
      }
    } catch (_) {}
  }

  Future<void> _endCall() async {
    _timer?.cancel();
    _pollingTimer?.cancel();
    setState(() => _callState = 'ended');

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

  @override
  void dispose() {
    _timer?.cancel();
    _pollingTimer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xff121410),
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                color: Color(0xff1e211c),
                border: Border(bottom: BorderSide(color: Color(0xff2d312c), width: 1.5)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: yellow,
                    child: Text(
                      widget.partnerName.isNotEmpty ? widget.partnerName[0].toUpperCase() : 'P',
                      style: const TextStyle(fontWeight: FontWeight.w900, color: ink),
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
                  if (_callState == 'connected')
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xff059669).withValues(alpha: 0.2),
                        border: Border.all(color: const Color(0xff10b981), width: 1.2),
                        borderRadius: BorderRadius.circular(20),
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
                ],
              ),
            ),

            // Video Stage View
            Expanded(
              child: Stack(
                children: [
                  // Main Remote Stage
                  Center(
                    child: _callState == 'connected'
                        ? Container(
                            margin: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xff222521),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xff374151), width: 1.5),
                            ),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                // Simulated active video feed with avatar & waveform
                                Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    CircleAvatar(
                                      radius: 46,
                                      backgroundColor: yellow,
                                      child: Text(
                                        widget.partnerName.isNotEmpty ? widget.partnerName[0].toUpperCase() : 'P',
                                        style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: ink),
                                      ),
                                    ),
                                    const SizedBox(height: 14),
                                    Text(
                                      widget.partnerName,
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18),
                                    ),
                                    const SizedBox(height: 6),
                                    const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.lock_outline, size: 14, color: Color(0xff79d9c5)),
                                        SizedBox(width: 4),
                                        Text(
                                          'Direct P2P Encrypted Feed',
                                          style: TextStyle(color: Color(0xff79d9c5), fontSize: 12, fontWeight: FontWeight.w700),
                                        ),
                                      ],
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
                                        scale: 1.0 + (_pulseController.value * 0.1),
                                        child: CircleAvatar(
                                          radius: 50,
                                          backgroundColor: yellow,
                                          child: const Icon(Icons.videocam, size: 48, color: ink),
                                        ),
                                      );
                                    },
                                  ),
                                  const SizedBox(height: 20),
                                  Text(
                                    'Calling ${widget.partnerName}...',
                                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white),
                                  ),
                                  const SizedBox(height: 6),
                                  const Text(
                                    'Waiting for them to accept the live video call...',
                                    style: TextStyle(fontSize: 13, color: Colors.white70),
                                  ),
                                ],
                              )
                            : _callState == 'declined'
                                ? Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const CircleAvatar(
                                        radius: 40,
                                        backgroundColor: Color(0xfff58e7e),
                                        child: Icon(Icons.call_end, size: 40, color: ink),
                                      ),
                                      const SizedBox(height: 16),
                                      const Text(
                                        'Call Declined',
                                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xfff58e7e)),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        '${widget.partnerName} is unavailable to take calls right now.',
                                        style: const TextStyle(fontSize: 12, color: Colors.white70),
                                      ),
                                    ],
                                  )
                                : Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.phone_disabled, size: 44, color: Colors.white54),
                                      const SizedBox(height: 12),
                                      const Text(
                                        'Call Ended',
                                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Duration: ${_formatDuration(_duration)}',
                                        style: const TextStyle(fontSize: 12, color: Colors.white54),
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
                                Icon(Icons.videocam_off, size: 26, color: Colors.white54),
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
                                    teal.withValues(alpha: 0.4),
                                    const Color(0xff171915),
                                  ],
                                ),
                              ),
                              child: Center(
                                child: Text(
                                  _isFrontCamera ? 'Self Preview' : 'Back Camera',
                                  style: const TextStyle(fontSize: 10, color: Colors.white70, fontWeight: FontWeight.w700),
                                ),
                              ),
                            ),
                          Positioned(
                            bottom: 6,
                            left: 8,
                            child: Text(
                              'You ${_audioMuted ? "🔇" : ""}',
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white),
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
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: const BoxDecoration(
                color: Color(0xff1e211c),
                border: Border(top: BorderSide(color: Color(0xff2d312c), width: 1.5)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  // Mute Mic Toggle
                  IconButton.filled(
                    onPressed: () => setState(() => _audioMuted = !_audioMuted),
                    icon: Icon(_audioMuted ? Icons.mic_off : Icons.mic),
                    style: IconButton.styleFrom(
                      backgroundColor: _audioMuted ? const Color(0xfff58e7e) : card,
                      foregroundColor: ink,
                      side: const BorderSide(color: ink, width: 1.5),
                    ),
                    tooltip: _audioMuted ? 'Unmute' : 'Mute',
                  ),

                  // Camera On/Off Toggle
                  IconButton.filled(
                    onPressed: () => setState(() => _videoOff = !_videoOff),
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
                    onPressed: () => setState(() => _isFrontCamera = !_isFrontCamera),
                    icon: const Icon(Icons.flip_camera_ios),
                    style: IconButton.styleFrom(
                      backgroundColor: card,
                      foregroundColor: ink,
                      side: const BorderSide(color: ink, width: 1.5),
                    ),
                    tooltip: 'Flip Camera',
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
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
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
