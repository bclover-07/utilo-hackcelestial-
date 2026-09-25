import 'package:dio/dio.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureCookies implements Storage {
  final storage = const FlutterSecureStorage();
  final prefix = 'utlio.cookies.';
  @override
  Future<void> init(bool persistSession, bool ignoreExpires) async {}
  @override
  Future<String?> read(String key) => storage.read(key: '$prefix$key');
  @override
  Future<void> write(String key, String value) =>
      storage.write(key: '$prefix$key', value: value);
  @override
  Future<void> delete(String key) => storage.delete(key: '$prefix$key');
  @override
  Future<void> deleteAll(List<String> keys) async {
    for (final key in (await storage.readAll()).keys.where(
      (k) => k.startsWith(prefix),
    )) {
      await storage.delete(key: key);
    }
  }
}

void configureTransport(Dio dio, {bool persistSession = true}) {
  dio.interceptors.add(
    CookieManager(
      persistSession
          ? PersistCookieJar(storage: SecureCookies(), ignoreExpires: false)
          : CookieJar(),
    ),
  );
}
