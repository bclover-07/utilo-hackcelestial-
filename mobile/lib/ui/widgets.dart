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

class Panel extends StatelessWidget {
  const Panel({super.key, required this.child, this.color = card});
  final Widget child;
  final Color color;
  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
    tween: Tween(begin: 0, end: 1),
    duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 240),
    builder: (context, value, child) => Opacity(opacity: value, child: Transform.translate(offset: Offset(0, (1 - value) * 8), child: child)),
    child: Container(
    margin: const EdgeInsets.only(bottom: 18, right: 5),
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: ink, width: 2.5),
      boxShadow: const [BoxShadow(color: ink, offset: Offset(4, 5))],
    ),
    child: child,
  ));
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
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 40),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(title, style: Theme.of(context).textTheme.headlineMedium),
              if (subtitle != null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text(subtitle!),
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
  String? error;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      FilledButton.icon(
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
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text(result)));
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
        label: Text(busy ? 'Working…' : widget.text),
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
