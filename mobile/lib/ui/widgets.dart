import 'dart:math' as math;
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

String money(dynamic val) {
  if (val == null) return '₹0';
  final num? n = val is num ? val : num.tryParse(val.toString());
  if (n == null) return '₹0';
  final rounded = n.round();
  final str = rounded.abs().toString();
  if (str.length <= 3) {
    return '${rounded < 0 ? '-' : ''}₹$str';
  }
  final lastThree = str.substring(str.length - 3);
  final rest = str.substring(0, str.length - 3);
  final formattedRest = rest.replaceAllMapped(RegExp(r'(\d)(?=(\d\d)+$)'), (m) => '${m[1]},');
  return '${rounded < 0 ? '-' : ''}₹$formattedRest,$lastThree';
}

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

class LivePulseDot extends StatefulWidget {
  const LivePulseDot({super.key, this.color = const Color(0xff16a34a), this.size = 8.0});
  final Color color;
  final double size;
  @override
  State<LivePulseDot> createState() => _LivePulseDotState();
}

class _LivePulseDotState extends State<LivePulseDot> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))..repeat(reverse: true);
  }
  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }
  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: _ctrl,
        builder: (context, child) => Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            color: widget.color,
            shape: BoxShape.circle,
            border: Border.all(color: ink, width: 1.2),
            boxShadow: [
              BoxShadow(
                color: widget.color.withValues(alpha: 0.3 + 0.5 * _ctrl.value),
                blurRadius: 4 + 4 * _ctrl.value,
                spreadRadius: 1 + 2 * _ctrl.value,
              ),
            ],
          ),
        ),
      );
}

class FeatureChartPanel extends StatelessWidget {
  const FeatureChartPanel({
    super.key,
    required this.eyebrow,
    required this.title,
    this.badges = const [],
    required this.child,
    this.color = const Color(0xfffffdf8),
  });
  final String eyebrow;
  final String title;
  final List<Widget> badges;
  final Widget child;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: ink, width: 2),
          boxShadow: const [BoxShadow(color: ink, offset: Offset(3, 4))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        eyebrow.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.8,
                          color: Color(0xff0f766e),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        title,
                        style: const TextStyle(
                          fontFamily: 'SpaceGrotesk',
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          color: ink,
                        ),
                      ),
                    ],
                  ),
                ),
                if (badges.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  Wrap(spacing: 6, runSpacing: 4, children: badges),
                ],
              ],
            ),
            const SizedBox(height: 14),
            child,
          ],
        ),
      );
}

class NeoBarItem {
  const NeoBarItem({
    required this.label,
    required this.value,
    this.color = teal,
    this.valueLabel,
    this.subLabel,
  });
  final String label;
  final double value;
  final Color color;
  final String? valueLabel;
  final String? subLabel;
}

class NeoBarChart extends StatelessWidget {
  const NeoBarChart({
    super.key,
    required this.items,
    this.height = 180,
    this.isHorizontal = false,
    this.maxValue,
    this.unitSuffix = '',
  });
  final List<NeoBarItem> items;
  final double height;
  final bool isHorizontal;
  final double? maxValue;
  final String unitSuffix;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return SizedBox(
        height: height,
        child: const Center(child: Text('No data recorded yet', style: TextStyle(fontSize: 12))),
      );
    }
    final effectiveMax = maxValue ?? items.map((e) => e.value).fold<double>(0.0, math.max);
    final maxVal = effectiveMax <= 0 ? 1.0 : effectiveMax;

    if (isHorizontal) {
      return Column(
        children: items.map((item) {
          final ratio = (item.value / maxVal).clamp(0.0, 1.0);
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                SizedBox(
                  width: 75,
                  child: Text(
                    item.label,
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, constraints) => Stack(
                      children: [
                        Container(
                          height: 20,
                          decoration: BoxDecoration(
                            color: const Color(0xfff1ede2),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: ink, width: 1.2),
                          ),
                        ),
                        Container(
                          height: 20,
                          width: constraints.maxWidth * ratio,
                          decoration: BoxDecoration(
                            color: item.color,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: ink, width: 1.2),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 50,
                  child: Text(
                    item.valueLabel ?? '${item.value.toInt()}$unitSuffix',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900),
                    textAlign: TextAlign.end,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      );
    }

    return SizedBox(
      height: height,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: items.map((item) {
          final ratio = (item.value / maxVal).clamp(0.04, 1.0);
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    item.valueLabel ?? '${item.value.toInt()}',
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900),
                    maxLines: 1,
                  ),
                  const SizedBox(height: 4),
                  Flexible(
                    child: FractionallySizedBox(
                      heightFactor: ratio,
                      child: Container(
                        decoration: BoxDecoration(
                          color: item.color,
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                          border: Border.all(color: ink, width: 1.5),
                          boxShadow: const [BoxShadow(color: ink, offset: Offset(1.5, 1.5))],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.label,
                    style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class NeoPieItem {
  const NeoPieItem({
    required this.label,
    required this.value,
    required this.color,
  });
  final String label;
  final double value;
  final Color color;
}

class NeoDonutChart extends StatelessWidget {
  const NeoDonutChart({
    super.key,
    required this.items,
    this.size = 140,
    this.innerRadiusRatio = 0.5,
    this.centerText,
    this.centerSubtext,
  });
  final List<NeoPieItem> items;
  final double size;
  final double innerRadiusRatio;
  final String? centerText;
  final String? centerSubtext;

  @override
  Widget build(BuildContext context) {
    final total = items.fold<double>(0.0, (sum, i) => sum + i.value);
    if (total <= 0) {
      return SizedBox(
        height: size,
        child: const Center(child: Text('No data recorded yet', style: TextStyle(fontSize: 12))),
      );
    }

    return Column(
      children: [
        SizedBox(
          width: size,
          height: size,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CustomPaint(
                size: Size(size, size),
                painter: _DonutChartPainter(
                  items: items,
                  total: total,
                  innerRadiusRatio: innerRadiusRatio,
                ),
              ),
              if (centerText != null)
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      centerText!,
                      style: const TextStyle(
                        fontFamily: 'SpaceGrotesk',
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                      ),
                    ),
                    if (centerSubtext != null)
                      Text(
                        centerSubtext!,
                        style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.grey),
                      ),
                  ],
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 6,
          alignment: WrapAlignment.center,
          children: items.map((i) {
            final pct = total > 0 ? ((i.value / total) * 100).round() : 0;
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: i.color,
                    shape: BoxShape.circle,
                    border: Border.all(color: ink, width: 1.2),
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  '${i.label}: ${i.value.toInt()} ($pct%)',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                ),
              ],
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _DonutChartPainter extends CustomPainter {
  const _DonutChartPainter({
    required this.items,
    required this.total,
    required this.innerRadiusRatio,
  });
  final List<NeoPieItem> items;
  final double total;
  final double innerRadiusRatio;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    final innerRadius = radius * innerRadiusRatio;

    var startAngle = -math.pi / 2;

    for (final item in items) {
      if (item.value <= 0) continue;
      final sweepAngle = (item.value / total) * 2 * math.pi;

      final path = Path()
        ..arcTo(
          Rect.fromCircle(center: center, radius: radius),
          startAngle,
          sweepAngle,
          false,
        )
        ..arcTo(
          Rect.fromCircle(center: center, radius: innerRadius),
          startAngle + sweepAngle,
          -sweepAngle,
          false,
        )
        ..close();

      final fillPaint = Paint()
        ..color = item.color
        ..style = PaintingStyle.fill;
      canvas.drawPath(path, fillPaint);

      final strokePaint = Paint()
        ..color = ink
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.8;
      canvas.drawPath(path, strokePaint);

      startAngle += sweepAngle;
    }
  }

  @override
  bool shouldRepaint(covariant _DonutChartPainter oldDelegate) => true;
}

class NeoAreaPoint {
  const NeoAreaPoint({required this.label, required this.value});
  final String label;
  final double value;
}

class NeoAreaChart extends StatelessWidget {
  const NeoAreaChart({
    super.key,
    required this.points,
    this.height = 160,
    this.fillColor = const Color(0xffa8e6cf),
    this.strokeColor = const Color(0xff2e7d32),
    this.valuePrefix = '₹',
    this.unitSuffix = '',
  });
  final List<NeoAreaPoint> points;
  final double height;
  final Color fillColor;
  final Color strokeColor;
  final String valuePrefix;
  final String unitSuffix;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) {
      return SizedBox(
        height: height,
        child: const Center(child: Text('No curve data recorded yet')),
      );
    }
    return SizedBox(
      height: height,
      child: Column(
        children: [
          Expanded(
            child: CustomPaint(
              size: Size.infinite,
              painter: _AreaChartPainter(
                points: points,
                fillColor: fillColor,
                strokeColor: strokeColor,
              ),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: points.map((p) => Expanded(
              child: Text(
                p.label,
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800),
                textAlign: TextAlign.center,
              ),
            )).toList(),
          ),
        ],
      ),
    );
  }
}

class _AreaChartPainter extends CustomPainter {
  const _AreaChartPainter({
    required this.points,
    required this.fillColor,
    required this.strokeColor,
  });
  final List<NeoAreaPoint> points;
  final Color fillColor;
  final Color strokeColor;

  @override
  void paint(Canvas canvas, Size size) {
    if (points.length < 2) return;
    final minVal = points.map((p) => p.value).fold<double>(double.infinity, math.min);
    final maxVal = points.map((p) => p.value).fold<double>(0.0, math.max);
    final range = (maxVal - minVal) <= 0 ? 1.0 : (maxVal - minVal);

    final path = Path();
    final fillPath = Path();

    final stepX = size.width / (points.length - 1);
    final computedPoints = <Offset>[];

    for (int i = 0; i < points.length; i++) {
      final x = i * stepX;
      final normalized = ((points[i].value - minVal) / range).clamp(0.0, 1.0);
      final y = size.height - (normalized * (size.height - 20) + 10);
      computedPoints.add(Offset(x, y));
    }

    path.moveTo(computedPoints.first.dx, computedPoints.first.dy);
    fillPath.moveTo(computedPoints.first.dx, size.height);
    fillPath.lineTo(computedPoints.first.dx, computedPoints.first.dy);

    for (int i = 0; i < computedPoints.length - 1; i++) {
      final p1 = computedPoints[i];
      final p2 = computedPoints[i + 1];
      final controlX = (p1.dx + p2.dx) / 2;
      path.cubicTo(controlX, p1.dy, controlX, p2.dy, p2.dx, p2.dy);
      fillPath.cubicTo(controlX, p1.dy, controlX, p2.dy, p2.dx, p2.dy);
    }

    fillPath.lineTo(computedPoints.last.dx, size.height);
    fillPath.close();

    final fillPaint = Paint()
      ..color = fillColor.withValues(alpha: 0.5)
      ..style = PaintingStyle.fill;
    canvas.drawPath(fillPath, fillPaint);

    final strokePaint = Paint()
      ..color = strokeColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(path, strokePaint);

    // Draw dots
    for (final pt in computedPoints) {
      canvas.drawCircle(pt, 4.5, Paint()..color = yellow);
      canvas.drawCircle(pt, 4.5, Paint()..color = ink..style = PaintingStyle.stroke..strokeWidth = 1.5);
    }
  }

  @override
  bool shouldRepaint(covariant _AreaChartPainter oldDelegate) => true;
}

class NeoLinePoint {
  const NeoLinePoint({required this.xLabel, required this.yValue});
  final String xLabel;
  final double yValue;
}

class NeoLineChart extends StatelessWidget {
  const NeoLineChart({
    super.key,
    required this.points,
    this.height = 150,
    this.color = ink,
    this.valuePrefix = '₹',
  });
  final List<NeoLinePoint> points;
  final double height;
  final Color color;
  final String valuePrefix;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) {
      return SizedBox(
        height: height,
        child: const Center(child: Text('No trajectory data yet')),
      );
    }
    return SizedBox(
      height: height,
      child: Column(
        children: [
          Expanded(
            child: CustomPaint(
              size: Size.infinite,
              painter: _LineChartPainter(points: points, color: color),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: points.map((p) => Text(
              p.xLabel,
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800),
            )).toList(),
          ),
        ],
      ),
    );
  }
}

class _LineChartPainter extends CustomPainter {
  const _LineChartPainter({required this.points, required this.color});
  final List<NeoLinePoint> points;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;
    final minVal = points.map((p) => p.yValue).fold<double>(double.infinity, math.min);
    final maxVal = points.map((p) => p.yValue).fold<double>(0.0, math.max);
    final range = (maxVal - minVal) <= 0 ? 1.0 : (maxVal - minVal);

    final stepX = points.length == 1 ? size.width / 2 : size.width / (points.length - 1);
    final computed = <Offset>[];

    for (int i = 0; i < points.length; i++) {
      final x = points.length == 1 ? size.width / 2 : i * stepX;
      final normalized = ((points[i].yValue - minVal) / range).clamp(0.0, 1.0);
      final y = size.height - (normalized * (size.height - 24) + 12);
      computed.add(Offset(x, y));
    }

    if (computed.length > 1) {
      final path = Path()..moveTo(computed.first.dx, computed.first.dy);
      for (int i = 0; i < computed.length - 1; i++) {
        final p1 = computed[i];
        final p2 = computed[i + 1];
        final midX = (p1.dx + p2.dx) / 2;
        path.cubicTo(midX, p1.dy, midX, p2.dy, p2.dx, p2.dy);
      }
      canvas.drawPath(
        path,
        Paint()
          ..color = color
          ..strokeWidth = 2.5
          ..style = PaintingStyle.stroke,
      );
    }

    for (int i = 0; i < computed.length; i++) {
      final pt = computed[i];
      canvas.drawCircle(pt, 5, Paint()..color = yellow);
      canvas.drawCircle(pt, 5, Paint()..color = ink..style = PaintingStyle.stroke..strokeWidth = 1.5);
    }
  }

  @override
  bool shouldRepaint(covariant _LineChartPainter oldDelegate) => true;
}

class NeoCircularGauge extends StatelessWidget {
  const NeoCircularGauge({
    super.key,
    required this.score,
    this.size = 52.0,
    this.strokeWidth = 4.5,
  });
  final double score;
  final double size;
  final double strokeWidth;

  @override
  Widget build(BuildContext context) {
    final color = score >= 85
        ? const Color(0xff10b981)
        : score >= 65
            ? const Color(0xfff59e0b)
            : const Color(0xff6366f1);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: Size(size, size),
            painter: _CircularGaugePainter(
              score: score.clamp(0.0, 100.0),
              color: color,
              strokeWidth: strokeWidth,
            ),
          ),
          Text(
            '${score.toInt()}%',
            style: TextStyle(
              fontFamily: 'SpaceGrotesk',
              fontSize: size * 0.28,
              fontWeight: FontWeight.w900,
              color: ink,
            ),
          ),
        ],
      ),
    );
  }
}

class _CircularGaugePainter extends CustomPainter {
  const _CircularGaugePainter({
    required this.score,
    required this.color,
    required this.strokeWidth,
  });
  final double score;
  final Color color;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Background circle
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = const Color(0x20171915)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth,
    );

    // Active arc
    final sweepAngle = (score / 100.0) * 2 * math.pi;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      sweepAngle,
      false,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant _CircularGaugePainter oldDelegate) => true;
}

