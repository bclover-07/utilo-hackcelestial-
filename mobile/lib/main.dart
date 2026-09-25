import 'package:flutter/material.dart';
import 'core/api.dart';
import 'ui/theme.dart';
import 'ui/widgets.dart';
import 'screens/workspace.dart';

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
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (widget.session.error != null) {
          return Scaffold(
            body: Center(
              child: Panel(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(widget.session.error!),
                    AsyncButton(
                      text: 'Retry connection',
                      run: widget.session.restore,
                    ),
                  ],
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

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key, required this.session});
  final Session session;
  @override
  Widget build(BuildContext context) {
    void auth(bool register) => Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AuthScreen(session: session, register: register),
      ),
    );
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'U  utlio ✳',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
        actions: [
          TextButton(onPressed: () => auth(false), child: const Text('Log in')),
        ],
      ),
      body: PageBody(
        title: 'Less idle.\nMore possible.',
        subtitle:
            'The B2B hospitality exchange. Turn unused resources into someone else’s next big thing.',
        children: [
          Panel(
            color: yellow,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.hub_outlined, size: 64),
                const SizedBox(height: 16),
                Text(
                  'Good resources deserve a second shift.',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Discover venues, furniture and equipment. Build a bundle, negotiate the details, and reserve the right quantity.',
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: () => auth(true),
                  child: const Text('Join the exchange →'),
                ),
              ],
            ),
          ),
          for (final entry in [
            (
              Icons.search,
              'Find your fit.',
              'Search by category, location, dates, quantity and delivery.',
            ),
            (
              Icons.inventory_2_outlined,
              'Make idle, useful.',
              'Publish resources, manage availability and negotiate offers.',
            ),
            (
              Icons.auto_awesome,
              'Plan together.',
              'AI Conductor builds resource packages with evidence and constraints.',
            ),
            (
              Icons.handshake_outlined,
              'A clear agreement.',
              'Versioned offers, private conversations and quantity-aware bookings.',
            ),
            (
              Icons.insights_outlined,
              'Understand your market.',
              'Explore real demand, utilization, liquidity and performance.',
            ),
            (
              Icons.shield_outlined,
              'Trust has a paper trail.',
              'Business verification, reviews, dispute evidence and moderation.',
            ),
          ])
            Panel(
              color: palette[entry.$1.codePoint % palette.length],
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(entry.$1, size: 36),
                  const SizedBox(height: 12),
                  Text(entry.$2, style: Theme.of(context).textTheme.titleLarge),
                  Text(entry.$3),
                ],
              ),
            ),
          Text(
            'Your next possibility starts here.',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () => auth(true),
            child: const Text('Create your business account'),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Text('Utlio • Hospitality resources, working together.'),
          ),
        ],
      ),
    );
  }
}

class AuthScreen extends StatelessWidget {
  const AuthScreen({super.key, required this.session, required this.register});
  final Session session;
  final bool register;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Utlio')),
    body: PageBody(
      title: register ? 'A little space. A lot of potential.' : 'Welcome back.',
      subtitle: register
          ? 'One business account. Provider and seeker tools.'
          : 'Your next opportunity is waiting.',
      children: [
        Panel(
          color: register ? teal : lavender,
          child: FieldsForm(
            submit: register ? 'Create account →' : 'Log in →',
            fields: [
              if (register) ...[
                const FieldSpec('name', 'Business name'),
                const FieldSpec('city', 'City'),
                const FieldSpec('category', 'Business type'),
                const FieldSpec('phone', 'Phone'),
              ],
              const FieldSpec('email', 'Email', type: 'email'),
              FieldSpec(
                'password',
                'Password',
                type: 'password',
                min: register ? 10 : null,
              ),
              if (!register)
                const FieldSpec(
                  'role',
                  'Account type',
                  options: {'business': 'Business', 'admin': 'Administrator'},
                  initial: 'business',
                ),
              const FieldSpec(
                'mode',
                'Workspace',
                options: {'seeker': 'Seeker', 'provider': 'Provider'},
                initial: 'seeker',
              ),
            ],
            onSubmit: (body) async {
              await session.login({
                ...body,
                if (register) 'role': 'business',
              }, register: register);
              if (context.mounted) {
                Navigator.of(context).popUntil((r) => r.isFirst);
              }
              return null;
            },
          ),
        ),
      ],
    ),
  );
}
