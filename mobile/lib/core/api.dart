import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'api_native.dart' if (dart.library.js_interop) 'api_web.dart';

typedef Json = Map<String, dynamic>;

class ApiFailure implements Exception {
  final String message;
  final int? status;
  const ApiFailure(this.message, [this.status]);
  @override
  String toString() => message;
}

class Api {
  static const List<String> defaultCandidates = [
    'http://127.0.0.1:4000/api',
    'http://10.229.144.159:4000/api',
    'http://10.0.2.2:4000/api',
    'http://localhost:4000/api',
  ];

  Api({String? baseUrl, bool persistSession = true}) {
    final defaultHost = kIsWeb
        ? 'http://${Uri.base.host.isNotEmpty ? Uri.base.host : 'localhost'}:4000/api'
        : 'http://127.0.0.1:4000/api';
    const envUrl = String.fromEnvironment('API_BASE_URL');
    var url = baseUrl ?? (envUrl.isNotEmpty ? envUrl : defaultHost);
    if (!kIsWeb && url.contains('localhost')) {
      url = url.replaceFirst('localhost', '127.0.0.1');
    }
    final uri = Uri.parse(url);
    if (!uri.hasAuthority || !['http', 'https'].contains(uri.scheme)) {
      throw ArgumentError(
        'API_BASE_URL must be an absolute HTTP(S) URL ending in /api.',
      );
    }
    if (kReleaseMode && uri.scheme != 'https') {
      // In dev release/debug on local network allow HTTP
    }
    _currentBaseUrl = url.replaceFirst(RegExp(r'/$'), '');
    dio = Dio(
      BaseOptions(
        baseUrl: _currentBaseUrl,
        connectTimeout: const Duration(seconds: 8),
        receiveTimeout: const Duration(seconds: 110),
        headers: {'X-Utlio-Request': '1', 'Accept': 'application/json'},
      ),
    );
    configureTransport(dio, persistSession: persistSession);
  }

  late final Dio dio;
  VoidCallback? onUnauthorized;
  late String _currentBaseUrl;
  String get currentBaseUrl => _currentBaseUrl;

  void setBaseUrl(String newUrl) {
    var cleaned = newUrl.trim().replaceFirst(RegExp(r'/$'), '');
    if (!cleaned.endsWith('/api')) cleaned = '$cleaned/api';
    _currentBaseUrl = cleaned;
    dio.options.baseUrl = cleaned;
  }

  Future<bool> probeHost(String url) async {
    try {
      final testDio = Dio(BaseOptions(
        baseUrl: url.replaceFirst(RegExp(r'/$'), ''),
        connectTimeout: const Duration(milliseconds: 2500),
        receiveTimeout: const Duration(milliseconds: 2500),
        headers: {'X-Utlio-Request': '1', 'Accept': 'application/json'},
      ));
      final res = await testDio.get('/categories');
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<String?> autoDiscoverWorkingHost() async {
    final list = [_currentBaseUrl, ...defaultCandidates];
    final unique = list.toSet().toList();
    for (final candidate in unique) {
      if (await probeHost(candidate)) {
        setBaseUrl(candidate);
        return candidate;
      }
    }
    return null;
  }

  Future<dynamic> call(
    String path, {
    String method = 'GET',
    dynamic body,
    CancelToken? cancel,
    bool allowRetryFailover = true,
  }) async {
    try {
      final response = await dio.request(
        path,
        data: body,
        cancelToken: cancel,
        options: Options(method: method),
      );
      if (response.data is! Map &&
          response.data is! List &&
          response.data != null) {
        throw const ApiFailure('The server returned an unreadable response.');
      }
      return response.data;
    } on DioException catch (e) {
      if (e.response?.statusCode == 401 && !path.startsWith('/auth/')) {
        onUnauthorized?.call();
      }
      if (allowRetryFailover &&
          (e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.connectionError ||
              e.type == DioExceptionType.unknown)) {
        final working = await autoDiscoverWorkingHost();
        if (working != null) {
          return call(path, method: method, body: body, cancel: cancel, allowRetryFailover: false);
        }
      }
      final data = e.response?.data;
      throw ApiFailure(
        data is Map && data['error'] is String
            ? data['error']
            : e.type == DioExceptionType.cancel
            ? 'Request cancelled.'
            : 'Unable to connect to Utlio backend at $_currentBaseUrl. Please verify connection or select host.',
        e.response?.statusCode,
      );
    }
  }

  Future<Uint8List> bytes(
    String path, {
    String method = 'GET',
    Json? body,
  }) async {
    try {
      final r = await dio.request<List<int>>(
        path,
        data: body,
        options: Options(method: method, responseType: ResponseType.bytes),
      );
      return Uint8List.fromList(r.data!);
    } on DioException catch (e) {
      throw ApiFailure(
        'Download failed (${e.response?.statusCode ?? 'connection'}).',
      );
    }
  }

  Future<Json> upload(Uint8List bytes, String name, String kind) async {
    if (bytes.length > 8 * 1024 * 1024) {
      throw const ApiFailure('Choose a file smaller than 8 MB.');
    }
    return Map<String, dynamic>.from(
      await call(
        '/uploads',
        method: 'POST',
        body: FormData.fromMap({
          'kind': kind,
          'file': MultipartFile.fromBytes(bytes, filename: name),
        }),
      ),
    );
  }
}

class Session extends ChangeNotifier {
  Session(this.api) {
    api.onUnauthorized = () {
      user = null;
      notifyListeners();
    };
  }
  final Api api;
  Json? user;
  bool loading = true;
  String? error;
  String get mode => user?['mode'] ?? 'seeker';
  bool get admin => user?['role'] == 'admin';
  Future<void> restore() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      user = Map<String, dynamic>.from(await api.call('/auth/me'));
    } on ApiFailure catch (e) {
      if (e.status != 401) error = e.message;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> login(Json input, {bool register = false}) async {
    user = Map<String, dynamic>.from(
      await api.call(
        register ? '/auth/register' : '/auth/login',
        method: 'POST',
        body: input,
      ),
    );
    notifyListeners();
  }

  Future<void> profile(Json input) async {
    user = Map<String, dynamic>.from(
      await api.call('/profile', method: 'PATCH', body: input),
    );
    notifyListeners();
  }

  Future<void> logout() async {
    await api.call('/auth/logout', method: 'POST');
    user = null;
    notifyListeners();
  }

  Future<void> changeHost(String newUrl) async {
    api.setBaseUrl(newUrl);
    await restore();
  }

  Future<void> retryAutoDiscover() async {
    loading = true;
    error = null;
    notifyListeners();
    await api.autoDiscoverWorkingHost();
    await restore();
  }
}
