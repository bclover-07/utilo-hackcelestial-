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
  Api({String? baseUrl, bool persistSession = true}) {
    // When adb reverse tcp:4000 tcp:4000 is active, localhost:4000 works on physical Android USB devices
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
      throw ArgumentError('Release builds require an HTTPS API_BASE_URL.');
    }
    dio = Dio(
      BaseOptions(
        baseUrl: url.replaceFirst(RegExp(r'/$'), ''),
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 110),
        headers: {'X-Utlio-Request': '1', 'Accept': 'application/json'},
      ),
    );
    configureTransport(dio, persistSession: persistSession);
  }
  late final Dio dio;
  VoidCallback? onUnauthorized;
  Future<dynamic> call(
    String path, {
    String method = 'GET',
    dynamic body,
    CancelToken? cancel,
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
      final data = e.response?.data;
      throw ApiFailure(
        data is Map && data['error'] is String
            ? data['error']
            : e.type == DioExceptionType.cancel
            ? 'Request cancelled.'
            : 'Unable to complete request. Check your connection. Before repeating a change, refresh its record.',
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
}
