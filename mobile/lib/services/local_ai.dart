import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_gemma/flutter_gemma.dart' as gemma;
import 'package:flutter_gemma_litertlm/flutter_gemma_litertlm.dart';
import '../core/api.dart';
import '../ui/widgets.dart';
import '../ui/theme.dart';

String conversationText(List<Json> messages) => messages
    .map(
      (m) =>
          '${identity(m['sender'])} (${m['createdAt'] ?? 'date unavailable'}): ${'${m['text']}'.replaceAll('\n', ' ')}',
    )
    .join('\n');

class DeviceAi {
  static final DeviceAi instance = DeviceAi();
  bool busy = false, initialized = false;
  gemma.InferenceChat? chat;
  gemma.CancelToken? download;
  bool cancelled = false;
  Future<void> cancel() async {
    cancelled = true;
    download?.cancel();
    await chat?.stopGeneration();
  }

  Future<String> run(
    Api api,
    String task,
    String source,
    void Function(String) progress,
  ) async {
    if (busy) throw const ApiFailure('Another on-device task is running.');
    if (source.trim().isEmpty) throw const ApiFailure('Add text first.');
    if (source.length > 6000) {
      throw const ApiFailure(
        'Select a conversation excerpt of at most 6000 characters. No messages were silently removed.',
      );
    }
    busy = true;
    cancelled = false;
    gemma.InferenceModel? model;
    try {
      final config = await api.call('/ai/local-config');
      if (!initialized) {
        await gemma.FlutterGemma.initialize(
          inferenceEngines: [LiteRtLmEngine()],
        );
        initialized = true;
      }
      download = gemma.CancelToken();
      progress('Downloading Qwen3 0.6B (586 MB). Keep the app open.');
      await gemma.FlutterGemma.installModel(
            modelType: gemma.ModelType.qwen3,
            fileType: gemma.ModelFileType.litertlm,
          )
          .fromNetwork(
            'https://huggingface.co/litert-community/Qwen3-0.6B/resolve/main/Qwen3-0.6B.litertlm',
          )
          .withProgress((p) => progress('Model download: $p%'))
          .withCancelToken(download!)
          .install();
      if (cancelled) throw const ApiFailure('Cancelled.');
      progress('Loading on-device model…');
      model = await gemma.FlutterGemma.getActiveModel(
        maxTokens: 4096,
        preferredBackend: kIsWeb ? gemma.PreferredBackend.gpu : gemma.PreferredBackend.cpu,
      );
      chat = await model.createChat(
        temperature: 0.2,
        isThinking: false,
        modelType: gemma.ModelType.qwen3,
        systemInstruction: config['tasks'][task],
      );
      await chat!.addQueryChunk(
        gemma.Message.text(
          text: '${jsonEncode({'sourceText': source})}\n/no_think',
          isUser: true,
        ),
      );
      progress('Writing on this device…');
      final result = StringBuffer();
      await for (final chunk in chat!.generateChatResponseAsync()) {
        if (cancelled) throw const ApiFailure('Cancelled.');
        if (chunk is gemma.TextResponse) result.write(chunk.token);
        if (result.length > 4000) {
          await chat!.stopGeneration();
          throw const ApiFailure('The response exceeded the local output limit. Try a shorter excerpt.');
        }
      }
      if (cancelled) throw const ApiFailure('Cancelled.');
      if (result.isEmpty) {
        throw const ApiFailure(
          'The model returned no text. Try a shorter excerpt.',
        );
      }
      return result.toString().trim();
    } finally {
      try { await chat?.close(); await model?.close(); }
      finally { chat = null; download = null; busy = false; }
    }
  }
}

class LocalAiPanel extends StatefulWidget {
  const LocalAiPanel({
    super.key,
    required this.api,
    required this.task,
    required this.source,
    this.onApply,
  });
  final Api api;
  final String task, source;
  final void Function(String)? onApply;
  @override
  State<LocalAiPanel> createState() => _LocalAiPanelState();
}

class _LocalAiPanelState extends State<LocalAiPanel> {
  String? output, original;
  String progress = '';
  bool active = false;
  int messages = 20;
  @override
  void dispose() {
    if (active) DeviceAi.instance.cancel();
    super.dispose();
  }

  String get source => widget.task == 'summarize'
      ? widget.source
            .split('\n')
            .reversed
            .take(messages)
            .toList()
            .reversed
            .join('\n')
      : widget.source;
  @override
  Widget build(BuildContext context) => Panel(
    color: lavender,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          '✳ AI on your device',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
        ),
        const Text(
          'Optional Qwen3 0.6B download: 586 MB. Requires free storage and several GB of device memory. Text stays on this device. Review every suggestion.',
        ),
        if (widget.task == 'summarize')
          DropdownButtonFormField<int>(
            initialValue: messages,
            decoration: const InputDecoration(
              labelText: 'Conversation excerpt (recent lines)',
            ),
            items: [5, 10, 20, 50]
                .map(
                  (n) =>
                      DropdownMenuItem(value: n, child: Text('Last $n lines')),
                )
                .toList(),
            onChanged: active ? null : (v) => setState(() => messages = v!),
          ),
        AsyncButton(
          text: widget.task == 'polish'
              ? 'Polish with AI'
              : 'Summarize conversation',
          icon: Icons.auto_awesome,
          enabled: source.trim().isNotEmpty,
          run: () async {
            final input = source;
            setState(() {
              active = true;
              output = null;
            });
            try {
              final result = await DeviceAi.instance.run(
                widget.api,
                widget.task,
                input,
                (p) {
                  if (mounted) setState(() => progress = p);
                },
              );
              if (mounted) {
                setState(() {
                  output = result;
                  original = input;
                });
              }
              return 'Suggestion ready. Check against the original.';
            } finally {
              if (mounted) {
                setState(() {
                  active = false;
                  progress = '';
                });
              }
            }
          },
        ),
        if (active) ...[
          Text(progress),
          TextButton(
            onPressed: DeviceAi.instance.cancel,
            child: const Text('Cancel'),
          ),
        ],
        if (output != null) ...[
          SelectableText(output!),
          if (original != source)
            const Text('Source changed. Generate again before applying.'),
          if (widget.onApply != null)
            FilledButton(
              onPressed: original != source
                  ? null
                  : () {
                      widget.onApply!(output!);
                      setState(() => output = null);
                    },
              child: const Text('Use this description'),
            ),
        ],
      ],
    ),
  );
}
