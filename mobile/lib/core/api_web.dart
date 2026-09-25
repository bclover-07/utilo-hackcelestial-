import 'package:dio/dio.dart';
import 'package:dio/browser.dart';

void configureTransport(Dio dio, {bool persistSession = true}) {
  dio.httpClientAdapter = BrowserHttpClientAdapter(withCredentials: true);
}
