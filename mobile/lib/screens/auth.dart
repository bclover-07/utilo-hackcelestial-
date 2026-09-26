import 'package:flutter/material.dart';
import '../core/api.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({
    super.key,
    required this.session,
    this.register = false,
    this.initialRole = 'seeker',
  });
  final Session session;
  final bool register;
  final String initialRole;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  late bool _isRegister = widget.register;
  late String _accountType = widget.initialRole == 'admin' ? 'admin' : 'business';
  late String _businessMode = widget.initialRole == 'provider' ? 'provider' : 'seeker';

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _cityController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  String _selectedCategory = 'hotel';
  bool _obscurePassword = true;
  bool _busy = false;
  String? _errorMessage;

  static const List<Map<String, String>> _categories = [
    {'value': 'hotel', 'label': 'Hotel / Resort'},
    {'value': 'venue', 'label': 'Banquet / Venue'},
    {'value': 'caterer', 'label': 'Caterer'},
    {'value': 'production', 'label': 'Event Production & AV'},
    {'value': 'logistics', 'label': 'Logistics & Transport'},
    {'value': 'equipment', 'label': 'Furniture & Equipment'},
    {'value': 'other', 'label': 'Other Hospitality Business'},
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _cityController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _autofillDemo(String email, String role, String mode) {
    setState(() {
      _emailController.text = email;
      _passwordController.text = 'Password123!';
      _accountType = role;
      _businessMode = mode;
      _errorMessage = null;
    });
  }

  Future<void> _submit() async {
    if (_busy) return;
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _busy = true;
      _errorMessage = null;
    });

    try {
      final input = <String, dynamic>{
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
        'role': _accountType,
        if (_accountType == 'business') 'mode': _businessMode,
        if (_isRegister) ...{
          'name': _nameController.text.trim(),
          'city': _cityController.text.trim(),
          'phone': _phoneController.text.trim(),
          if (_accountType == 'business') 'category': _selectedCategory,
        },
      };

      await widget.session.login(input, register: _isRegister);

      if (mounted) {
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } on ApiFailure catch (e) {
      if (mounted) setState(() => _errorMessage = e.message);
    } catch (e) {
      if (mounted) setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: pink,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: ink, width: 2),
                boxShadow: const [BoxShadow(color: ink, offset: Offset(1.5, 1.5))],
              ),
              child: const Text('u', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: ink)),
            ),
            const SizedBox(width: 8),
            const Text('utlio', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'SpaceGrotesk', fontSize: 22, color: ink)),
            const Text(' ✳', style: TextStyle(color: Color(0xfff59e0b), fontSize: 20)),
          ],
        ),
      ),
      body: DottedScaffoldBackground(
        child: Scrollbar(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Editorial Banner Card
                  Panel(
                    color: paperCard,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const NeoBadge(
                          text: '✳ GOOD THINGS ARE BETTER SHARED',
                          color: yellow,
                          textColor: ink,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Less idle.\nMore possible.',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.5,
                              ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'The right resources. The right neighbours. A little help from AI. Let’s make your next event happen.',
                          style: TextStyle(fontSize: 13, height: 1.4, color: Colors.black87),
                        ),
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xfff5f0ff),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: ink, width: 1.8),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.shield_outlined, size: 22, color: ink),
                              SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  'One business. Both sides of the exchange. Find resources as a seeker. Share them as a provider.',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: ink),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Auth Form Card
                  Panel(
                    color: card,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            NeoBadge(
                              text: _isRegister ? 'YOUR NEXT CHAPTER' : 'YOUR PEOPLE. YOUR POSSIBILITIES.',
                              color: lavender,
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: pink,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: ink, width: 1.5),
                              ),
                              child: const Text('HELLO ✳', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: ink)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          _isRegister ? 'Make room for more.' : 'Welcome back.',
                          style: const TextStyle(fontFamily: 'SpaceGrotesk', fontSize: 24, fontWeight: FontWeight.w900, color: ink),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _isRegister
                              ? 'Create your account and start something good.'
                              : 'Choose how you’d like to get things moving.',
                          style: const TextStyle(fontSize: 13, color: Colors.black87),
                        ),
                        const SizedBox(height: 16),

                        // Account Type Toggle (Business vs Admin)
                        const Text('ACCOUNT TYPE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.6)),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () => setState(() => _accountType = 'business'),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 10),
                                  decoration: BoxDecoration(
                                    color: _accountType == 'business' ? yellow : paperCard,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: ink, width: 2),
                                    boxShadow: _accountType == 'business' ? const [BoxShadow(color: ink, offset: Offset(2, 2))] : null,
                                  ),
                                  child: const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.inventory_2_outlined, size: 18),
                                      SizedBox(width: 6),
                                      Text('Business', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            if (!_isRegister) ...[
                              const SizedBox(width: 8),
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => setState(() => _accountType = 'admin'),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                    decoration: BoxDecoration(
                                      color: _accountType == 'admin' ? yellow : paperCard,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: ink, width: 2),
                                      boxShadow: _accountType == 'admin' ? const [BoxShadow(color: ink, offset: Offset(2, 2))] : null,
                                    ),
                                    child: const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.shield_outlined, size: 18),
                                        SizedBox(width: 6),
                                        Text('Admin', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),

                        // Starting Business Mode Toggle
                        if (_accountType == 'business') ...[
                          const SizedBox(height: 14),
                          Text(
                            _isRegister ? 'CHOOSE YOUR STARTING MODE' : 'OPEN YOUR BUSINESS WORKSPACE IN',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.6),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => setState(() => _businessMode = 'seeker'),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                    decoration: BoxDecoration(
                                      color: _businessMode == 'seeker' ? teal : paperCard,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: ink, width: 2),
                                      boxShadow: _businessMode == 'seeker' ? const [BoxShadow(color: ink, offset: Offset(2, 2))] : null,
                                    ),
                                    child: const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.search, size: 18),
                                        SizedBox(width: 6),
                                        Text('Seeker', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => setState(() => _businessMode = 'provider'),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                    decoration: BoxDecoration(
                                      color: _businessMode == 'provider' ? teal : paperCard,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: ink, width: 2),
                                      boxShadow: _businessMode == 'provider' ? const [BoxShadow(color: ink, offset: Offset(2, 2))] : null,
                                    ),
                                    child: const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.apartment, size: 18),
                                        SizedBox(width: 6),
                                        Text('Provider', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _businessMode == 'seeker' ? 'Find your next great setup.' : 'Put your spare capacity to work.',
                            style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Colors.black87),
                          ),
                        ],

                        // Demo Accounts Autofill (One-Click)
                        if (!_isRegister) ...[
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xfff5f2eb),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: ink, width: 1.5),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.bolt, size: 16, color: ink),
                                    SizedBox(width: 4),
                                    Text(
                                      'DEMO ACCOUNTS (ONE-CLICK AUTOFILL)',
                                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.6),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    _demoChip('🏢 Shreshta (Provider)', yellow, () => _autofillDemo('shreshta@utlio.com', 'business', 'provider')),
                                    _demoChip('🔊 Shreyas (Provider)', yellow, () => _autofillDemo('shreyas@utlio.com', 'business', 'provider')),
                                    _demoChip('💼 Shivam (Seeker)', teal, () => _autofillDemo('shivam@utlio.com', 'business', 'seeker')),
                                    _demoChip('🎉 Vaishnavi (Seeker)', teal, () => _autofillDemo('vaishnavi@utlio.com', 'business', 'seeker')),
                                    _demoChip('🛡️ Admin (Super)', pink, () => _autofillDemo('admin@utlio.com', 'admin', 'seeker')),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],

                        // Error Banner
                        if (_errorMessage != null) ...[
                          const SizedBox(height: 14),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: coral.withValues(alpha: 0.3),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.red.shade900, width: 1.8),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.error_outline, color: Colors.red.shade900, size: 20),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: TextStyle(color: Colors.red.shade900, fontWeight: FontWeight.w700, fontSize: 13),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 18),

                        // Form Fields
                        if (_isRegister) ...[
                          TextFormField(
                            controller: _nameController,
                            decoration: InputDecoration(
                              labelText: _accountType == 'admin' ? 'Full name' : 'Business name',
                              hintText: _accountType == 'admin' ? 'Your full name' : 'Your hotel, venue or business',
                              prefixIcon: const Icon(Icons.business_outlined),
                            ),
                            validator: (v) => v == null || v.trim().isEmpty ? 'Please enter a name' : null,
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _cityController,
                                  decoration: const InputDecoration(
                                    labelText: 'City',
                                    hintText: 'Mumbai',
                                    prefixIcon: Icon(Icons.location_city_outlined),
                                  ),
                                  validator: (v) => v == null || v.trim().isEmpty ? 'Enter city' : null,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: TextFormField(
                                  controller: _phoneController,
                                  keyboardType: TextInputType.phone,
                                  decoration: const InputDecoration(
                                    labelText: 'Phone',
                                    hintText: '+91 98765 43210',
                                    prefixIcon: Icon(Icons.phone_outlined),
                                  ),
                                  validator: (v) => v == null || v.trim().isEmpty ? 'Enter phone' : null,
                                ),
                              ),
                            ],
                          ),
                          if (_accountType == 'business') ...[
                            const SizedBox(height: 14),
                            DropdownButtonFormField<String>(
                              initialValue: _selectedCategory,
                              decoration: const InputDecoration(
                                labelText: 'Business category',
                                prefixIcon: Icon(Icons.category_outlined),
                              ),
                              items: _categories.map((c) => DropdownMenuItem(value: c['value'], child: Text(c['label']!))).toList(),
                              onChanged: (v) => setState(() => _selectedCategory = v ?? 'hotel'),
                            ),
                          ],
                          const SizedBox(height: 14),
                        ],

                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'Work email address',
                            hintText: 'name@business.com',
                            prefixIcon: Icon(Icons.email_outlined),
                          ),
                          validator: (v) => v == null || !v.contains('@') ? 'Enter a valid email' : null,
                        ),
                        const SizedBox(height: 14),

                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            hintText: '••••••••',
                            prefixIcon: const Icon(Icons.lock_outline),
                            suffixIcon: IconButton(
                              icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                            ),
                          ),
                          validator: (v) => v == null || v.length < 6 ? 'Password must be at least 6 characters' : null,
                        ),
                        const SizedBox(height: 22),

                        NeoButton(
                          text: _busy
                              ? 'Connecting...'
                              : _isRegister
                                  ? 'Create business account ↗'
                                  : 'Open your workspace ↗',
                          isFullWidth: true,
                          color: yellow,
                          onPressed: _busy ? null : _submit,
                        ),

                        const SizedBox(height: 16),
                        Center(
                          child: TextButton(
                            onPressed: () => setState(() {
                              _isRegister = !_isRegister;
                              _errorMessage = null;
                            }),
                            child: Text(
                              _isRegister
                                  ? 'Already have an account? Log in'
                                  : 'Don’t have an account? Create your business account',
                              style: const TextStyle(fontWeight: FontWeight.w800, color: ink),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _demoChip(String label, Color bg, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: ink, width: 1.5),
            boxShadow: const [BoxShadow(color: ink, offset: Offset(1.5, 1.5))],
          ),
          child: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: ink)),
        ),
      );
}
