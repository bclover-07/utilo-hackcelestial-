import 'package:flutter/material.dart';
import '../core/api.dart';
import 'theme.dart';

String label(String key) => key
    .replaceAllMapped(RegExp(r'([a-z])([A-Z])'), (m) => '${m[1]} ${m[2]}')
    .replaceAll('_', ' ');
String identity(dynamic value) => value is Map
    ? '${value['name'] ?? value['title'] ?? value['_id'] ?? ''}'
    : '${value ?? ''}';
List<Json> records(dynamic value) => value is List
    ? value.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
    : [];

class Panel extends StatefulWidget {
  const Panel({super.key, required this.child, this.color = card, this.onTap});
  final Widget child;
  final Color color;
  final VoidCallback? onTap;
  @override
  State<Panel> createState() => _PanelState();
}

class _PanelState extends State<Panel> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
    tween: Tween(begin: 0, end: 1),
    duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 280),
    curve: Curves.easeOutCubic,
    builder: (context, value, child) => Opacity(
      opacity: value.clamp(0.0, 1.0),
      child: Transform.translate(
        offset: Offset(0, (1 - value) * 10),
        child: child,
      ),
    ),
    child: GestureDetector(
      onTapDown: widget.onTap != null ? (_) => setState(() => _pressed = true) : null,
      onTapUp: widget.onTap != null ? (_) => setState(() => _pressed = false) : null,
      onTapCancel: widget.onTap != null ? () => setState(() => _pressed = false) : null,
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _pressed ? 0.98 : 1.0,
        duration: const Duration(milliseconds: 110),
        curve: Curves.easeInOut,
        child: Container(
          margin: const EdgeInsets.only(bottom: 16, right: 3),
          padding: EdgeInsets.all(MediaQuery.sizeOf(context).width < 400 ? 14 : 20),
          decoration: BoxDecoration(
            color: widget.color,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: ink, width: 2.5),
            boxShadow: [
              BoxShadow(
                color: ink,
                offset: _pressed ? const Offset(2, 2) : const Offset(4, 5),
              ),
            ],
          ),
          child: widget.child,
        ),
      ),
    ),
  );
}

class PageBody extends StatelessWidget {
  const PageBody({
    super.key,
    required this.title,
    this.subtitle,
    required this.children,
  });
  final String title;
  final String? subtitle;
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Scrollbar(
    child: SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
        MediaQuery.sizeOf(context).width < 400 ? 12 : 20,
        18,
        MediaQuery.sizeOf(context).width < 400 ? 12 : 20,
        40,
      ),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
              if (subtitle != null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text(
                    subtitle!,
                    style: TextStyle(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? Colors.grey.shade400
                          : Colors.grey.shade700,
                      fontSize: 14,
                    ),
                  ),
                ),
              const SizedBox(height: 18),
              ...children,
            ],
          ),
        ),
      ),
    ),
  );
}

class AsyncButton extends StatefulWidget {
  const AsyncButton({
    super.key,
    required this.text,
    required this.run,
    this.icon = Icons.arrow_forward,
    this.enabled = true,
  });
  final String text;
  final Future<dynamic> Function() run;
  final IconData icon;
  final bool enabled;
  @override
  State<AsyncButton> createState() => _AsyncButtonState();
}

class _AsyncButtonState extends State<AsyncButton> {
  bool busy = false;
  bool pressed = false;
  String? error;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      AnimatedScale(
        scale: pressed ? 0.96 : 1.0,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeInOut,
        child: Listener(
          onPointerDown: (_) => setState(() => pressed = true),
          onPointerUp: (_) => setState(() => pressed = false),
          onPointerCancel: (_) => setState(() => pressed = false),
          child: FilledButton.icon(
            onPressed: busy || !widget.enabled
                ? null
                : () async {
                    setState(() {
                      busy = true;
                      error = null;
                    });
                    try {
                      final result = await widget.run();
                      if (context.mounted && result is String) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(result),
                            backgroundColor: ink,
                            behavior: SnackBarBehavior.floating,
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      }
                    } catch (e) {
                      if (mounted) setState(() => error = e.toString());
                    } finally {
                      if (mounted) setState(() => busy = false);
                    }
                  },
            icon: busy
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Icon(widget.icon, size: 18),
            label: Text(
              busy ? 'Working…' : widget.text,
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ),
        ),
      ),
      if (error != null)
        Padding(
          padding: const EdgeInsets.all(8),
          child: Text(
            error!,
            style: const TextStyle(color: Colors.red),
            semanticsLabel: 'Error: $error',
          ),
        ),
    ],
  );
}

class Remote extends StatefulWidget {
  const Remote({
    super.key,
    required this.api,
    required this.path,
    required this.builder,
  });
  final Api api;
  final String path;
  final Widget Function(dynamic data, Future<void> Function() reload) builder;
  @override
  State<Remote> createState() => _RemoteState();
}

class _RemoteState extends State<Remote> {
  late Future<dynamic> future;
  @override
  void initState() {
    super.initState();
    future = widget.api.call(widget.path);
  }

  @override
  void didUpdateWidget(Remote old) {
    super.didUpdateWidget(old);
    if (old.path != widget.path) future = widget.api.call(widget.path);
  }

  Future<void> reload() async {
    final next = widget.api.call(widget.path);
    setState(() => future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) => FutureBuilder(
    key: ValueKey(widget.path),
    future: future,
    builder: (context, snap) {
      if (snap.connectionState != ConnectionState.done && !snap.hasData) {
        return const Padding(
          padding: EdgeInsets.all(32),
          child: Center(child: CircularProgressIndicator()),
        );
      }
      if (snap.hasError) {
        return Panel(
          child: Column(
            children: [
              Text(snap.error.toString()),
              AsyncButton(
                text: 'Retry connection',
                run: reload,
                icon: Icons.refresh,
              ),
            ],
          ),
        );
      }
      return widget.builder(snap.data, reload);
    },
  );
}

class DataView extends StatelessWidget {
  const DataView(this.data, {super.key});
  final dynamic data;
  @override
  Widget build(BuildContext context) {
    if (data == null) return const Text('Not recorded');
    if (data is List) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: (data as List).isEmpty
            ? [const Text('No records yet.')]
            : (data as List)
                  .map(
                    (v) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: v is Map || v is List ? DataView(v) : Text('• $v'),
                    ),
                  )
                  .toList(),
      );
    }
    if (data is Map) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: (data as Map).entries
            .where(
              (e) => ![
                '__v',
                'embedding',
                'passwordHash',
                'sessionVersion',
              ].contains(e.key),
            )
            .map(
              (e) => e.value is Map || e.value is List
                  ? ExpansionTile(
                      tilePadding: EdgeInsets.zero,
                      title: Text(
                        label('${e.key}'),
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(left: 12, bottom: 12),
                          child: DataView(e.value),
                        ),
                      ],
                    )
                  : Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: SelectableText(
                        '${label('${e.key}')}: ${e.value is bool ? (e.value ? 'Yes' : 'No') : e.value ?? 'Not recorded'}',
                      ),
                    ),
            )
            .toList(),
      );
    }
    return SelectableText('$data');
  }
}

class Empty extends StatelessWidget {
  const Empty({
    super.key,
    this.text =
        'No records yet. Results will appear here when data is available.',
  });
  final String text;
  @override
  Widget build(BuildContext context) => Panel(
    color: sky,
    child: Column(
      children: [
        const Icon(Icons.inbox_outlined, size: 40),
        const SizedBox(height: 12),
        Text(text),
      ],
    ),
  );
}

class FieldSpec {
  const FieldSpec(
    this.key,
    this.title, {
    this.type = 'text',
    this.required = true,
    this.options,
    this.initial,
    this.min,
    this.max,
  });
  final String key, title, type;
  final bool required;
  final Map<String, String>? options;
  final dynamic initial;
  final double? min, max;
}

class FieldsForm extends StatefulWidget {
  const FieldsForm({
    super.key,
    required this.fields,
    required this.submit,
    required this.onSubmit,
    this.initial = const {},
    this.footer,
    this.onChanged,
  });
  final List<FieldSpec> fields;
  final String submit;
  final Json initial;
  final Future<dynamic> Function(Json) onSubmit;
  final Widget? footer;
  final void Function(String key, dynamic value)? onChanged;
  @override
  State<FieldsForm> createState() => _FieldsFormState();
}

class _FieldsFormState extends State<FieldsForm> {
  final form = GlobalKey<FormState>();
  late Json values;
  @override
  void initState() {
    super.initState();
    values = {
      for (final f in widget.fields)
        f.key:
            widget.initial[f.key] ??
            f.initial ??
            (f.type == 'bool' ? false : ''),
    };
  }

  @override
  void didUpdateWidget(FieldsForm old) {
    super.didUpdateWidget(old);
    for (final f in widget.fields) {
      values.putIfAbsent(
        f.key,
        () =>
            widget.initial[f.key] ??
            f.initial ??
            (f.type == 'bool' ? false : ''),
      );
    }
  }

  @override
  Widget build(BuildContext context) => Form(
    key: form,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final f in widget.fields)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: f.type == 'bool'
                ? SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(f.title),
                    value: values[f.key] == true,
                    onChanged: (v) => setState(() => values[f.key] = v),
                  )
                : f.options != null
                ? DropdownButtonFormField<String>(
                    initialValue: f.options!.containsKey('${values[f.key]}')
                        ? '${values[f.key]}'
                        : null,
                    isExpanded: true,
                    decoration: InputDecoration(labelText: f.title),
                    items: f.options!.entries
                        .map(
                          (e) => DropdownMenuItem(
                            value: e.key,
                            child: Text(
                              e.value,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (v) => values[f.key] = v,
                    validator: (v) =>
                        f.required && v == null ? 'Choose ${f.title}' : null,
                  )
                : f.type == 'date'
                ? _dateField(f)
                : TextFormField(
                    initialValue: '${values[f.key]}',
                    decoration: InputDecoration(labelText: f.title),
                    obscureText: f.type == 'password',
                    maxLines: f.type == 'multiline' ? 4 : 1,
                    keyboardType: f.type == 'number'
                        ? const TextInputType.numberWithOptions(
                            decimal: true,
                            signed: true,
                          )
                        : f.type == 'email'
                        ? TextInputType.emailAddress
                        : TextInputType.text,
                    onChanged: (v) => values[f.key] = v,
                    validator: (v) {
                      if (f.required && (v == null || v.trim().isEmpty)) {
                        return '${f.title} is required';
                      }
                      if (f.type == 'number' && v!.isNotEmpty) {
                        final n = num.tryParse(v);
                        if (n == null || !n.isFinite) {
                          return 'Enter a valid number';
                        }
                        if (f.min != null && n < f.min!) {
                          return 'Minimum ${f.min}';
                        }
                        if (f.max != null && n > f.max!) {
                          return 'Maximum ${f.max}';
                        }
                      }
                      if (f.type == 'email' &&
                          v!.isNotEmpty &&
                          !v.contains('@')) {
                        return 'Enter an email address';
                      }
                      if (f.type == 'password' &&
                          f.min != null &&
                          v!.length < f.min!) {
                        return 'Use at least ${f.min!.toInt()} characters';
                      }
                      return null;
                    },
                  ),
          ),
        if (widget.footer != null) widget.footer!,
        AsyncButton(
          text: widget.submit,
          run: () async {
            if (!form.currentState!.validate()) return null;
            final body = <String, dynamic>{};
            for (final f in widget.fields) {
              final v = values[f.key];
              if (!f.required && (v == null || v == '')) continue;
              body[f.key] = f.type == 'number' ? num.parse('$v') : v;
            }
            return widget.onSubmit(body);
          },
        ),
      ],
    ),
  );
  Widget _dateField(FieldSpec f) => FormField<String>(
    initialValue: '${values[f.key]}',
    validator: (_) =>
        f.required && values[f.key] == '' ? 'Choose ${f.title}' : null,
    builder: (state) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        OutlinedButton.icon(
          icon: const Icon(Icons.calendar_month),
          label: Text(
            '${f.title}: ${values[f.key] == '' ? 'Choose date & time' : DateTime.tryParse('${values[f.key]}')?.toLocal().toString() ?? values[f.key]}',
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),
          onPressed: () async {
            final date = await showDatePicker(
              context: context,
              firstDate: DateTime(2020),
              lastDate: DateTime(2100),
              initialDate:
                  DateTime.tryParse('${values[f.key]}')?.toLocal() ??
                  DateTime.now(),
            );
            if (date == null || !mounted) return;
            final time = await showTimePicker(
              context: context,
              initialTime: TimeOfDay.now(),
            );
            if (time == null || !mounted) return;
            setState(
              () => values[f.key] = DateTime(
                date.year,
                date.month,
                date.day,
                time.hour,
                time.minute,
              ).toUtc().toIso8601String(),
            );
            state.didChange(values[f.key]);
          },
        ),
        if (state.hasError)
          Text(state.errorText!, style: const TextStyle(color: Colors.red)),
      ],
    ),
  );
}

class DottedBackgroundPainter extends CustomPainter {
  const DottedBackgroundPainter();
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0x18272b18)
      ..style = PaintingStyle.fill;
    const spacing = 22.0;
    const radius = 1.2;
    for (double x = spacing / 2; x < size.width; x += spacing) {
      for (double y = spacing / 2; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), radius, paint);
      }
    }
  }
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class DottedScaffoldBackground extends StatelessWidget {
  const DottedScaffoldBackground({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => CustomPaint(
        painter: const DottedBackgroundPainter(),
        child: child,
      );
}

class NeoButton extends StatefulWidget {
  const NeoButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.color = yellow,
    this.textColor = ink,
    this.icon,
    this.trailingIcon,
    this.isFullWidth = false,
    this.fontSize = 15,
    this.padding = const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
  });
  final String text;
  final VoidCallback? onPressed;
  final Color color;
  final Color textColor;
  final IconData? icon;
  final IconData? trailingIcon;
  final bool isFullWidth;
  final double fontSize;
  final EdgeInsets padding;
  @override
  State<NeoButton> createState() => _NeoButtonState();
}

class _NeoButtonState extends State<NeoButton> {
  bool _pressed = false;
  @override
  Widget build(BuildContext context) {
    final child = GestureDetector(
      onTapDown: widget.onPressed != null ? (_) => setState(() => _pressed = true) : null,
      onTapUp: widget.onPressed != null ? (_) => setState(() => _pressed = false) : null,
      onTapCancel: widget.onPressed != null ? () => setState(() => _pressed = false) : null,
      onTap: widget.onPressed,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 100),
        transform: Matrix4.translationValues(_pressed ? 2 : 0, _pressed ? 3 : 0, 0),
        padding: widget.padding,
        decoration: BoxDecoration(
          color: widget.onPressed == null ? Colors.grey.shade300 : widget.color,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: ink, width: 2.5),
          boxShadow: [
            BoxShadow(
              color: ink,
              offset: _pressed ? const Offset(1, 1) : const Offset(3, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: widget.isFullWidth ? MainAxisSize.max : MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (widget.icon != null) ...[
              Icon(widget.icon, size: widget.fontSize + 3, color: widget.textColor),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: Text(
                widget.text,
                style: TextStyle(
                  fontFamily: 'SpaceGrotesk',
                  fontWeight: FontWeight.w900,
                  fontSize: widget.fontSize,
                  color: widget.textColor,
                ),
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (widget.trailingIcon != null) ...[
              const SizedBox(width: 8),
              Icon(widget.trailingIcon, size: widget.fontSize + 3, color: widget.textColor),
            ],
          ],
        ),
      ),
    );
    return widget.isFullWidth ? SizedBox(width: double.infinity, child: child) : child;
  }
}

class NeoBadge extends StatelessWidget {
  const NeoBadge({
    super.key,
    required this.text,
    this.color = lavender,
    this.textColor = ink,
    this.fontSize = 11,
    this.hasLiveDot = false,
    this.icon,
  });
  final String text;
  final Color color;
  final Color textColor;
  final double fontSize;
  final bool hasLiveDot;
  final IconData? icon;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: ink, width: 1.8),
          boxShadow: const [BoxShadow(color: ink, offset: Offset(1.5, 1.5))],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (hasLiveDot) ...[
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Color(0xff16a34a),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
            ] else if (icon != null) ...[
              Icon(icon, size: 14, color: textColor),
              const SizedBox(width: 5),
            ],
            Flexible(
              child: Text(
                text,
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
                style: TextStyle(
                  fontFamily: 'SpaceGrotesk',
                  fontSize: fontSize,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.6,
                  color: textColor,
                ),
              ),
            ),
          ],
        ),
      );
}

class NeoStatCard extends StatelessWidget {
  const NeoStatCard({
    super.key,
    required this.tag,
    required this.value,
    required this.label,
    required this.bg,
  });
  final String tag, value, label;
  final Color bg;
  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: ink, width: 2.5),
          boxShadow: const [BoxShadow(color: ink, offset: Offset(3, 4))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                NeoBadge(text: tag, color: Colors.white, hasLiveDot: true),
                const Icon(Icons.arrow_outward, size: 18, color: ink),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: const TextStyle(
                fontFamily: 'SpaceGrotesk',
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: ink,
                height: 1.05,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: ink,
              ),
            ),
          ],
        ),
      );
}

class NeoAccordion extends StatefulWidget {
  const NeoAccordion({
    super.key,
    required this.question,
    required this.answer,
    this.initialOpen = false,
  });
  final String question;
  final String answer;
  final bool initialOpen;
  @override
  State<NeoAccordion> createState() => _NeoAccordionState();
}

class _NeoAccordionState extends State<NeoAccordion> {
  late bool _isOpen = widget.initialOpen;
  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: ink, width: 2.2),
          boxShadow: const [BoxShadow(color: ink, offset: Offset(3, 3))],
        ),
        child: Column(
          children: [
            InkWell(
              onTap: () => setState(() => _isOpen = !_isOpen),
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        widget.question,
                        style: const TextStyle(
                          fontFamily: 'SpaceGrotesk',
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: ink,
                        ),
                      ),
                    ),
                    AnimatedRotation(
                      turns: _isOpen ? 0.5 : 0,
                      duration: const Duration(milliseconds: 200),
                      child: const Icon(Icons.keyboard_arrow_down, size: 24, color: ink),
                    ),
                  ],
                ),
              ),
            ),
            if (_isOpen)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xfffff4d4),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: ink, width: 1.5),
                  ),
                  child: Text(
                    widget.answer,
                    style: const TextStyle(
                      fontSize: 14,
                      height: 1.5,
                      fontWeight: FontWeight.w500,
                      color: ink,
                    ),
                  ),
                ),
              ),
          ],
        ),
      );
}

class NeoMarqueeStrip extends StatelessWidget {
  const NeoMarqueeStrip({super.key});
  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.symmetric(vertical: 20),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        decoration: BoxDecoration(
          color: ink,
          borderRadius: BorderRadius.circular(12),
          boxShadow: const [BoxShadow(color: yellow, offset: Offset(3, 3))],
        ),
        child: const SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              Text('LESS WASTE', style: TextStyle(color: yellow, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
              Padding(padding: EdgeInsets.symmetric(horizontal: 10), child: Text('✳', style: TextStyle(color: pink))),
              Text('MORE OPPORTUNITY', style: TextStyle(color: teal, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
              Padding(padding: EdgeInsets.symmetric(horizontal: 10), child: Text('✳', style: TextStyle(color: pink))),
              Text('LOCAL CONNECTIONS', style: TextStyle(color: lavender, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
              Padding(padding: EdgeInsets.symmetric(horizontal: 10), child: Text('✳', style: TextStyle(color: pink))),
              Text('SHARED POSSIBILITIES', style: TextStyle(color: yellow, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
              Padding(padding: EdgeInsets.symmetric(horizontal: 10), child: Text('✳', style: TextStyle(color: pink))),
            ],
          ),
        ),
      );
}

