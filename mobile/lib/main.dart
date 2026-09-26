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
                child: Padding(
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
                          style: const TextStyle(fontSize: 13),
                        ),
                        const SizedBox(height: 18),
                        NeoButton(
                          text: 'Retry connection ↻',
                          color: card,
                          onPressed: widget.session.restore,
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

