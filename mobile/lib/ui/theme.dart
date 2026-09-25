import 'package:flutter/material.dart';

const ink = Color(0xff171915),
    paper = Color(0xfffff9eb),
    card = Color(0xfffffef8),
    yellow = Color(0xfff8dc60),
    teal = Color(0xff79d9c5),
    lavender = Color(0xffc9b5ee),
    pink = Color(0xfff7a7c2),
    sky = Color(0xffa5d9f5);
const palette = [yellow, teal, lavender, pink, sky];
ThemeData utlioTheme() {
  final base = ThemeData(
    useMaterial3: true,
    fontFamily: 'DMSans',
    scaffoldBackgroundColor: paper,
    colorScheme: ColorScheme.fromSeed(
      seedColor: teal,
      primary: ink,
      surface: paper,
    ),
  );
  final border = OutlineInputBorder(
    borderRadius: BorderRadius.circular(12),
    borderSide: const BorderSide(color: ink, width: 2),
  );
  return base.copyWith(
    textTheme: base.textTheme.copyWith(
      headlineLarge: const TextStyle(
        fontFamily: 'SpaceGrotesk',
        fontSize: 40,
        fontWeight: FontWeight.w800,
        height: 1.08,
        color: ink,
      ),
      headlineMedium: const TextStyle(
        fontFamily: 'SpaceGrotesk',
        fontSize: 29,
        fontWeight: FontWeight.w700,
        color: ink,
      ),
      titleLarge: const TextStyle(
        fontFamily: 'SpaceGrotesk',
        fontSize: 21,
        fontWeight: FontWeight.w700,
        color: ink,
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: paper,
      foregroundColor: ink,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: card,
      border: border,
      enabledBorder: border,
      focusedBorder: border.copyWith(
        borderSide: const BorderSide(color: ink, width: 3),
      ),
      contentPadding: const EdgeInsets.all(16),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: yellow,
        foregroundColor: ink,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        side: const BorderSide(color: ink, width: 2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontWeight: FontWeight.w800),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: ink,
        side: const BorderSide(color: ink, width: 2),
        padding: const EdgeInsets.all(14),
      ),
    ),
    chipTheme: base.chipTheme.copyWith(
      backgroundColor: lavender,
      side: const BorderSide(color: ink, width: 1.5),
    ),
    scrollbarTheme: const ScrollbarThemeData(
      thumbColor: WidgetStatePropertyAll(ink),
      thickness: WidgetStatePropertyAll(7),
      radius: Radius.circular(5),
    ),
    snackBarTheme: const SnackBarThemeData(
      backgroundColor: ink,
      behavior: SnackBarBehavior.floating,
    ),
  );
}
