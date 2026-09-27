import 'package:flutter/material.dart';
import 'core/api.dart';
import 'ui/theme.dart';
import 'ui/widgets.dart';
import 'screens/workspace.dart';
import 'screens/landing.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(UtlioApp(session: Session(Api())));
}

class UtlioApp extends StatefulWidget {
  const UtlioApp({super.key, required this.session});
  final Session session;
  @override
  State<UtlioApp> createState() => _UtlioAppState();
}

class _UtlioAppState extends State<UtlioApp> {
  final navigator = GlobalKey<NavigatorState>();
  bool authenticated = false;
  void sessionChanged() {
    if (authenticated && widget.session.user == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => navigator.currentState?.popUntil((route) => route.isFirst));
    }
    authenticated = widget.session.user != null;
  }
  @override
  void initState() {
    super.initState();
    widget.session.addListener(sessionChanged);
    widget.session.restore();
  }
  @override void dispose() { widget.session.removeListener(sessionChanged); super.dispose(); }

  @override
  Widget build(BuildContext context) => MaterialApp(
    navigatorKey: navigator,
    title: 'Utlio • Less idle. More possible.',
    debugShowCheckedModeBanner: false,
    theme: utlioTheme(),
    home: ListenableBuilder(
      listenable: widget.session,
      builder: (context, _) {
        if (widget.session.loading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator(color: ink)),
          );
        }
        if (widget.session.error != null) {
          return Scaffold(
            body: DottedScaffoldBackground(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Panel(
                    color: yellow,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.wifi_off, size: 48, color: ink),
                        const SizedBox(height: 12),
                        const Text(
                          'Connection Issue',
                          style: TextStyle(fontFamily: 'SpaceGrotesk', fontSize: 20, fontWeight: FontWeight.w900),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          widget.session.error!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 12),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: ink, width: 1.5),
                          ),
                          child: Text(
                            'Active Host: ${widget.session.api.currentBaseUrl}',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'SpaceGrotesk'),
                          ),
                        ),
                        const SizedBox(height: 14),
                        NeoButton(
                          text: 'Auto-Detect & Connect ⚡',
                          color: card,
                          onPressed: widget.session.retryAutoDiscover,
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          alignment: WrapAlignment.center,
                          children: [
                            NeoButton(
                              text: 'Wi-Fi (10.229.144.159)',
                              color: card,
                              fontSize: 12,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              onPressed: () => widget.session.changeHost('http://10.229.144.159:4000/api'),
                            ),
                            NeoButton(
                              text: 'USB/ADB (127.0.0.1)',
                              color: card,
                              fontSize: 12,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              onPressed: () => widget.session.changeHost('http://127.0.0.1:4000/api'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            TextButton.icon(
                              icon: const Icon(Icons.edit, size: 16, color: ink),
                              label: const Text('Custom IP', style: TextStyle(color: ink, fontWeight: FontWeight.bold, fontSize: 12)),
                              onPressed: () {
                                final controller = TextEditingController(text: widget.session.api.currentBaseUrl);
                                showDialog(
                                  context: context,
                                  builder: (ctx) => AlertDialog(
                                    title: const Text('Custom Backend IP'),
                                    content: TextField(
                                      controller: controller,
                                      decoration: const InputDecoration(
                                        hintText: 'http://192.168.1.5:4000/api',
                                        labelText: 'Backend URL',
                                      ),
                                    ),
                                    actions: [
                                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                      ElevatedButton(
                                        onPressed: () {
                                          Navigator.pop(ctx);
                                          widget.session.changeHost(controller.text);
                                        },
                                        child: const Text('Connect'),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                            const SizedBox(width: 8),
                            TextButton.icon(
                              icon: const Icon(Icons.refresh, size: 16, color: ink),
                              label: const Text('Retry', style: TextStyle(color: ink, fontWeight: FontWeight.bold, fontSize: 12)),
                              onPressed: widget.session.restore,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
        }
        return widget.session.user == null
            ? LandingScreen(session: widget.session)
            : Workspace(session: widget.session);
      },
    ),
  );
}

